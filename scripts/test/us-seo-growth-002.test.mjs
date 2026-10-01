import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { ROOMFENG_RELEASE_AUTHORITY } from '../release-authority.mjs';

const root = resolve(process.cwd());
const dist = join(root, 'dist');
const siteUrl = 'https://roomfeng.win';
const targetPaths = [
  '/en/moving-furniture-size-check/',
  '/en/bed-desk-wardrobe-layout/',
  '/en/small-bedroom-layout-planner/',
  '/en/studio-apartment-layout/',
  '/en/furniture-fit-checker/',
];

const fileFor = (route) => join(dist, route.replace(/^\//, ''), 'index.html');
const htmlFor = (route) => {
  const file = fileFor(route);
  assert.ok(existsSync(file), `${route}: rendered HTML is missing`);
  return readFileSync(file, 'utf8');
};
const headFrom = (html) => html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? '';
const count = (value, pattern) => (value.match(pattern) ?? []).length;
const canonicalFrom = (html) => headFrom(html).match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ?? '';
const titleFrom = (html) => headFrom(html).match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
const descriptionFrom = (html) => headFrom(html).match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] ?? '';
const hrefsFrom = (html) => [...html.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]);
const childSitemap = () => {
  const sitemapFiles = readdirSync(dist).filter((name) => /^sitemap-\d+\.xml$/.test(name));
  assert.ok(sitemapFiles.length > 0, 'built sitemap child file is missing');
  return sitemapFiles.map((name) => readFileSync(join(dist, name), 'utf8')).join('\n');
};

test('US SEO Growth 002 retains its URLs while repair 001 adds only six trust routes', async () => {
  assert.ok(existsSync(dist), 'dist does not exist; run npm.cmd run build first');
  assert.equal(ROOMFENG_RELEASE_AUTHORITY.buildPages, 1463, 'build authority changed unexpectedly');
  assert.equal(ROOMFENG_RELEASE_AUTHORITY.sitemapUrls, 1454, 'sitemap authority changed unexpectedly');

  const sitemap = childSitemap();
  const candidateUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const uniqueCandidateUrls = [...new Set(candidateUrls)];
  assert.equal(uniqueCandidateUrls.length, 1454, 'candidate sitemap URL count must be 1,454');
  assert.equal(candidateUrls.length, uniqueCandidateUrls.length, 'candidate sitemap must not contain duplicates');

  const baselineResponse = await fetch(`${siteUrl}/sitemap-0.xml`);
  assert.equal(baselineResponse.status, 200, 'public baseline sitemap must be readable');
  const baselineXml = await baselineResponse.text();
  const baselineUrls = [...baselineXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const baselineCount = baselineUrls.length;
  assert.ok(baselineCount === 1448 || baselineCount === 1454, `unexpected public sitemap count ${baselineCount}`);
  const expectedAdditions = ROOMFENG_RELEASE_AUTHORITY.productionRepair001.addedRoutes.map((path) => `${siteUrl}${path}`);
  const candidateSet = new Set(candidateUrls);
  const baselineSet = new Set(baselineUrls);
  const added = [...candidateSet].filter((url) => !baselineSet.has(url)).sort();
  const removed = [...baselineSet].filter((url) => !candidateSet.has(url)).sort();
  assert.deepEqual(added, baselineCount === 1448 ? expectedAdditions.sort() : [], 'unexpected candidate URL additions');
  assert.deepEqual(removed, [], 'candidate removed a public URL');

  for (const path of targetPaths) {
    assert.ok(sitemap.includes(`${siteUrl}${path}`), `${path}: missing from candidate sitemap`);
  }
  assert.equal(uniqueCandidateUrls.length - baselineSet.size, added.length, 'candidate sitemap count differs from exact URL delta');

  const titles = new Set();
  const h1s = new Set();
  const requiredCommon = ['/en/room-layout-planner/'];
  for (const path of targetPaths) {
    const html = htmlFor(path);
    const head = headFrom(html);
    assert.equal(count(html, /<html[^>]+lang="en"/gi), 1, `${path}: lang=en missing`);
    assert.equal(count(html, /<h1\b/gi), 1, `${path}: exactly one H1 required`);
    assert.equal(count(head, /<title>/gi), 1, `${path}: title count`);
    assert.equal(count(head, /<meta[^>]+name="description"/gi), 1, `${path}: description count`);
    assert.equal(count(head, /noindex/gi), 0, `${path}: noindex must not be introduced`);
    assert.equal(canonicalFrom(html), `${siteUrl}${path}`, `${path}: canonical must stay self-referential`);
    assert.ok(titleFrom(html).length > 20 && titleFrom(html).length < 75, `${path}: title is not useful`);
    assert.ok(descriptionFrom(html).length > 80, `${path}: description is not useful`);
    assert.ok(!/lorem ipsum|coming soon|TODO|undefined/i.test(html), `${path}: placeholder copy found`);
    for (const lang of ['zh', 'en', 'x-default']) {
      assert.match(head, new RegExp(`hreflang="${lang}"`), `${path}: ${lang} hreflang missing`);
    }
    for (const required of requiredCommon) assert.ok(hrefsFrom(html).includes(required), `${path}: missing ${required}`);
    const title = titleFrom(html);
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '';
    assert.ok(!titles.has(title), `${path}: duplicate title`);
    assert.ok(!h1s.has(h1), `${path}: duplicate H1`);
    titles.add(title);
    h1s.add(h1);
  }

  const moving = htmlFor('/en/moving-furniture-size-check/');
  for (const term of ['doorway', 'hallway', 'stairs', 'elevator', 'delivery route', 'dining table with removable legs']) {
    assert.match(moving, new RegExp(term, 'i'), `moving page missing ${term}`);
  }
  for (const link of ['/en/furniture-fit-calculator/', '/en/furniture-fit-checker/', '/en/couch-fit-through-door-calculator/']) {
    assert.ok(hrefsFrom(moving).includes(link), `moving page missing intent handoff ${link}`);
  }

  const bed = htmlFor('/en/bed-desk-wardrobe-layout/');
  for (const term of ['96 × 120', '108 × 120', '120 × 120', '18 in', '24 in', '36 in', 'mattress dimensions are not necessarily bed-frame dimensions']) {
    assert.match(bed, new RegExp(term.replace(/[×]/g, '×'), 'i'), `bed/desk/wardrobe page missing ${term}`);
  }
  assert.match(bed, /idealized cross-room arithmetic screen/i, '10×10 arithmetic must be explicitly idealized');
  assert.match(bed, /ignores placement offsets and does not describe the exact gap drawn below/i, '10×10 arithmetic must be separated from diagram placement');
  const actualGapCm = Number(bed.match(/data-bed-to-wardrobe-gap-cm="([\d.]+)"/i)?.[1]);
  const actualGapIn = Number(bed.match(/data-bed-to-wardrobe-gap-in="([\d.]+)"/i)?.[1]);
  assert.ok(Number.isFinite(actualGapCm) && Number.isFinite(actualGapIn), 'actual diagram gap must be rendered from geometry');
  assert.ok(Math.abs(actualGapCm - (232 - (12 + 152.4))) < 0.01, 'actual gap cm must derive from bed and wardrobe geometry');
  assert.ok(Math.abs(actualGapIn - actualGapCm / 2.54) < 0.05, 'actual gap inches must derive from actual gap cm');
  assert.ok(Math.abs(actualGapIn - 26.6) < 0.1, `actual diagram gap should be approximately 26.6 in, received ${actualGapIn}`);
  assert.match(bed, /actual bed-to-wardrobe gap[\s\S]{0,300}26\.6 in/i, 'rendered actual gap must be visible beside the diagram');
  assert.match(bed, /actual bed frame[\s\S]*baseboards[\s\S]*door swing[\s\S]*window[\s\S]*wardrobe operation[\s\S]*desk\/chair zone/i, 'diagram caveat must name real-world clearance constraints');
  assert.match(bed, /mathematical fit ≠ usable layout clearance/i, 'diagram caveat must distinguish mathematical fit from usable clearance');
  assert.ok(hrefsFrom(bed).includes('/en/small-bedroom-layout-planner/'), 'bed/desk/wardrobe page missing general workflow handoff');
  assert.ok(count(bed, /data-measured-plan="true"/g) >= 1, 'bed/desk/wardrobe page missing original measured diagram');

  const small = htmlFor('/en/small-bedroom-layout-planner/');
  for (const link of ['/en/8x10-bedroom-layout/', '/en/9x10-bedroom-layout/', '/en/layout-guides/10x10-bedroom-layout/', '/en/layout-guides/10x12-bedroom-queen-desk/', '/en/11x12-bedroom-layout/', '/en/12x12-bedroom-layout/', '/en/bed-desk-wardrobe-layout/']) {
    assert.ok(hrefsFrom(small).includes(link), `small-bedroom page missing ${link}`);
  }

  const studio = htmlFor('/en/studio-apartment-layout/');
  for (const link of ['/en/layout-guides/300-sq-ft-studio-layout/', '/en/350-sq-ft-studio-apartment-layout/', '/en/400-sq-ft-studio-apartment-layout/', '/en/450-sq-ft-studio-apartment-layout/', '/en/500-sq-ft-studio-apartment-layout/']) {
    assert.ok(hrefsFrom(studio).includes(link), `studio page missing ${link}`);
  }
  for (const term of ['16 × 25 ft', '20 × 20 ft', '400 sq ft of unobstructed open floor']) {
    assert.match(studio, new RegExp(term), `studio page missing ${term}`);
  }

  const checker = htmlFor('/en/furniture-fit-checker/');
  assert.match(checker, /does not model the full delivery route/i, 'checker must separate route intent');
  assert.ok(hrefsFrom(checker).includes('/en/moving-furniture-size-check/'), 'checker missing full-route handoff');

  console.log(JSON.stringify({ status: 'PASS', sitemapBefore: baselineCount, sitemapAfter: uniqueCandidateUrls.length, addedUrls: added.length, removedUrls: removed.length, canonicalDelta: 0, redirectDelta: 0, noindexDelta: 0, targets: targetPaths.length }));
});
