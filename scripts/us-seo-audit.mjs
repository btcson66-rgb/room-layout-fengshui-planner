import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import { ROOMFENG_RELEASE_AUTHORITY } from './release-authority.mjs';

const root = resolve(process.cwd());
const dist = join(root, 'dist');
const siteUrl = 'https://roomfeng.win';
const baselineSitemapUrls = 1430;
const expectedNewUrls = 17;
// PRODUCT-006 adds one intentional commercial landing route outside the US SEO batch.
const expectedCommercialRoutes = 1;
const expectedSitemapUrls = ROOMFENG_RELEASE_AUTHORITY.sitemapUrls;
const records = [
  ['8x10 bedroom layout', '/en/8x10-bedroom-layout/', 'new'],
  ['9x10 bedroom layout', '/en/9x10-bedroom-layout/', 'new'],
  ['10x10 bedroom layout', '/en/layout-guides/10x10-bedroom-layout/', 'enhanced'],
  ['10x12 bedroom layout', '/en/layout-guides/10x12-bedroom-queen-desk/', 'enhanced'],
  ['11x12 bedroom layout', '/en/11x12-bedroom-layout/', 'new'],
  ['12x12 bedroom layout', '/en/12x12-bedroom-layout/', 'new'],
  ['300 sq ft studio layout', '/en/layout-guides/300-sq-ft-studio-layout/', 'enhanced'],
  ['350 sq ft studio layout', '/en/350-sq-ft-studio-apartment-layout/', 'new'],
  ['400 sq ft studio layout', '/en/400-sq-ft-studio-apartment-layout/', 'new'],
  ['450 sq ft studio layout', '/en/450-sq-ft-studio-apartment-layout/', 'new'],
  ['500 sq ft studio layout', '/en/500-sq-ft-studio-apartment-layout/', 'new'],
  ['long narrow living room layout', '/en/long-narrow-living-room-layout/', 'new'],
  ['awkward living room layout', '/en/awkward-living-room-layout/', 'new'],
  ['living room layout with fireplace and TV', '/en/living-room-layout-with-fireplace-and-tv/', 'new'],
  ['couch fit through door calculator', '/en/couch-fit-through-door-calculator/', 'new'],
  ['furniture fit calculator', '/en/furniture-fit-calculator/', 'new'],
  ['bed room fit calculator', '/en/bed-room-fit-calculator/', 'new'],
  ['feng shui bed placement', '/en/feng-shui-bed-placement/', 'new'],
  ['bed facing door feng shui', '/en/bed-facing-door-feng-shui/', 'new'],
  ['mirror facing bed feng shui', '/en/mirror-facing-bed-feng-shui/', 'new'],
];

assert.ok(existsSync(dist), 'dist does not exist; run npm run build first');

const fileFor = (route) => join(dist, route.replace(/^\//, ''), 'index.html');
const htmlFor = (route) => {
  const file = fileFor(route);
  assert.ok(existsSync(file), `${route}: rendered HTML is missing`);
  return readFileSync(file, 'utf8');
};
const count = (html, pattern) => (html.match(pattern) ?? []).length;
const headFrom = (html) => html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? '';
const canonicalFrom = (html) => html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ?? '';
const titleFrom = (html) => html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
const normalizeHref = (href) => {
  const url = new URL(href, siteUrl);
  if (url.origin !== siteUrl || url.hash || url.search) return null;
  return url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
};

const knownRoutes = new Set(['/']);
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') {
      const relative = normalize(full.slice(dist.length + 1)).replaceAll('\\', '/');
      knownRoutes.add(`/${relative.replace(/index\.html$/, '')}`);
    }
  }
};
walk(dist);

const targetPaths = records.map(([, path]) => path);
const targetHtml = new Map(records.map(([, path]) => [path, htmlFor(path)]));
const titles = new Set();
const h1s = new Set();
for (const [intent, path, mode] of records) {
  const html = targetHtml.get(path);
  const head = headFrom(html);
  assert.equal(count(html, /<html[^>]+lang="en"/gi), 1, `${intent}: lang=en missing`);
  assert.equal(count(head, /<title>/gi), 1, `${intent}: title count`);
  assert.equal(count(html, /<h1\b/gi), 1, `${intent}: H1 count`);
  const title = titleFrom(html);
  assert.ok(title.length > 20 && title.length < 75, `${intent}: title length is ${title.length}`);
  assert.ok(!titles.has(title), `${intent}: duplicate target title: ${title}`);
  titles.add(title);
  assert.ok(!h1s.has(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]), `${intent}: duplicate target H1`);
  h1s.add(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
  assert.equal(count(head, /<meta[^>]+name="description"/gi), 1, `${intent}: meta description count`);
  assert.equal(count(head, /<meta[^>]+property="og:title"/gi), 1, `${intent}: OG title missing`);
  assert.equal(count(head, /noindex/gi), 0, `${intent}: noindex found`);
  assert.equal(canonicalFrom(head), `${siteUrl}${path}`, `${intent}: canonical is not self-canonical`);
  assert.ok(!/lorem ipsum|coming soon|TODO|undefined/i.test(html), `${intent}: placeholder text found`);
  assert.ok(/room-layout-planner|roomfeng-planner|Room Planner/i.test(html), `${intent}: no planner CTA/contextual link`);
  if (mode === 'new') assert.ok(knownRoutes.has(path), `${intent}: new route is not in built route inventory`);
  if (path.includes('calculator')) assert.ok(/id="run-calculation"|Check dimensions/i.test(html), `${intent}: calculator control missing`);
  if (path.includes('layout') && !path.includes('calculator')) assert.ok(/<svg\b/i.test(html), `${intent}: static diagram missing`);
}

for (const path of ['/en/layout-guides/10x10-bedroom-layout/', '/en/layout-guides/10x12-bedroom-queen-desk/', '/en/layout-guides/300-sq-ft-studio-layout/']) {
  assert.ok(!existsSync(fileFor(path.replace('/layout-guides/', '/'))), `${path}: duplicate flat route unexpectedly built`);
}

const preExistingEnglishInboundTargets = [
  '/en/long-narrow-living-room-layout/',
  '/en/awkward-living-room-layout/',
  '/en/living-room-layout-with-fireplace-and-tv/',
  '/en/feng-shui-bed-placement/',
  '/en/bed-facing-door-feng-shui/',
  '/en/mirror-facing-bed-feng-shui/',
];
const englishHomepage = htmlFor('/en/');
for (const target of preExistingEnglishInboundTargets) {
  assert.ok(englishHomepage.includes(`href="${target}"`), `pre-existing English homepage inbound link missing: ${target}`);
}

const sitemapFiles = readdirSync(dist).filter((name) => /^sitemap-\d+\.xml$/.test(name));
assert.ok(sitemapFiles.length > 0, 'sitemap child file missing');
const sitemap = sitemapFiles.map((name) => readFileSync(join(dist, name), 'utf8')).join('\n');
for (const path of targetPaths) assert.ok(sitemap.includes(`${siteUrl}${path}`), `${path}: missing from sitemap`);
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(
  baselineSitemapUrls + expectedNewUrls + expectedCommercialRoutes,
  expectedSitemapUrls,
  'US SEO inventory arithmetic must match the current release authority',
);
assert.equal(sitemapUrls.length, expectedSitemapUrls, `sitemap URL count changed unexpectedly: ${sitemapUrls.length}`);

for (const [path, html] of targetHtml) {
  const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]).filter((href) => href.startsWith('/') && !/\.[a-z0-9]+$/i.test(href));
  for (const rawHref of hrefs) {
    const href = normalizeHref(rawHref);
    if (href) assert.ok(knownRoutes.has(href), `${path}: internal href does not resolve in build: ${href}`);
  }
}

console.log(`[us-seo-audit] PASS: ${records.length} intents, ${expectedNewUrls} US SEO URLs + ${expectedCommercialRoutes} commercial route, ${expectedSitemapUrls} sitemap URLs, noindex/canonical/title/H1/internal-link checks passed.`);
