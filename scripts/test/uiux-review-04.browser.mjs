import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:4321';
const evidenceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/uiux/evidence/review-04');
fs.mkdirSync(evidenceDir, { recursive: true });
const navigationEvidence = [];
const viewports = [375, 390, 768, 1024, 1280, 1440];

const browser = await chromium.launch({ headless: true });
const screenshot = async (page, name, fullPage = true) => page.screenshot({ path: path.join(evidenceDir, name), fullPage });
const open = async (page, route) => {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  navigationEvidence.push(await page.evaluate((pathname) => {
    const entry = performance.getEntriesByType('navigation')[0];
    return { route: pathname, domContentLoadedMs: Math.round(entry?.domContentLoadedEventEnd ?? 0), loadEventMs: Math.round(entry?.loadEventEnd ?? 0), transferSizeBytes: (entry && 'transferSize' in entry) ? entry.transferSize : null };
  }, route));
};
const assertNoHorizontalOverflow = async (page, label) => {
  const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth - window.innerWidth, body: document.body.scrollWidth - window.innerWidth }));
  assert.ok(overflow.document <= 1 && overflow.body <= 1, `${label} horizontal overflow: ${JSON.stringify(overflow)}`);
};
const assertPlannerPanels = async (page) => {
  for (const panel of ['room', 'furniture', 'templates']) {
    await page.locator(`[data-planner-open="${panel}"]`).first().click();
    assert.equal(await page.locator('.planner-drawer').getAttribute('data-panel'), panel);
    assert.equal(await page.locator(`[data-planner-panel="${panel}"]`).isVisible(), true);
  }
  await page.locator('[data-planner-open="checks"]').first().click();
  assert.equal(await page.locator('.planner-drawer').getAttribute('data-panel'), 'checks');
};
const captureExports = async (page, prefix) => {
  const exportEvidence = await page.evaluate(async () => {
    const api = window.__roomfengExportTest;
    if (!api) throw new Error('export test harness unavailable');
    const [png, pdf] = await Promise.all([api.png(), api.pdf()]);
    const pngBytes = new Uint8Array(await png.arrayBuffer());
    const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
    const bitmap = await createImageBitmap(png);
    const pngGeometry = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { png: { size: png.size, type: png.type, bytes: Array.from(pngBytes), head: Array.from(pngBytes.slice(0, 8)), geometry: pngGeometry }, pdf: { size: pdf.size, type: pdf.type, bytes: Array.from(pdfBytes), head: Array.from(pdfBytes.slice(0, 5)) } };
  });
  assert.equal(exportEvidence.png.type, 'image/png');
  assert.ok(exportEvidence.png.size > 0 && exportEvidence.png.geometry.width > 0 && exportEvidence.png.geometry.height > 0);
  assert.deepEqual(exportEvidence.png.head, [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(exportEvidence.pdf.type, 'application/pdf');
  assert.ok(exportEvidence.pdf.size > 0);
  assert.deepEqual(exportEvidence.pdf.head, [37, 80, 68, 70, 45]);
  fs.writeFileSync(path.join(evidenceDir, `${prefix}-export.png`), Buffer.from(exportEvidence.png.bytes));
  fs.writeFileSync(path.join(evidenceDir, `${prefix}-export.pdf`), Buffer.from(exportEvidence.pdf.bytes));
  return { pngBytes: exportEvidence.png.size, pdfBytes: exportEvidence.pdf.size, pngGeometry: exportEvidence.png.geometry };
};

try {
  for (const [locale, route, h1Pattern] of [['zh', '/', /放不放得下/], ['en', '/en/', /Will it fit/]]) {
    for (const width of viewports) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await open(page, route);
      assert.match(await page.locator('h1').first().textContent(), h1Pattern);
      assert.match((await page.locator('.plan-measurement').allTextContents()).join(' '), /360.*300|150.*190|120.*60|80/);
      assert.equal(await page.locator('a[href$="room-layout-planner/"]').count() > 0, true);
      assert.equal(await page.locator('a[href$="furniture-fit-checker/"]').count() > 0, true);
      await assertNoHorizontalOverflow(page, `homepage-${locale}-${width}`);
      await screenshot(page, `homepage-${locale}-${width}.png`);
      await page.close();
    }
  }

  for (const [locale, route, expectedH1, plannerRoute] of [
    ['zh', '/zh/furniture-fit-checker/', '家具尺寸適配檢查', '/zh/room-layout-planner/'],
    ['en', '/en/furniture-fit-checker/', 'Furniture fit checker', '/en/room-layout-planner/'],
  ]) {
    const fit = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await open(fit, route);
    assert.equal(await fit.locator('h1').first().textContent(), expectedH1);
    assert.equal(await fit.locator('[data-furniture-fit-tool]').getAttribute('data-fit-locale'), locale);
    await fit.locator('[data-fit-preset]').first().click();
    assert.match(await fit.locator('[data-fit-result]').textContent(), /Physical fit/);
    assert.equal(await fit.locator('[data-fit-diagram] svg').getAttribute('viewBox'), '0 0 300 300');
    await fit.locator('[name="roomWidth"]').fill('300');
    await fit.locator('[name="roomLength"]').fill('300');
    await fit.locator('[name="furnitureWidth"]').fill('100');
    await fit.locator('[name="furnitureDepth"]').fill('100');
    await fit.locator('[name="leftClearance"]').fill('120');
    await fit.locator('[name="rightClearance"]').fill('0');
    await fit.locator('[name="frontClearance"]').fill('0');
    await fit.locator('[name="backClearance"]').fill('20');
    await fit.locator('[data-fit-form]').locator('button[type="submit"]').click();
    const asym = await fit.locator('[data-fit-diagram] svg').evaluate((svg) => Object.fromEntries(['data-furniture-x', 'data-furniture-y', 'data-clearance-fit', 'data-clearance-left', 'data-clearance-right', 'data-clearance-front', 'data-clearance-back'].map((key) => [key, svg.getAttribute(key)])));
    assert.deepEqual(asym, { 'data-furniture-x': '160', 'data-furniture-y': '110', 'data-clearance-fit': 'true', 'data-clearance-left': '120', 'data-clearance-right': '0', 'data-clearance-front': '0', 'data-clearance-back': '20' });
    const presetPayloads = await fit.locator('a[data-planner-handoff]').evaluateAll((links) => links.map((link) => JSON.parse(link.dataset.plannerHandoff).items[0]).map((item) => [item.widthCm, item.depthCm, item.type]));
    assert.deepEqual(presetPayloads, [[105, 188, 'bed'], [150, 190, 'bed'], [180, 85, 'sofa']]);
    await screenshot(fit, `furniture-fit-${locale}-1280.png`);
    await assertNoHorizontalOverflow(fit, `furniture-fit-${locale}-1280`);
    await fit.locator('a[data-planner-handoff]').first().click();
    await fit.waitForURL(new RegExp(`${plannerRoute.replaceAll('/', '\\/')}\\?rf_quick_handoff=1`));
    await fit.waitForTimeout(250);
    const handoff = await fit.locator('.planner-svg').evaluate((svg) => {
      const rect = svg.querySelector('[data-id="handoff-single-bed-preset"] rect');
      return { width: rect?.getAttribute('width'), height: rect?.getAttribute('height') };
    });
    assert.deepEqual(handoff, { width: '105', height: '188' });
    await screenshot(fit, `planner-${locale}-furniture-fit-handoff-1280.png`);
    await fit.close();
  }

  for (const locale of ['zh', 'en']) {
    for (const width of viewports) {
      const planner = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 1000 } });
      await open(planner, locale === 'zh' ? '/zh/room-layout-planner/' : '/en/room-layout-planner/');
      await assertNoHorizontalOverflow(planner, `planner-${locale}-${width}`);
      if (width === 1280) {
        await assertPlannerPanels(planner);
        await screenshot(planner, `planner-${locale}-report-export-preview-1280.png`);
        await planner.locator('[data-planner-close]').click();
        await captureExports(planner, `planner-${locale}`);
      }
      if (width === 390) {
        await planner.locator('.planner-mobile-action[data-planner-open="room"]').click();
        assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), 'room');
        await planner.locator('[data-planner-close]').click();
        await planner.locator('.planner-mobile-action[data-planner-open="report"]').click();
        assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), 'report');
      }
      await screenshot(planner, `planner-${locale}-${width}.png`);
      await planner.close();
    }
  }

  for (const [locale, bedroomRoute, studioRoute] of [['zh', '/zh/small-bedroom-layout/', '/zh/studio-apartment-layout/'], ['en', '/en/small-bedroom-layout-planner/', '/en/studio-apartment-layout/']]) {
    const bedroom = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    await open(bedroom, bedroomRoute);
    assert.equal(await bedroom.locator('[data-measured-plan]').getAttribute('viewBox'), '0 0 248 400');
    assert.equal(await bedroom.locator('a[data-planner-handoff]').getAttribute('data-planner-handoff').then((value) => JSON.parse(value).room.widthCm), 248);
    assert.match(await bedroom.locator('.measured-check').textContent(), locale === 'zh' ? /127 cm/ : /127 cm/);
    await screenshot(bedroom, `bedroom-${locale}-measured-1024.png`);
    await bedroom.close();
    const studio = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    await open(studio, studioRoute);
    assert.equal(await studio.locator('[data-measured-plan]').getAttribute('viewBox'), '0 0 560 500');
    const studioPayload = JSON.parse(await studio.locator('a[data-planner-handoff]').getAttribute('data-planner-handoff'));
    assert.deepEqual(studioPayload.items.map((item) => [item.widthCm, item.depthCm]), [[150, 190], [100, 50], [120, 45]]);
    await screenshot(studio, `studio-${locale}-measured-1024.png`);
    await studio.close();
  }

  for (const [locale, route] of [['zh', '/zh/layout-guides/10x10-bedroom-layout/'], ['en', '/en/layout-guides/10x10-bedroom-layout/']]) {
    const guide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await open(guide, route);
    assert.equal(await guide.locator('h1').count(), 1);
    assert.equal(await guide.locator('.guide-measure-flow').count(), 1);
    assert.equal(await guide.locator('a[href$="room-layout-planner/"]').count() > 0, true);
    await assertNoHorizontalOverflow(guide, `guide-${locale}-1280`);
    await screenshot(guide, `guide-${locale}-1280.png`);
    await guide.close();
  }

  fs.writeFileSync(path.join(evidenceDir, 'performance.json'), JSON.stringify({ source: baseUrl, generatedAt: new Date().toISOString(), viewports, navigation: navigationEvidence }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', screenshots: evidenceDir, viewports, checks: ['zh/en homepage measurement facts', 'zh/en Furniture Fit calculation and measured SVG', 'exact-dimension handoff', 'zh/en bedroom/studio measured plans and payloads', 'distinct rail panel selection', 'mobile bottom sheets', 'zh/en Guide templates', 'zh/en browser PNG/PDF exports'], performance: navigationEvidence }));
} finally {
  await browser.close();
}
