// 由 scripts/gsc-demand-policy.mjs 產生，請勿手動編輯；重跑腳本更新。
// 資料：GSC 網頁匯出 2026-07-07..2026-10-06（網路搜尋）
// 規則：clicks >= 2 || impressions >= 50 || pinned
// 結果：1315 篇 → 保留 411（clicks 87%／impressions 81%），暫停索引 904
//
// 2026-10-19 需求閘門合併：上面暫停索引的 904 篇已刪除並 301 到語意最近的保留文章
// （src/data/demandConsolidation.mjs，由 scripts/build-demand-consolidation.mjs 從
// 合併前 main 的本檔重建）。所以暫停清單目前是空的；之後重跑 gsc-demand-policy
// 若又判出低需求文章，會再出現在這裡（noindex、不進 sitemap／文章索引、不載廣告）。
// 每行註解為 [clicks, impressions]。

export const searchDemandPolicy = {
  "range": "2026-07-07..2026-10-06",
  "rule": "clicks >= 2 || impressions >= 50 || pinned",
  "articles": 1315,
  "kept": 411,
  "held": 904,
  "pinned": 44,
  "keptClicksShare": "87%",
  "keptImpressionsShare": "81%",
  "consolidatedOn": "2026-10-19"
};

export const demandHeldBlogSlugs = new Set([
]);
