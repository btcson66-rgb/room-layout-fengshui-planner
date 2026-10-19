#!/usr/bin/env node
/**
 * 產生 src/data/demandConsolidation.mjs：2026-10-10 搜尋需求閘門暫停索引的 904 篇
 * 文章，各自 301 到語意最近的保留文章（或分類 Hub）。
 *
 * 為什麼：noindex 的文章仍回 200，AdSense 審核員與 Googlebot 照樣進得去，
 * 而且 Google 要很久才會把它們移出索引（10/10 改動後 9 天只處理了約 35 篇）。
 * 這些文章是 GSC 3 個月內零需求的模板頁，沒有值得搬的內容，所以直接 301
 * 合併到最接近的保留文章（AGENTS.md §9b-2 的例外說明）。
 *
 * 來源固定讀 `--source-ref`（預設合併前的 main）裡的暫停清單與 .md，
 * 所以文章刪除後仍可重跑；手動修正一律寫在下面的 overrides，不要改產物。
 *
 * 打分（0～1）：
 *   0.35 房間前綴（slug 開頭 token 相同；同一房間族群給部分分數）
 *   0.25 slug token Jaccard（去掉 feng、shui）
 *   0.25 中文標題字元 bigram Dice（去掉出現在 >12% 標題裡的模板 bigram）
 *   0.15 held 文章的 relatedPosts 或內文連結直接指向該保留文章
 * 最佳分數 < FALLBACK_THRESHOLD 時退回該文章分類的 /zh/category/<slug>/ Hub。
 *
 * 用法：
 *   node scripts/build-demand-consolidation.mjs [--source-ref 54d1899] [--csv <對照表.csv>]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewReadyBlogSlugs, reviewReadyCategorySlugs } from '../src/data/contentQuality.mjs';
import { redirects } from '../src/data/redirects.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const sourceRef = arg('source-ref', '54d1899');
const csvPath = arg('csv');
const FALLBACK_THRESHOLD = 0.3;

/**
 * 人工抽查後的修正：held slug → 目標（保留文章 slug 或 /zh/category/<slug>/）。
 * 每筆都要寫理由，產物裡的 reason 會標成 override。
 */
const overrides = {
  'kitchen-pantry-expiry-check-feng-shui': { to: 'kitchen-upper-cabinet-feng-shui', why: '乾貨櫃收納，自動分數落到風水 Hub' },
  'kitchen-tea-canister-feng-shui': { to: 'kitchen-spice-rack-feng-shui', why: '罐裝收納與調味架同一題型' },
  'bedroom-carbon-monoxide-alarm-feng-shui': { to: 'kitchen-gas-stove-ventilation-feng-shui', why: '一氧化碳與燃氣通風安全' },
  'minimalist-bedroom-layout': { to: '/zh/category/bedroom/', why: '臥室整體配置，自動結果誤落收納 Hub' },
  'dresser-nightstand-layout': { to: 'wardrobe-placement-bedroom', why: '臥室收納家具擺位，比照明指南接近' },
  'bedroom-soundproofing-diy': { to: 'bedroom-bed-head-wall-sound-buffer-rental-feng-shui', why: '臥室隔音' },
  'elderly-bedroom-layout': { to: '/zh/category/bedroom/', why: '長輩臥室整體配置，沒有單篇對應' },
  'kids-room-layout-safety': { to: '/zh/category/bedroom/', why: '兒童房整體配置，沒有單篇對應' },
  'no-window-bedroom-layout': { to: '/zh/category/bedroom/', why: '無窗臥室整體配置，套房分區不對題' },
  'loft-bed-small-room': { to: '/zh/category/small-room/', why: '與 bunk-bed-small-room-layout 同去小房間 Hub' },
  'door-facing-door-feng-shui': { to: 'door-window-room-layout', why: '門的相對位置，床對門不對題' },
  'living-room-baby-gate-feng-shui': { to: '/zh/category/living-room/', why: '客廳安全動線，盆栽不對題' },
  'living-room-recycling-station-feng-shui': { to: 'entryway-recycling-station-feng-shui', why: '同為資源回收站' },
  'living-room-curtain-hem-cleaning-feng-shui': { to: 'living-room-window-feng-shui', why: '窗簾屬窗邊，空氣清淨機不對題' },
  'bedroom-wardrobe-back-panel-cleaning-feng-shui': { to: 'wardrobe-placement-bedroom', why: '衣櫃，床墊通風不對題' },
  'bedroom-wardrobe-shelf-liner-cleaning-feng-shui': { to: 'wardrobe-placement-bedroom', why: '衣櫃' },
  'bedroom-bedspread-cleaning-feng-shui': { to: 'bedroom-bed-throw-cleaning-feng-shui', why: '床上織品清潔，離子夾不對題' },
  'bedroom-bedsheet-folding-storage-feng-shui': { to: 'bedroom-pillow-storage-feng-shui', why: '寢具收納，帽子收納不對題' },
  'bedroom-floor-lamp-cleaning-feng-shui': { to: 'living-room-floor-lamp-feng-shui', why: '立燈' },
  'bedroom-dehumidifier-filter-cleaning-feng-shui': { to: 'humid-bedroom-layout', why: '臥室除濕' },
  'kitchen-drawer-organizer-cleaning-feng-shui': { to: 'kitchen-cabinet-bottom-cleaning-feng-shui', why: '櫥櫃抽屜清潔，三明治機不對題' },
  'kitchen-drawer-crumbs-cleaning-feng-shui': { to: 'kitchen-cabinet-bottom-cleaning-feng-shui', why: '櫥櫃抽屜清潔' },
  'kitchen-air-fryer-basket-cleaning-feng-shui': { to: 'kitchen-toaster-crumb-tray-cleaning-feng-shui', why: '小家電清潔' },
  'kitchen-freezer-drawer-cleaning-feng-shui': { to: 'kitchen-refrigerator-ice-tray-cleaning-feng-shui', why: '冷凍庫' },
  'kitchen-food-container-seal-cleaning-feng-shui': { to: 'kitchen-bowl-storage-feng-shui', why: '餐具／容器收納' },
  'kitchen-lunch-box-storage-feng-shui': { to: 'kitchen-bowl-storage-feng-shui', why: '餐具／容器收納' },
  // 隨機抽查 50 筆中不對題的 6 筆（其中 2 筆由下方 curtain 規則涵蓋）
  'living-room-tv-stand-bottom-cleaning-feng-shui': { to: 'living-room-tv-console-feng-shui', why: '電視櫃，遙控器清潔不對題' },
  'desk-placement-standing-desk-clearance-feng-shui': { to: 'home-office-standing-desk-feng-shui', why: '升降桌' },
  'entryway-walker-storage-feng-shui': { to: 'entryway-stroller-feng-shui', why: '助行器與推車同屬玄關大型輔具停放' },
  'desk-placement-door-exit-route-feng-shui': { to: 'home-office-desk-facing-door-behind-chair-walkway-feng-shui', why: '書桌對門的離座動線' },
};

/** 整個模板叢集一次指定，避免同一系列被打散到不相干的目標。 */
const overrideRules = [
  { pattern: /^kitchen-dishwasher-/, to: 'kitchen-sink-feng-shui', why: '洗碗機系列，保留文章沒有洗碗機，統一到水槽區' },
  { pattern: /^bedroom-dresser-/, to: 'bedroom-bedside-cabinet-cleaning-feng-shui', why: '斗櫃清潔系列，統一到臥室櫃體清潔' },
  { pattern: /^bedroom-bed-headboard-wall-curtain-/, to: 'bedroom-bed-headboard-wall-curtain-window-opening-feng-shui', why: '床頭牆窗簾系列，統一到窗簾與開窗那篇' },
  { pattern: /^balcony-(?:sliding-door|window-lock)/, to: 'balcony-mosquito-screen-feng-shui', why: '陽台門窗五金，紗窗紗門最接近' },
];
const overrideFor = (slug) => overrides[slug] ?? overrideRules.find((rule) => rule.pattern.test(slug));

/**
 * 自動結果把整個叢集收進一篇過窄的文章時，改指向同叢集較通用的那篇。
 * key＝自動選出的目標，keep＝本來就對題、維持原目標的 held slug。
 */
const retargets = {
  'home-office-desk-facing-door-headphone-stand-feng-shui': {
    to: 'home-office-desk-facing-door-visibility-feng-shui',
    keep: ['home-office-desk-facing-door-headset-cable-feng-shui', 'home-office-desk-facing-door-phone-stand-feng-shui'],
    why: '書桌對門叢集 18 篇原本全落在耳機架那篇，改到較通用的視線篇',
  },
};

// --- 讀取來源 -------------------------------------------------------------
function readBlobs(specs) {
  const result = spawnSync('git', ['cat-file', '--batch'], {
    cwd: root,
    input: `${specs.join('\n')}\n`,
    maxBuffer: 512 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`git cat-file failed: ${result.stderr}`);
  const out = result.stdout;
  const blobs = [];
  let offset = 0;
  for (const spec of specs) {
    const newline = out.indexOf(0x0a, offset);
    const header = out.subarray(offset, newline).toString('utf8');
    if (header.endsWith('missing')) throw new Error(`missing in ${sourceRef}: ${spec}`);
    const size = Number(header.split(' ')[2]);
    blobs.push(out.subarray(newline + 1, newline + 1 + size).toString('utf8'));
    offset = newline + 1 + size + 1;
  }
  return blobs;
}

const [policySource] = readBlobs([`${sourceRef}:src/data/searchDemandPolicy.mjs`]);
const heldSlugs = [...policySource.matchAll(/^\s+'([a-z0-9-]+)',/gm)].map((match) => match[1]).sort();
if (heldSlugs.length === 0) throw new Error(`no held slugs found in ${sourceRef}:src/data/searchDemandPolicy.mjs`);

const frontmatter = (source) => source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
const titleOf = (source) => frontmatter(source).match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? '';
const categoryOf = (source) => frontmatter(source).match(/^category:\s*["']?([a-z-]+)["']?\s*$/m)?.[1] ?? '';
const relatedPostsOf = (source) => {
  const block = frontmatter(source).match(/^relatedPosts:\n((?:\s+-\s+.+\n?)+)/m)?.[1] ?? '';
  return [...block.matchAll(/-\s+["']?([a-z0-9-]+)["']?/g)].map((match) => match[1]);
};
const bodyLinksOf = (source) => [...source.matchAll(/\/zh\/blog\/([a-z0-9-]+)\//g)].map((match) => match[1]);

const heldSources = readBlobs(heldSlugs.map((slug) => `${sourceRef}:src/content/blog/${slug}.md`));
const held = heldSlugs.map((slug, index) => {
  const source = heldSources[index].replace(/\r\n/g, '\n');
  return {
    slug,
    title: titleOf(source),
    category: categoryOf(source),
    linked: new Set([...relatedPostsOf(source), ...bodyLinksOf(source)]),
  };
});

const redirectSources = new Set(redirects.map((entry) => entry.from));
const heldSet = new Set(heldSlugs);
for (const slug of Object.keys(overrides)) {
  if (!heldSet.has(slug)) throw new Error(`override key is not a held slug: ${slug}`);
}
const candidates = [];
for (const slug of [...reviewReadyBlogSlugs].sort()) {
  if (heldSet.has(slug) || redirectSources.has(`/zh/blog/${slug}/`)) continue;
  const source = (await fs.readFile(path.join(root, 'src', 'content', 'blog', `${slug}.md`), 'utf8')).replace(/\r\n/g, '\n');
  candidates.push({ slug, title: titleOf(source), category: categoryOf(source) });
}
const candidateBySlug = new Map(candidates.map((candidate) => [candidate.slug, candidate]));

// --- 打分 ---------------------------------------------------------------
const STOP_TOKENS = new Set(['feng', 'shui']);
const tokensOf = (slug) => slug.split('-').filter((token) => token && !STOP_TOKENS.has(token));

// 同一房間族群：開頭 token 不同但談的是同一個空間。
const ROOM_FAMILIES = [
  ['bedroom', 'bed', 'bedside', 'mattress', 'sleep', 'bunk', 'couple', 'kids', 'elderly', 'dresser', 'makeup', 'wardrobe', 'mirror', 'square', 'tatami', 'floor'],
  ['bathroom', 'toilet'],
  ['living', 'sofa', 'tv'],
  ['kitchen', 'stove'],
  ['entryway', 'door'],
  ['desk', 'home', 'student'],
  ['small', 'tiny', 'studio', 'five', 'ping', 'loft', 'room', 'l', 'no', 'first', 'rental', 'renter', 'irregular', 'long'],
  ['laundry', 'balcony', 'dehumidifier', 'humid'],
];
const familyOf = new Map(ROOM_FAMILIES.flatMap((family, index) => family.map((token) => [token, index])));

function prefixScore(a, b) {
  if (a[0] !== b[0]) {
    const family = familyOf.get(a[0]);
    return family !== undefined && family === familyOf.get(b[0]) ? 0.4 : 0;
  }
  let common = 0;
  while (common < Math.min(a.length, b.length) && a[common] === b[common]) common += 1;
  return Math.min(1, 0.6 + 0.2 * (common - 1));
}

function jaccard(a, b) {
  const left = new Set(a);
  const right = new Set(b);
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / (left.size + right.size - intersection || 1);
}

const bigramsOf = (title) => {
  const text = title.replace(/[^\p{Script=Han}a-z0-9]/giu, '');
  const grams = new Set();
  for (let index = 0; index < text.length - 1; index += 1) grams.add(text.slice(index, index + 2));
  return grams;
};
const allTitles = [...held.map((entry) => entry.title), ...candidates.map((entry) => entry.title)];
const documentFrequency = new Map();
for (const title of allTitles) for (const gram of bigramsOf(title)) documentFrequency.set(gram, (documentFrequency.get(gram) ?? 0) + 1);
const templateGrams = new Set([...documentFrequency].filter(([, count]) => count / allTitles.length > 0.12).map(([gram]) => gram));
const contentGramsOf = (title) => new Set([...bigramsOf(title)].filter((gram) => !templateGrams.has(gram)));

function dice(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((gram) => b.has(gram)).length;
  return (2 * intersection) / (a.size + b.size);
}

const round = (value) => Math.round(value * 1000) / 1000;
for (const candidate of candidates) {
  candidate.tokens = tokensOf(candidate.slug);
  candidate.grams = contentGramsOf(candidate.title);
}

const consolidation = [];
for (const entry of held) {
  const tokens = tokensOf(entry.slug);
  const grams = contentGramsOf(entry.title);
  let best;
  for (const candidate of candidates) {
    const parts = {
      prefix: prefixScore(tokens, candidate.tokens),
      tokens: jaccard(tokens, candidate.tokens),
      title: dice(grams, candidate.grams),
      linked: entry.linked.has(candidate.slug) ? 1 : 0,
    };
    const score = 0.35 * parts.prefix + 0.25 * parts.tokens + 0.25 * parts.title + 0.15 * parts.linked;
    if (!best || score > best.score || (score === best.score && candidate.slug < best.candidate.slug)) best = { candidate, score, parts };
  }

  const override = overrideFor(entry.slug);
  let to;
  let targetTitle;
  let reason;
  if (override) {
    if (override.to.startsWith('/zh/category/')) {
      const category = override.to.match(/^\/zh\/category\/([a-z-]+)\/$/)?.[1];
      if (!reviewReadyCategorySlugs.has(category)) throw new Error(`override hub is not built: ${override.to}`);
      to = override.to;
      targetTitle = `分類 Hub：${category}`;
    } else {
      const target = candidateBySlug.get(override.to);
      if (!target) throw new Error(`override target is not a kept article: ${entry.slug} -> ${override.to}`);
      to = `/zh/blog/${target.slug}/`;
      targetTitle = target.title;
    }
    reason = `override: ${override.why}`;
  } else if (best.score >= FALLBACK_THRESHOLD && retargets[best.candidate.slug] && !retargets[best.candidate.slug].keep.includes(entry.slug)) {
    const retarget = retargets[best.candidate.slug];
    const target = candidateBySlug.get(retarget.to);
    if (!target) throw new Error(`retarget is not a kept article: ${retarget.to}`);
    to = `/zh/blog/${target.slug}/`;
    targetTitle = target.title;
    reason = `override: ${retarget.why}`;
  } else if (best.score >= FALLBACK_THRESHOLD) {
    to = `/zh/blog/${best.candidate.slug}/`;
    targetTitle = best.candidate.title;
    reason = `prefix ${round(best.parts.prefix)} / tokens ${round(best.parts.tokens)} / title ${round(best.parts.title)}${best.parts.linked ? ' / linked' : ''}`;
  } else if (reviewReadyCategorySlugs.has(entry.category)) {
    to = `/zh/category/${entry.category}/`;
    targetTitle = `分類 Hub：${entry.category}`;
    reason = `low score ${round(best.score)} (best ${best.candidate.slug}) → category hub`;
  } else {
    to = `/zh/blog/${best.candidate.slug}/`;
    targetTitle = best.candidate.title;
    reason = `low score ${round(best.score)}, category ${entry.category || '(none)'} has no hub → best article`;
  }
  if (to === '/') throw new Error(`never redirect to the home page: ${entry.slug}`);
  consolidation.push({ slug: entry.slug, to, score: round(best.score), reason, heldTitle: entry.title, targetTitle });
}

// --- 輸出 ---------------------------------------------------------------
const hubCount = consolidation.filter((entry) => entry.to.startsWith('/zh/category/')).length;
const overrideCount = consolidation.filter((entry) => entry.reason.startsWith('override')).length;
const targetCount = new Set(consolidation.map((entry) => entry.to)).size;
const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const output = `// 由 scripts/build-demand-consolidation.mjs 產生，請勿手動編輯；修正寫在該腳本的 overrides。
// 來源：${sourceRef} 的 src/data/searchDemandPolicy.mjs 暫停清單（2026-10-10 搜尋需求閘門）
// 結果：${consolidation.length} 篇 → ${targetCount} 個目標（分類 Hub ${hubCount}、人工覆寫 ${overrideCount}）
//
// 2026-10-19 需求閘門合併：這些文章已從 src/content/blog/ 刪除，由 src/data/redirects.mjs
// 展開成 301。score 是最佳候選的相似度（0～1），低於 ${FALLBACK_THRESHOLD} 時退回分類 Hub。

/** @type {{ slug: string; to: string; score: number; reason: string }[]} */
export const demandConsolidation = [
${consolidation.map((entry) => `  { slug: ${quote(entry.slug)}, to: ${quote(entry.to)}, score: ${entry.score}, reason: ${quote(entry.reason)} },`).join('\n')}
];

export const demandConsolidatedBlogSlugs = new Set(demandConsolidation.map((entry) => entry.slug));
`;
await fs.writeFile(path.join(root, 'src', 'data', 'demandConsolidation.mjs'), output);

if (csvPath) {
  const cell = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [
    ['slug', 'target', 'score', 'held_title', 'target_title', 'reason'],
    ...consolidation.map((entry) => [entry.slug, entry.to, entry.score, entry.heldTitle, entry.targetTitle, entry.reason]),
  ];
  await fs.writeFile(csvPath, `﻿${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`);
}

const buckets = [0, 0.3, 0.4, 0.5, 0.6, 0.7, 1.01];
const histogram = buckets.slice(0, -1).map((low, index) => `${low}-${buckets[index + 1]}: ${consolidation.filter((entry) => entry.score >= low && entry.score < buckets[index + 1]).length}`);
console.info(JSON.stringify({ sourceRef, held: consolidation.length, candidates: candidates.length, targets: targetCount, hubs: hubCount, overrides: overrideCount, histogram }, null, 2));
