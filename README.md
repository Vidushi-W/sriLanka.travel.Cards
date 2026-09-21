# Bliss Nature Trails

A responsive Sri Lanka tourism website and authenticated content studio, built with React, Vite, Tailwind CSS, React Router, Lucide, Leaflet, Express and MySQL 8.

## Quick start

Requires Node.js 22.12+ and MySQL 8+. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

```sh
npm install
npm run assets
```

The supplied root PNGs are preserved. `assets` optimizes them into `public/images` and extracts nine individual photographs from `image_stack.png`. No stock or generated placeholder images are used.

Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in the existing local `.env` file. This file also contains the application and administrator settings and is excluded from Git. Create a dedicated MySQL account with privileges limited to this database. For example, run the following as a MySQL administrator, replacing the password:

```sql
CREATE DATABASE IF NOT EXISTS bliss_trails CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bliss'@'127.0.0.1' IDENTIFIED BY 'YOUR_OWN_STRONG_DATABASE_PASSWORD';
GRANT ALL PRIVILEGES ON bliss_trails.* TO 'bliss'@'127.0.0.1';
```

For a DB host of `localhost`, use a matching MySQL account host. Then:

```sh
npm run db:setup
```

This applies `server/schema.sql`, creates the database if permitted, and inserts initial page content and image paths from `shared/content.js`. Setup is idempotent and preserves existing pages. Database creation permission can be avoided by creating the database beforehand. The setup account needs table/view creation permissions; production runtime may use a separate account limited to SELECT, INSERT, UPDATE and DELETE on this database.

Generate a session secret and place its output in `SESSION_SECRET` in `.env`:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of 12–72 characters in `.env`, then run:

```sh
npm run admin:create
```

The provisioning script removes `ADMIN_PASSWORD` from `.env` after successful creation and generates a random session secret if one is missing. Restart Express afterward. There is no default administrator or public registration route. Passwords use bcrypt with cost 12; sessions are opaque random tokens stored as keyed hashes in MySQL and sent in HttpOnly, SameSite=Strict cookies. Production cookies additionally require HTTPS. Account settings can change the password and invalidate all existing sessions.

```sh
npm run dev
```

- Website: **http://localhost:5173**
- Admin: **http://localhost:5173/admin**
- API: **http://localhost:3001/api/health**

Vite proxies `/api` and `/uploads` to Express. The same-origin architecture avoids cross-origin session configuration. If you use `127.0.0.1:5173` instead of `localhost:5173`, add `http://127.0.0.1:5173` to the comma-separated `APP_ORIGIN` setting.

Without MySQL, development serves an explicit **read-only design preview** from backend seed data. Admin sign-in clearly reports the required configuration. This is not a persistence substitute. Restart the server after database setup. Production refuses to start without MySQL or a session secret.

## Editing and publishing

1. Sign in at `/admin` and select a page from Page Management or the editor's page selector.
2. Edit any section using its sidebar editor. Every text field, image, destination coordinate, card link and video URL is editable.
3. Add, remove and reorder cards, destinations and gallery photos using the item controls. Image pickers reuse the media library; uploads include a local preview before submission.
4. **Save draft** persists the revision without changing public content. **Cancel** restores the last saved draft. **Preview** renders the current unsaved draft through the actual public components.
5. **Publish** saves the draft and atomically replaces the published revision. Visitors receive only the published revision.
6. Page Management creates draft pages, sets URL slugs, adds supported sections, changes section order, unpublishes and deletes pages. Published pages appear at `/<slug>`. The homepage cannot be deleted, renamed or unpublished.

Six initial wellness detail pages are included so the experience cards have working destinations. They are starting editorial content and can be customized. Header links point to main website sections. Footer navigation and social links are editable. The nine-gallery layout remains responsive when administrators add or remove photos. The map downloads destinations as GeoJSON, a useful geographic data format; it does not claim to produce an offline basemap or PDF.

## Storage and uploads

`administrators`, `admin_sessions`, `website_pages`, `website_sections`, and `media_assets` are physical tables. Website sections have a type, ordering field, foreign key, timestamp and JSON content validated by a shared API schema. Each page has independent draft and published section records. Typed SQL views expose hero content, experience cards, destinations, gallery/video, wellness and footer information. Content arrays live inside their section JSON so each published revision is complete and atomic. Image binaries remain on disk, never in MySQL.

Uploads require authentication, allow JPG/PNG/WebP only, have an 8 MB/40 megapixel limit, and are decoded and re-encoded as WebP to validate content and remove metadata. Filenames are UUIDs. Deleting a referenced asset is rejected; original supplied assets are preserved. Remove images from draft and published sections before deleting uploads. Back up both MySQL and the `uploads` directory. Existing project images are in `public/images` and included by Vite in production builds.

## Production

```sh
npm run build
npm start
```

Set `NODE_ENV=production`, `APP_ORIGIN=https://your-domain.example`, database credentials and `SESSION_SECRET`. Express serves `dist`, API routes and uploads. It listens on loopback port 3001 by default; place an HTTPS reverse proxy in front of it. Requests to unknown frontend paths render the SPA and show a page-not-found state if no published page exists. Ensure the proxy forwards requests without altering their Origin header. Session and login limits are per Node process; use a shared rate-limit store before deploying multiple instances. Configure a process manager and database/uploads backups.

Map tiles are provided by OpenStreetMap and require network access. YouTube embeds use the privacy-enhanced domain and require internet access; administrators should verify rights and embedding availability for their chosen video. The small text-based tourism wordmark is a design recreation, not an official logo asset.

## Project structure

```text
src/
  main.jsx                React entry and routes
  styles.css              Responsive public and admin design; Tailwind import
  api.js                  JSON/multipart API client
  public/PublicPage.jsx   Reusable public sections, Leaflet map and gallery
  admin/Admin.jsx         Login, dashboard, editors, page/media/account management
shared/content.js         Seed content, section templates, YouTube URL parser
server/
  index.js                Environment and database bootstrap
  app.js                  REST routes, authorization, uploads, static hosting
  store.js                MySQL repository and read-only preview repository
  validation.js           Server-side typed content validation
  schema.sql              MySQL schema and typed views
  seed.sql                Standalone initial-data SQL for an empty database
  setup.js                Idempotent schema and initial-data installation
  create-admin.js         Secure initial account provisioning
scripts/prepare-assets.js Supplied image optimization and gallery extraction
public/images/            Optimized original assets
uploads/                  Administrator-uploaded media (gitignored)
tests/api.test.js         API/authentication/publishing/upload contract tests
```

## Verification

```sh
npm test
npm run build
```

For browser checks with Google Chrome installed, run `node scripts/check-ui.js` while the app serves port 3001. After configuring MySQL, `node scripts/check-mysql-ui.js` starts an isolated test server on port 3002 and exercises the full admin workflow against MySQL. It creates and cleans up a uniquely named test account, page and upload, preserving normal content. Screenshots are saved to `test-results/`.

The API suite uses an isolated repository double; it verifies authorization, cookie settings, input validation, draft isolation, publishing, page removal, image validation/reference protection, and session invalidation. It does not substitute for a live MySQL test.

After configuring MySQL, verify persistence by editing a draft, restarting Express, confirming the draft remains, publishing, then loading its URL in a separate signed-out window. Upload a photo, assign it, publish it, and confirm it loads after restart. Check both desktop and mobile widths; test map filtering and markers, the YouTube embed, gallery lightbox, and newly published/unpublished pages.
