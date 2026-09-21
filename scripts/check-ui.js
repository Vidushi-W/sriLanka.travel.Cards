import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
page.on('pageerror', (e) => failures.push(e.message));
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Bliss nature trails', exact: true }).waitFor();
for (const img of await page.locator('img[src^="/images/"]').all()) {
  await img.scrollIntoViewIfNeeded();
  await img.evaluate((el) =>
    el.complete
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          el.onload = resolve;
          el.onerror = reject;
        }),
  );
}
await page.evaluate(() => window.scrollTo(0, 0));
assert.equal(
  await page
    .locator('img')
    .evaluateAll((images) => images.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src))
    .then((x) => x.filter((x) => !x.includes('tile.openstreetmap.org')))
    .then((x) => x.length),
  0,
  'Local images must load',
);
await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
await page.getByRole('button', { name: 'National parks', exact: true }).click();
assert.equal(await page.locator('.destination-item').count(), 2);
await page.locator('.destination-item').filter({ hasText: 'Minneriya' }).click();
await page.locator('.selected-destination').getByRole('heading', { name: 'Minneriya' }).waitFor();
await page.getByRole('button', { name: 'View Island colours', exact: true }).click();
await page.getByRole('dialog', { name: 'Island colours' }).waitFor();
await page.keyboard.press('Escape');
assert.equal(await page.getByRole('dialog').count(), 0);
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  'Mobile page must not overflow',
);
await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
await page
  .getByRole('navigation', { name: 'Main navigation' })
  .getByRole('link', { name: 'Nature & wildlife', exact: true })
  .click();
assert.equal(await page.getByRole('button', { name: 'Open navigation', exact: true }).count(), 1);
await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
await page.goto('http://localhost:3001/experiences/ayurveda', { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Ayurveda', exact: true }).first().waitFor();
await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
await page.screenshot({ path: 'test-results/login.png', fullPage: true });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  'Mobile login must not overflow',
);
assert.deepEqual(failures, [], 'No browser JavaScript errors');
console.log(
  'Desktop/mobile rendering, local images, filters, destination details, lightbox, mobile navigation, experience route and login page passed.',
);
await browser.close();
