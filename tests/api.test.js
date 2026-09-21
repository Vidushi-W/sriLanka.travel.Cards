import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { pageSchema } from '../server/validation.js';
import { seedPage } from '../shared/content.js';
import { PreviewStore } from '../server/store.js';

// Contract double: MySQL persistence is verified separately against a configured DB.
class TestStore {
  ready = true;
  pages = new Map();
  sessions = new Map();
  media = [];
  nextId = 2;
  constructor(hash) {
    this.admin = { id: 1, email: 'admin@example.test', password_hash: hash };
    this.pages.set('1', {
      draft: { ...structuredClone(seedPage), id: 1 },
      published: { ...structuredClone(seedPage), id: 1 },
    });
  }
  async findAdmin(email) {
    return email === this.admin.email ? this.admin : null;
  }
  async createSession(hash, id, expires) {
    this.sessions.set(hash, { id, email: this.admin.email, expires });
  }
  async getSession(hash) {
    const s = this.sessions.get(hash);
    return s?.expires > Date.now() ? s : null;
  }
  async deleteSession(hash) {
    this.sessions.delete(hash);
  }
  async listPages() {
    return [...this.pages.values()].map((p) => ({
      ...p.draft,
      published_slug: p.published?.slug,
      published_at: p.published ? 'now' : null,
    }));
  }
  async getPage(value, published = false) {
    if (published)
      return structuredClone(
        [...this.pages.values()].find((p) => p.published?.slug === value)?.published || null,
      );
    return structuredClone(this.pages.get(String(value))?.draft || null);
  }
  async savePage(id, page, publish = false) {
    id = String(id || this.nextId++);
    if ([...this.pages.entries()].some(([key, p]) => key !== id && p.draft.slug === page.slug))
      throw Object.assign(new Error(), { code: 'ER_DUP_ENTRY' });
    const old = this.pages.get(id);
    if (old?.draft.slug === 'home' && page.slug !== 'home')
      throw Object.assign(new Error('Homepage protected'), { status: 400 });
    const draft = { ...structuredClone(page), id: Number(id) };
    this.pages.set(id, { draft, published: publish ? structuredClone(draft) : old?.published });
    return draft;
  }
  async unpublish(id) {
    this.pages.get(String(id)).published = null;
  }
  async deletePage(id) {
    this.pages.delete(String(id));
  }
  async listMedia() {
    return this.media;
  }
  async addMedia(asset) {
    const a = { ...asset, id: this.media.length + 1 };
    this.media.push(a);
    return a;
  }
  async mediaInUse(path) {
    return JSON.stringify([...this.pages.values()]).includes(path);
  }
  async deleteMedia(id) {
    this.media = this.media.filter((a) => a.id !== id);
  }
  async changePassword(id, hash) {
    this.admin.password_hash = hash;
    this.sessions.clear();
  }
}
let hash;
before(async () => {
  hash = await bcrypt.hash('a-secure-test-password', 12);
});
const fixture = () => {
  const store = new TestStore(hash);
  const app = createApp(store, { secret: 'test-only-secret-at-least-32-characters-long' });
  return { store, app, client: request.agent(app) };
};
const login = (client) =>
  client
    .post('/api/admin/login')
    .send({ email: 'admin@example.test', password: 'a-secure-test-password' })
    .expect(200);
test('seed content is valid; script links, external image paths, coordinates and reserved slugs are rejected', () => {
  assert.equal(pageSchema.safeParse(seedPage).success, true);
  for (const edit of [
    (p) => (p.sections[0].primaryLink = 'javascript:alert(1)'),
    (p) => (p.sections[0].primaryLink = '//evil.test'),
    (p) => (p.sections[0].image = '/uploads/../secret.png'),
    (p) => (p.sections[3].items[0].lat = 91),
    (p) => (p.slug = 'admin'),
    (p) => p.sections.push(p.sections[0]),
  ]) {
    const p = structuredClone(seedPage);
    edit(p);
    assert.equal(pageSchema.safeParse(p).success, false);
  }
});
test('public preview works without exposing admin mutation routes', async () => {
  const app = createApp(new PreviewStore());
  await request(app).get('/api/page').expect(200);
  await request(app).post('/api/admin/login').send({}).expect(503);
});
test('all admin endpoints require authentication and cross-origin writes are rejected', async () => {
  const { app } = fixture();
  for (const route of ['/api/admin/me', '/api/admin/pages', '/api/admin/media'])
    await request(app).get(route).expect(401);
  await request(app).put('/api/admin/pages/1').send(seedPage).expect(401);
  await request(app).post('/api/admin/media').expect(401);
  await request(app)
    .post('/api/admin/login')
    .set('Origin', 'https://evil.test')
    .send({})
    .expect(403);
});
test('login uses an HttpOnly strict cookie and logout invalidates it', async () => {
  const { client } = fixture();
  await client
    .post('/api/admin/login')
    .send({ email: 'admin@example.test', password: 'wrong' })
    .expect(401);
  const res = await login(client);
  assert.match(res.headers['set-cookie'][0], /HttpOnly/);
  assert.match(res.headers['set-cookie'][0], /SameSite=Strict/);
  await client.get('/api/admin/me').expect(200);
  await client.post('/api/admin/logout').expect(200);
  await client.get('/api/admin/me').expect(401);
});
test('drafts stay private, publish is visible, unpublish and deletion remove public access', async () => {
  const { client, app } = fixture();
  await login(client);
  const page = { ...structuredClone(seedPage), slug: 'new-trail', title: 'New trail' };
  const created = await client.post('/api/admin/pages').send(page).expect(201);
  const id = created.body.id;
  await request(app).get('/api/page?slug=new-trail').expect(404);
  await client.put(`/api/admin/pages/${id}?publish=true`).send(page).expect(200);
  let publicPage = await request(app).get('/api/page?slug=new-trail').expect(200);
  assert.equal(publicPage.body.page.title, 'New trail');
  page.title = 'Private edit';
  await client.put(`/api/admin/pages/${id}`).send(page).expect(200);
  publicPage = await request(app).get('/api/page?slug=new-trail');
  assert.equal(publicPage.body.page.title, 'New trail');
  await client.post(`/api/admin/pages/${id}/unpublish`).expect(200);
  await request(app).get('/api/page?slug=new-trail').expect(404);
  await client.delete(`/api/admin/pages/${id}`).expect(200);
  await client.get(`/api/admin/pages/${id}`).expect(404);
  await client.delete('/api/admin/pages/1').expect(400);
  await client.post('/api/admin/pages/1/unpublish').expect(400);
});
test('invalid content is refused before persistence; duplicate URLs conflict', async () => {
  const { client } = fixture();
  await login(client);
  const page = structuredClone(seedPage);
  page.sections[3].items[0].lat = 95;
  await client.put('/api/admin/pages/1').send(page).expect(400);
  await client.post('/api/admin/pages').send(seedPage).expect(409);
});
test('upload validates actual bytes, re-encodes images and protects referenced assets', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'bliss-tests-'));
  try {
    const store = new TestStore(hash);
    const client = request.agent(
      createApp(store, { root, secret: 'test-only-secret-at-least-32-characters-long' }),
    );
    await login(client);
    await client
      .post('/api/admin/media')
      .attach('image', Buffer.from('<script>bad</script>'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(400);
    const png = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#328267' },
    })
      .png()
      .toBuffer();
    const res = await client
      .post('/api/admin/media')
      .attach('image', png, { filename: 'trail.png', contentType: 'image/png' })
      .expect(201);
    assert.match(res.body.path, /^\/uploads\/[a-f0-9-]+\.webp$/);
    const page = structuredClone(seedPage);
    page.sections[0].image = res.body.path;
    await client.put('/api/admin/pages/1').send(page).expect(200);
    await client.delete(`/api/admin/media/${res.body.id}`).expect(409);
    await client.put('/api/admin/pages/1').send(seedPage).expect(200);
    await client.delete(`/api/admin/media/${res.body.id}`).expect(200);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('password change requires the current password and revokes sessions', async () => {
  const { client } = fixture();
  await login(client);
  await client
    .put('/api/admin/password')
    .send({ currentPassword: 'wrong', newPassword: 'a-new-long-password' })
    .expect(400);
  await client
    .put('/api/admin/password')
    .send({ currentPassword: 'a-secure-test-password', newPassword: 'a-new-long-password' })
    .expect(200);
  await client.get('/api/admin/me').expect(401);
  await client
    .post('/api/admin/login')
    .send({ email: 'admin@example.test', password: 'a-new-long-password' })
    .expect(200);
});
