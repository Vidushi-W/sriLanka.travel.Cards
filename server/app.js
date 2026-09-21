import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import sharp from 'sharp';
import { randomBytes, createHmac, randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { pageSchema } from './validation.js';

export function createApp(store, options = {}) {
  const app = express();
  const production = process.env.NODE_ENV === 'production';
  const secret = options.secret || process.env.SESSION_SECRET;
  const root = options.root || process.cwd();
  const uploadDir = path.join(root, 'uploads');
  const tokenHash = (token) => createHmac('sha256', secret).update(token).digest('hex');
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
          frameSrc: ['https://www.youtube-nocookie.com'],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: production ? undefined : false,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      const allowed = (process.env.APP_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map((v) => v.trim());
      if (!production) allowed.push('http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:5173', 'http://127.0.0.1:5173');
      if (origin && !allowed.includes(origin))
        return res.status(403).json({ error: 'This origin is not allowed.' });
      if (req.get('sec-fetch-site') === 'cross-site')
        return res.status(403).json({ error: 'Cross-site requests are not allowed.' });
    }
    next();
  });
  app.get('/api/health', (req, res) =>
    res.json({
      status: store.ready ? 'ready' : 'preview',
      database: store.ready ? 'connected' : 'not configured',
    }),
  );
  app.get('/api/pages', async (req, res) =>
    res.json(
      store.ready
        ? (await store.listPages())
            .filter((p) => p.published_at)
            .map((p) => ({ title: p.published_title, slug: p.published_slug }))
        : [],
    ),
  );
  app.get('/api/page', async (req, res) => {
    const page = await store.getPage(String(req.query.slug || 'home'), true);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    res.json({ page, previewMode: !store.ready });
  });
  app.use('/api/admin', (req, res, next) => {
    if (!store.ready || !secret || secret.length < 32)
      return res
        .status(503)
        .json({
          error:
            'Administration requires MySQL and a SESSION_SECRET of at least 32 characters. Follow README.md to finish setup.',
        });
    next();
  });
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  });
  app.post('/api/admin/login', authLimit, async (req, res) => {
    const { email, password } = z
      .object({ email: z.email(), password: z.string().min(1).max(200) })
      .parse(req.body);
    const admin = await store.findAdmin(email.toLowerCase());
    // Perform the expensive comparison even when an account does not exist.
    const valid = await bcrypt.compare(
      password,
      admin?.password_hash || '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttxl6Q.vdPFcOj0LtNaDTfZxL8L.',
    );
    if (!admin || !valid) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const token = randomBytes(48).toString('hex');
    await store.createSession(
      tokenHash(token),
      admin.id,
      new Date(Date.now() + 8 * 60 * 60 * 1000),
    );
    res.cookie('bliss_session', token, {
      httpOnly: true,
      secure: production,
      sameSite: 'strict',
      path: '/api/admin',
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ user: { id: admin.id, email: admin.email } });
  });
  app.use('/api/admin', async (req, res, next) => {
    const token = req.cookies.bliss_session;
    const user =
      typeof token === 'string' && /^[a-f0-9]{96}$/.test(token)
        ? await store.getSession(tokenHash(token))
        : null;
    if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });
    req.admin = user;
    next();
  });
  app.get('/api/admin/me', (req, res) => res.json({ user: req.admin }));
  app.post('/api/admin/logout', async (req, res) => {
    await store.deleteSession(tokenHash(req.cookies.bliss_session));
    res.clearCookie('bliss_session', {
      path: '/api/admin',
      secure: production,
      sameSite: 'strict',
      httpOnly: true,
    });
    res.json({ ok: true });
  });
  app.put('/api/admin/password', authLimit, async (req, res) => {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().max(200), newPassword: z.string().min(12).max(72) })
      .parse(req.body);
    const admin = await store.findAdmin(req.admin.email);
    if (!(await bcrypt.compare(currentPassword, admin.password_hash)))
      return res.status(400).json({ error: 'Current password is incorrect.' });
    await store.changePassword(admin.id, await bcrypt.hash(newPassword, 12));
    res.clearCookie('bliss_session', { path: '/api/admin' });
    res.json({ ok: true });
  });
  app.get('/api/admin/pages', async (req, res) => res.json(await store.listPages()));
  app.get('/api/admin/pages/:id', async (req, res) => {
    const page = await store.getPage(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    res.json(page);
  });
  app.post('/api/admin/pages', async (req, res) =>
    res.status(201).json(await store.savePage(null, pageSchema.parse(req.body))),
  );
  app.put('/api/admin/pages/:id', async (req, res) =>
    res.json(
      await store.savePage(req.params.id, pageSchema.parse(req.body), req.query.publish === 'true'),
    ),
  );
  app.post('/api/admin/pages/:id/unpublish', async (req, res) => {
    const page = await store.getPage(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    if (page.slug === 'home')
      return res.status(400).json({ error: 'The homepage must remain published.' });
    await store.unpublish(req.params.id);
    res.json({ ok: true });
  });
  app.delete('/api/admin/pages/:id', async (req, res) => {
    const page = await store.getPage(req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    if (page.slug === 'home')
      return res.status(400).json({ error: 'The homepage cannot be deleted.' });
    await store.deletePage(req.params.id);
    res.json({ ok: true });
  });
  app.get('/api/admin/media', async (req, res) => res.json(await store.listMedia()));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) =>
      cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
  });
  app.post('/api/admin/media', upload.single('image'), async (req, res) => {
    if (!req.file)
      return res.status(400).json({ error: 'Choose a JPG, PNG or WebP image, up to 8 MB.' });
    let buffer;
    try {
      const picture = sharp(req.file.buffer, { limitInputPixels: 40000000 });
      const metadata = await picture.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format)) throw new Error();
      buffer = await picture
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return res
        .status(400)
        .json({ error: 'This file is not a supported, valid image (maximum 40 megapixels).' });
    }
    await mkdir(uploadDir, { recursive: true });
    const filename = `${randomUUID()}.webp`;
    const output = path.join(uploadDir, filename);
    const { writeFile } = await import('node:fs/promises');
    await writeFile(output, buffer);
    try {
      res
        .status(201)
        .json(
          await store.addMedia({
            path: `/uploads/${filename}`,
            original_name: path.basename(req.file.originalname).slice(0, 255),
            mime_type: 'image/webp',
            size_bytes: buffer.length,
            uploaded_by: req.admin.id,
          }),
        );
    } catch (error) {
      await unlink(output);
      throw error;
    }
  });
  app.delete('/api/admin/media/:id', async (req, res) => {
    const asset = (await store.listMedia()).find((a) => String(a.id) === req.params.id);
    if (!asset) return res.status(404).json({ error: 'Image not found.' });
    if (await store.mediaInUse(asset.path))
      return res
        .status(409)
        .json({
          error:
            'This image is used by a draft or published page. Replace it there before deleting.',
        });
    if (!/^\/uploads\/[a-f0-9-]+\.webp$/.test(asset.path))
      return res
        .status(400)
        .json({
          error: 'Original project assets are preserved. Remove them from page sections instead.',
        });
    await unlink(path.join(uploadDir, path.basename(asset.path))).catch((e) => {
      if (e.code !== 'ENOENT') throw e;
    });
    await store.deleteMedia(asset.id);
    res.json({ ok: true });
  });
  app.use('/uploads', express.static(uploadDir, { dotfiles: 'deny', maxAge: '1d' }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
  app.use(express.static(path.join(root, 'dist')));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(root, 'dist/index.html')));
  app.use((error, req, res, next) => {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
    if (error.code === 'ER_DUP_ENTRY')
      return res
        .status(409)
        .json({ error: 'This page URL is already in use. Choose another slug.' });
    if (error instanceof multer.MulterError)
      return res
        .status(400)
        .json({
          error:
            error.code === 'LIMIT_FILE_SIZE'
              ? 'Image exceeds the 8 MB limit.'
              : 'Upload one image at a time.',
        });
    if (error.status && error.status < 500)
      return res.status(error.status).json({ error: error.message });
    console.error(error);
    res.status(500).json({ error: 'The request could not be completed. Please try again.' });
  });
  return app;
}
