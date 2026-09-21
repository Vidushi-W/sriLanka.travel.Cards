import 'dotenv/config';
import { chromium } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createPool, MysqlStore } from '../server/store.js';
import { createApp } from '../server/app.js';

// Owns only a uniquely named test account, draft page and upload. Never edits the homepage.
const suffix = randomUUID();
const email = `ui-${suffix}@example.test`;
const password = randomBytes(24).toString('hex');
const slug = `test-${suffix}`;
process.env.APP_ORIGIN = [
  process.env.APP_ORIGIN || 'http://localhost:5173',
  'http://localhost:3002',
].join(',');
let pool = createPool();
let server;
let browser;
let adminId;
let pageId;
let uploaded;
try {
  const [insert] = await pool.execute(
    'INSERT INTO administrators (email,password_hash) VALUES (?,?)',
    [email, await bcrypt.hash(password, 12)],
  );
  adminId = insert.insertId;
  let store = new MysqlStore(pool);
  const secret = randomBytes(48).toString('hex');
  server = createApp(store, { secret }).listen(3002, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:3002/admin');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Dashboard Overview', exact: true }).waitFor();
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/admin-dashboard.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Page Management', exact: true }).click();
  await page.getByRole('button', { name: 'Create page', exact: true }).click();
  await page
    .locator('.new-page-form')
    .getByLabel('Page title', { exact: true })
    .fill('Integration test page');
  await page.locator('.new-page-form').getByLabel('URL slug', { exact: true }).fill(slug);
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Page created as a draft' }).waitFor();
  pageId = (await store.listPages()).find((p) => p.slug === slug).id;
  assert.equal(await store.getPage(slug, true), null, 'Draft cannot be public');
  await page
    .locator('.admin-sidebar')
    .getByRole('button', { name: 'Hero Section', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Heading / title', exact: true })
    .fill('Persistence test trail');
  await page.getByRole('button', { name: 'Choose image', exact: true }).click();
  await page.locator('.asset-chooser input[type=file]').setInputFiles('public/images/forest.webp');
  await page.getByRole('button', { name: 'Upload image', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Image uploaded' }).waitFor();
  uploaded = (await store.listMedia()).find((a) => a.uploaded_by === adminId);
  assert.ok(uploaded, 'Uploaded image metadata saved');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
  const draft = await store.getPage(pageId);
  assert.equal(draft.sections[0].title, 'Persistence test trail');
  assert.equal(draft.sections[0].image, uploaded.path);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.getByRole('heading', { name: 'Persistence test trail', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Back to editor', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Your changes are now live' }).waitFor();
  const publicPage = await browser.newPage();
  await publicPage.goto(`http://localhost:3002/${slug}`);
  await publicPage.getByRole('heading', { name: 'Persistence test trail', exact: true }).waitFor();
  await publicPage.close();
  await page.screenshot({
    path: 'test-results/admin-editor.png',
    fullPage: true,
    animations: 'disabled',
  });
  // New connection pool and server instance exercise persistence across restart.
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
  pool = createPool();
  store = new MysqlStore(pool);
  server = createApp(store, { secret }).listen(3002, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  assert.equal((await store.getPage(slug, true)).sections[0].title, 'Persistence test trail');
  assert.equal((await store.getPage(pageId)).sections[0].image, uploaded.path);
  await page.reload();
  await page.getByRole('heading', { name: 'Dashboard Overview', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Admin fits mobile',
  );
  await page.screenshot({
    path: 'test-results/admin-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
  await page.getByRole('button', { name: 'Page Management', exact: true }).click();
  await page.locator('.page-row').filter({ hasText: 'Integration test page' }).click();
  await page.getByRole('button', { name: 'Unpublish', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Page unpublished' }).waitFor();
  assert.equal(await store.getPage(slug, true), null);
  assert.deepEqual(errors, []);
  console.log(
    'Live MySQL + browser checks passed: login, page creation, image upload/assignment, draft isolation, preview, publish, public URL, server restart persistence, session persistence, mobile admin, unpublish.',
  );
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (pageId) await pool.execute('DELETE FROM website_pages WHERE id=? AND slug=?', [pageId, slug]);
  if (uploaded) {
    await pool.execute('DELETE FROM media_assets WHERE id=? AND uploaded_by=?', [
      uploaded.id,
      adminId,
    ]);
    await unlink(path.join(process.cwd(), 'uploads', path.basename(uploaded.path))).catch(() => {});
  }
  if (adminId)
    await pool.execute('DELETE FROM administrators WHERE id=? AND email=?', [adminId, email]);
  await pool.end();
}
