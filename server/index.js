import 'dotenv/config';
import { createPool, MysqlStore, PreviewStore } from './store.js';
import { createApp } from './app.js';
const pool = createPool();
let store;
try {
  await pool.query('SELECT id FROM website_pages LIMIT 1');
  store = new MysqlStore(pool);
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    console.error('MySQL is required in production. Run npm run db:setup.', error.code);
    process.exit(1);
  }
  await pool.end();
  store = new PreviewStore();
  console.warn(
    'MySQL is not configured: public design preview is available; admin writes are disabled. See README.md.',
  );
}
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
)
  throw new Error('Configure a SESSION_SECRET of at least 32 characters.');
const server = createApp(store).listen(Number(process.env.PORT || 3001), '127.0.0.1', () =>
  console.log(`Bliss API: http://localhost:${process.env.PORT || 3001}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(async () => {
      if (store.ready) await pool.end();
      process.exit(0);
    }),
  );
