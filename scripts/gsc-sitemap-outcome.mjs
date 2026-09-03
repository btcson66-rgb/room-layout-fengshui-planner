// GSC sitemap 提交結果的判定規則，抽成純函式是為了讓它可以被測試。
//
// 抽出來的理由：這段邏輯在 2026-08-31 發生過回歸。2026-08-05 的修法明訂
// 「任一筆 pending 且從未被下載超過 14 天就 exit 1」，`faa573d` 當時靠
// 「alerts 非空就 exit 1」達成；`cd0a426`（PR #49）把退出碼改寫成分支結構時，
// stuck 那條漏掉了 process.exitCode，於是每次部署都印出 STUCK 警告卻仍回報
// 成功——正是 CLAUDE.md 風險紅線第 6 條禁止的靜默跳過。
//
// 規則本身只有一句：**只要有卡住的 sitemap，這個步驟就必須是紅的。**
// 這一步排在 Cloudflare 部署之後，失敗只會讓 workflow 變紅，不會擋住網站上線。

export function resolveSitemapOutcome({
  failureCount = 0,
  submittedCount = 0,
  registeredCount = 0,
  stuckCount = 0,
  alerts = [],
} = {}) {
  if (failureCount > 0) {
    return {
      status: 'failed',
      message: alerts.join(' '),
      exitCode: 1,
    };
  }

  if (submittedCount > 0) {
    return {
      status: 'submitted-and-verified',
      message: `Submitted ${submittedCount} unregistered sitemap entries and read back ${registeredCount} existing entries.`,
      // 有新提交但同時有卡住的項目，仍然要紅。
      exitCode: stuckCount > 0 ? 1 : 0,
    };
  }

  if (stuckCount > 0) {
    return {
      status: 'registered-pending',
      message: `Read back ${registeredCount} registered sitemap entries. Google download remains pending; no repeat PUT was sent. Failing the step so this does not stay invisible.`,
      exitCode: 1,
    };
  }

  return {
    status: 'already-registered',
    message: `Read back ${registeredCount} registered sitemap entries; no repeat PUT was needed.`,
    exitCode: 0,
  };
}
