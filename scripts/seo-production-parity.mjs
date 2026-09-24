import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { ROOMFENG_RELEASE_AUTHORITY } from './release-authority.mjs';

const origin = process.env.ROOMFENG_SEO_ORIGIN ?? 'https://roomfeng.win';
const evidenceDir = path.resolve(process.env.ROOMFENG_SEO_EVIDENCE_DIR ?? 'docs/uiux/evidence/hardening-003/seo');
const expectedSitemapUrlCount = ROOMFENG_RELEASE_AUTHORITY.sitemapUrls;
const pendingRepair = ROOMFENG_RELEASE_AUTHORITY.productionRepair001;
const requireDeployed = process.env.ROOMFENG_SEO_REQUIRE_DEPLOYED === '1';
const representatives = [
  { path: '/', canonical: '/', sitemap: true },
  { path: '/en/', canonical: '/en/', sitemap: true },
  { path: '/zh/', canonical: '/', sitemap: false, redirect: true },
  { path: '/zh/room-layout-planner/', canonical: '/zh/room-layout-planner/', sitemap: true },
  { path: '/en/room-layout-planner/', canonical: '/en/room-layout-planner/', sitemap: true },
  { path: '/zh/furniture-fit-checker/', canonical: '/zh/furniture-fit-checker/', sitemap: true },
  { path: '/en/furniture-fit-checker/', canonical: '/en/furniture-fit-checker/', sitemap: true },
  { path: '/zh/small-bedroom-layout/', canonical: '/zh/small-bedroom-layout/', sitemap: true },
  { path: '/en/small-bedroom-layout-planner/', canonical: '/en/small-bedroom-layout-planner/', sitemap: true },
  { path: '/zh/studio-apartment-layout/', canonical: '/zh/studio-apartment-layout/', sitemap: true },
  { path: '/en/studio-apartment-layout/', canonical: '/en/studio-apartment-layout/', sitemap: true },
  { path: '/zh/layout-guides/10x10-bedroom-layout/', canonical: '/zh/layout-guides/10x10-bedroom-layout/', sitemap: true },
  { path: '/en/layout-guides/10x10-bedroom-layout/', canonical: '/en/layout-guides/10x10-bedroom-layout/', sitemap: true },
  { path: '/zh/moving-new-home-os/', canonical: '/zh/moving-new-home-os/', sitemap: true },
  { path: '/en/moving-new-home-os/', canonical: '/en/moving-new-home-os/', sitemap: true },
];

const failures = [];
const check = (name, pass, detail) => {
  if (!pass) failures.push({ name, detail });
};
const absolute = (pathname) => new URL(pathname, origin).toString();
const canonicalFrom = (html) => html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? '';
const robotsFrom = (html) => html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? '';
const titleFrom = (html) => html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '';
const descriptionFrom = (html) => html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? '';
const hreflangFrom = (html) => [...html.matchAll(/<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]).sort();
const jsonLdCount = (html) => (html.match(/<script\s+type=["']application\/ld\+json["']/gi) ?? []).length;
const h1Count = (html) => (html.match(/<h1\b/gi) ?? []).length;
const internalAnchorCount = (html) => [...html.matchAll(/<a\s+[^>]*href=["'](\/[^"'#?]*)/gi)].filter((match) => match[1] !== '/').length;

async function fetchText(pathname) {
  const started = Date.now();
  const response = await fetch(absolute(pathname), { redirect: 'manual' });
  const text = await response.text();
  return { status: response.status, text, location: response.headers.get('location') ?? '', durationMs: Date.now() - started };
}

await fs.mkdir(evidenceDir, { recursive: true });
const robots = await fetchText('/robots.txt');
check('robots status', robots.status === 200, robots.status);
check('robots references sitemap index', /Sitemap:\s*https:\/\/roomfeng\.win\/sitemap-index\.xml/i.test(robots.text), robots.text);
check('robots references child sitemap', /Sitemap:\s*https:\/\/roomfeng\.win\/sitemap-0\.xml/i.test(robots.text), robots.text);

const sitemapIndex = await fetchText('/sitemap-index.xml');
const childSitemap = await fetchText('/sitemap-0.xml');
check('sitemap index status', sitemapIndex.status === 200, sitemapIndex.status);
check('child sitemap status', childSitemap.status === 200, childSitemap.status);
check('sitemap index has child', /<loc>https:\/\/roomfeng\.win\/sitemap-0\.xml<\/loc>/i.test(sitemapIndex.text), sitemapIndex.text);
const sitemapUrls = [...childSitemap.text.matchAll(/<loc>(https:\/\/roomfeng\.win[^<]*)<\/loc>/gi)].map((match) => match[1]);
const uniqueSitemapUrls = [...new Set(sitemapUrls)];
check('sitemap has no duplicate URLs', sitemapUrls.length === uniqueSitemapUrls.length, `${sitemapUrls.length} total`);
const sitemapSet = new Set(uniqueSitemapUrls);
const pendingUrls = pendingRepair.addedRoutes.map((route) => `https://roomfeng.win${route}`);
const isDeployed = uniqueSitemapUrls.length === expectedSitemapUrlCount;
const isPreDeploy = uniqueSitemapUrls.length === pendingRepair.previousSitemapUrls;
check('sitemap count matches deployed or exact pre-deploy authority', isDeployed || isPreDeploy, `${uniqueSitemapUrls.length} vs ${pendingRepair.previousSitemapUrls}/${expectedSitemapUrlCount}`);
check('post-deploy gate requires deployed sitemap', !requireDeployed || isDeployed, `${uniqueSitemapUrls.length} vs ${expectedSitemapUrlCount}`);
if (isDeployed) {
  for (const url of pendingUrls) check(`deployed sitemap includes ${url}`, sitemapSet.has(url), url);
} else if (isPreDeploy) {
  const candidateXml = await fs.readFile(path.resolve('dist/sitemap-0.xml'), 'utf8');
  const candidateUrls = [...candidateXml.matchAll(/<loc>(https:\/\/roomfeng\.win[^<]*)<\/loc>/gi)].map((match) => match[1]);
  const candidateSet = new Set(candidateUrls);
  const added = [...candidateSet].filter((url) => !sitemapSet.has(url)).sort();
  const removed = [...sitemapSet].filter((url) => !candidateSet.has(url)).sort();
  check('candidate sitemap count', candidateSet.size === expectedSitemapUrlCount && candidateUrls.length === candidateSet.size, `${candidateUrls.length} vs ${expectedSitemapUrlCount}`);
  check('pre-deploy added URLs are exactly the six approved trust pages', JSON.stringify(added) === JSON.stringify(pendingUrls.sort()), added);
  check('pre-deploy candidate removes no production URLs', removed.length === 0, removed);
}

const representative = [];
for (const entry of representatives) {
  const result = await fetchText(entry.path);
  const canonicalExpected = absolute(entry.canonical);
  const canonical = canonicalFrom(result.text);
  const hreflang = hreflangFrom(result.text);
  const isRedirectAlias = entry.redirect === true;
  const record = {
    path: entry.path,
    status: result.status,
    location: result.location,
    titlePresent: titleFrom(result.text).trim().length > 0,
    descriptionPresent: descriptionFrom(result.text).trim().length >= 24,
    canonical,
    canonicalExpected,
    canonicalPass: canonical === canonicalExpected,
    robots: robotsFrom(result.text),
    indexable: !/\bnoindex\b/i.test(robotsFrom(result.text)),
    hreflang,
    hreflangPass: JSON.stringify(hreflang) === JSON.stringify(['en', 'x-default', 'zh']),
    jsonLdCount: jsonLdCount(result.text),
    h1Count: h1Count(result.text),
    internalAnchorCount: internalAnchorCount(result.text),
    inSitemap: sitemapSet.has(absolute(entry.path)),
    sitemapExpected: entry.sitemap,
    durationMs: result.durationMs,
  };
  record.pass = isRedirectAlias
    ? [301, 302, 307, 308].includes(result.status) && new URL(result.location, origin).toString() === absolute(entry.canonical) && !record.inSitemap
    : result.status === 200
      && record.titlePresent
      && record.descriptionPresent
      && record.canonicalPass
      && record.indexable
      && record.hreflangPass
      && record.jsonLdCount > 0
      && record.h1Count === 1
      && record.internalAnchorCount > 0
      && record.inSitemap === entry.sitemap;
  if (!record.pass) check(`representative ${entry.path}`, false, record);
  representative.push(record);
}

const sitemapXmlAlias = await fetchText('/sitemap.xml');
check('legacy sitemap alias remains absent', sitemapXmlAlias.status === 404, sitemapXmlAlias.status);

if (isDeployed) {
  for (const route of pendingRepair.addedRoutes) {
    const result = await fetchText(route);
    check(`deployed trust route ${route}`, result.status === 200 && canonicalFrom(result.text) === absolute(route)
      && !/\bnoindex\b/i.test(robotsFrom(result.text))
      && JSON.stringify(hreflangFrom(result.text)) === JSON.stringify(['en', 'x-default', 'zh']),
    { status: result.status, canonical: canonicalFrom(result.text), hreflang: hreflangFrom(result.text) });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: origin,
  expectedSitemapUrlCount,
  sitemapUrlCount: uniqueSitemapUrls.length,
  releaseState: isDeployed ? 'DEPLOYED' : isPreDeploy ? 'PRE_DEPLOY_EXACT_SIX_ROUTE_DELTA' : 'UNEXPECTED',
  requireDeployed,
  sitemapIndexStatus: sitemapIndex.status,
  childSitemapStatus: childSitemap.status,
  robotsStatus: robots.status,
  legacySitemapAliasStatus: sitemapXmlAlias.status,
  representative,
  failures,
  pass: failures.length === 0,
};
await fs.writeFile(path.join(evidenceDir, 'seo-parity.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
