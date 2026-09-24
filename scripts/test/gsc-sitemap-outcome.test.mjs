import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { isSuccessfulSitemapSubmissionStatus, resolveSitemapOutcome } from '../gsc-sitemap-outcome.mjs';
import { findStuckSitemaps, needsResubmission } from '../gsc-client.mjs';

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

test('sitemap 從未被擷取不擋部署，但狀態與訊息必須保留下來', () => {
  const outcome = resolveSitemapOutcome({ registeredCount: 2, stuckCount: 2 });
  assert.equal(outcome.status, 'registered-never-fetched');
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

test('最終發布判定接受已註冊但尚未擷取，仍拒絕真正提交失敗或未知狀態', () => {
  for (const status of ['submitted-and-verified', 'already-registered', 'registered-never-fetched']) {
    assert.equal(isSuccessfulSitemapSubmissionStatus(status), true, status);
  }
  for (const status of ['failed', 'registered-pending', 'UNKNOWN', null]) {
    assert.equal(isSuccessfulSitemapSubmissionStatus(status), false, String(status));
  }
});

test('沒有任何輸入時不會爆，視為全部已註冊', () => {
  const outcome = resolveSitemapOutcome();
  assert.equal(outcome.status, 'already-registered');
  assert.equal(outcome.exitCode, 0);
});

// GSC 介面把 isPending + lastDownloaded=null 顯示為「無法擷取」，不是排隊中。
// 判定只留兩天寬限，是為了不把剛送出去、Google 還沒輪到的那一筆誤報。
test('findStuckSitemaps：已註冊、從未被下載、且送出超過兩天才算從未擷取', () => {
  const entries = [
    { path: 'a', isPending: true, lastDownloaded: null, lastSubmitted: daysAgo(15) },
    { path: 'b', isPending: true, lastDownloaded: daysAgo(1), lastSubmitted: daysAgo(15) },
    { path: 'c', isPending: true, lastDownloaded: null, lastSubmitted: daysAgo(3) },
    { path: 'd', isPending: false, lastDownloaded: null, lastSubmitted: daysAgo(30) },
    { path: 'e', isPending: true, lastDownloaded: null, lastSubmitted: daysAgo(1) },
  ];
  const stuck = findStuckSitemaps(entries, now).map((entry) => entry.path);
  assert.deepEqual(stuck, ['a', 'c']);
});

// 這一組守的是 2026-09-21 修掉的凍結狀態：只要 GSC 回報「已註冊」就永遠不再 PUT，
// roomfeng 自 09-06、funnytools 自 09-03 起就再也沒有送出過任何一次提交。
test('needsResubmission：從未被下載且超過七天才重送', () => {
  assert.equal(needsResubmission({ lastDownloaded: null, lastSubmitted: daysAgo(8) }, now), true);
  assert.equal(needsResubmission({ lastDownloaded: null, lastSubmitted: daysAgo(6) }, now), false);
});

test('needsResubmission：Google 已經下載過的項目永遠不重送', () => {
  assert.equal(
    needsResubmission({ lastDownloaded: daysAgo(20), lastSubmitted: daysAgo(30) }, now),
    false,
  );
});

test('needsResubmission：沒有可解析的送出時間就不重送，避免無限 PUT', () => {
  assert.equal(needsResubmission({ lastDownloaded: null, lastSubmitted: null }, now), false);
});

test('提交腳本真的會在從未擷取時改走 PUT，而不是直接 continue', async () => {
  const script = await readFile(new URL('scripts/gsc-submit-sitemap.mjs', root), 'utf8');
  assert.match(script, /needsResubmission/);
  assert.match(script, /!forceSubmit && !resubmitting/);
  assert.match(script, /resubmitted_never_fetched/);
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
