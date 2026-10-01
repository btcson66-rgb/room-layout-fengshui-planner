#!/usr/bin/env node
/**
 * build-faq-seeds.mjs — 把 GSC 查詢配對到頁面，產生 FAQ 題目的候選清單。
 *
 * 為什麼需要這支
 * --------------
 * FAQ 的題目必須是「真的有人這樣搜」，不能自己掰。掰出來的問答就是
 * 量產內容，正是 2026 年 3 月核心更新在打的東西。
 *
 * 但 GSC 的匯出不含 query→page 對應（那要用 API 或逐頁篩選）。
 * 這支腳本用 slug 的英文詞 ↔ 查詢的中文詞對照表做語意配對，
 * 產生「這一頁可能該回答哪些查詢」的候選，讓人或 agent 挑選，
 * 而不是從零發明。
 *
 * 用法
 * ----
 *   node scripts/build-faq-seeds.mjs \
 *     --pages gsc/網頁.csv \
 *     --queries gsc/查詢.csv \
 *     --out data/faq-seeds.csv \
 *     --top 80
 *
 * 輸出欄位
 * --------
 *   url, impressions, position, clicks, candidate_queries, match_score
 *
 * candidate_queries 是用 ` | ` 分隔的查詢，依曝光排序。
 * **這是候選不是答案** —— 配對可能有誤，寫 FAQ 前要人工確認該查詢
 * 真的屬於那一頁。
 *
 * Node 18+，零相依。
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};
const PAGES = flag("pages", "gsc/網頁.csv");
const QUERIES = flag("queries", "gsc/查詢.csv");
const OUT = flag("out", "data/faq-seeds.csv");
const TOP = Number(flag("top", 80));
const MIN_Q_IMPR = Number(flag("min-query-impr", 3));

// ---------------------------------------------------------------- CSV
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
const col = (r, ...ns) => { for (const n of ns) if (r[n] !== undefined) return r[n]; return ""; };
const num = (v) => { const n = parseFloat(String(v).replace(/[,%]/g, "")); return Number.isFinite(n) ? n : 0; };
const pathOf = (u) => String(u).replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0];

// ---------------------------------------------------------------- 對照表
/**
 * slug 英文詞 → 該詞在查詢裡可能出現的中文寫法（含簡體，HK/MY 用戶會用）。
 * 一個 slug token 命中多個中文詞都算分。
 */
const LEX = {
  bed:        ["床", "床鋪", "床舖", "床墊"],
  door:       ["門", "房門", "大門", "门"],
  wall:       ["牆", "靠牆", "牆面", "墙"],
  window:     ["窗", "窗戶", "靠窗", "窗户"],
  wardrobe:   ["衣櫃", "衣櫥", "衣柜"],
  closet:     ["衣櫃", "更衣室"],
  desk:       ["書桌", "桌", "辦公桌", "书桌"],
  mirror:     ["鏡子", "鏡", "镜子"],
  beam:       ["樑", "橫樑", "梁"],
  ceiling:    ["天花", "天花板", "樑"],
  entryway:   ["玄關", "門口", "玄关"],
  doormat:    ["地墊", "踏墊"],
  shoe:       ["鞋櫃", "鞋"],
  umbrella:   ["傘", "雨傘", "傘架"],
  helmet:     ["安全帽"],
  storage:    ["收納", "儲物", "收纳"],
  small:      ["小房間", "小坪數", "小套房"],
  tiny:       ["小房間", "坪"],
  ping:       ["坪"],
  studio:     ["套房", "小套房"],
  living:     ["客廳", "客厅"],
  sofa:       ["沙發", "沙发"],
  tv:         ["電視", "电视"],
  clock:      ["掛鐘", "時鐘", "鬧鐘"],
  air:        ["冷氣", "空調", "空调"],
  conditioner:["冷氣", "空調"],
  outdoor:    ["室外機", "外機"],
  fan:        ["吊扇", "風扇"],
  light:      ["燈", "燈具", "照明"],
  outlet:     ["插座"],
  kitchen:    ["廚房", "厨房"],
  fridge:     ["冰箱"],
  dining:     ["餐桌", "餐廳"],
  bathroom:   ["浴室", "廁所"],
  balcony:    ["陽台", "阳台"],
  clearance:  ["留寬", "走道", "間距", "距離"],
  width:      ["寬", "寬度", "走道"],
  circulation:["動線", "走道"],
  height:     ["高度"],
  size:       ["尺寸", "大小"],
  moving:     ["搬家", "搬"],
  square:     ["方形", "正方形"],
  narrow:     ["狹長", "長型"],
  head:       ["床頭"],
  bedside:    ["床頭", "床邊", "床頭櫃"],
  cabinet:    ["櫃", "床頭櫃"],
  layout:     ["配置", "格局", "擺放"],
  placement:  ["擺放", "位置"],
  facing:     ["對", "正對"],
  feng:       [], shui: [], zh: [], blog: [],  // 全站共用，不計分
};

const STOP = new Set(["zh", "en", "blog", "index", "feng", "shui", "the", "and", "for"]);
const slugToks = (p) =>
  p.toLowerCase().split(/[/\-_.]+/).filter((t) => t && !STOP.has(t) && t.length > 2);

// ---------------------------------------------------------------- 載入
const pages = parseCsv(fs.readFileSync(PAGES, "utf8"))
  .map((r) => ({
    url: pathOf(col(r, "熱門網頁", "Top pages")),
    impr: num(col(r, "曝光", "Impressions")),
    clicks: num(col(r, "點擊", "Clicks")),
    pos: num(col(r, "排名", "Position")) || 999,
  }))
  .filter((p) => p.url.startsWith("/zh/") && p.impr > 0)
  .sort((a, b) => b.impr - a.impr)
  .slice(0, TOP);

const ANOMALY = ["夏天直接睡地上会影响财运吗", "夏天客厅窗户反光严重如何处理"];

const queries = parseCsv(fs.readFileSync(QUERIES, "utf8"))
  .map((r) => ({
    q: col(r, "熱門查詢項目", "Top queries"),
    impr: num(col(r, "曝光", "Impressions")),
    clicks: num(col(r, "點擊", "Clicks")),
    pos: num(col(r, "排名", "Position")) || 999,
  }))
  // 排除兩個異常查詢：第 7 名零點擊，曝光被 AI 摘要推到視線外，不會轉換
  .filter((q) => q.q && q.impr >= MIN_Q_IMPR && !ANOMALY.includes(q.q))
  // 排除帶 site:/filetype: 運算子的查詢，那是別人在做競品調查
  .filter((q) => !/(-site:|filetype:)/i.test(q.q));

console.log(`頁面 ${pages.length}（取曝光前 ${TOP}）　查詢 ${queries.length}（曝光 ≥${MIN_Q_IMPR}）\n`);

// ---------------------------------------------------------------- 配對
function score(page, query) {
  const toks = slugToks(page.url);
  let s = 0, hit = 0;
  for (const t of toks) {
    const zh = LEX[t];
    if (!zh || !zh.length) continue;
    if (zh.some((w) => query.q.includes(w))) { s += 10; hit++; }
  }
  // 命中越多不同的 slug 詞，配對越可信
  if (hit >= 2) s += 15;
  if (hit >= 3) s += 15;
  // 查詢有曝光量的加權（取對數避免大查詢壓過一切）
  s += Math.log10(query.impr + 1) * 3;
  return hit >= 2 ? s : 0;   // 至少兩個 slug 詞命中才算配對，避免亂配
}

const out = [];
for (const p of pages) {
  const cands = queries
    .map((q) => ({ q, s: score(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.q.impr - a.q.impr)
    .slice(0, 8);
  out.push({
    url: p.url,
    impressions: p.impr,
    position: p.pos.toFixed(1),
    clicks: p.clicks,
    candidate_queries: cands.map((c) => `${c.q.q}(${c.q.impr})`).join(" | "),
    match_score: cands.length ? Math.round(cands[0].s) : 0,
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const cols = ["url", "impressions", "position", "clicks", "candidate_queries", "match_score"];
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
fs.writeFileSync(OUT,
  "﻿" + cols.join(",") + "\n" +
  out.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n"), "utf8");

const withQ = out.filter((r) => r.candidate_queries).length;
console.log(`有候選查詢的頁面：${withQ}/${out.length}`);
console.log(`沒有候選的 ${out.length - withQ} 頁 —— 這些頁不要寫 FAQ，`);
console.log(`因為沒有證據顯示有人這樣搜。\n`);
console.log(`已寫出 ${OUT}`);
console.log(`\n⚠ candidate_queries 是「候選」不是答案。配對用 slug 詞對中文詞，`);
console.log(`  會有誤配。寫 FAQ 前要逐頁確認該查詢真的屬於那一頁。`);
