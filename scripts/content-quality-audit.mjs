import fs from 'node:fs/promises';
import path from 'node:path';
import { reviewReadyBlogSlugs, reviewReadyCategorySlugs } from '../src/data/contentQuality.mjs';

const root = process.cwd();
const contentRoot = path.join(root, 'src', 'content', 'blog');
const distRoot = path.join(root, 'dist');
const failures = [];
const checks = [];
const expectedReviewReadyCount = 7;
const expandedArticleRequirements = new Map([
  ['bed-under-window-solutions', {
    required: [/7 晚|七晚/, /epa\.gov/i, /260\s*×\s*300/],
    forbidden: [],
  }],
  ['air-conditioner-bedroom-layout', {
    required: [/紙條/, /energystar\.gov/i, /30 分鐘/, /3 晚/],
    forbidden: [/建議至少錯開\s*60\s*公分/],
  }],
  ['small-room-storage-zones', {
    required: [/30 件/, /cpsc\.gov/i, /防傾倒/, /7 天歸位測試/],
    forbidden: [],
  }],
]);

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
  if (!pass) failures.push({ name, detail });
}

function bodyFromMarkdown(source) {
  const match = source.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
  return match ? match[1] : source;
}

function htmlText(source) {
  const main = source.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  return main
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function outputPathForUrl(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/') return path.join(distRoot, 'index.html');
  if (pathname.endsWith('/')) return path.join(distRoot, pathname.slice(1), 'index.html');
  return path.join(distRoot, pathname.slice(1));
}

const markdownFiles = (await fs.readdir(contentRoot)).filter((name) => name.endsWith('.md'));
const allSlugs = markdownFiles.map((name) => name.replace(/\.md$/, ''));
const heldSlugs = allSlugs.filter((slug) => !reviewReadyBlogSlugs.has(slug));

check('review-ready-count', reviewReadyBlogSlugs.size === expectedReviewReadyCount, reviewReadyBlogSlugs.size);
check('held-count', heldSlugs.length === markdownFiles.length - expectedReviewReadyCount, heldSlugs.length);

const expandedArticleBodies = new Map();

for (const slug of reviewReadyBlogSlugs) {
  const source = await fs.readFile(path.join(contentRoot, `${slug}.md`), 'utf8');
  const body = bodyFromMarkdown(source);
  const characters = body.replace(/\s/g, '').length;
  const h2Count = (body.match(/^##\s+/gm) ?? []).length;
  const linkCount = (body.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length;
  check(`source:${slug}:characters`, characters >= 1800, characters);
  check(`source:${slug}:h2`, h2Count >= 6, h2Count);
  check(`source:${slug}:links`, linkCount >= 3, linkCount);
  check(`source:${slug}:review-date`, /updated:\s*["']?2026-07-15/.test(source), 'updated must be 2026-07-15');
  check(`source:${slug}:no-seo-copy`, !/SEO|搜尋流量|關鍵字叢集|建議保持免註冊/.test(body), 'no internal SEO/editorial instructions in reader content');
  const expandedRequirements = expandedArticleRequirements.get(slug);
  if (expandedRequirements) {
    expandedArticleBodies.set(slug, body);
    check(`source:${slug}:expanded-depth`, characters >= 2500, characters);
    for (const pattern of expandedRequirements.required) {
      check(`source:${slug}:required:${pattern.source}`, pattern.test(body), pattern.source);
    }
    for (const pattern of expandedRequirements.forbidden) {
      check(`source:${slug}:forbidden:${pattern.source}`, !pattern.test(body), pattern.source);
    }
  }
}

const expandedEntries = [...expandedArticleBodies.entries()];
for (let index = 0; index < expandedEntries.length; index += 1) {
  const [leftSlug, leftBody] = expandedEntries[index];
  const leftHeadings = new Set([...leftBody.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim()));
  const leftParagraphs = new Set(
    leftBody.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, ' ').trim()).filter((paragraph) => paragraph.length >= 120 && !paragraph.startsWith('#')),
  );
  for (let rightIndex = index + 1; rightIndex < expandedEntries.length; rightIndex += 1) {
    const [rightSlug, rightBody] = expandedEntries[rightIndex];
    const rightHeadings = new Set([...rightBody.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim()));
    const rightParagraphs = new Set(
      rightBody.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, ' ').trim()).filter((paragraph) => paragraph.length >= 120 && !paragraph.startsWith('#')),
    );
    const sharedHeadings = [...leftHeadings].filter((heading) => rightHeadings.has(heading));
    const sharedParagraphs = [...leftParagraphs].filter((paragraph) => rightParagraphs.has(paragraph));
    check(`distinct-structure:${leftSlug}:${rightSlug}`, sharedHeadings.length <= 2, sharedHeadings);
    check(`distinct-copy:${leftSlug}:${rightSlug}`, sharedParagraphs.length === 0, sharedParagraphs);
  }
}

for (const slug of allSlugs) {
  const htmlPath = path.join(distRoot, 'zh', 'blog', slug, 'index.html');
  const html = await fs.readFile(htmlPath, 'utf8');
  const reviewReady = reviewReadyBlogSlugs.has(slug);
  check(`render:${slug}:robots`, reviewReady ? !/name="robots"[^>]+noindex/i.test(html) : /name="robots"[^>]+noindex/i.test(html), reviewReady ? 'indexable' : 'noindex');
  if (!reviewReady) {
    check(`render:${slug}:no-ad-loader`, !/pagead2\.googlesyndication|adsbygoogle|data-ad-slot/i.test(html), 'held pages must not load or host ads');
    check(`render:${slug}:no-affiliate`, !/Shopee Affiliate|shopee\.tw/i.test(html), 'held pages must not show affiliate offers');
  } else {
    check(`render:${slug}:substantial-main`, htmlText(html).replace(/\s/g, '').length >= 1800, htmlText(html).replace(/\s/g, '').length);
  }
}

const blogIndex = await fs.readFile(path.join(distRoot, 'zh', 'blog', 'index.html'), 'utf8');
const blogIndexSlugs = new Set(
  [...blogIndex.matchAll(/href="\/zh\/blog\/([^/"#?]+)\/"/g)].map((match) => match[1]),
);
check('blog-index-count', blogIndexSlugs.size === reviewReadyBlogSlugs.size, [...blogIndexSlugs]);
for (const slug of reviewReadyBlogSlugs) check(`blog-index:${slug}`, blogIndexSlugs.has(slug), 'must be linked');
for (const slug of heldSlugs) check(`blog-index-held:${slug}`, !blogIndexSlugs.has(slug), 'must not be linked');

const sitemapFiles = (await fs.readdir(distRoot)).filter((name) => /^sitemap.*\.xml$/.test(name));
const sitemapSource = (await Promise.all(sitemapFiles.map((name) => fs.readFile(path.join(distRoot, name), 'utf8')))).join('\n');
const sitemapUrls = [...sitemapSource.matchAll(/<loc>(https:\/\/roomfeng\.win\/[^<]*)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => !url.endsWith('.xml'));
for (const slug of reviewReadyBlogSlugs) check(`sitemap:${slug}`, sitemapUrls.includes(`https://roomfeng.win/zh/blog/${slug}/`), 'must be included');
for (const slug of heldSlugs) check(`sitemap-held:${slug}`, !sitemapUrls.includes(`https://roomfeng.win/zh/blog/${slug}/`), 'must be excluded');
for (const category of reviewReadyCategorySlugs) check(`sitemap-category:${category}`, sitemapUrls.includes(`https://roomfeng.win/zh/category/${category}/`), 'must be included');

for (const url of sitemapUrls) {
  const htmlPath = outputPathForUrl(url);
  let html = '';
  try {
    html = await fs.readFile(htmlPath, 'utf8');
  } catch {
    check(`sitemap-output:${url}`, false, htmlPath);
    continue;
  }
  check(`metadata:${url}:title`, /<title>[^<]{8,}<\/title>/i.test(html), 'title required');
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ?? '';
  check(
    `metadata:${url}:description`,
    description.replace(/\s/g, '').length >= 24,
    'description must contain at least 24 non-whitespace characters',
  );
  check(`metadata:${url}:canonical`, /<link\s+rel="canonical"\s+href="https:\/\/roomfeng\.win\/[^"]*"/i.test(html), 'canonical required');
  check(`metadata:${url}:h1`, (html.match(/<h1\b/gi) ?? []).length === 1, 'exactly one h1');
  check(`metadata:${url}:indexable`, !/name="robots"[^>]+noindex/i.test(html), 'sitemap pages cannot be noindex');
}

const htmlFiles = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(distRoot);
let affiliateHits = 0;
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  if (/Shopee Affiliate|shopee\.tw/i.test(html)) affiliateHits += 1;
}
check('affiliate-output-hidden', affiliateHits === 0, affiliateHits);

const report = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  totals: {
    sourceArticles: markdownFiles.length,
    reviewReady: reviewReadyBlogSlugs.size,
    heldNoindex: heldSlugs.length,
    sitemapPages: sitemapUrls.length,
    checks: checks.length,
    failed: failures.length,
  },
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exitCode = 1;
