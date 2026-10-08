#!/usr/bin/env node
// Generate the 19-row review table from the supplied site-level GSC query export
// and the manual page-intent decisions. No query→page GSC evidence is implied.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rows = fs.readFileSync('data/faq-seeds.csv', 'utf8').trim().split(/\r?\n/).slice(1);
const observed = new Map(rows.map((line) => {
  const cells = line.split(',');
  return [cells[0], (cells[4] ?? '').split(' | ').filter(Boolean).map((query) => query.replace(/\(\d+\)$/, '').trim())];
}));
const t1 = new Set(fs.readFileSync('data/title-rewrites.csv', 'utf8').trim().split(/\r?\n/).slice(1).map((line) => line.split(',')[0]));
const decisions = JSON.parse(fs.readFileSync('data/wave1-faq-disposition.json', 'utf8'));
const candidates = [...observed].filter(([url, queries]) => queries.length > 0 && !t1.has(url)).map(([url]) => url);
assert.equal(candidates.length, 19, 'Wave 1 candidate count changed');
assert.equal(decisions.length, candidates.length, 'every candidate needs one review row');
assert.deepEqual(new Set(decisions.map((row) => row.url)), new Set(candidates), 'review URLs differ from seed candidates');
const reasons = new Set(['QUALIFIED', 'INSUFFICIENT_QUERY_EVIDENCE', 'QUERY_PAGE_MISMATCH', 'DUPLICATE_INTENT', 'ANOMALOUS_QUERY', 'REDIRECTED_URL', 'T1_FROZEN', 'HUMAN_REVIEW']);
const implemented = new Set([
  '/zh/blog/small-room-wardrobe-door-turning-clearance-feng-shui/',
  '/zh/blog/air-conditioner-bedroom-layout/',
  '/zh/bed-desk-wardrobe-layout/',
]);
const breakdown = new Map();
const escape = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const cells = (items) => items.length ? items.join('；') : '—';
const lines = [
  '# RoomFeng Wave 1 FAQ candidate disposition',
  '',
  '證據定義：以下 GSC observed queries 僅證明查詢出現在提供的**站點層級** GSC 匯出；`faq-seeds.csv` 以 slug/語意配對產生候選，沒有 query × page 維度。合格題目另經人工核對該頁主要意圖與正文。因此本表稱為 **GSC-observed query + manually verified page-intent match**，不宣稱 Google 已證明查詢對應該 URL。',
  '',
  'Gate：每頁至少 4 個互不重複、意圖相符且可實質回答的查詢才新增 FAQ。0–3 題正確略過，不算失敗；T1 30 頁凍結。Google FAQ rich result 已停用；Schema validity ≠ Google rich-result eligibility。',
  '',
  '| URL | GSC observed queries | Semantic candidates | Qualified unique queries | Rejected queries | Rejection reason | FAQ implemented | Question count | Schema validation | Notes |',
  '| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |',
];
for (const row of decisions) {
  const sourceQueries = observed.get(row.url);
  assert.ok(sourceQueries, `missing source queries: ${row.url}`);
  assert.ok(reasons.has(row.reason), `unknown reason: ${row.reason}`);
  assert.ok(row.semantic.every((query) => sourceQueries.includes(query)), `semantic query absent from GSC export: ${row.url}`);
  assert.ok(row.qualified.every((query) => row.semantic.includes(query)), `qualified query absent from semantic set: ${row.url}`);
  assert.equal(new Set(row.qualified).size, row.qualified.length, `duplicate qualified query: ${row.url}`);
  const yes = implemented.has(row.url);
  assert.equal(row.reason === 'QUALIFIED', yes, `implementation/reason mismatch: ${row.url}`);
  assert.equal(yes, row.qualified.length >= 4, `four-question gate mismatch: ${row.url}`);
  breakdown.set(row.reason, (breakdown.get(row.reason) ?? 0) + 1);
  const rejected = sourceQueries.filter((query) => !row.qualified.includes(query));
  lines.push(`| ${escape(row.url)} | ${escape(cells(sourceQueries))} | ${escape(cells(row.semantic))} | ${escape(cells(row.qualified))} | ${escape(cells(rejected))} | ${row.reason} | ${yes ? 'YES' : 'NO'} | ${yes ? row.qualified.length : 0} | ${yes ? 'PASS: Schema.org 0 errors / 0 warnings (2026-09-24)' : 'N/A'} | ${escape(row.notes)} |`);
}
lines.push('', `總計：19 reviewed candidates；${implemented.size} qualified / implemented；${decisions.length - implemented.size} evidence-gated skipped。`);
lines.push('', `Reason breakdown：${[...breakdown].map(([reason, count]) => `${reason} ${count}`).join('；')}。`);
lines.push('', '三個實作頁的 Schema.org Validator 結果為本機 build JSON-LD 片段測試；正式站部署與 Google SERP 呈現不在此證據範圍。');
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/wave1-faq-disposition.md', `${lines.join('\n')}\n`, 'utf8');
console.log(`FAQ disposition: ${decisions.length} candidates, ${implemented.size} implemented, ${decisions.length - implemented.size} skipped; docs/wave1-faq-disposition.md`);
