import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const baseUrl = process.env.ROOMFENG_PREVIEW_URL ?? 'http://127.0.0.1:4321';
const targetPaths = [
  '/en/8x10-bedroom-layout/', '/en/9x10-bedroom-layout/', '/en/layout-guides/10x10-bedroom-layout/',
  '/en/layout-guides/10x12-bedroom-queen-desk/', '/en/11x12-bedroom-layout/', '/en/12x12-bedroom-layout/',
  '/en/layout-guides/300-sq-ft-studio-layout/', '/en/350-sq-ft-studio-apartment-layout/', '/en/400-sq-ft-studio-apartment-layout/',
  '/en/450-sq-ft-studio-apartment-layout/', '/en/500-sq-ft-studio-apartment-layout/', '/en/long-narrow-living-room-layout/',
  '/en/awkward-living-room-layout/', '/en/living-room-layout-with-fireplace-and-tv/', '/en/couch-fit-through-door-calculator/',
  '/en/furniture-fit-calculator/', '/en/bed-room-fit-calculator/', '/en/feng-shui-bed-placement/', '/en/bed-facing-door-feng-shui/',
  '/en/mirror-facing-bed-feng-shui/',
];
const critical = {
  '/en/': { title: 'RoomFeng | Free Room Furniture Layout Tool', h1: 'Will it fit? Check before you buy or move it.' },
  '/en/room-layout-planner/': { title: 'Room Layout Planner | Free Online Furniture Planner', h1: 'RoomFeng Room Planner' },
  '/en/room-size-layout-templates/': { title: 'Room Sizer & Layout Templates | 150–450 sq ft Plans', h1: 'Room sizer with calculated layout templates' },
  '/en/studio-apartment-layout/': { title: 'Studio Apartment Layout Planner | Plan Sleep Work and Dining Zones', h1: 'Studio apartment layout planner' },
  '/en/moving-new-home-os/': { title: 'Moving & New Home OS | Furniture Fit, Boxes & Budget | RoomFeng', h1: 'Plan the move before moving day.' },
};

const browser = await chromium.launch({ headless: true });
const errors = [];
const visit = async (page, path, expected = null) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200, `${path}: HTTP status`);
  assert.equal(await page.locator('h1').count(), 1, `${path}: h1 count`);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://roomfeng.win${path}`, `${path}: canonical`);
  assert.equal(await page.locator('meta[name="robots"]').count(), 0, `${path}: unexpected robots meta`);
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(dimensions.scrollWidth <= dimensions.width + 1, `${path}: horizontal overflow ${dimensions.scrollWidth} > ${dimensions.width}`);
  if (expected) {
    assert.equal(await page.title(), expected.title, `${path}: title changed`);
    assert.equal((await page.locator('h1').innerText()).trim(), expected.h1, `${path}: H1 changed`);
  }
  if (path.includes('calculator')) {
    await page.locator('#run-calculation').click();
    assert.ok((await page.locator('#calculation-result').innerText()).length > 20, `${path}: calculator did not render a result`);
    if (path === '/en/bed-room-fit-calculator/') {
      assert.equal(await page.locator('#bed-size option[value="Twin XL"]').textContent(), 'Twin XL — 38 × 80 in mattress', `${path}: Twin XL label changed`);
      assert.equal(await page.locator('#bed-size option[value="California King"]').textContent(), 'California King — 72 × 84 in mattress', `${path}: California King label changed`);
    }
    if (path === '/en/couch-fit-through-door-calculator/') {
      await page.locator('#leg-reduction-ft').fill('3');
      await page.locator('#leg-reduction-in').fill('0');
      await page.locator('#run-calculation').click();
      assert.match(await page.locator('#calculation-result').innerText(), /Removable leg reduction must be smaller than couch height\./, `${path}: invalid leg reduction was not rejected`);
    }
    await page.locator('#unit-system').selectOption('metric');
    assert.ok(await page.locator('.metric-input:not([hidden])').count() > 0, `${path}: metric toggle did not expose inputs`);
  }
  if (path === '/en/room-layout-planner/') {
    const storage = await page.evaluate(() => { localStorage.setItem('__roomfeng_preview_check', 'ok'); const value = localStorage.getItem('__roomfeng_preview_check'); localStorage.removeItem('__roomfeng_preview_check'); return value; });
    assert.equal(storage, 'ok', `${path}: localStorage unavailable`);
    assert.ok(await page.locator('[data-planner]').count() === 1, `${path}: planner root missing`);
    assert.ok(await page.getByText('Structural checks', { exact: true }).count() >= 1, `${path}: structural checks missing`);
  }
  if (path === '/en/') {
    for (const target of [
      '/en/long-narrow-living-room-layout/',
      '/en/awkward-living-room-layout/',
      '/en/living-room-layout-with-fireplace-and-tv/',
      '/en/feng-shui-bed-placement/',
      '/en/bed-facing-door-feng-shui/',
      '/en/mirror-facing-bed-feng-shui/',
    ]) assert.ok(await page.locator(`a[href="${target}"]`).count() >= 1, `${path}: missing inbound reference link ${target}`);
  }
  if (pageErrors.length) errors.push(`${path}: ${pageErrors.join('; ')}`);
};

for (const viewport of [{ width: 375, height: 900 }, { width: 1440, height: 1000 }]) {
  const page = await browser.newPage({ viewport });
  for (const path of targetPaths) await visit(page, path);
  for (const [path, expected] of Object.entries(critical)) await visit(page, path, expected);
  await page.close();
}
await browser.close();
assert.deepEqual(errors, [], `browser page errors: ${errors.join(' | ')}`);
console.log(`[us-seo-preview] PASS: ${targetPaths.length} target routes + ${Object.keys(critical).length} critical routes at 375px and 1440px; no overflow, metadata, calculator, planner, or page-error failures.`);
