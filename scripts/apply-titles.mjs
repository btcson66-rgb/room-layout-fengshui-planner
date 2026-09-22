#!/usr/bin/env node
/**
 * apply-titles.mjs — 依 data/title-rewrites.csv 改寫 RoomFeng 的 title / description。
 *
 * 為什麼這是第一件該做的事
 * ------------------------
 * GSC 顯示這些頁面已經排在第 5~13 名，曝光有了，點擊沒有。排名要再往上要數週，
 * 但標題改掉，下次 Google 重新抓取（通常 3~10 天）CTR 就會變。這是唯一
 * 「今天改、兩週內看得到」的槓桿。
 *
 * 用法
 * ----
 *   node scripts/apply-titles.mjs --dry            # 只印出會改什麼，不寫檔
 *   node scripts/apply-titles.mjs                  # 實際寫入
 *   node scripts/apply-titles.mjs --content src/content --csv data/title-rewrites.csv
 *   node scripts/apply-titles.mjs --restore        # 用 .bak 還原
 *
 * 支援的檔案型態
 * --------------
 *   1. Markdown / MDX：改 YAML frontmatter 的 title 與 description
 *   2. .astro：改 frontmatter 內的 `const title = "..."` 這類賦值
 *
 * 安全機制
 * --------
 *   - 寫入前一律產生 <file>.bak
 *   - 標題寬度（中文算 2 格）超過 62 會警告，因為 Google 會截斷
 *   - 找不到對應檔案會列出來，不會靜默跳過
 *
 * 只用 Node 內建模組，不需要 npm install。Node 18+。
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ---------------------------------------------------------------- 參數
const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
};
const DRY = argv.includes("--dry");
const RESTORE = argv.includes("--restore");
const CONTENT_DIR = flag("content", "src/content");
const CSV_PATH = flag("csv", "data/title-rewrites.csv");
const PAGES_DIR = flag("pages", "src/pages");

// ---------------------------------------------------------------- 工具
/** 中文字算 2 格，粗估 Google SERP 顯示寬度（約 62 格會截斷）。 */
const cjkWidth = (s) =>
  [...(s || "")].reduce((n, c) => n + (c.codePointAt(0) > 0x2e80 ? 2 : 1), 0);

/** 最小但正確的 CSV 解析：支援引號內的逗號與換行、"" 逸出。 */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map((h) => h.replace(/^\uFEFF/, "").trim());
  return rows
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(md|mdx|astro)$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * 把 CSV 的 slug（如 /zh/blog/bed-facing-door-feng-shui/）對應到實體檔案。
 * 內容集合的檔名通常就是最後一段 slug，所以用最後一段比對，
 * 再用倒數第二段（blog / 工具頁）縮小範圍，避免多語系撞名。
 */
function matchFile(slug, files) {
  const parts = slug.split("/").filter(Boolean);
  const leaf = parts[parts.length - 1];
  const parent = parts[parts.length - 2] || "";
  const locale = parts[0] || "";

  const score = (f) => {
    const norm = f.replace(/\\/g, "/");
    const base = path.basename(f).replace(/\.(md|mdx|astro)$/, "");
    if (base !== leaf && !norm.includes(`/${leaf}/index.`)) return -1;
    let s = 10;
    if (norm.includes(`/${locale}/`) || norm.includes(`-${locale}/`) ||
        norm.includes(`/${locale}-`)) s += 5;
    // The route parent must outrank a locale-only match. For example,
    // /zh/blog/foo/ should select src/content/blog/foo.md instead of a
    // same-named src/pages/zh/foo.astro landing page.
    if (parent && norm.includes(`/${parent}/`)) s += 8;
    return s;
  };

  let best = null, bestScore = 0;
  for (const f of files) {
    const s = score(f);
    if (s > bestScore) { best = f; bestScore = s; }
  }
  return best;
}

/** YAML 純量逸出：一律用雙引號，內部雙引號與反斜線轉義。 */
const yamlStr = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** 改寫 frontmatter 的一個鍵；沒有該鍵就在結尾補上。 */
function setFrontmatterKey(src, key, value) {
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return { text: src, changed: false, reason: "no-frontmatter" };
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  let body = fm[1];
  // 匹配 key: 後面可能是純量、單引號、雙引號，或 >- / |- 區塊
  const re = new RegExp(`^(\\s*)${key}\\s*:\\s*(?:[>|][-+]?\\s*\\n(?:\\s{2,}.*\\n?)*|.*)$`, "m");
  const line = `${key}: ${yamlStr(value)}`;
  if (re.test(body)) body = body.replace(re, line);
  else body = `${body}${eol}${line}`;
  const text = src.replace(fm[0], `---${eol}${body}${eol}---`);
  return {
    // RegExp replacement around CRLF scalar lines can otherwise leave a bare
    // CR or LF. Normalize back to the source file's original line ending.
    text: text.replace(/\r\n|\r|\n/g, eol),
    changed: true,
    reason: "frontmatter",
  };
}

/** 改寫 .astro frontmatter 內的 const title = "..." 這類賦值。 */
function setAstroConst(src, key, value) {
  const re = new RegExp(
    `(const\\s+${key}\\s*=\\s*)(["'\`])(?:\\\\.|(?!\\2)[\\s\\S])*\\2`, "m");
  if (!re.test(src)) return { text: src, changed: false, reason: "no-const" };
  const lit = JSON.stringify(String(value));
  return { text: src.replace(re, `$1${lit}`), changed: true, reason: "astro-const" };
}

// ---------------------------------------------------------------- 還原
if (RESTORE) {
  const baks = [...walk(CONTENT_DIR), ...walk(PAGES_DIR)]
    .map((f) => `${f}.bak`)
    .filter((f) => fs.existsSync(f));
  for (const b of baks) {
    fs.copyFileSync(b, b.replace(/\.bak$/, ""));
    fs.unlinkSync(b);
  }
  console.log(`已還原 ${baks.length} 個檔案`);
  process.exit(0);
}

// ---------------------------------------------------------------- 主流程
if (!fs.existsSync(CSV_PATH)) {
  console.error(`找不到 ${CSV_PATH}`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));
const files = [...walk(CONTENT_DIR), ...walk(PAGES_DIR)];
console.log(`CSV ${rows.length} 筆　掃描到 ${files.length} 個內容檔\n`);

let ok = 0, miss = 0, warn = 0;
const missing = [];

for (const r of rows) {
  const slug = r.slug;
  const title = r.new_title;
  const desc = r.new_description;
  if (!slug || !title) continue;

  const w = cjkWidth(title);
  if (w > 62) {
    console.warn(`  ⚠ 標題過寬 ${w}/62（會被截斷）：${title}`);
    warn++;
  }

  const file = matchFile(slug, files);
  if (!file) {
    missing.push(slug);
    miss++;
    continue;
  }

  let src = fs.readFileSync(file, "utf8");
  const isAstro = file.endsWith(".astro");
  const hasFm = /^---\r?\n/.test(src);

  // 注意順序：.astro 的 `---` 圍住的是 JavaScript，不是 YAML。
  // 先判斷副檔名，否則會把 YAML 行插進 JS，build 會壞。
  let res1, res2;
  if (isAstro) {
    res1 = setAstroConst(src, "title", title);
    res2 = setAstroConst(res1.text, "description", desc);
    if (!res1.changed) {
      missing.push(`${slug} (.astro 內找不到 const title = "..."：${file})`);
      miss++;
      continue;
    }
  } else if (hasFm) {
    res1 = setFrontmatterKey(src, "title", title);
    res2 = setFrontmatterKey(res1.text, "description", desc);
  } else {
    missing.push(`${slug} (無 frontmatter，無法辨識：${file})`);
    miss++;
    continue;
  }

  if (!res1.changed && !res2.changed) {
    missing.push(`${slug} (找不到 title 欄位：${file})`);
    miss++;
    continue;
  }

  console.log(`  ✓ ${slug}`);
  console.log(`      → ${title}  [寬度 ${w}]`);
  if (!DRY) {
    if (!fs.existsSync(`${file}.bak`)) fs.copyFileSync(file, `${file}.bak`);
    fs.writeFileSync(file, res2.text, "utf8");
  }
  ok++;
}

console.log(`\n${DRY ? "[預演] " : ""}成功 ${ok}　找不到 ${miss}　過寬警告 ${warn}`);
if (missing.length) {
  console.log("\n以下需要手動對應（檔案結構與預設不同）：");
  missing.forEach((m) => console.log(`  - ${m}`));
  console.log("\n可用 --content / --pages 指定正確目錄後重跑。");
}
if (!DRY && ok) {
  console.log("\n備份已存為 <檔名>.bak，要還原執行：node scripts/apply-titles.mjs --restore");
  console.log("接著：npm run build && 在 GSC 用「網址審查 → 要求建立索引」送出改過的頁面。");
}
