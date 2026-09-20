import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = process.env.ROOMFENG_UIUX_ORIGIN || 'http://127.0.0.1:4321';
const evidenceDir = path.resolve(process.env.ROOMFENG_UIUX_EVIDENCE_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/uiux/evidence/review-03'));
fs.mkdirSync(evidenceDir, { recursive: true });
const navigationEvidence = [];

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

try {
  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await open(page, '/');
    assert.match(await page.locator('h1').first().textContent(), /放不放得下|Measure/);
    assert.match((await page.locator('.plan-measurement').allTextContents()).join(' '), /360.*300|150.*190|120.*60|80/);
    await assertNoHorizontalOverflow(page, `homepage-${width}`);
    await screenshot(page, `homepage-${width}.png`);
    await page.close();
  }

  const fit = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await open(fit, '/zh/furniture-fit-checker/');
  assert.equal(await fit.locator('h1').first().textContent(), '家具尺寸適配檢查');
  await fit.locator('[data-fit-preset]').first().click();
  assert.match(await fit.locator('[data-fit-result]').textContent(), /本體適配/);
  assert.equal(await fit.locator('[data-fit-diagram] svg').getAttribute('viewBox'), '0 0 300 300');
  for (const selectedUnit of ['m', 'ft']) {
    await fit.locator('[data-fit-unit]').selectOption(selectedUnit);
    await fit.locator('[data-fit-preset]').first().click();
    const geometry = await fit.locator('[data-fit-diagram] svg').evaluate((svg) => Object.fromEntries(['data-room-width', 'data-room-length', 'data-furniture-width', 'data-furniture-depth'].map((key) => [key, svg.getAttribute(key)])));
    assert.deepEqual(geometry, { 'data-room-width': '300', 'data-room-length': '300', 'data-furniture-width': '105', 'data-furniture-depth': '188' });
  }
  await fit.locator('[data-fit-unit]').selectOption('cm');
  await fit.locator('[data-fit-preset]').first().click();
  const presetPayloads = await fit.locator('a[data-planner-handoff]').evaluateAll((links) => links.map((link) => JSON.parse(link.dataset.plannerHandoff).items[0]).map((item) => [item.widthCm, item.depthCm, item.type]));
  const uniquePresetPayloads = [...new Map(presetPayloads.map((item) => [item.join(':'), item])).values()];
  for (const expected of [[105, 188, 'bed'], [150, 190, 'bed'], [180, 85, 'sofa']]) assert.ok(uniquePresetPayloads.some((item) => item.join(':') === expected.join(':')), `missing preset handoff ${expected.join(' × ')}`);
  await screenshot(fit, 'furniture-fit-interactive-1280.png');
  await assertNoHorizontalOverflow(fit, 'furniture-fit-1280');
  const singleBedHandoffIndex = await fit.locator('a[data-planner-handoff]').evaluateAll((links) => links.findIndex((link) => {
    const item = JSON.parse(link.dataset.plannerHandoff).items[0];
    return item.widthCm === 105 && item.depthCm === 188 && item.type === 'bed';
  }));
  assert.ok(singleBedHandoffIndex >= 0, 'single-bed handoff link is present');
  await fit.locator('a[data-planner-handoff]').nth(singleBedHandoffIndex).click();
  await fit.waitForURL(/\/zh\/room-layout-planner\/\?rf_quick_handoff=1/);
  await fit.waitForTimeout(250);
  const handoff = await fit.locator('.planner-svg').evaluate((svg) => {
    const rect = Array.from(svg.querySelectorAll('rect')).find((candidate) => candidate.getAttribute('width') === '105' && candidate.getAttribute('height') === '188');
    return { viewBox: svg.getAttribute('viewBox'), width: rect?.getAttribute('width'), height: rect?.getAttribute('height') };
  });
  assert.equal(handoff.viewBox, '0 0 348 348');
  assert.equal(handoff.width, '105');
  assert.equal(handoff.height, '188');
  await screenshot(fit, 'planner-furniture-fit-handoff-1280.png');
  await fit.close();

  const bedroom = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await open(bedroom, '/zh/small-bedroom-layout/');
  assert.equal(await bedroom.locator('h1').first().textContent(), '小房間配置指南｜床、書桌、衣櫃怎麼放才不擠');
  assert.equal(await bedroom.locator('[data-measured-plan]').getAttribute('viewBox'), '0 0 248 400');
  assert.equal(await bedroom.locator('a[data-planner-handoff]').getAttribute('data-planner-handoff').then((value) => JSON.parse(value).room.widthCm), 248);
  assert.match(await bedroom.locator('.measured-check').textContent(), /127 cm/);
  assert.match(await bedroom.locator('.measured-check').textContent(), /47 cm/);
  await screenshot(bedroom, 'bedroom-landing-1024.png');
  await bedroom.close();

  const studio = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await open(studio, '/zh/studio-apartment-layout/');
  assert.equal(await studio.locator('h1').first().textContent(), '套房格局配置｜單房空間分出睡眠、工作與用餐區');
  assert.equal(await studio.locator('[data-measured-plan]').getAttribute('viewBox'), '0 0 560 500');
  const studioPayload = JSON.parse(await studio.locator('a[data-planner-handoff]').getAttribute('data-planner-handoff'));
  assert.deepEqual(studioPayload.items.map((item) => [item.widthCm, item.depthCm]), [[150, 190], [100, 50], [120, 45]]);
  await screenshot(studio, 'studio-landing-1024.png');
  await studio.close();

  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    const planner = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 1000 } });
    await open(planner, '/zh/room-layout-planner/');
    await assertNoHorizontalOverflow(planner, `planner-${width}`);
    if (width === 1280) {
      for (const panel of ['room', 'furniture', 'templates']) {
        await planner.locator(`[data-planner-open="${panel}"]`).first().click();
        assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), panel);
        assert.equal(await planner.locator(`[data-planner-panel="${panel}"]`).isVisible(), true);
      }
      await planner.locator('[data-planner-open="checks"]').first().click();
      assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), 'checks');
      assert.equal(await planner.locator('.planner-drawer-checks').isVisible(), true);
      await screenshot(planner, 'planner-report-export-preview-1280.png');
      await planner.locator('[data-planner-close]').click();
      const exportEvidence = await planner.evaluate(async () => {
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
      fs.writeFileSync(path.join(evidenceDir, 'planner-export-browser.png'), Buffer.from(exportEvidence.png.bytes));
      fs.writeFileSync(path.join(evidenceDir, 'planner-export-browser.pdf'), Buffer.from(exportEvidence.pdf.bytes));
    }
    if (width === 390) {
      await planner.locator('.planner-mobile-action[data-planner-open="room"]').click();
      assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), 'room');
      await planner.locator('[data-planner-close]').click();
      await planner.locator('.planner-mobile-action[data-planner-open="report"]').click();
      assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), 'report');
    }
    await screenshot(planner, `planner-${width}.png`);
    await planner.close();
  }

  const guide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await open(guide, '/zh/layout-guides/10x10-bedroom-layout/');
  assert.equal(await guide.locator('h1').count(), 1);
  assert.equal(await guide.locator('.guide-measure-flow').count(), 1);
  await assertNoHorizontalOverflow(guide, 'guide-zh-1280');
  await screenshot(guide, 'guide-zh-1280.png');
  await guide.close();

  fs.writeFileSync(path.join(evidenceDir, 'performance.json'), JSON.stringify({ source: baseUrl, generatedAt: new Date().toISOString(), navigation: navigationEvidence }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', screenshots: evidenceDir, viewports: [375, 390, 768, 1024, 1280, 1440], checks: ['homepage measurement facts', 'furniture fit calculation and measured SVG', 'exact-dimension handoff', 'bedroom/studio measured plans and payloads', 'rail panel selection', 'mobile report drawer', 'zh guide template', 'browser PNG/PDF blobs'], performance: navigationEvidence }));
} finally {
  await browser.close();
}
