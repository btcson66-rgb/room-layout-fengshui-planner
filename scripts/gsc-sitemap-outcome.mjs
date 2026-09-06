// GSC sitemap 提交結果的判定規則，抽成純函式是為了讓它可以被測試。
//
// ## 這個步驟負責什麼、不負責什麼
//
// 它只回答一個問題：**這次部署有沒有把 sitemap 成功送進 Search Console。**
// 送不進去（API 掛掉、授權失效、PUT 被拒）＝ 管線壞了 ＝ 紅燈，每次都要紅。
//
// 它**不**負責回答「Google 到底有沒有來抓」。那是一個持續數週甚至數月的外部狀態，
// 不是這次 push 造成的，也不是任何一次 push 能修好的。那條線由 fable-company 的
// 每日健檢擁有：`scripts/lib/gsc-sitemap-discovery.mjs` 每天查三站的 sitemaps.list，
// 全部 lastDownloaded=null 時單站報 warning、三站全中報 critical，並附上
// URL Inspection 的 Googlebot 爬取狀態。它會進每日短報告與 Discord 通知。
//
// ## 為什麼把 stuck 從這裡的退出碼移走（2026-09-06）
//
// 2026-09-04 起 roomfeng 每一次部署都紅，紅的都是同一件事：sitemap 自 08-18 起
// 從未被 Google 下載。連續紅了兩週之後，老闆回報「這個通知我已經收很久了」。
//
// 永久紅燈不是「有在監控」，它是**把監控關掉的最有效方法**——因為所有人都學會忽略它。
// 這次工作期間我自己就被它誤導兩次，得逐一展開 job 步驟才能判斷部署到底成功沒有；
// 下一次真正的部署失敗會長得一模一樣。
//
// 所以這不是靜默跳過（紅線 6 禁止的那件事），是**換頻道**：
//   - 訊號沒有消失：STUCK 警告照樣印在部署 log，狀態仍是 registered-pending，
//     `stuck: true` 也保留在回傳值裡讓呼叫端可以判斷。
//   - 告警沒有消失：每日健檢天天查、天天報，而且比這裡多看一個維度
//     （Googlebot 是否仍正常爬取），那才是判斷嚴重度需要的資訊。
//   - 改變的只有頻率：從「每推一次一次」變成「每天一次」，而且會自己恢復。
//
// 反過來說，**下面 failureCount 那一條永遠不准放寬**。提交失敗代表管線真的壞了，
// 那才是紅線 6 講的「不得靜默跳過」。2026-08-31 就發生過一次真正的靜默跳過：
// `cd0a426`（PR #49）重構退出碼時漏掉 process.exitCode，警告照印但步驟回報成功。
// 那次的教訓是「不要讓警告沒有出口」，不是「所有警告都必須擋部署」。

export function resolveSitemapOutcome({
  failureCount = 0,
  submittedCount = 0,
  registeredCount = 0,
  stuckCount = 0,
  alerts = [],
} = {}) {
  // 提交本身失敗 = 管線壞了。這一條是紅線，永遠 exit 1。
  if (failureCount > 0) {
    return {
      status: 'failed',
      message: alerts.join(' '),
      stuck: stuckCount > 0,
      exitCode: 1,
    };
  }

  const stuckNote = stuckCount > 0
    ? ` ${stuckCount} sitemap entr${stuckCount === 1 ? 'y is' : 'ies are'} still pending with no download from Google;`
      + ' that is tracked daily by fable-company 的每日健檢（sitemap-never-downloaded），not by this deploy step.'
    : '';

  if (submittedCount > 0) {
    return {
      status: 'submitted-and-verified',
      message: `Submitted ${submittedCount} unregistered sitemap entries and read back ${registeredCount} existing entries.${stuckNote}`,
      stuck: stuckCount > 0,
      exitCode: 0,
    };
  }

  if (stuckCount > 0) {
    return {
      status: 'registered-pending',
      message: `Read back ${registeredCount} registered sitemap entries; no repeat PUT was sent.${stuckNote}`,
      stuck: true,
      exitCode: 0,
    };
  }

  return {
    status: 'already-registered',
    message: `Read back ${registeredCount} registered sitemap entries; no repeat PUT was needed.`,
    stuck: false,
    exitCode: 0,
  };
}
