import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFile, stat } from 'node:fs/promises';
import { createPool, MysqlStore } from './store.js';
import { seedPage, seedExperiencePages } from '../shared/content.js';
const name = process.env.DB_NAME || 'bliss_trails';
if (!/^[a-zA-Z0-9_]+$/.test(name))
  throw new Error('DB_NAME may contain letters, numbers and underscores only.');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'bliss',
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});
await connection.query(
  `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await connection.changeUser({ database: name });
await connection.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
await connection.end();
const pool = createPool();
const store = new MysqlStore(pool);
for (const page of [seedPage, ...seedExperiencePages]) {
  const existing = (await store.listPages()).find((p) => p.slug === page.slug);
  if (!existing) await store.savePage(null, page, true);
}
for (const name of [
  'hero',
  'forest',
  'wildlife',
  'water',
  'wellness',
  ...Array.from({ length: 9 }, (_, i) => `gallery-${i + 1}`),
]) {
  const path = `/images/${name}.webp`;
  const size = (await stat(`public${path}`)).size;
  await pool.execute(
    'INSERT IGNORE INTO media_assets(path,original_name,mime_type,size_bytes) VALUES (?,?,?,?)',
    [path, `${name}.webp`, 'image/webp', size],
  );
}
await pool.end();
console.log(
  'Schema and initial content installed. Existing content was preserved. Run npm run admin:create next.',
);
