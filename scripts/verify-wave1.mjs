#!/usr/bin/env node
// Run after `npm run build`. This checks the generated HTML rather than only source props.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sitemap = fs.readFileSync('dist/sitemap-0.xml', 'utf8');
const sitemapPaths = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));
const graph = JSON.parse(fs.readFileSync('src/data/internal-links.json', 'utf8'));
let edges = 0;
let renderedEdges = 0;
const missingRenderedEdges = [];
const genericAnchors = /^(閱讀更多|點這裡|read more)$/i;
const decodeHtml = (value) => value.replace(/&(#(?:x[\da-f]+|\d+)|amp|quot|apos|lt|gt|nbsp);/gi, (_match, entity) => {
  if (entity[0] === '#') {
    const codepoint = entity[1].toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
    return Number.isFinite(codepoint) ? String.fromCodePoint(codepoint) : _match;
  }
  return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }[entity.toLowerCase()] ?? _match;
});
const normalizeText = (value) => decodeHtml(value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
const htmlFor = (route) => fs.readFileSync(path.join('dist', route, 'index.html'), 'utf8');
for (const [source, links] of Object.entries(graph)) {
  assert.ok(sitemapPaths.has(source), `graph source missing from sitemap: ${source}`);
  const htmlPath = path.join('dist', source, 'index.html');
  assert.ok(fs.existsSync(htmlPath), `graph source generated HTML missing: ${source}`);
  const renderedAnchors = [...htmlFor(source).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      href: decodeHtml(match[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? ''),
      text: normalizeText(match[2]),
    }));
  for (const link of links) {
    assert.ok(sitemapPaths.has(link.url), `graph target missing from sitemap: ${link.url}`);
    assert.ok(link.anchor && !genericAnchors.test(link.anchor.trim()), `meaningless anchor: ${link.url}`);
    edges++;
    if (renderedAnchors.some((anchor) => anchor.href === link.url && anchor.text === link.anchor)) renderedEdges++;
    else missingRenderedEdges.push(`${source} -> ${link.url} [${link.anchor}]`);
  }
}
console.log(`Graph verification: ${Object.keys(graph).length} sources, ${edges} edges, ${renderedEdges} rendered edges, ${missingRenderedEdges.length} missing rendered edges`);
assert.equal(missingRenderedEdges.length, 0, `graph edges missing static rendered anchors:\n${missingRenderedEdges.slice(0, 20).join('\n')}`);

const seeds = new Map(fs.readFileSync('data/faq-seeds.csv', 'utf8').trim().split(/\r?\n/).slice(1)
  .map((line) => {
    const cells = line.split(',');
    return [cells[0], new Set((cells[4] ?? '').split(' | ').map((query) => query.replace(/\(\d+\)$/, '').trim()))];
  }));
const t1 = new Set(fs.readFileSync('data/title-rewrites.csv', 'utf8').trim().split(/\r?\n/).slice(1).map((line) => line.split(',')[0]));
assert.equal(t1.size, 30, 'T1 freeze list must contain 30 unique pages');
const disposition = JSON.parse(fs.readFileSync('data/wave1-faq-disposition.json', 'utf8'));
assert.equal(disposition.length, 19, 'Wave 1 needs 19 reviewed FAQ candidates');
const qualifiedByRoute = new Map(disposition.filter((row) => row.reason === 'QUALIFIED').map((row) => [row.url, row.qualified]));
const faqRoutes = [
  '/zh/blog/small-room-wardrobe-door-turning-clearance-feng-shui/',
  '/zh/blog/air-conditioner-bedroom-layout/',
  '/zh/bed-desk-wardrobe-layout/',
];
assert.deepEqual(new Set(faqRoutes), new Set(qualifiedByRoute.keys()), 'FAQ routes differ from evidence-gated review');
let checkedQuestions = 0;
for (const route of faqRoutes) {
  assert.ok(!t1.has(route), `T1 FAQ route must not be changed: ${route}`);
  const html = htmlFor(route);
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1])).flat();
  const faq = blocks.find((block) => block['@type'] === 'FAQPage');
  assert.ok(faq && faq.mainEntity.length >= 4 && faq.mainEntity.length <= 6, `FAQPage count invalid: ${route}`);
  assert.deepEqual(faq.mainEntity.map((question) => question.name), qualifiedByRoute.get(route), `FAQ questions differ from manual review: ${route}`);
  const visiblePairs = new Map([...visible.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => [normalizeText(match[1]), normalizeText(match[2])]));
  for (const question of faq.mainEntity) {
    assert.equal(question['@type'], 'Question', `invalid question type: ${route}`);
    assert.equal(question.acceptedAnswer?.['@type'], 'Answer', `invalid answer type: ${route}`);
    assert.ok(seeds.get(route)?.has(question.name), `FAQ question lacks seed: ${route} ${question.name}`);
    assert.equal(visiblePairs.get(question.name), question.acceptedAnswer.text, `FAQ visible/schema parity failed: ${route} ${question.name}`);
    assert.ok(question.acceptedAnswer.text.trim().length >= 30, `FAQ answer too thin: ${route} ${question.name}`);
    assert.doesNotMatch(question.acceptedAnswer.text, /(?:至少|不足|小於|切斷|不得少於)\s*60\s*公分/i, `unsupported hard 60 cm threshold: ${route} ${question.name}`);
    checkedQuestions++;
  }
  assert.ok(visible.includes('免責聲明') || visible.includes('民俗參考'), `disclaimer missing: ${route}`);
}

const redirects = fs.readFileSync('dist/_redirects', 'utf8');
assert.match(redirects, /^\/zh\/bed-facing-door-feng-shui\/ \/zh\/blog\/bed-facing-door-feng-shui\/ 301$/m);
assert.ok(!fs.existsSync('dist/zh/bed-facing-door-feng-shui/index.html'), 'alias must not emit a 200 HTML page');
console.log(`Wave 1 static verification passed: sitemap ${sitemapPaths.size}, graph ${Object.keys(graph).length} sources/${edges} rendered edges, ${faqRoutes.length} FAQ pages/${checkedQuestions} seeded questions, alias 301 rule`);
