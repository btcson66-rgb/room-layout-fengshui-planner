#!/usr/bin/env node
/**
 * build-links.mjs — 用 GSC 資料算出「哪一頁該連到哪一頁」，產生 src/data/internal-links.json。
 *
 * 問題
 * ----
 * RoomFeng 有 986 頁有曝光，其中 621 頁卡在第 7~10 名。這些頁面內容沒問題，
 * 缺的是站內權重。外部連結要花數月，內鏈是你現在就能控制的唯一排名槓桿。
 *
 * 做法
 * ----
 * 1. 把每頁依 slug token 分群（床/門、衣櫃、冷氣、玄關、坪數…）。
 * 2. 每頁挑出同群中「曝光最高」與「最需要幫助」的頁面各數個。
 *    - 曝光最高的當「權重來源」：強頁連到弱頁，把權重往下導。
 *    - 排名 11~30 但有曝光的當「受援頁」：這些最接近突破第一頁。
 * 3. 錨點文字用目標頁的主查詢，不用「點這裡」或頁面標題全文。
 *
 * 用法
 * ----
 *   node scripts/build-links.mjs \
 *     --pages ~/gsc/roomfeng.win/網頁.csv \
 *     --queries ~/gsc/roomfeng.win/查詢.csv \
 *     --out src/data/internal-links.json \
 *     --per-page 6
 *
 * 產出格式
 * --------
 *   {
 *     "/zh/blog/bed-facing-door-feng-shui/": [
 *       { "url": "/zh/blog/bed-under-window-solutions/", "anchor": "床頭靠窗怎麼辦", "reason": "boost" },
 *       ...
 *     ]
 *   }
 *
 * 只用 Node 內建模組。Node 18+。
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { redirectSources } from "../src/data/redirects.mjs";

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

const PAGES_CSV = flag("pages");
const QUERIES_CSV = flag("queries");
const OUT = flag("out", "src/data/internal-links.json");
const PER_PAGE = Number(flag("per-page", 6));
const LOCALE = flag("locale", "/zh/");

if (!PAGES_CSV) {
  console.error("用法：node scripts/build-links.mjs --pages <網頁.csv> [--queries <查詢.csv>]");
  process.exit(1);
}

// ------------------------------------------------------------------ CSV
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map((h) => h.replace(/^﻿/, "").trim());
  return rows.filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

// GSC 中英欄名都支援
const col = (row, ...names) => {
  for (const n of names) if (row[n] !== undefined) return row[n];
  return "";
};
const num = (v) => {
  const n = parseFloat(String(v).replace(/[,%]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// ------------------------------------------------------------------ 主題分群
/**
 * 用 slug 的英文詞判定主題。一頁可以屬於多個主題，
 * 這樣「冷氣＋臥室」的頁面會同時連到冷氣群與臥室群。
 */
const TOPICS = {
  "bed-door":      { tokens: ["bed", "door", "facing"], label: "床與門" },
  "bed-wall":      { tokens: ["bed", "head", "wall"], label: "床頭與牆面" },
  "bed-window":    { tokens: ["bed", "window"], label: "床與窗" },
  "wardrobe":      { tokens: ["wardrobe", "closet"], label: "衣櫃" },
  "desk":          { tokens: ["desk", "office", "monitor"], label: "書桌" },
  "aircon":        { tokens: ["air", "conditioner", "hvac", "outdoor"], label: "冷氣" },
  "mirror":        { tokens: ["mirror"], label: "鏡子" },
  "beam":          { tokens: ["beam", "ceiling"], label: "樑與天花" },
  "entryway":      { tokens: ["entryway", "doormat", "shoe", "umbrella", "helmet"], label: "玄關" },
  "storage":       { tokens: ["storage", "zones", "organizer"], label: "收納" },
  "small-room":    { tokens: ["small", "tiny", "ping", "studio"], label: "小房間與坪數" },
  "living-room":   { tokens: ["living", "sofa", "tv", "clock"], label: "客廳" },
  "clearance":     { tokens: ["clearance", "width", "circulation", "turning"], label: "走道與操作尺寸" },
  "kitchen":       { tokens: ["kitchen", "fridge", "dining", "range"], label: "廚房與餐廳" },
  "bathroom":      { tokens: ["bathroom", "dryer", "toilet"], label: "浴室" },
  "balcony":       { tokens: ["balcony", "privacy", "screen"], label: "陽台" },
  "moving":        { tokens: ["moving", "fit", "size", "check"], label: "搬家與尺寸檢查" },
};

const STOP = new Set(["zh", "en", "blog", "index", "feng", "shui", "layout", "the", "and", "for"]);

function pathOf(u) {
  return String(u).replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0];
}
function tokensOf(p) {
  return p.toLowerCase().split(/[/\-_.]+/).filter((t) => t && !STOP.has(t) && t.length > 2);
}
function topicsOf(p) {
  const toks = new Set(tokensOf(p));
  const hits = [];
  for (const [key, def] of Object.entries(TOPICS)) {
    const n = def.tokens.filter((t) => toks.has(t)).length;
    if (n >= (def.tokens.length > 2 ? 2 : 1)) hits.push({ key, score: n });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, 3).map((h) => h.key);
}

// ------------------------------------------------------------------ 載入
const gscPages = parseCsv(fs.readFileSync(PAGES_CSV, "utf8"))
  .map((r) => ({
    url: pathOf(col(r, "熱門網頁", "Top pages", "page")),
    impr: num(col(r, "曝光", "Impressions")),
    clicks: num(col(r, "點擊", "Clicks")),
    pos: num(col(r, "排名", "Position")) || 999,
  }))
  .filter((p) => p.url.startsWith(LOCALE) && p.impr > 0);
// GSC 歷史匯出仍包含已合併或即將轉址的舊 URL。這些 URL 不在 sitemap，
// 不能成為新內鏈圖的來源或目標。
const pages = gscPages.filter((p) => !redirectSources.has(p.url));
console.log(`GSC 來源頁 ${gscPages.length}，排除轉址來源 ${gscPages.length - pages.length} 頁`);

// 查詢表用來決定錨點文字。GSC 匯出不含 query→page 對應，
// 只有查詢完整出現在文章既有標題時才可自動採用，避免把別頁查詢誤配；
// 其他頁先用人工 anchors.json，最後才回退到可讀的文章標題或 slug。
let queryHints = [];
if (QUERIES_CSV && fs.existsSync(QUERIES_CSV)) {
  queryHints = parseCsv(fs.readFileSync(QUERIES_CSV, "utf8"))
    .map((r) => ({
      q: col(r, "熱門查詢項目", "Top queries", "query"),
      impr: num(col(r, "曝光", "Impressions")),
      pos: num(col(r, "排名", "Position")) || 999,
    }))
    .filter((q) => q.q && q.impr >= 5)
    .sort((a, b) => b.impr - a.impr);
}

// 人工錨點對照（可選）：{ "/zh/blog/xxx/": "床對門怎麼辦" }
const ANCHOR_FILE = flag("anchors", "data/anchors.json");
let anchors = {};
if (fs.existsSync(ANCHOR_FILE)) {
  anchors = JSON.parse(fs.readFileSync(ANCHOR_FILE, "utf8"));
  console.log(`已載入人工錨點 ${Object.keys(anchors).length} 筆`);
}

const SLUG_ZH = {
  bed: "床", door: "門", wall: "牆", window: "窗", wardrobe: "衣櫃",
  desk: "書桌", mirror: "鏡子", beam: "橫樑", entryway: "玄關",
  storage: "收納", small: "小房間", living: "客廳", room: "房間",
  kitchen: "廚房", fridge: "冰箱", dining: "餐桌", bathroom: "浴室",
  balcony: "陽台", clearance: "留寬", sofa: "沙發", clock: "掛鐘",
  air: "冷氣", conditioner: "", ceiling: "天花", light: "燈具",
  outlet: "插座", height: "高度", size: "尺寸", moving: "搬家",
};
function fallbackAnchor(p) {
  const blogSlug = p.match(/^\/zh\/blog\/([^/]+)\/$/)?.[1];
  if (blogSlug) {
    const source = path.join('src', 'content', 'blog', `${blogSlug}.md`);
    if (fs.existsSync(source)) {
      const title = fs.readFileSync(source, 'utf8').match(/^title:\s*(.+)$/m)?.[1]
        ?.trim().replace(/^['"]|['"]$/g, '');
      const exactQuery = queryHints.find(({ q }) => q.length >= 3 && title?.includes(q));
      if (exactQuery) return exactQuery.q;
      const phrase = title?.split(/[？?:：｜|]/)[0]?.trim();
      if (phrase && phrase.length >= 4) return phrase.slice(0, 28);
    }
  }
  const zh = tokensOf(p).map((t) => SLUG_ZH[t]).filter(Boolean);
  return zh.length ? zh.slice(0, 3).join("") : p.replace(/\//g, " ").trim();
}
const anchorFor = (p) => anchors[p] || anchors[p.replace(/\/$/, "")] || fallbackAnchor(p);

// ------------------------------------------------------------------ 建圖
const byTopic = new Map();
for (const p of pages) {
  p.topics = topicsOf(p.url);
  p.family = familyOf(p.url);
  p.tokenSet = new Set(tokensOf(p.url));
  for (const t of p.topics) {
    if (!byTopic.has(t)) byTopic.set(t, []);
    byTopic.get(t).push(p);
  }
}

// 同一個「門／窗」詞會跨床、書桌、客廳等不同問題。先鎖定主要場景，
// 再用少見的共同詞排序，避免高曝光床頁壓過真正相關的書桌或客廳頁。
function familyOf(url) {
  const slug = url.split('/').filter(Boolean).at(-1) ?? '';
  if (slug.startsWith('entryway-')) return 'entryway';
  if (slug.startsWith('living-room-') || slug.startsWith('sofa-') || slug.startsWith('tv-')) return 'living-room';
  if (slug.startsWith('home-office-') || slug.startsWith('desk-')) return 'desk';
  if (slug.startsWith('bathroom-') || slug.startsWith('toilet-')) return 'bathroom';
  if (slug.startsWith('kitchen-') || slug.startsWith('fridge-')) return 'kitchen';
  if (slug.startsWith('balcony-')) return 'balcony';
  if (slug.startsWith('dining-')) return 'dining';
  if (slug.includes('air-conditioner') || slug.includes('aircon')) return 'aircon';
  if (slug.startsWith('small-room-storage-')) return 'small-room-storage';
  if (slug.startsWith('small-') || slug.startsWith('tiny-') || slug.includes('ping-')) return 'small-room';
  if (slug.includes('wardrobe') || slug.includes('closet')) return 'wardrobe';
  if (slug.startsWith('bed-') || slug.startsWith('bedroom-') || slug.startsWith('bedside-')) return 'bedroom';
  return 'other';
}

const COMMON_TOKENS = new Set([
  'bed', 'bedroom', 'room', 'small', 'living', 'home', 'office', 'feng',
  'shui', 'layout', 'cleaning', 'storage', 'clearance', 'zh', 'blog',
]);
function sharedSpecificTokens(source, target) {
  return [...source.tokenSet].filter((token) => !COMMON_TOKENS.has(token) && target.tokenSet.has(token)).length;
}

const links = {};
let edges = 0;

for (const src of pages) {
  const cand = new Map();
  for (const p of pages) {
    if (p.url === src.url || p.family !== src.family) continue;
    const shared = sharedSpecificTokens(src, p);
    if (shared === 0 && src.family === 'other') continue;
    const need = p.pos > 10 && p.pos <= 30 ? 90 : p.pos <= 5 ? 0 : 35;
    const score = shared * 1000 + need + Math.log2(1 + p.impr) * 8;
    cand.set(p.url, { page: p, score });
  }

  const picked = [...cand.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, PER_PAGE)
    .map(({ page }) => ({
      url: page.url,
      anchor: anchorFor(page.url),
      reason: page.pos > 10 && page.pos <= 30 ? "boost"
            : page.pos <= 5 ? "hub" : "related",
      pos: Math.round(page.pos * 10) / 10,
      impr: page.impr,
    }));
  if (picked.length) {
    links[src.url] = picked;
    edges += picked.length;
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(links, null, 2), "utf8");

// ------------------------------------------------------------------ 報告
const inbound = new Map();
for (const targets of Object.values(links))
  for (const t of targets) inbound.set(t.url, (inbound.get(t.url) || 0) + 1);

const orphans = pages.filter((p) => !inbound.has(p.url) && p.impr >= 20);
const boosted = pages.filter((p) => p.pos > 10 && p.pos <= 30 && inbound.has(p.url));

console.log(`\n來源頁 ${Object.keys(links).length}　連結邊 ${edges}　平均每頁 ${(edges / Math.max(1, Object.keys(links).length)).toFixed(1)} 條`);
console.log(`受援頁（排名 11~30 且已獲內鏈）：${boosted.length}`);
console.log(`孤兒頁（有曝光但沒人連，需手動處理）：${orphans.length}`);
orphans.slice(0, 15).forEach((p) =>
  console.log(`  - ${p.url}  曝光 ${p.impr}  名次 ${p.pos.toFixed(1)}`));
console.log(`\n已寫出 ${OUT}`);
console.log(`錨點文字若不理想，建立 ${ANCHOR_FILE}：{"/zh/blog/xxx/": "床對門怎麼辦"} 再重跑。`);
