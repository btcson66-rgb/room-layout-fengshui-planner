import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.env.ROOMFENG_UIUX_ORIGIN ?? 'http://127.0.0.1:4321';
const evidenceDir = path.resolve(process.env.ROOMFENG_ADSENSE_EVIDENCE_DIR ?? 'docs/uiux/evidence/closeout-005');
const browser = await chromium.launch({ headless: true });
const failures = [];
const routeEvidence = [];

const resourceSnapshot = async (page) => page.evaluate(() => {
  const entries = performance.getEntriesByType('resource');
  const firstPartyJs = entries.filter((entry) => {
    try { return new URL(entry.name).origin === location.origin && /\.js(?:\?|$)/i.test(entry.name); } catch { return false; }
  });
  const adsenseResources = entries.filter((entry) => /(?:googlesyndication|googleads|doubleclick)/i.test(entry.name));
  const summarize = (items) => ({
    requests: items.length,
    transferBytes: items.reduce((total, entry) => total + (entry.transferSize || 0), 0),
    encodedBytes: items.reduce((total, entry) => total + (entry.encodedBodySize || 0), 0),
    decodedBytes: items.reduce((total, entry) => total + (entry.decodedBodySize || 0), 0),
    urls: [...new Set(items.map((entry) => entry.name))],
  });
  return {
    resourceRequests: entries.length,
    firstPartyJavascript: summarize(firstPartyJs),
    adsense: summarize(adsenseResources),
    longTasks: {
      count: window.__roomfengLongTasks?.length ?? 0,
      durationMs: (window.__roomfengLongTasks ?? []).reduce((total, entry) => total + entry.duration, 0),
    },
  };
});

try {
  for (const route of ['/zh/room-layout-planner/', '/en/room-layout-planner/']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => {
      window.__roomfengLongTasks = [];
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) window.__roomfengLongTasks.push({ duration: entry.duration });
          });
          observer.observe({ type: 'longtask', buffered: true });
        } catch {}
      }
    });
    await page.route('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?*', async (request) => {
      await request.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.adsbygoogle = window.adsbygoogle || []; window.__roomfengAdsenseStubLoaded = true;',
      });
    });
    const consoleErrors = [];
    const pageErrors = [];
    const html = await page.request.get(`${origin}${route}`).then((response) => response.text());
    assert.doesNotMatch(html, /<script[^>]+src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i, `${route} must not ship a blocking AdSense src tag`);
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
    const reject = page.locator('[data-consent-action="reject"]');
    if (await reject.isVisible().catch(() => false)) await reject.click();
    const beforeActivation = await resourceSnapshot(page);
    assert.equal(beforeActivation.adsense.requests, 0, `${route} must not load AdSense before Planner activation`);

    await page.locator(route.startsWith('/en/') ? '#planner-mid-en' : '#planner-mid-zh').scrollIntoViewIfNeeded();
    const adId = route.startsWith('/en/') ? 'planner-mid-en' : 'planner-mid-zh';
    await page.waitForFunction((id) => document.querySelector(`#${id} .adsbygoogle`)?.dataset.adInitialized === 'true', adId, { timeout: 5000 });
    assert.equal(await page.locator('script[data-roomfeng-adsense-loader]').count(), 1, `${route} should load AdSense after activation`);
    const stats = await page.evaluate(() => window.__roomfengAdSenseStats);
    assert.equal(stats.initializedSlots, 1, `${route} should initialize one slot`);
    assert.equal(stats.duplicateInitializations, 0, `${route} should not duplicate slot initialization`);
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(100);
    const afterResize = await page.evaluate(() => window.__roomfengAdSenseStats);
    assert.equal(afterResize.initializedSlots, 1, `${route} resize must not reinitialize the slot`);
    assert.equal(afterResize.duplicateInitializations, 0, `${route} resize must not record a duplicate initialization`);
    const afterActivation = await resourceSnapshot(page);
    assert.ok(afterActivation.adsense.requests >= 1, `${route} must load the AdSense loader after activation`);
    assert.deepEqual(consoleErrors, [], `${route} console errors`);
    assert.deepEqual(pageErrors, [], `${route} page errors`);
    routeEvidence.push({ route, beforeActivation, afterActivation, stats: afterResize });
    await page.close();
  }
} catch (error) {
  failures.push(error.message);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(JSON.stringify({ origin, failures }, null, 2));
  process.exitCode = 1;
} else {
  const report = {
    status: 'PASS',
    generatedAt: new Date().toISOString(),
    origin,
    routes: routeEvidence,
    assertions: {
      zeroWidthErrors: 0,
      duplicateInitializations: 0,
      plannerRoutesWithoutAdSenseBeforeActivation: routeEvidence.every((entry) => entry.beforeActivation.adsense.requests === 0),
      plannerRoutesWithAdSenseAfterActivation: routeEvidence.every((entry) => entry.afterActivation.adsense.requests >= 1),
    },
  };
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(path.join(evidenceDir, 'adsense-browser.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
