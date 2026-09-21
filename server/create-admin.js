import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createPool } from './store.js';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
const pool = createPool();
try {
  const [existing] = await pool.execute('SELECT id FROM administrators WHERE email=?', [email]);
  if (existing.length) {
    console.log(
      'This administrator account already exists. Sign in with its existing password at /admin. This command does not reset passwords.',
    );
  } else {
    const password = z.string().min(12).max(72).parse(process.env.ADMIN_PASSWORD);
    await pool.execute('INSERT INTO administrators(email,password_hash) VALUES (?,?)', [
      email,
      await bcrypt.hash(password, 12),
    ]);
    const envPath = new URL('../.env', import.meta.url);
    let content = await readFile(envPath, 'utf8').catch((e) => {
      if (e.code === 'ENOENT') return '';
      throw e;
    });
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      const entry = `SESSION_SECRET=${randomBytes(48).toString('hex')}`;
      content = /^\s*SESSION_SECRET=.*$/m.test(content)
        ? content.replace(/^\s*SESSION_SECRET=.*$/m, entry)
        : `${content}\n${entry}\n`;
    }
    content = content.replace(/^\s*ADMIN_PASSWORD=.*$/m, 'ADMIN_PASSWORD=');
    await writeFile(envPath, content);
    console.log(
      'Administrator created. Session secret configured; provisioning password removed from .env. Restart the server to load the secret.',
    );
  }
} finally {
  await pool.end();
}
