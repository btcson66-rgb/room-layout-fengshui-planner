import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  classifyConsoleMessage,
  classifyPageError,
  classifyUrl,
  DEFAULT_PRODUCTION_ORIGIN,
} from '../production-signal-classifier.mjs';

const origin = process.env.ROOMFENG_PRODUCTION_ORIGIN ?? DEFAULT_PRODUCTION_ORIGIN;
const evidenceDir = path.resolve(process.env.ROOMFENG_PRODUCTION_EVIDENCE_DIR ?? 'docs/uiux/evidence/hardening-003/production-browser');
fs.mkdirSync(evidenceDir, { recursive: true });
const routes = [
  ['zh-home', '/', 375], ['en-home', '/en/', 1440],
  ['zh-planner', '/zh/room-layout-planner/', 390], ['en-planner', '/en/room-layout-planner/', 1440],
  ['zh-fit', '/zh/furniture-fit-checker/', 768], ['en-fit', '/en/furniture-fit-checker/', 1280],
  ['en-bedroom', '/en/small-bedroom-layout-planner/', 1024],
  ['en-studio', '/en/studio-apartment-layout/', 1024],
  ['en-guide', '/en/layout-guides/10x10-bedroom-layout/', 1280],
];
const smokeRoutes = routes.filter(([name]) => name.includes('home') || name.includes('planner') || name.includes('fit'));
const errors = [];
const runs = [];
const browser = await chromium.launch({ headless: true });
const diagnosticText = (item) => `${item?.message ?? ''}\n${item?.stack ?? ''}`;
const isAdsenseZeroWidthError = (item) => /adsbygoogle\.push\(\).*no slot size for availableWidth=0|no slot size for availableWidth=0/i.test(diagnosticText(item));
const isDuplicateAdsenseError = (item) => /adsbygoogle.*(already initialized|duplicate initialization|already pushed)/i.test(diagnosticText(item));

async function prepare(page, route) {
  await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const reject = page.locator('[data-consent-action="reject"]');
  if (await reject.isVisible().catch(() => false)) await reject.click().catch(() => {});
  const consent = page.locator('[data-consent-widget]');
  if (await consent.isVisible().catch(() => false)) await consent.evaluate((element) => { element.style.display = 'none'; });
  await page.waitForTimeout(900);
}

try {
  for (const [name, route, width] of routes) {
    for (let iteration = 1; iteration <= 3; iteration += 1) {
      const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 1000 } });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Runtime.enable');
      const cdpExceptions = [];
      cdp.on('Runtime.exceptionThrown', (event) => {
        const details = event.exceptionDetails ?? {};
        const stackUrls = details.stackTrace?.callFrames?.map((frame) => frame.url).filter(Boolean) ?? [];
        cdpExceptions.push({
          message: details.exception?.description?.split('\n')[0] ?? details.text ?? '',
          stack: details.exception?.description ?? '',
          sourceUrl: details.url || stackUrls[0] || '',
        });
      });
      await page.addInitScript(() => {
        const state = /** @type {any} */ (window);
        state.__roomfengUnhandledRejections = [];
        state.__roomfengRuntimeErrors = [];
        window.addEventListener('unhandledrejection', (event) => {
          const reason = event.reason;
          state.__roomfengUnhandledRejections.push({
            message: String(reason?.message ?? reason ?? 'Unhandled rejection'),
            stack: String(reason?.stack ?? ''),
          });
        });
        window.addEventListener('error', (event) => {
          if (!event.error && !event.message) return;
          state.__roomfengRuntimeErrors.push({
            message: String(event.message ?? event.error?.message ?? ''),
            stack: String(event.error?.stack ?? ''),
            sourceUrl: String(event.filename ?? ''),
          });
        });
      });
      const consoleErrors = [];
      const rawPageErrors = [];
      const failedRequests = [];
      const badResponses = [];
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(classifyConsoleMessage(message, origin)); });
      page.on('pageerror', (error) => rawPageErrors.push({ message: error.message, stack: error.stack ?? '' }));
      page.on('requestfailed', (request) => failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText ?? 'unknown',
        ...classifyUrl(request.url(), origin),
      }));
      page.on('response', (response) => {
        if (response.status() >= 400) badResponses.push({
          url: response.url(),
          status: response.status(),
          ...classifyUrl(response.url(), origin),
        });
      });
      try {
        await prepare(page, route);
        const runtime = await page.evaluate(() => {
          const state = /** @type {any} */ (window);
          return {
            unhandledRejections: state.__roomfengUnhandledRejections ?? [],
            runtimeErrors: state.__roomfengRuntimeErrors ?? [],
          };
        });
        const pageErrors = rawPageErrors.map((error) => {
          const matchingRuntime = runtime.runtimeErrors.find((candidate) => candidate.message === error.message);
          const matchingCdp = cdpExceptions.find((candidate) => candidate.message.includes(error.message));
          return classifyPageError({
            ...error,
            sourceUrl: matchingRuntime?.sourceUrl || matchingCdp?.sourceUrl || '',
            stack: error.stack || matchingCdp?.stack || '',
          }, origin);
        });
        const matchedRuntime = new Set(rawPageErrors.map((error) => runtime.runtimeErrors.find((candidate) => candidate.message === error.message)));
        for (const error of runtime.runtimeErrors) {
          if (!matchedRuntime.has(error)) pageErrors.push(classifyPageError(error, origin));
        }
        const matchedCdp = new Set(rawPageErrors.map((error) => cdpExceptions.find((candidate) => candidate.message.includes(error.message))));
        for (const error of cdpExceptions) {
          if (!matchedCdp.has(error)) pageErrors.push(classifyPageError(error, origin));
        }
        const classifiedUnhandledRejections = runtime.unhandledRejections.map((error) => classifyPageError(error, origin));
        const adsenseDiagnostics = [...consoleErrors, ...pageErrors, ...classifiedUnhandledRejections];
        const adsenseStats = await page.evaluate(() => {
          const stats = window.__roomfengAdSenseStats ?? {};
          return {
            initializedSlots: Number(stats.initializedSlots ?? 0),
            duplicateInitializations: Number(stats.duplicateInitializations ?? 0),
            lastInitialization: stats.lastInitialization ?? null,
          };
        });
        const adsenseZeroWidthErrors = adsenseDiagnostics.filter(isAdsenseZeroWidthError).length;
        const duplicateAdsbygoogleInitializations = adsenseStats.duplicateInitializations
          + adsenseDiagnostics.filter(isDuplicateAdsenseError).length;
        const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth - innerWidth, body: document.body.scrollWidth - innerWidth }));
        assert.ok(overflow.document <= 1 && overflow.body <= 1, `${name} overflow ${JSON.stringify(overflow)}`);
        if (route.includes('furniture-fit-checker')) assert.equal(await page.locator('[data-furniture-fit-tool]').count(), 1);
        if (route.includes('room-layout-planner')) {
          for (const panel of ['room', 'furniture', 'templates', 'checks', 'report']) {
            const button = page.locator(`[data-planner-open="${panel}"]:visible`).first();
            if (await button.count()) {
              await button.click({ timeout: 5000 });
              assert.equal(await page.locator('.planner-drawer').getAttribute('data-panel'), panel);
              await page.locator('[data-planner-close]:visible').first().click({ timeout: 5000 });
            }
          }
        }
        if (iteration === 1) await page.screenshot({ path: path.join(evidenceDir, `${name}-${width}.png`), fullPage: true });
        const firstPartyConsoleErrors = consoleErrors.filter((item) => !item.external);
        const firstPartyPageErrors = pageErrors.filter((item) => !item.external);
        const firstPartyUnhandledRejections = classifiedUnhandledRejections.filter((item) => !item.external);
        const firstPartyNetwork = [...failedRequests, ...badResponses]
          .filter((item) => !item.external && new URL(item.url).hostname === new URL(origin).hostname);
        runs.push({
          name, route, iteration, width,
          consoleErrors,
          pageErrors,
          unhandledRejections: classifiedUnhandledRejections,
          failedRequests,
          badResponses,
          firstPartyConsoleErrors,
          firstPartyPageErrors,
          firstPartyUnhandledRejections,
          firstPartyNetwork,
          adsenseZeroWidthErrors,
          duplicateAdsbygoogleInitializations,
          adsenseStats,
          pass: firstPartyConsoleErrors.length === 0
            && firstPartyPageErrors.length === 0
            && firstPartyUnhandledRejections.length === 0
            && firstPartyNetwork.length === 0
            && adsenseZeroWidthErrors === 0
            && duplicateAdsbygoogleInitializations === 0,
        });
      } catch (error) {
        errors.push({ name, route, iteration, error: error.message });
        runs.push({ name, route, iteration, width, pass: false, error: error.message });
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const controllableFirstPartyErrors = runs.flatMap((run) => [
  ...(run.firstPartyConsoleErrors ?? []).map((item) => ({ kind: 'console.error', run: run.name, ...item })),
  ...(run.firstPartyPageErrors ?? []).map((item) => ({ kind: 'pageerror', run: run.name, ...item })),
  ...(run.firstPartyUnhandledRejections ?? []).map((item) => ({ kind: 'unhandledrejection', run: run.name, ...item })),
  ...(run.firstPartyNetwork ?? []).map((item) => ({ kind: 'network', run: run.name, ...item })),
]);
const summary = {
  origin,
  classifier: 'source-url-v1',
  generatedAt: new Date().toISOString(),
  repetitions: 3,
  smokeRoutes: smokeRoutes.map(([name, route]) => ({ name, route })),
  runs,
  firstPartyCounts: {
    consoleErrors: controllableFirstPartyErrors.filter((item) => item.kind === 'console.error').length,
    pageErrors: controllableFirstPartyErrors.filter((item) => item.kind === 'pageerror').length,
    unhandledRejections: controllableFirstPartyErrors.filter((item) => item.kind === 'unhandledrejection').length,
    failedRequestsOrHttpErrors: controllableFirstPartyErrors.filter((item) => item.kind === 'network').length,
  },
  adsenseZeroWidthErrors: runs.reduce((total, run) => total + (run.adsenseZeroWidthErrors ?? 0), 0),
  duplicateAdsbygoogleInitializations: runs.reduce((total, run) => total + (run.duplicateAdsbygoogleInitializations ?? 0), 0),
  controllableFirstPartyErrors,
  pass: errors.length === 0 && runs.length === routes.length * 3 && runs.every((run) => run.pass),
};
fs.writeFileSync(path.join(evidenceDir, 'console-network-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
if (errors.length) console.error(JSON.stringify(errors, null, 2));
console.log(JSON.stringify({
  pass: summary.pass,
  evidenceDir,
  runCount: runs.length,
  adsenseZeroWidthErrors: summary.adsenseZeroWidthErrors,
  duplicateAdsbygoogleInitializations: summary.duplicateAdsbygoogleInitializations,
  controllableFirstPartyErrors: summary.controllableFirstPartyErrors.length,
}, null, 2));
process.exitCode = summary.pass ? 0 : 1;
