import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const origin = process.env.ROOMFENG_REPAIR_ORIGIN || 'http://127.0.0.1:4321';
const evidenceDir = resolve(process.env.ROOMFENG_REPAIR_EVIDENCE_DIR || 'reports/production-repair-001/browser');
const widths = [375, 768, 1280, 1440];
const routes = [
  '/', '/en/', '/en/room-layout-planner/', '/en/furniture-fit-checker/',
  '/en/room-size-layout-templates/', '/en/layout-guides/10x10-bedroom-layout/',
  '/en/layout-guides/3x3m-bedroom-layout/', '/zh/layout-guides/10x10-bedroom-layout/',
  '/zh/layout-guides/3x3m-bedroom-layout/', '/en/small-space-layout-vault/',
  '/en/bed-desk-wardrobe-layout/', '/en/moving-new-home-os/',
  '/about/', '/privacy/', '/terms/', '/contact/', '/disclaimer/', '/changelog/',
  '/en/about/', '/en/privacy/', '/en/terms/', '/en/contact/', '/en/disclaimer/', '/en/changelog/',
  '/zh/blog/small-bedroom-bed-placement/', '/zh/blog/door-window-room-layout/',
  '/zh/blog/room-layout-faq/', '/zh/blog/room-layout-mistakes/',
  '/zh/blog/wardrobe-door-types/', '/zh/bed-desk-wardrobe-layout/',
];
const screenshotRoutes = new Set(['/en/about/', '/en/layout-guides/10x10-bedroom-layout/', '/contact/']);
mkdirSync(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const findings = [];
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    let pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));
    for (const path of routes) {
      pageErrors = [];
      const response = await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.locator('h1').first().waitFor({ timeout: 5000 });
      assert.equal(response?.status(), 200, `${path} HTTP status at ${width}px`);
      const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      assert.ok(size.document <= size.viewport + 2 && size.body <= size.viewport + 2, `${path} overflow at ${width}px: ${JSON.stringify(size)}`);
      assert.deepEqual(pageErrors, [], `${path} page error at ${width}px`);
      assert.ok(await page.locator('.site-footer a').count() >= 5, `${path} missing footer links`);
      if (path.startsWith('/en/')) {
        const wrong = await page.locator('.site-footer a[href="/about/"], .site-footer a[href="/privacy/"], .site-footer a[href="/terms/"], .site-footer a[href="/contact/"], .site-footer a[href="/disclaimer/"], .site-footer a[href="/changelog/"]').count();
        assert.equal(wrong, 0, `${path} has Chinese trust link in footer`);
      }
      if (screenshotRoutes.has(path) && (width === 375 || width === 1440)) {
        await page.screenshot({ path: resolve(evidenceDir, `${path.replaceAll('/', '_')}-${width}.png`), fullPage: true });
      }
      findings.push({ path, width, status: response?.status(), overflowPx: Math.max(size.document, size.body) - size.viewport, pageErrors: pageErrors.length });
    }
    if (width === 375) {
      await page.goto(`${origin}/en/about/`);
      await page.locator('.site-nav-toggle').click();
      assert.ok(await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About' }).isVisible(), 'mobile About navigation');
      await page.locator('.site-nav-panel a[lang="zh"]').click();
      assert.equal(new URL(page.url()).pathname, '/about/', 'trust-page language switch');
      await page.goto(`${origin}/en/bed-desk-wardrobe-layout/`);
      const data = await page.locator('[data-affiliate-amazon="true"] script[data-affiliate-products]').first().textContent();
      assert.ok(data, 'Amazon product pool is rendered');
      const products = JSON.parse(data);
      assert.equal(new Set(products.map((product) => product.name)).size, products.length, 'Amazon titles must distinguish different ASINs');
      assert.ok(products.every((product) => product.affiliate_url.includes('tag=roomfeng-20')), 'Amazon tag preserved');
      assert.ok(products.every((product) => product.description.includes(product.product_id)), 'fallback description identifies catalog ASIN');
      const link = page.locator('[data-affiliate-amazon="true"] a[data-affiliate-product-link]').first();
      assert.equal(await link.getAttribute('rel'), 'sponsored nofollow noopener', 'affiliate rel preserved');
    }
    await context.close();
  }
  writeFileSync(resolve(evidenceDir, 'results.json'), JSON.stringify({ status: 'PASS', routes: routes.length, widths, checks: findings.length, findings }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', routes: routes.length, widths, checks: findings.length, evidenceDir }));
} finally {
  await browser.close();
}
