import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { classifyConsoleMessage, classifyPageError, classifyUrl, DEFAULT_PRODUCTION_ORIGIN } from '../production-signal-classifier.mjs';

const origin = process.env.ROOMFENG_LIVE_CRAWL_ORIGIN ?? process.env.ROOMFENG_PRODUCTION_ORIGIN ?? process.env.ROOMFENG_UIUX_ORIGIN ?? DEFAULT_PRODUCTION_ORIGIN;
const evidenceDir = path.resolve(process.env.ROOMFENG_LIVE_CRAWL_EVIDENCE_DIR ?? 'docs/uiux/evidence/live-crawl-006');
fs.mkdirSync(evidenceDir, { recursive: true });

const coreRoutes = [
  ['zh-home', '/', 390, 'zh-home-390.png'],
  ['en-home', '/en/', 1440, 'en-home-1440.png'],
  ['zh-planner', '/zh/room-layout-planner/', 390, 'zh-planner-390.png'],
  ['en-planner-1024', '/en/room-layout-planner/', 1024, 'en-planner-1024.png'],
  ['en-planner-1440', '/en/room-layout-planner/', 1440, 'en-planner-1440.png'],
  ['zh-fit', '/zh/furniture-fit-checker/', 768, 'zh-fit-768.png'],
  ['en-fit', '/en/furniture-fit-checker/', 1280, 'en-fit-1280.png'],
  ['en-bedroom', '/en/small-bedroom-layout-planner/', 1024, 'en-bedroom-1024.png'],
  ['en-guide', '/en/layout-guides/10x10-bedroom-layout/', 1280, 'en-guide-1280.png'],
];
const requiredRoutes = [
  ['zh-home', '/', 390], ['en-home', '/en/', 1440],
  ['zh-planner', '/zh/room-layout-planner/', 390], ['en-planner', '/en/room-layout-planner/', 1024],
  ['zh-fit', '/zh/furniture-fit-checker/', 768], ['en-fit', '/en/furniture-fit-checker/', 1280],
  ['zh-bedroom', '/zh/small-bedroom-layout/', 1024], ['en-bedroom', '/en/small-bedroom-layout-planner/', 1024],
  ['zh-studio', '/zh/studio-apartment-layout/', 1024], ['en-studio', '/en/studio-apartment-layout/', 1024],
  ['en-guide', '/en/layout-guides/10x10-bedroom-layout/', 1280], ['en-product', '/en/contractor-margin-guard/', 1280],
  ['zh-moving', '/zh/moving-furniture-size-check/', 1024], ['en-moving', '/en/moving-furniture-size-check/', 1024],
];
const headerRuns = [];
const DESKTOP_HEADER_BREAKPOINT = 1200;
const headerWidths = [390, 768, 1024, 1080, 1120, 1180, 1200, 1280, 1440];
const headerRoutes = [['zh', '/'], ['en', '/en/']];
const runs = [];
const localizationRuns = [];
const failures = [];
const browser = await chromium.launch({ headless: true });

const isAdsenseUrl = (value) => /(?:googlesyndication|googleads|doubleclick|adsbygoogle|pagead)/i.test(value);
const diagnosticText = (item) => `${item?.message ?? ''}\n${item?.stack ?? ''}`;
const isZeroWidthDiagnostic = (item) => /adsbygoogle\.push\(\).*no slot size for availableWidth=0|no slot size for availableWidth=0/i.test(diagnosticText(item));
const isDuplicateDiagnostic = (item) => /adsbygoogle.*(already initialized|duplicate initialization|already pushed)/i.test(diagnosticText(item));

async function openPage(page, route) {
  const response = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const reject = page.locator('[data-consent-action="reject"]');
  if (await reject.isVisible().catch(() => false)) await reject.click().catch(() => {});
  const widget = page.locator('[data-consent-widget]');
  if (await widget.isVisible().catch(() => false)) await widget.evaluate((element) => { element.style.display = 'none'; });
  await page.waitForTimeout(900);
  return response?.status() ?? null;
}

async function pageSignals(page, consoleErrors, pageErrors, unhandledRejections, failedRequests, badResponses) {
  const runtime = await page.evaluate(() => {
    const state = /** @type {any} */ (window);
    return { runtimeErrors: state.__roomfengRuntimeErrors ?? [], unhandledRejections: state.__roomfengUnhandledRejections ?? [] };
  });
  const classifiedPageErrors = pageErrors.map((error) => classifyPageError(error, origin));
  const classifiedRuntimeErrors = runtime.runtimeErrors.map((error) => classifyPageError(error, origin));
  const classifiedUnhandled = [...unhandledRejections, ...runtime.unhandledRejections].map((error) => classifyPageError(error, origin));
  const allPageErrors = [...classifiedPageErrors, ...classifiedRuntimeErrors];
  const firstPartyConsoleErrors = consoleErrors.filter((item) => !item.external);
  const firstPartyPageErrors = allPageErrors.filter((item) => !item.external);
  const firstPartyUnhandled = classifiedUnhandled.filter((item) => !item.external);
  const firstPartyNetwork = [...failedRequests, ...badResponses].filter((item) => !item.external && new URL(item.url).hostname === new URL(origin).hostname);
  const adsense400Responses = badResponses.filter((item) => item.status >= 400 && isAdsenseUrl(item.url));
  const diagnostics = [...consoleErrors, ...allPageErrors, ...classifiedUnhandled];
  return {
    consoleErrors,
    pageErrors: allPageErrors,
    unhandledRejections: classifiedUnhandled,
    failedRequests,
    badResponses,
    firstPartyConsoleErrors,
    firstPartyPageErrors,
    firstPartyUnhandledRejections: firstPartyUnhandled,
    firstPartyNetwork,
    adsense400Responses,
    zeroWidthErrors: diagnostics.filter(isZeroWidthDiagnostic).length,
    duplicateInitializations: diagnostics.filter(isDuplicateDiagnostic).length,
  };
}

async function inspectPage(page, name, route, width, screenshotName) {
  const consoleErrors = [];
  const pageErrors = [];
  const unhandledRejections = [];
  const failedRequests = [];
  const badResponses = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(classifyConsoleMessage(message, origin)); });
  page.on('pageerror', (error) => pageErrors.push({ message: error.message, stack: error.stack ?? '', sourceUrl: '' }));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown', ...classifyUrl(request.url(), origin) }));
  page.on('response', (response) => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status(), ...classifyUrl(response.url(), origin) }); });
  await page.addInitScript(() => {
    const state = /** @type {any} */ (window);
    state.__roomfengRuntimeErrors = [];
    state.__roomfengUnhandledRejections = [];
    window.addEventListener('error', (event) => state.__roomfengRuntimeErrors.push({ message: String(event.message ?? event.error?.message ?? ''), stack: String(event.error?.stack ?? ''), sourceUrl: String(event.filename ?? '') }));
    window.addEventListener('unhandledrejection', (event) => state.__roomfengUnhandledRejections.push({ message: String(event.reason?.message ?? event.reason ?? ''), stack: String(event.reason?.stack ?? '') }));
  });
  let status = null;
  const issues = [];
  try {
    status = await openPage(page, route);
    const dom = await page.evaluate(() => {
      const overflow = { document: document.documentElement.scrollWidth - innerWidth, body: document.body.scrollWidth - innerWidth };
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
      const hreflang = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => ({ lang: link.getAttribute('hreflang'), href: link.getAttribute('href') }));
      const manual = [...document.querySelectorAll('[data-ad-placement] .adsbygoogle')];
      const slotValues = manual.map((element) => element.getAttribute('data-ad-slot') ?? '');
      const adsenseStats = window.__roomfengAdSenseStats ?? {};
      return {
        overflow,
        canonical,
        hreflang,
        h1Count: document.querySelectorAll('h1').length,
        manualSlotsRendered: manual.length,
        numericManualSlotsRendered: slotValues.filter((value) => /^\d+$/.test(value)).length,
        invalidManualSlots: slotValues.filter((value) => !/^\d+$/.test(value)).length,
        adsenseStats: { initializedSlots: Number(adsenseStats.initializedSlots ?? 0), duplicateInitializations: Number(adsenseStats.duplicateInitializations ?? 0) },
      };
    });
    if (status !== 200) issues.push(`HTTP ${status}`);
    if (!dom.canonical) issues.push('missing canonical');
    // PRODUCT-006 is intentionally English-only and has no paired Chinese
    // route; preserve that approved SEO architecture while requiring the
    // existing hreflang pair everywhere else in this crawl.
    if (!route.includes('/en/contractor-margin-guard/') && dom.hreflang.length < 2) issues.push('missing hreflang pair');
    if (dom.h1Count !== 1) issues.push(`H1 count ${dom.h1Count}`);
    if (dom.overflow.document > 1 || dom.overflow.body > 1) issues.push(`horizontal overflow ${JSON.stringify(dom.overflow)}`);
    if (dom.invalidManualSlots !== 0) issues.push(`invalid manual slots ${dom.invalidManualSlots}`);
    if (dom.adsenseStats.duplicateInitializations !== 0) issues.push('duplicate AdSense initialization');
    if (route.includes('furniture-fit-checker')) {
      const fit = page.locator('[data-furniture-fit-tool]');
      if (await fit.count() !== 1) issues.push('Furniture Fit tool missing');
      await page.locator('[data-fit-preset]').first().click();
      if (!(await page.locator('[data-fit-diagram] svg').count())) issues.push('Furniture Fit measured SVG missing');
      if (!(await page.locator('[data-fit-handoff]').count())) issues.push('Furniture Fit exact handoff missing');
    }
    if (route.includes('room-layout-planner')) {
      for (const panel of ['room', 'furniture', 'templates', 'checks', 'report']) {
        const button = page.locator(`[data-planner-open="${panel}"]:visible`).first();
        if (await button.count()) {
          await button.click();
          const selected = await page.locator('.planner-drawer').getAttribute('data-panel');
          if (selected !== panel) issues.push(`planner rail ${panel} opened ${selected}`);
          await page.locator('[data-planner-close]:visible').first().click().catch(() => {});
        }
      }
    }
    if (screenshotName) await page.screenshot({ path: path.join(evidenceDir, screenshotName), fullPage: true });
    const signals = await pageSignals(page, consoleErrors, pageErrors, unhandledRejections, failedRequests, badResponses);
    issues.push(...signals.firstPartyConsoleErrors.map((item) => `console ${item.message}`));
    issues.push(...signals.firstPartyPageErrors.map((item) => `pageerror ${item.message}`));
    issues.push(...signals.firstPartyUnhandledRejections.map((item) => `unhandled ${item.message}`));
    issues.push(...signals.firstPartyNetwork.map((item) => `first-party ${item.status ?? item.failure} ${item.url}`));
    issues.push(...signals.adsense400Responses.map((item) => `AdSense ${item.status} ${item.url}`));
    return { name, route, width, status, dom, ...signals, pass: issues.length === 0, issues };
  } catch (error) {
    issues.push(error.message);
    return { name, route, width, status, pass: false, issues, ...await pageSignals(page, consoleErrors, pageErrors, unhandledRejections, failedRequests, badResponses) };
  }
}

async function inspectLocalization(page, locale, route) {
  const result = await page.evaluate((currentLocale) => {
    const text = (selector) => document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const componentText = (selector) => document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const faq = componentText('[data-roomfeng-component="faq"]');
    const related = componentText('[data-roomfeng-component="related-links"]');
    const header = componentText('[data-roomfeng-component="header"]');
    const fit = componentText('[data-furniture-fit-tool]');
    const forbiddenEn = ['常見問題', '相關頁面', '開始規劃', '家具適配', '家具尺寸檢查', '房間規劃', '房間尺寸'];
    const forbiddenZh = ['Physical fit', 'Requested clearance', 'Open this exact configuration in Room Planner', 'Try this size in Planner'];
    const haystack = currentLocale === 'en' ? `${faq}\n${related}\n${header}\n${fit}` : fit;
    const forbidden = currentLocale === 'en' ? forbiddenEn : forbiddenZh;
    return {
      locale: currentLocale,
      faqHeading: text('[data-roomfeng-component="faq"] h2'),
      relatedHeading: text('[data-roomfeng-component="related-links"] h2'),
      forbiddenFound: forbidden.filter((item) => haystack.includes(item)),
      faqExpected: currentLocale === 'en' ? 'Frequently asked questions' : '常見問題',
      relatedExpected: currentLocale === 'en' ? 'Related pages' : '相關頁面',
      fitExpected: currentLocale === 'en' ? ['Physical fit', 'Requested clearance'] : ['本體適配', '要求淨空', '把這組尺寸帶入 Room Planner', '在 Planner 試這個尺寸'],
      fitText: fit,
      pass: (currentLocale === 'en' ? !forbidden.filter((item) => haystack.includes(item)).length : !forbidden.filter((item) => haystack.includes(item)).length),
    };
  }, locale);
  if (result.faqHeading !== result.faqExpected) result.pass = false;
  if (result.relatedHeading !== result.relatedExpected) result.pass = false;
  if (route.includes('furniture-fit-checker') && !result.fitExpected.every((item) => result.fitText.includes(item))) result.pass = false;
  localizationRuns.push({ route, ...result });
  return result;
}

async function inspectHeader(page, locale, route, width) {
  const evidence = await page.evaluate((viewportWidth) => {
    const header = document.querySelector('[data-roomfeng-component="header"]');
    const visible = (element) => element && getComputedStyle(element).display !== 'none' && element.getBoundingClientRect().width > 0;
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect().toJSON() ?? null;
    const desktopNav = document.querySelector('.site-nav-desktop');
    const navList = desktopNav?.querySelector('.nav-list');
    const compact = visible(document.querySelector('.site-nav-toggle'));
    const desktop = visible(desktopNav);
    const interactive = [...document.querySelectorAll('.site-nav-toggle, .site-nav a, .language-switcher a, .header-cta')]
      .filter((element) => visible(element)).map((element) => ({ text: element.textContent?.trim() ?? '', width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }));
    const nowrapFailures = interactive.filter((item) => item.height < 44 && !item.text.includes('')).map((item) => item.text);
    const headerRect = header?.getBoundingClientRect();
    const brandRect = rect('.brand');
    const ctaRect = rect('.header-cta');
    const navRect = desktop ? rect('.site-nav-desktop') : rect('.site-nav');
    const innerRect = rect('.header-inner');
    const languageRect = desktop ? rect('.site-nav-desktop .language-switcher') : null;
    const navItems = desktop ? [...navList.querySelectorAll(':scope > li')].filter(visible).map((element) => {
      const itemRect = element.getBoundingClientRect();
      return { text: element.textContent?.trim() ?? '', top: itemRect.top, bottom: itemRect.bottom, width: itemRect.width, height: itemRect.height };
    }) : [];
    const navItemTops = navItems.map((item) => item.top);
    const controlTops = [navItemTops[0], languageRect?.top, ctaRect?.top].filter((value) => Number.isFinite(value));
    const navItemRowDelta = navItemTops.length ? Math.max(...navItemTops) - Math.min(...navItemTops) : null;
    const controlRowDelta = controlTops.length ? Math.max(...controlTops) - Math.min(...controlTops) : null;
    const gap = innerRect ? Number.parseFloat(getComputedStyle(document.querySelector('.header-inner')).gap) : 0;
    const requiredWidth = desktop && brandRect && navRect && ctaRect ? brandRect.width + navRect.width + ctaRect.width + gap * 2 : null;
    const safetyMargin = innerRect && requiredWidth !== null ? innerRect.width - requiredWidth : null;
    const overlaps = Boolean(navRect && ctaRect && navRect.right > ctaRect.left && ctaRect.right > navRect.left);
    return {
      viewportWidth,
      compact,
      desktop,
      interactive,
      nowrapFailures,
      overlaps,
      headerHeight: headerRect?.height ?? null,
      brandWidth: brandRect?.width ?? null,
      ctaWidth: ctaRect?.width ?? 0,
      navItemCount: navItems.length,
      navItemRowDelta,
      controlRowDelta,
      navListFlexWrap: navList ? getComputedStyle(navList).flexWrap : null,
      safetyMargin,
      navItemTops,
      languageTop: languageRect?.top ?? null,
      ctaTop: ctaRect?.top ?? null,
    };
  }, width);
  const issues = [];
  if (width < DESKTOP_HEADER_BREAKPOINT && (!evidence.compact || evidence.desktop)) issues.push('compact menu breakpoint incorrect');
  if (width >= DESKTOP_HEADER_BREAKPOINT && (evidence.compact || !evidence.desktop)) issues.push('desktop nav breakpoint incorrect');
  if (evidence.overlaps) issues.push('planner CTA overlaps navigation');
  if (evidence.interactive.some((item) => item.height < 44)) issues.push('interactive target below 44px');
  if (evidence.headerHeight === null || evidence.headerHeight > 82) issues.push(`header height exceeds 82px (${evidence.headerHeight})`);
  if (evidence.desktop && evidence.navItemCount === 0) issues.push('desktop nav items missing');
  if (evidence.desktop && evidence.navItemRowDelta > 2) issues.push(`desktop nav row delta ${evidence.navItemRowDelta}`);
  if (evidence.desktop && evidence.controlRowDelta > 2) issues.push(`desktop control row delta ${evidence.controlRowDelta}`);
  if (evidence.desktop && evidence.navListFlexWrap !== 'nowrap') issues.push(`desktop nav flex-wrap ${evidence.navListFlexWrap}`);
  if (evidence.desktop && evidence.safetyMargin < 32) issues.push(`desktop safety margin ${evidence.safetyMargin}`);
  const run = { locale, route, width, ...evidence, issues, pass: issues.length === 0 };
  headerRuns.push(run);
  return run;
}

try {
  for (const [name, route, width, screenshotName] of coreRoutes) {
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 1000 } });
    const run = await inspectPage(page, name, route, width, screenshotName);
    runs.push(run);
    const locale = route.startsWith('/en') ? 'en' : 'zh';
    if (route === '/' || route === '/en/' || route.includes('furniture-fit-checker')) await inspectLocalization(page, locale, route);
    await page.close();
  }
  for (const [name, route, width] of requiredRoutes) {
    if (coreRoutes.some(([coreName, coreRoute, coreWidth]) => coreName.startsWith(name) && coreRoute === route && coreWidth === width)) continue;
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 1000 } });
    const run = await inspectPage(page, name, route, width, null);
    runs.push(run);
    if (route.includes('furniture-fit-checker') || route === '/' || route === '/en/') await inspectLocalization(page, route.startsWith('/en') ? 'en' : 'zh', route);
    await page.close();
  }
  for (const [locale, route] of headerRoutes) {
    for (const width of headerWidths) {
      const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 } });
      await openPage(page, route);
      const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth - innerWidth, body: document.body.scrollWidth - innerWidth }));
      const result = await inspectHeader(page, locale, route, width);
      result.overflow = overflow;
      if (overflow.document > 1 || overflow.body > 1) { result.pass = false; result.issues.push(`overflow ${JSON.stringify(overflow)}`); }
      const screenshotName = `${locale}-header-${width}.png`;
      await page.screenshot({ path: path.join(evidenceDir, screenshotName), fullPage: true });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const adsenseSummary = {
  generatedAt: new Date().toISOString(),
  origin,
  manualSlotsRendered: runs.reduce((sum, run) => sum + (run.dom?.manualSlotsRendered ?? 0), 0),
  numericManualSlotsRendered: runs.reduce((sum, run) => sum + (run.dom?.numericManualSlotsRendered ?? 0), 0),
  invalidManualSlots: runs.reduce((sum, run) => sum + (run.dom?.invalidManualSlots ?? 0), 0),
  adsense400Responses: runs.reduce((sum, run) => sum + (run.adsense400Responses?.length ?? 0), 0),
  zeroWidthErrors: runs.reduce((sum, run) => sum + (run.zeroWidthErrors ?? 0), 0),
  duplicateInitializations: runs.reduce((sum, run) => sum + (run.duplicateInitializations ?? 0) + (run.dom?.adsenseStats?.duplicateInitializations ?? 0), 0),
};
const localizationSummary = {
  generatedAt: new Date().toISOString(),
  origin,
  englishFaqHeading: localizationRuns.filter((run) => run.route.startsWith('/en')).every((run) => run.faqHeading === 'Frequently asked questions' && run.forbiddenFound.length === 0) ? 'PASS' : 'FAIL',
  englishRelatedHeading: localizationRuns.filter((run) => run.route.startsWith('/en')).every((run) => run.relatedHeading === 'Related pages' && run.forbiddenFound.length === 0) ? 'PASS' : 'FAIL',
  chineseFurnitureFit: localizationRuns.filter((run) => run.route === '/zh/furniture-fit-checker/').every((run) => run.pass) ? 'PASS' : 'FAIL',
  englishFurnitureFit: localizationRuns.filter((run) => run.route === '/en/furniture-fit-checker/').every((run) => run.pass) ? 'PASS' : 'FAIL',
  headerZh: headerRuns.filter((run) => run.locale === 'zh').every((run) => run.pass) ? 'PASS' : 'FAIL',
  headerEn: headerRuns.filter((run) => run.locale === 'en').every((run) => run.pass) ? 'PASS' : 'FAIL',
  runs: localizationRuns,
};
const summary = {
  generatedAt: new Date().toISOString(),
  origin,
  desktopHeaderBreakpoint: DESKTOP_HEADER_BREAKPOINT,
  routes: runs,
  requiredRouteCount: requiredRoutes.length,
  headerRuns,
  adsense: adsenseSummary,
  localization: localizationSummary,
  firstPartyCounts: {
    consoleErrors: runs.reduce((sum, run) => sum + (run.firstPartyConsoleErrors?.length ?? 0), 0),
    pageErrors: runs.reduce((sum, run) => sum + (run.firstPartyPageErrors?.length ?? 0), 0),
    unhandledRejections: runs.reduce((sum, run) => sum + (run.firstPartyUnhandledRejections?.length ?? 0), 0),
    failedRequestsOrHttpErrors: runs.reduce((sum, run) => sum + (run.firstPartyNetwork?.length ?? 0), 0),
  },
  pass: failures.length === 0 && runs.length >= requiredRoutes.length && runs.every((run) => run.pass)
    && headerRuns.length === headerRoutes.length * headerWidths.length && headerRuns.every((run) => run.pass)
    && adsenseSummary.invalidManualSlots === 0 && adsenseSummary.adsense400Responses === 0
    && adsenseSummary.zeroWidthErrors === 0 && adsenseSummary.duplicateInitializations === 0
    && localizationSummary.englishFaqHeading === 'PASS' && localizationSummary.englishRelatedHeading === 'PASS'
    && localizationSummary.chineseFurnitureFit === 'PASS' && localizationSummary.englishFurnitureFit === 'PASS',
};
fs.writeFileSync(path.join(evidenceDir, 'live-crawl-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(evidenceDir, 'adsense-network-summary.json'), `${JSON.stringify(adsenseSummary, null, 2)}\n`);
fs.writeFileSync(path.join(evidenceDir, 'localization-summary.json'), `${JSON.stringify(localizationSummary, null, 2)}\n`);
fs.writeFileSync(path.join(evidenceDir, 'responsive-header-summary.json'), `${JSON.stringify({ origin, generatedAt: summary.generatedAt, runs: headerRuns, pass: headerRuns.every((run) => run.pass) }, null, 2)}\n`);
console.log(JSON.stringify({ pass: summary.pass, origin, routeRuns: runs.length, headerRuns: headerRuns.length, firstPartyCounts: summary.firstPartyCounts, adsense: adsenseSummary, localization: { englishFaqHeading: localizationSummary.englishFaqHeading, englishRelatedHeading: localizationSummary.englishRelatedHeading, chineseFurnitureFit: localizationSummary.chineseFurnitureFit, englishFurnitureFit: localizationSummary.englishFurnitureFit }, evidenceDir }, null, 2));
process.exitCode = summary.pass ? 0 : 1;
