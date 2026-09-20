import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = 'https://roomfeng.win';
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

function isExternal(value) {
  return /cloudflareinsights|googletagmanager|google-analytics|doubleclick|googlesyndication|adsbygoogle|TagError/i.test(value)
    || /^(Wl|Vl|W)$/.test(value.trim());
}

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
      const eventErrors = [];
      const pageErrors = [];
      const failedRequests = [];
      const badResponses = [];
      page.on('console', (message) => { if (message.type() === 'error') eventErrors.push({ message: message.text(), external: isExternal(message.text()) }); });
      page.on('pageerror', (error) => pageErrors.push({ message: error.message, stack: error.stack ?? '', external: isExternal(`${error.message}\n${error.stack ?? ''}`) }));
      page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown', external: isExternal(request.url()) }));
      page.on('response', (response) => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status(), external: isExternal(response.url()) }); });
      try {
        await prepare(page, route);
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
      } catch (error) {
        errors.push({ name, route, iteration, error: error.message });
      }
      const firstParty = [...eventErrors, ...pageErrors].filter((item) => !item.external);
      const firstPartyNetwork = [...failedRequests, ...badResponses].filter((item) => !item.external && new URL(item.url).origin === origin);
      runs.push({ name, route, iteration, width, consoleErrors: eventErrors, pageErrors, failedRequests, badResponses, firstPartyErrors: firstParty, firstPartyNetwork, pass: firstParty.length === 0 && firstPartyNetwork.length === 0 });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const summary = { origin, generatedAt: new Date().toISOString(), repetitions: 3, smokeRoutes: smokeRoutes.map(([name, route]) => ({ name, route })), runs, controllableFirstPartyErrors: runs.flatMap((run) => [...run.firstPartyErrors, ...run.firstPartyNetwork].map((item) => ({ run: run.name, ...item }))), pass: errors.length === 0 && runs.every((run) => run.pass) };
fs.writeFileSync(path.join(evidenceDir, 'console-network-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
if (errors.length) console.error(JSON.stringify(errors, null, 2));
console.log(JSON.stringify({ pass: summary.pass, evidenceDir, runCount: runs.length, controllableFirstPartyErrors: summary.controllableFirstPartyErrors.length }, null, 2));
process.exitCode = summary.pass ? 0 : 1;
