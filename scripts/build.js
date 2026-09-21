// A local server's .env may use NODE_ENV=development. Always ship React's
// production runtime when building deployable frontend assets.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');
await build();
