#!/usr/bin/env node
// Run after `npm run build`. This checks the generated HTML rather than only source props.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sitemap = fs.readFileSync('dist/sitemap-0.xml', 'utf8');
const sitemapPaths = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));
const graph = JSON.parse(fs.readFileSync('src/data/internal-links.json', 'utf8'));
let edges = 0;
for (const [source, links] of Object.entries(graph)) {
  assert.ok(sitemapPaths.has(source), `graph source missing from sitemap: ${source}`);
  for (const link of links) {
    assert.ok(sitemapPaths.has(link.url), `graph target missing from sitemap: ${link.url}`);
    assert.ok(link.anchor && !/^(閱讀更多|點這裡|read more)$/i.test(link.anchor), `meaningless anchor: ${link.url}`);
    edges++;
  }
}

const htmlFor = (route) => fs.readFileSync(path.join('dist', route, 'index.html'), 'utf8');
const samples = [
  '/zh/blog/bed-head-against-wall/',
  '/zh/blog/desk-facing-door-layout/',
  '/zh/blog/living-room-air-conditioner-feng-shui/',
  '/zh/blog/entryway-shoe-cabinet-feng-shui/',
  '/zh/blog/small-room-wardrobe-door-turning-clearance-feng-shui/',
];
for (const route of samples) {
  const html = htmlFor(route);
  assert.ok(graph[route]?.some((link) => html.includes(`href="${link.url}"`) && html.includes(link.anchor)), `no static graph anchor on ${route}`);
}

const seeds = new Map(fs.readFileSync('data/faq-seeds.csv', 'utf8').trim().split(/\r?\n/).slice(1)
  .map((line) => {
    const cells = line.split(',');
    return [cells[0], new Set((cells[4] ?? '').split(' | ').map((query) => query.replace(/\(\d+\)$/, '').trim()))];
  }));
const t1 = new Set(fs.readFileSync('data/title-rewrites.csv', 'utf8').trim().split(/\r?\n/).slice(1).map((line) => line.split(',')[0]));
const faqRoutes = [
  '/zh/blog/small-room-wardrobe-door-turning-clearance-feng-shui/',
  '/zh/blog/air-conditioner-bedroom-layout/',
  '/zh/bed-desk-wardrobe-layout/',
];
let checkedQuestions = 0;
for (const route of faqRoutes) {
  assert.ok(!t1.has(route), `T1 FAQ route must not be changed: ${route}`);
  const html = htmlFor(route);
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1])).flat();
  const faq = blocks.find((block) => block['@type'] === 'FAQPage');
  assert.ok(faq && faq.mainEntity.length >= 4 && faq.mainEntity.length <= 6, `FAQPage count invalid: ${route}`);
  for (const question of faq.mainEntity) {
    assert.ok(seeds.get(route)?.has(question.name), `FAQ question lacks seed: ${route} ${question.name}`);
    assert.ok(visible.includes(question.name), `FAQ question not visible: ${route} ${question.name}`);
    assert.ok(visible.includes(question.acceptedAnswer.text), `FAQ answer differs from visible text: ${route} ${question.name}`);
    assert.match(question.acceptedAnswer.text, /\d/, `FAQ answer needs a measurable number: ${route} ${question.name}`);
    checkedQuestions++;
  }
  assert.ok(visible.includes('免責聲明') || visible.includes('民俗參考'), `disclaimer missing: ${route}`);
}

const redirects = fs.readFileSync('dist/_redirects', 'utf8');
assert.match(redirects, /^\/zh\/bed-facing-door-feng-shui\/ \/zh\/blog\/bed-facing-door-feng-shui\/ 301$/m);
assert.ok(!fs.existsSync('dist/zh/bed-facing-door-feng-shui/index.html'), 'alias must not emit a 200 HTML page');
console.log(`Wave 1 static verification passed: sitemap ${sitemapPaths.size}, graph ${Object.keys(graph).length} sources/${edges} edges, 5 static anchors, ${faqRoutes.length} FAQ pages/${checkedQuestions} seeded questions, alias 301 rule`);
