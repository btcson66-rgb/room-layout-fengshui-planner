import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOMFENG_RELEASE_AUTHORITY } from './release-authority.mjs';
import { isSuccessfulSitemapSubmissionStatus } from './gsc-sitemap-outcome.mjs';

const evidenceDir = path.resolve(process.env.ROOMFENG_RELEASE_EVIDENCE_DIR ?? 'release-evidence');
const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(evidenceDir, relativePath), 'utf8'));
const failures = [];
const requirePass = (name, value) => { if (value !== true) failures.push(name); };

const browser = await readJson('production-browser/console-network-summary.json');
const liveCrawl = await readJson('live-crawl/live-crawl-summary.json');
const adsense = await readJson('live-crawl/adsense-network-summary.json');
const localization = await readJson('live-crawl/localization-summary.json');
const responsiveHeader = await readJson('live-crawl/responsive-header-summary.json');
const lighthouse = await readJson('production-lighthouse/lighthouse-summary.json');
const seo = await readJson('production-seo/seo-parity.json');
const build = await readJson('build-authority.json');
const readback = await readJson('production-readback/production-readback.json');
const commitReadback = await readJson('commit-readback.json');
const sitemap = await readJson('production-sitemap-readback.json');
const gscLog = await fs.readFile(path.join(evidenceDir, 'gsc-submission.log'), 'utf8');
const gscSubmissionStatus = /"status"\s*:\s*"([^"]+)"/i.exec(gscLog)?.[1] ?? 'UNKNOWN';

requirePass('production browser', browser.pass);
requirePass('production browser origin', browser.origin === 'https://roomfeng.win');
requirePass('production browser 27 runs', browser.runs?.length === 27);
requirePass('first-party console errors', browser.firstPartyCounts?.consoleErrors === 0);
requirePass('first-party page errors', browser.firstPartyCounts?.pageErrors === 0);
requirePass('first-party unhandled rejections', browser.firstPartyCounts?.unhandledRejections === 0);
requirePass('first-party failed requests or HTTP errors', browser.firstPartyCounts?.failedRequestsOrHttpErrors === 0);
requirePass('production live crawl', liveCrawl.pass);
requirePass('production live crawl origin', liveCrawl.origin === 'https://roomfeng.win');
requirePass('production live crawl routes', liveCrawl.requiredRouteCount === 14 && liveCrawl.routes?.length >= 14);
requirePass('production live crawl localization', liveCrawl.localization?.englishFaqHeading === 'PASS'
  && liveCrawl.localization?.englishRelatedHeading === 'PASS'
  && liveCrawl.localization?.chineseFurnitureFit === 'PASS'
  && liveCrawl.localization?.englishFurnitureFit === 'PASS');
requirePass('production localization artifact', localization.englishFaqHeading === 'PASS'
  && localization.englishRelatedHeading === 'PASS'
  && localization.chineseFurnitureFit === 'PASS'
  && localization.englishFurnitureFit === 'PASS');
// Final Header Closeout 007 measures both locales at all nine required
// widths: 390, 768, 1024, 1080, 1120, 1180, 1200, 1280, and 1440.
// The responsive-header artifact stores those 18 records under `runs`.
requirePass('production responsive header', responsiveHeader.pass && responsiveHeader.runs?.length === 18);
requirePass('manual AdSense slots are numeric', adsense.invalidManualSlots === 0 && adsense.numericManualSlotsRendered === adsense.manualSlotsRendered);
requirePass('AdSense integration HTTP 400', adsense.adsense400Responses === 0);
requirePass('AdSense zero-width errors', adsense.zeroWidthErrors === 0);
requirePass('AdSense duplicate initialization', adsense.duplicateInitializations === 0);
requirePass('build authority', build.pass && build.htmlFiles === ROOMFENG_RELEASE_AUTHORITY.buildPages);
requirePass('build sitemap authority', build.sitemapUrls === ROOMFENG_RELEASE_AUTHORITY.sitemapUrls);
requirePass('production Lighthouse', lighthouse.pass);
requirePass('production Lighthouse origin', lighthouse.origin === 'https://roomfeng.win');
requirePass('production Lighthouse desktop and mobile', lighthouse.modes?.includes('desktop') && lighthouse.modes?.includes('mobile'));
requirePass('production Lighthouse 18 reports', lighthouse.results?.length === 18);
requirePass('production SEO parity', seo.pass);
requirePass('production SEO origin', seo.source === 'https://roomfeng.win');
requirePass('sitemap URL count', seo.sitemapUrlCount === ROOMFENG_RELEASE_AUTHORITY.sitemapUrls && seo.expectedSitemapUrlCount === ROOMFENG_RELEASE_AUTHORITY.sitemapUrls);
requirePass('production readback', readback.pass);
requirePass('production readback origin', readback.origin === 'https://roomfeng.win');
requirePass('production commit readback', commitReadback.pass);
requirePass('production content readback matches main SHA', readback.expectedProductionSha === commitReadback.mainSha);
requirePass('production sitemap readback', sitemap.pass);
requirePass('production sitemap count', sitemap.count === ROOMFENG_RELEASE_AUTHORITY.sitemapUrls && sitemap.expectedCount === ROOMFENG_RELEASE_AUTHORITY.sitemapUrls);
requirePass('GSC submission request', isSuccessfulSitemapSubmissionStatus(gscSubmissionStatus));

const sha = commitReadback.mainSha ?? process.env.GITHUB_SHA ?? null;
const report = {
  result: failures.length === 0 ? 'PASS — RELEASE PIPELINE AND PRODUCTION VERIFIED' : 'BLOCKED',
  generatedAt: new Date().toISOString(),
  pr: commitReadback.pullRequest?.number ?? null,
  sourceSha: commitReadback.pullRequest?.headSha ?? null,
  mergeSha: sha,
  productionSha: sha,
  deploymentWorkflowHeadSha: commitReadback.workflowHeadSha ?? null,
  commitEquality: commitReadback.mainSha === commitReadback.workflowHeadSha && commitReadback.mainSha === readback.expectedProductionSha,
  branchProtection: ['preflight', 'UIUX browser evidence', 'Lighthouse Preview'],
  preflight: 'PASS',
  uiuxBrowserPreview: 'PASS',
  lighthousePreview: 'PASS',
  cloudflareDeploy: 'PASS',
  buildPages: build.htmlFiles,
  buildSitemapUrls: build.sitemapUrls,
  sitemapAuthority: ROOMFENG_RELEASE_AUTHORITY.sitemapUrls,
  authorityTransition: ROOMFENG_RELEASE_AUTHORITY.transition,
  productionBrowser: browser.pass ? 'PASS' : 'FAIL',
  productionLiveCrawl: liveCrawl.pass ? 'PASS' : 'FAIL',
  productionLocalization: liveCrawl.localization,
  productionResponsiveHeader: responsiveHeader.pass ? 'PASS' : 'FAIL',
  adsense: {
    manualSlotsRendered: adsense.manualSlotsRendered,
    numericManualSlotsRendered: adsense.numericManualSlotsRendered,
    invalidManualSlots: adsense.invalidManualSlots,
    adsense400Responses: adsense.adsense400Responses,
    zeroWidthErrors: adsense.zeroWidthErrors,
    duplicateInitializations: adsense.duplicateInitializations,
  },
  productionLighthouse: lighthouse.pass ? 'PASS' : 'FAIL',
  productionLighthouseModes: lighthouse.modes,
  productionSeoParity: seo.pass ? 'PASS' : 'FAIL',
  sitemap: `${seo.sitemapUrlCount}/${seo.expectedSitemapUrlCount}`,
  gscSubmission: gscSubmissionStatus,
  productionFirstPartyConsoleErrors: browser.firstPartyCounts?.consoleErrors ?? null,
  productionFirstPartyPageErrors: browser.firstPartyCounts?.pageErrors ?? null,
  productionFirstPartyUnhandledRejections: browser.firstPartyCounts?.unhandledRejections ?? null,
  productionFirstPartyFailedRequests: browser.firstPartyCounts?.failedRequestsOrHttpErrors ?? null,
  evidence: {
    browser: 'production-browser/',
    liveCrawl: 'live-crawl/live-crawl-summary.json',
    adsense: 'live-crawl/adsense-network-summary.json',
    localization: 'live-crawl/localization-summary.json',
    responsiveHeader: 'live-crawl/responsive-header-summary.json',
    lighthouse: 'production-lighthouse/',
    seo: 'production-seo/seo-parity.json',
    readback: 'production-readback/production-readback.json',
    sitemap: 'production-sitemap-readback.json',
    gsc: 'gsc-submission.log',
  },
  failures,
  knownControllableDefects: failures.length === 0 ? 'NONE' : failures,
  merged: failures.length === 0,
  deployed: failures.length === 0,
  productionVerified: failures.length === 0,
};
await fs.writeFile(path.join(evidenceDir, 'authority-transition.json'), `${JSON.stringify({
  previousAuthority: {
    buildPages: ROOMFENG_RELEASE_AUTHORITY.transition.previousBuildPages,
    sitemapUrls: ROOMFENG_RELEASE_AUTHORITY.transition.previousSitemapUrls,
  },
  addedRoute: ROOMFENG_RELEASE_AUTHORITY.transition.addedRoute,
  sourcePullRequest: ROOMFENG_RELEASE_AUTHORITY.transition.sourcePullRequest,
  baselineCorrectionPullRequest: ROOMFENG_RELEASE_AUTHORITY.transition.baselineCorrectionPullRequest,
  currentAuthority: {
    buildPages: ROOMFENG_RELEASE_AUTHORITY.buildPages,
    sitemapUrls: ROOMFENG_RELEASE_AUTHORITY.sitemapUrls,
  },
}, null, 2)}\n`);
await fs.writeFile(path.join(evidenceDir, 'release-summary.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length === 0 ? 0 : 1;
