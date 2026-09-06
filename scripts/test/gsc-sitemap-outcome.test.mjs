import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { resolveSitemapOutcome } from '../gsc-sitemap-outcome.mjs';
import { findStuckSitemaps } from '../gsc-client.mjs';

const root = new URL('../../', import.meta.url);
const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-09-03T00:00:00Z');
const daysAgo = (n) => new Date(now.getTime() - n * DAY_MS).toISOString();

// 這組測試守的是「哪一種問題該擋部署」的邊界：
//
//   提交失敗（API/授權/PUT 被拒）→ 管線壞了 → 一定紅。這一條是 CLAUDE.md
//   風險紅線第 6 條，2026-08-31 曾因重構漏掉 process.exitCode 而真的靜默跳過過。
//
//   sitemap 卡住（Google 遲遲不下載）→ 真問題，但不是這次部署的問題，
//   也不是任何一次 push 能修好的 → 不擋部署，改由 fable-company 每日健檢
//   （scripts/lib/gsc-sitemap-discovery.mjs）每天報一次。詳見
//   gsc-sitemap-outcome.mjs 檔頭 2026-09-06 的那一節。
//
// 兩者不可互換：把上面那條放寬是紅線；把下面那條改回擋部署會讓部署永久紅，
// 反而讓真正的部署失敗看不出來。

test('sitemap 卡住不擋部署，但狀態與訊息必須保留下來', () => {
  const outcome = resolveSitemapOutcome({ registeredCount: 2, stuckCount: 2 });
  assert.equal(outcome.status, 'registered-pending');
  assert.equal(outcome.exitCode, 0);
  assert.equal(outcome.stuck, true);
  // 訊息要明說這條線由誰負責，否則下一個人會以為它被吃掉了。
  assert.match(outcome.message, /每日健檢/);
});

test('有新提交但同時有卡住的項目，仍然算成功', () => {
  const outcome = resolveSitemapOutcome({ submittedCount: 1, registeredCount: 1, stuckCount: 1 });
  assert.equal(outcome.status, 'submitted-and-verified');
  assert.equal(outcome.exitCode, 0);
  assert.equal(outcome.stuck, true);
});

test('提交失敗一定紅，即使同時有卡住的項目', () => {
  const outcome = resolveSitemapOutcome({ failureCount: 1, stuckCount: 2, alerts: ['PUT 403'] });
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.exitCode, 1);
});

test('有新提交且沒有卡住，成功', () => {
  const outcome = resolveSitemapOutcome({ submittedCount: 2, registeredCount: 3 });
  assert.equal(outcome.status, 'submitted-and-verified');
  assert.equal(outcome.exitCode, 0);
  assert.equal(outcome.stuck, false);
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
  // STUCK 不擋部署，但一定要印出來——否則就真的變成紅線 6 的靜默跳過。
  assert.match(script, /for \(const alert of report\.alerts\) console\.error\(alert\);/);
  assert.match(script, /outcome\.stuck/);
});
