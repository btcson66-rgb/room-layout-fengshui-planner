#!/usr/bin/env node
/**
 * 依 GSC「網頁」匯出產生 src/data/searchDemandPolicy.mjs。
 *
 * 為什麼：2026-08-29～09-03 六天內上線 1,236 篇文章，同一主題大量換情境
 * 分頁（例如「書桌對門 × 25 種情境」）。AdSense 兩度以「缺乏價值的內容」
 * 拒絕，Google 的 helpful-content 訊號也是全站計分——沒有人搜尋、也沒有
 * 人點擊的頁面只會稀釋整站。這支腳本用真實搜尋需求決定哪些文章繼續可索引。
 *
 * 規則（可用參數調整）：3 個月內 clicks >= MIN_CLICKS 或 impressions >= MIN_IMPRESSIONS
 * 的文章保留；其餘移入 demandHeldBlogSlugs（noindex、不進 sitemap／文章索引、
 * 不載廣告），檔案保留，之後重寫或合併再放行。
 *
 * 永遠保留（不受門檻影響）：站內頁面／Hub／llms.txt 直接指名的支柱文章，
 * 以及 301 轉址的目標頁。
 *
 * 用法：
 *   node scripts/gsc-demand-policy.mjs --pages <GSC 網頁.csv> --range 2026-07-10..2026-10-09 \
 *     [--min-clicks 2] [--min-impressions 50]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { redirects as siteRedirects } from '../src/data/redirects.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const pagesCsv = arg('pages');
const range = arg('range', 'unknown');
const minClicks = Number(arg('min-clicks', '2'));
const minImpressions = Number(arg('min-impressions', '50'));
if (!pagesCsv) {
  console.error('missing --pages <GSC 網頁.csv>');
  process.exit(1);
}

// GSC 匯出：熱門網頁,點擊,曝光,點閱率,排名（URL 不含逗號）
const csv = (await fs.readFile(pagesCsv, 'utf8')).replace(/^﻿/, '');
const metrics = new Map();
for (const line of csv.split(/\r?\n/).slice(1)) {
  const [url, clicks, impressions] = line.split(',');
  const slug = url?.match(/^https:\/\/roomfeng\.win\/zh\/blog\/([^/]+)\/$/)?.[1];
  if (slug) metrics.set(slug, { clicks: Number(clicks), impressions: Number(impressions) });
}

const contentRoot = path.join(root, 'src', 'content', 'blog');
const slugs = (await fs.readdir(contentRoot)).filter((name) => name.endsWith('.md')).map((name) => name.slice(0, -3)).sort();

// 支柱文章：站內非文章頁、Hub 資料與 llms.txt 直接指名的 /zh/blog/<slug>/。
const pinned = new Set();
async function collectPins(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full !== contentRoot) await collectPins(full);
    } else if (/\.(astro|ts|mjs)$/.test(entry.name) && !full.endsWith('searchDemandPolicy.mjs')) {
      const source = await fs.readFile(full, 'utf8');
      for (const match of source.matchAll(/\/zh\/blog\/([a-z0-9-]+)\//g)) pinned.add(match[1]);
    }
  }
}
await collectPins(path.join(root, 'src'));
const llms = await fs.readFile(path.join(root, 'public', 'llms.txt'), 'utf8');
for (const match of llms.matchAll(/\/zh\/blog\/([a-z0-9-]+)\//g)) pinned.add(match[1]);
for (const redirect of siteRedirects) {
  const target = redirect.to.match(/^\/zh\/blog\/([a-z0-9-]+)\/$/)?.[1];
  if (target) pinned.add(target);
}

const held = [];
let keptClicks = 0;
let keptImpressions = 0;
let totalClicks = 0;
let totalImpressions = 0;
for (const slug of slugs) {
  const { clicks, impressions } = metrics.get(slug) ?? { clicks: 0, impressions: 0 };
  totalClicks += clicks;
  totalImpressions += impressions;
  const keep = pinned.has(slug) || clicks >= minClicks || impressions >= minImpressions;
  if (keep) {
    keptClicks += clicks;
    keptImpressions += impressions;
  } else {
    held.push({ slug, clicks, impressions });
  }
}

const pct = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : 'n/a');
const summary = {
  range,
  rule: `clicks >= ${minClicks} || impressions >= ${minImpressions} || pinned`,
  articles: slugs.length,
  kept: slugs.length - held.length,
  held: held.length,
  pinned: [...pinned].filter((slug) => slugs.includes(slug)).length,
  keptClicksShare: pct(keptClicks, totalClicks),
  keptImpressionsShare: pct(keptImpressions, totalImpressions),
};

const output = `// 由 scripts/gsc-demand-policy.mjs 產生，請勿手動編輯；重跑腳本更新。
// 資料：GSC 網頁匯出 ${range}（網路搜尋）
// 規則：${summary.rule}
// 結果：${summary.articles} 篇 → 保留 ${summary.kept}（clicks ${summary.keptClicksShare}／impressions ${summary.keptImpressionsShare}），暫停索引 ${summary.held}
//
// 這裡的文章不是刪除：檔案與網址都在，只是 noindex、不進 sitemap／文章索引、
// 不載入廣告。重寫或合併到支柱文章後，從本清單移除即可重新放行。
// 每行註解為 [clicks, impressions]。

export const searchDemandPolicy = ${JSON.stringify(summary, null, 2)};

export const demandHeldBlogSlugs = new Set([
${held.map(({ slug, clicks, impressions }) => `  '${slug}', // [${clicks}, ${impressions}]`).join('\n')}
]);
`;

await fs.writeFile(path.join(root, 'src', 'data', 'searchDemandPolicy.mjs'), output);
console.info(JSON.stringify(summary, null, 2));
