import mysql from 'mysql2';
import { writeFile, stat } from 'node:fs/promises';
import { seedPage, seedExperiencePages } from '../shared/content.js';
const sql = [
  '-- Initial content for a NEW database only. Apply schema.sql first.',
  '-- Select the database with USE bliss_trails; before running this script.',
  '-- Use npm run db:setup for idempotent setup that preserves existing edits.',
  'START TRANSACTION;',
];
for (const page of [seedPage, ...seedExperiencePages]) {
  sql.push(
    `INSERT INTO website_pages (slug,title,published_slug,published_title,published_at) VALUES (${[page.slug, page.title, page.slug, page.title].map(mysql.escape).join(',')},UTC_TIMESTAMP());`,
    'SET @page_id = LAST_INSERT_ID();',
  );
  for (const revision of ['draft', 'published'])
    for (const [position, section] of page.sections.entries()) {
      const { id, type, ...content } = section;
      sql.push(
        `INSERT INTO website_sections (page_id,revision,section_key,kind,position,content) VALUES (@page_id,${[revision, id, type, position, JSON.stringify(content)].map(mysql.escape).join(',')});`,
      );
    }
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
  sql.push(
    `INSERT INTO media_assets (path,original_name,mime_type,size_bytes) VALUES (${[path, `${name}.webp`, 'image/webp', size].map(mysql.escape).join(',')});`,
  );
}
sql.push('COMMIT;');
await writeFile('server/seed.sql', sql.join('\n') + '\n');
console.log('Generated server/seed.sql from the original content.');
