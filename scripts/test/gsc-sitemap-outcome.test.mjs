import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { resolveSitemapOutcome } from '../gsc-sitemap-outcome.mjs';
import { findStuckSitemaps } from '../gsc-client.mjs';

const root = new URL('../../', import.meta.url);
const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-09-03T00:00:00Z');
const daysAgo = (n) => new Date(now.getTime() - n * DAY_MS).toISOString();

// 這組測試守的是一條規則：卡住的 sitemap 必須讓提交步驟失敗。
// 2026-08-31 這條規則因為一次重構漏掉 process.exitCode 而回歸成靜默跳過
//（CLAUDE.md 風險紅線第 6 條），所以現在用純函式＋測試把它釘住。

test('卡住的 sitemap 讓步驟失敗，而不是靜默回報成功', () => {
  const outcome = resolveSitemapOutcome({ registeredCount: 2, stuckCount: 2 });
  assert.equal(outcome.status, 'registered-pending');
  assert.equal(outcome.exitCode, 1);
  assert.match(outcome.message, /Failing the step/);
});

test('有新提交但同時有卡住的項目，仍然要失敗', () => {
  const outcome = resolveSitemapOutcome({ submittedCount: 1, registeredCount: 1, stuckCount: 1 });
  assert.equal(outcome.status, 'submitted-and-verified');
  assert.equal(outcome.exitCode, 1);
});

test('有新提交且沒有卡住，成功', () => {
  const outcome = resolveSitemapOutcome({ submittedCount: 2, registeredCount: 3 });
  assert.equal(outcome.status, 'submitted-and-verified');
  assert.equal(outcome.exitCode, 0);
});

test('全部已註冊且沒有卡住，成功', () => {
  const outcome = resolveSitemapOutcome({ registeredCount: 3 });
  assert.equal(outcome.status, 'already-registered');
  assert.equal(outcome.exitCode, 0);
});

test('有路徑失敗時，失敗優先於其他判定', () => {
  const outcome = resolveSitemapOutcome({
    failureCount: 1,
    submittedCount: 2,
    stuckCount: 3,
    alerts: ['boom'],
  });
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.exitCode, 1);
  assert.equal(outcome.message, 'boom');
});

test('沒有任何輸入時不會爆，視為全部已註冊', () => {
  const outcome = resolveSitemapOutcome();
  assert.equal(outcome.status, 'already-registered');
  assert.equal(outcome.exitCode, 0);
});

test('findStuckSitemaps 的判定：只有 pending、未下載、且超過 14 天才算卡住', () => {
  const entries = [
    { path: 'a', isPending: true, lastDownloaded: null, lastSubmitted: daysAgo(15) },
    { path: 'b', isPending: true, lastDownloaded: daysAgo(1), lastSubmitted: daysAgo(15) },
    { path: 'c', isPending: true, lastDownloaded: null, lastSubmitted: daysAgo(3) },
    { path: 'd', isPending: false, lastDownloaded: null, lastSubmitted: daysAgo(30) },
  ];
  const stuck = findStuckSitemaps(entries, now).map((entry) => entry.path);
  assert.deepEqual(stuck, ['a']);
});

test('提交腳本確實使用這個純函式，而不是自己再寫一組分支', async () => {
  const script = await readFile(new URL('scripts/gsc-submit-sitemap.mjs', root), 'utf8');
  assert.match(script, /import \{ resolveSitemapOutcome \}/);
  assert.match(script, /const outcome = resolveSitemapOutcome\(/);
  assert.match(script, /if \(outcome\.exitCode !== 0\) process\.exitCode = outcome\.exitCode;/);
  // 舊的分支寫法不該還留在腳本裡，否則兩份規則會再度分岔。
  assert.doesNotMatch(script, /report\.status = 'registered-pending';/);
});
