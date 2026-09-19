import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:4321';
const evidenceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/uiux/evidence/review-02');
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

try {
  for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await open(page, '/');
    assert.match(await page.locator('h1').first().textContent(), /放不放得下|Measure/);
    assert.match((await page.locator('.plan-measurement').allTextContents()).join(' '), /360.*300|150.*190|120.*60|80/);
    await screenshot(page, `homepage-${width}.png`);
    await page.close();
  }

  const fit = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await open(fit, '/zh/furniture-fit-checker/');
  assert.equal(await fit.locator('h1').first().textContent(), '家具尺寸適配檢查');
  await fit.locator('[data-fit-preset]').first().click();
  assert.match(await fit.locator('[data-fit-result]').textContent(), /Physical fit/);
  assert.equal(await fit.locator('[data-fit-diagram] svg').getAttribute('viewBox'), '0 0 300 300');
  const presetPayloads = await fit.locator('a[data-planner-handoff]').evaluateAll((links) => links.map((link) => JSON.parse(link.dataset.plannerHandoff).items[0]).map((item) => [item.widthCm, item.depthCm, item.type]));
  assert.deepEqual(presetPayloads, [[105, 188, 'bed'], [150, 190, 'bed'], [180, 85, 'sofa']]);
  await screenshot(fit, 'furniture-fit-interactive-1280.png');
  await fit.locator('a[data-planner-handoff]').first().click();
  await fit.waitForURL(/\/zh\/room-layout-planner\/\?rf_quick_handoff=1/);
  await fit.waitForTimeout(250);
  const handoff = await fit.locator('.planner-svg').evaluate((svg) => {
    const rect = svg.querySelector('[data-id="handoff-single-bed-preset"] rect');
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

  const planner = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await open(planner, '/zh/room-layout-planner/');
  for (const panel of ['room', 'furniture', 'templates']) {
    await planner.locator(`[data-planner-open="${panel}"]`).first().click();
    assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), panel);
    assert.equal(await planner.locator(`[data-planner-panel="${panel}"]`).isVisible(), true);
  }
  await planner.locator('[data-planner-open="checks"]').first().click();
  assert.equal(await planner.locator('.planner-drawer').getAttribute('data-panel'), 'checks');
  assert.equal(await planner.locator('.planner-drawer-checks').isVisible(), true);
  await screenshot(planner, 'planner-rail-report-export-preview-1280.png');
  await planner.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await open(mobile, '/zh/room-layout-planner/');
  await mobile.locator('.planner-mobile-action[data-planner-open="room"]').click();
  assert.equal(await mobile.locator('.planner-drawer').getAttribute('data-panel'), 'room');
  await mobile.locator('[data-planner-close]').click();
  await mobile.locator('.planner-mobile-action[data-planner-open="report"]').click();
  assert.equal(await mobile.locator('.planner-drawer').getAttribute('data-panel'), 'report');
  await screenshot(mobile, 'planner-mobile-report-390.png');
  await mobile.close();

  const guide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await open(guide, '/en/layout-guides/10x10-bedroom-layout/');
  assert.equal(await guide.locator('h1').count(), 1);
  await screenshot(guide, 'guide-1280.png');
  await guide.close();

  fs.writeFileSync(path.join(evidenceDir, 'performance.json'), JSON.stringify({ source: baseUrl, generatedAt: new Date().toISOString(), navigation: navigationEvidence }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', screenshots: evidenceDir, viewports: [375, 390, 768, 1024, 1280, 1440], checks: ['homepage measurement facts', 'furniture fit calculation and measured SVG', 'exact-dimension handoff', 'bedroom/studio measured plans and payloads', 'rail panel selection', 'mobile report drawer', 'guide template'], performance: navigationEvidence }));
} finally {
  await browser.close();
}
