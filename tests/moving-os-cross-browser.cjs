const assert = require('node:assert/strict');
const fs = require('node:fs');

const baseUrl = process.env.MOVING_OS_QA_BASE_URL || 'http://localhost:8788';
const sessionSecret = process.env.MOVING_OS_QA_SESSION_SECRET || 'qa-session-secret-that-is-at-least-32-characters';
const encryptionKey = process.env.MOVING_OS_QA_ENCRYPTION_KEY || Buffer.from('01234567890123456789012345678901').toString('base64url');
const productId = process.env.MOVING_OS_QA_PRODUCT_ID || 'roomfeng-moving-new-home-os-v1';
const licenseKey = 'QA-ONLY-1234-5678';

async function run() {
  const { chromium, firefox, webkit } = require('playwright');
  const { createEntitlementToken, createSessionToken } = await import('../functions/_lib/moving-os-license.ts');
  const token = await createSessionToken(sessionSecret, licenseKey, productId, 'payhip');
  const entitlement = await createEntitlementToken({ v: 1, product: productId, provider: 'payhip', licenseKey, issuedAt: Math.floor(Date.now() / 1000), lastVerifiedAt: Math.floor(Date.now() / 1000), expiresAt: Math.floor(Date.now() / 1000) + 172800 }, encryptionKey);
  if (!entitlement) throw new Error('QA entitlement encryption key is invalid');
  const results = [];

  for (const [name, browserType, viewport] of [['chromium', chromium, { width: 1280, height: 800 }], ['firefox', firefox, { width: 1280, height: 800 }], ['webkit', webkit, { width: 1280, height: 800 }], ['webkit-mobile', webkit, { width: 390, height: 844 }]]) {
    console.log(`starting ${name}`);
    const browser = await browserType.launch({ headless: true });
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    await context.addInitScript(() => {
      window.__movingOsPrintCalled = false;
      window.print = () => { window.__movingOsPrintCalled = true; };
    });
    await context.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ status: 204 }));
    await context.route('**/api/product/license/verify', async (route) => {
      const body = route.request().postDataJSON();
      assert.equal(body.provider, 'payhip', `${name}: provider selector missing`);
      assert.equal(body.product, productId, `${name}: product id missing`);
      await context.addCookies([{ name: '__Host-rf_moving_os_session', value: token, url: baseUrl, httpOnly: true, secure: true, sameSite: 'Lax' }, { name: 'rf_entitlement', value: entitlement, url: baseUrl, httpOnly: true, secure: true, sameSite: 'Lax' }]);
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify({ ok: true, expiresIn: 86400 }) });
    });
    const page = await context.newPage();
    const errors = [];
    const httpErrors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text()); });
    page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });

    await page.goto(`${baseUrl}/en/moving-new-home-os/`);
    await page.evaluate(() => localStorage.setItem('paid', 'true'));
    await page.goto(`${baseUrl}/en/moving-new-home-os/app/`);
    assert.match(page.url(), /\/en\/moving-new-home-os\/activate\//, `${name}: fake paid flag bypassed access`);
    await page.getByLabel('Where did you purchase?').selectOption('payhip');
    await page.getByLabel('License key').fill(licenseKey);
    await page.getByRole('button', { name: 'Activate', exact: true }).click();
    await page.waitForURL('**/en/moving-new-home-os/app/');
    await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();

    await page.getByRole('button', { name: /Load complete example/ }).click();
    const storageBefore = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes('moving')).length);
    assert.ok(storageBefore > 0, `${name}: project was not saved locally`);
    await page.reload();
    await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();

    await context.clearCookies();
    await page.goto(`${baseUrl}/en/moving-new-home-os/app/`);
    assert.match(page.url(), /\/en\/moving-new-home-os\/activate\//, `${name}: clearing the signed session did not require reactivation`);
    await context.addCookies([{ name: '__Host-rf_moving_os_session', value: token, url: baseUrl, httpOnly: true, secure: true, sameSite: 'Lax' }, { name: 'rf_entitlement', value: entitlement, url: baseUrl, httpOnly: true, secure: true, sameSite: 'Lax' }]);
    await page.goto(`${baseUrl}/en/moving-new-home-os/app/`);
    await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();

    await page.getByRole('button', { name: /05 Room layout/ }).click();
    await page.locator('[data-layout-room]').selectOption('room-bedroom');
    await Promise.all([page.waitForURL('**/en/room-layout-planner/'), page.locator('[data-action="open-planner"]').click()]);
    for (const imported of ['Queen bed frame', 'Queen mattress', 'Double wardrobe', 'Bedroom door']) await page.getByRole('button', { name: imported, exact: true }).waitFor();
    await page.goBack(); await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();

    await page.getByRole('button', { name: /12 Exports & backup/ }).click();
    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="export-json"]').click()]);
    const jsonPath = await jsonDownload.path(); assert.ok(jsonPath && fs.statSync(jsonPath).size > 100, `${name}: JSON export failed`);
    await page.locator('[data-import-json]').setInputFiles(jsonPath);
    const [xlsxDownload] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="export-xlsx"]').click()]);
    const xlsxPath = await xlsxDownload.path(); assert.ok(xlsxPath && fs.statSync(xlsxPath).size > 1000, `${name}: XLSX export failed`);
    const [printPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('[data-action="print-planner"]').click(),
    ]);
    await printPage.waitForURL('blob:**');
    await printPage.waitForLoadState('domcontentloaded');
    assert.match(await printPage.title(), /Printable Planner/, `${name}: printable edition title missing`);
    assert.match(await printPage.locator('body').innerText(), /Furniture decisions/, `${name}: printable edition content missing`);
    await printPage.close();

    if (name === 'webkit-mobile') {
      for (const moduleName of ['04 Furniture decisions', '06 Timeline', '07 Box tracker', '10 Move day']) { await page.getByRole('button', { name: new RegExp(moduleName) }).click(); assert.equal(await page.locator('.os-module.active').isVisible(), true); }
      await page.getByRole('button', { name: /07 Box tracker/ }).click(); const contents = page.locator('form[data-form="box"] input[name="contents"]'); await contents.focus(); await contents.fill('Mobile keyboard QA'); assert.equal(await contents.inputValue(), 'Mobile keyboard QA');
    }

    await page.evaluate(async () => { if ('serviceWorker' in navigator) { const registration = await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })); return registration.scope; } return ''; });
    await page.waitForTimeout(800);
    const cacheReady = await page.evaluate(async () => (await caches.keys()).some((name) => name.includes('moving-os-offline')));
    assert.equal(cacheReady, true, `${name}: offline cache not created`);
    await page.evaluate(() => navigator.serviceWorker.controller?.postMessage({ type: 'QA_SIMULATE_OFFLINE', enabled: true }));
    await page.waitForTimeout(100);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Moving & New Home OS', exact: true }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.controller?.postMessage({ type: 'QA_SIMULATE_OFFLINE', enabled: false }));

    const qaOrigin = new URL(baseUrl).origin;
    const unexpectedHttpErrors = httpErrors.filter((item) => new URL(item.url).origin === qaOrigin && !(item.status === 401 && item.url.endsWith('/api/product/license/session')));
    assert.deepEqual(unexpectedHttpErrors, [], `${name}: HTTP errors`);
    assert.deepEqual(errors, [], `${name}: browser script errors`);
    results.push({ browser: name, activation: 'PASS', access: 'PASS', localStorage: 'PASS', planner: 'PASS', jsonBackup: 'PASS', xlsx: 'PASS', printableEdition: 'PASS', offlineFallback: 'PASS', viewport: `${viewport.width}x${viewport.height}` });
    await browser.close();
  }
  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
