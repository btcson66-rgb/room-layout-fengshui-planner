import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.ROOMFENG_PREVIEW_URL ?? 'http://127.0.0.1:4321';
const evidenceDir = path.resolve(process.env.ROOMFENG_US_SEO_EVIDENCE_DIR ?? 'reports/us-seo-growth/2026-09-21/browser');
const targetPaths = [
  '/en/moving-furniture-size-check/',
  '/en/bed-desk-wardrobe-layout/',
  '/en/small-bedroom-layout-planner/',
  '/en/studio-apartment-layout/',
  '/en/furniture-fit-checker/',
];
const widths = [375, 390, 768, 1024, 1440];
const browser = await chromium.launch({ headless: true });
const report = { status: 'PASS', baseUrl, widths, pages: [], screenshots: [] };

await fs.mkdir(evidenceDir, { recursive: true });

for (const pathName of targetPaths) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 900 : 1000 } });
    const pageErrors = [];
    const consoleErrors = [];
    const failedFirstPartyRequests = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.url().startsWith(baseUrl) && response.status() >= 400) failedFirstPartyRequests.push(`${response.status()} ${response.url()}`);
    });
    const response = await page.goto(`${baseUrl}${pathName}`, { waitUntil: 'networkidle', timeout: 60000 });
    assert.equal(response?.status(), 200, `${pathName} @ ${width}: HTTP status`);
    assert.equal(await page.locator('h1').count(), 1, `${pathName} @ ${width}: H1 count`);
    assert.ok(await page.locator('header').count() >= 1, `${pathName} @ ${width}: header missing`);
    assert.ok(await page.locator('a.button, .cta-band a').count() >= 1, `${pathName} @ ${width}: CTA missing`);

    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const tables = [...document.querySelectorAll('table')].map((table) => {
        const parent = table.parentElement;
        const style = parent ? getComputedStyle(parent) : null;
        return { tableWidth: table.getBoundingClientRect().width, parentWidth: parent?.clientWidth ?? 0, overflowX: style?.overflowX ?? '' };
      });
      const svg = [...document.querySelectorAll('svg[data-measured-plan="true"]')].map((node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      return {
        viewportWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        tables,
        svg,
        adSlots: document.querySelectorAll('[data-ad-slot], .ad-slot').length,
      };
    });
    assert.ok(layout.scrollWidth <= layout.viewportWidth + 1, `${pathName} @ ${width}: horizontal overflow ${layout.scrollWidth} > ${layout.viewportWidth}`);
    for (const table of layout.tables) {
      assert.ok(table.tableWidth <= table.parentWidth + 1 || ['auto', 'scroll'].includes(table.overflowX), `${pathName} @ ${width}: table is not contained`);
    }
    for (const rect of layout.svg) {
      assert.ok(rect.left >= -1 && rect.right <= layout.viewportWidth + 1, `${pathName} @ ${width}: measured SVG clipped`);
    }
    assert.deepEqual(pageErrors, [], `${pathName} @ ${width}: page errors ${pageErrors.join(' | ')}`);
    assert.deepEqual(consoleErrors, [], `${pathName} @ ${width}: console errors ${consoleErrors.join(' | ')}`);
    assert.deepEqual(failedFirstPartyRequests, [], `${pathName} @ ${width}: first-party request failures ${failedFirstPartyRequests.join(' | ')}`);

    if (pathName === '/en/furniture-fit-checker/' && width === 390) {
      await page.locator('[data-furniture-fit-tool] form button[type="submit"]').click();
      assert.ok((await page.locator('[data-fit-result]').innerText()).length > 20, 'Furniture Fit Checker did not produce an interactive result');
    }

    if (width === 375 || width === 1440) {
      const safeName = pathName.split('/').filter(Boolean).join('-');
      const screenshotPath = path.join(evidenceDir, `${safeName}-${width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      report.screenshots.push(screenshotPath);
    }
    report.pages.push({ path: pathName, width, status: 200, horizontalOverflow: false, consoleErrors: 0, pageErrors: 0, firstPartyRequestFailures: 0, adSlots: layout.adSlots });
    await page.close();
  }
}

await browser.close();
await fs.writeFile(path.join(evidenceDir, 'browser-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ status: report.status, baseUrl, pageCount: report.pages.length, widths, screenshots: report.screenshots.length, interactiveFurnitureFitChecker: true }));
