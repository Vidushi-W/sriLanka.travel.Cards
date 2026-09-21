# Verification — 21 September 2026

Completed locally on Windows with Node.js 22, Google Chrome and the configured MySQL 8 database.

- `npm run build`: passed; production React bundle generated.
- `npm test`: 8/8 passed. Covers authorization, session cookies, input validation, unpublished content isolation, publishing, upload validation/reference protection, and password/session invalidation.
- `node scripts/check-ui.js`: passed at desktop (1440 px) and mobile (390 px) widths. Local images loaded; no horizontal overflow or browser JavaScript errors. Map category filters, destination selection, gallery lightbox and Escape dismissal, mobile navigation, wellness detail routes, and login rendering worked.
- `node scripts/check-mysql-ui.js`: passed against real MySQL. Browser login, new draft page creation, image upload and assignment, draft save and preview, publishing, public URL access, unpublishing, and mobile dashboard checked. A fresh server and database connection pool retained published content, draft data, uploaded image paths, and the authenticated session.
- Temporary database test accounts, pages and uploads were removed after testing. Seeded site content was preserved.
- Desktop, mobile, login, dashboard and editor screenshots were rendered and visually inspected. Screenshots are available in `test-results/` (not committed).

External map tiles loaded during browser verification. YouTube playback depends on connectivity, regional availability and the selected video's embedding settings; playback was not asserted by automated tests. The initial video is [Sri Lanka Tourism's “A Journey through Nature, Culture, and Cuisine”](https://www.youtube.com/watch?v=s4xgCFEsTEI).

This verifies local behavior. HTTPS reverse-proxy deployment and multi-instance operation have not been exercised.
