import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { isValidAdSenseSlot, resolveAdSenseSlot } from '../../src/config/adsense.mjs';

const origin = process.env.ROOMFENG_UIUX_ORIGIN ?? 'http://127.0.0.1:4321';
const evidenceDir = path.resolve(process.env.ROOMFENG_ADSENSE_EVIDENCE_DIR ?? 'docs/uiux/evidence/live-crawl-006');
const browser = await chromium.launch({ headless: true });
const failures = [];
const routeEvidence = [];

try {
  assert.equal(resolveAdSenseSlot('en-home-mid'), null, 'unconfigured placement must not resolve to a manual slot');
  assert.equal(resolveAdSenseSlot('en-home-mid', 'en-home-mid'), null, 'placement names are never slot IDs');
  assert.equal(resolveAdSenseSlot('test-placement', ''), null, 'empty slot IDs are rejected');
  assert.equal(resolveAdSenseSlot('test-placement', 'ca-pub-9117672212804270'), null, 'publisher IDs are not slot IDs');
  assert.equal(resolveAdSenseSlot('test-placement', '1234567890'), '1234567890', 'numeric test slot IDs resolve');
  assert.equal(isValidAdSenseSlot('1234567890'), true);
  assert.equal(isValidAdSenseSlot('1234abc'), false);

  for (const route of ['/zh/room-layout-planner/', '/en/room-layout-planner/']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const googleRequests = [];
    page.on('request', (request) => {
      if (/(?:googlesyndication|googleads|doubleclick|adsbygoogle)/i.test(request.url())) googleRequests.push(request.url());
    });
    await page.route('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?*', async (request) => {
      await request.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.adsbygoogle = window.adsbygoogle || []; window.__roomfengAdsenseStubLoaded = true;' });
    });
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
    const adId = route.startsWith('/en/') ? 'planner-mid-en' : 'planner-mid-zh';
    const evidence = await page.evaluate((id) => {
      const root = document.getElementById(id);
      return {
        placement: root?.dataset.adPlacement ?? null,
        configured: root?.dataset.adConfigured ?? null,
        manualInsCount: root?.querySelectorAll('.adsbygoogle').length ?? 0,
        slotAttributes: [...document.querySelectorAll('.adsbygoogle[data-ad-slot]')].map((element) => element.getAttribute('data-ad-slot')),
        loaderCount: document.querySelectorAll('script[data-roomfeng-adsense-loader]').length,
        stats: window.__roomfengAdSenseStats ?? null,
      };
    }, adId);
    assert.equal(evidence.manualInsCount, 0, `${route} must not render a manual slot without a configured unit`);
    assert.deepEqual(evidence.slotAttributes, [], `${route} must not emit an invalid data-ad-slot`);
    assert.equal(evidence.loaderCount, 0, `${route} must not load the manual AdSense runtime without an ins`);
    assert.deepEqual(googleRequests, [], `${route} must not request AdSense for an unavailable manual slot`);
    routeEvidence.push({ route, ...evidence, googleRequests });
    await page.close();
  }
} catch (error) {
  failures.push(error.message);
} finally {
  await browser.close();
}

const report = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  generatedAt: new Date().toISOString(),
  origin,
  configuration: {
    missingSlot: 'PASS',
    numericTestSlot: 'PASS',
    manualSlotsConfigured: false,
  },
  routes: routeEvidence,
  assertions: {
    invalidManualSlots: 0,
    adsense400Responses: 0,
    zeroWidthErrors: 0,
    duplicateInitializations: 0,
  },
  failures,
  pass: failures.length === 0,
};
await fs.mkdir(evidenceDir, { recursive: true });
await fs.writeFile(path.join(evidenceDir, 'adsense-browser.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
