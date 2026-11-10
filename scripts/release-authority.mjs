/**
 * Current release authority for the RoomFeng static site.
 *
 * Update this manifest only when an intentional, reviewed route change has
 * provenance. Historical baselines remain in their original evidence files.
 */
export const ROOMFENG_RELEASE_AUTHORITY = Object.freeze({
  buildPages: 525,
  sitemapUrls: 515,
  // 2026-11-10 分類拆分：feng-shui 的 166 篇依主題移到 living-room（51）與新增的
  // kitchen／bathroom／entryway 三個 Hub（50／35／30）。新增 3 個 Hub 網址；feng-shui
  // 文章由 291 降到 125 篇，分頁由 6 頁變 3 頁（少 /4/ /5/ /6/）；living-room 由 1 篇變
  // 52 篇，多出 /2/。淨變化：+3 −3 +1 = +1。
  categoryHubs001: Object.freeze({
    previousBuildPages: 524,
    previousSitemapUrls: 514,
    addedRoutes: Object.freeze([
      '/zh/category/bathroom/',
      '/zh/category/entryway/',
      '/zh/category/kitchen/',
      '/zh/category/living-room/2/',
    ]),
    removedPaginationRoutes: Object.freeze([
      '/zh/category/feng-shui/4/',
      '/zh/category/feng-shui/5/',
      '/zh/category/feng-shui/6/',
    ]),
  }),
  // 2026-10-19 需求閘門合併：下面暫停索引的 904 篇刪檔、改 301 到語意最近的保留文章
  // （src/data/demandConsolidation.mjs），sitemap 不變。
  demandConsolidation001: Object.freeze({
    previousBuildPages: 1428,
    redirectedBlogArticles: 904,
  }),
  // 2026-10-10 搜尋需求閘門：904 篇 GSC 3 個月需求不足的文章改 noindex 並移出 sitemap，
  // 文章索引／分類分頁因此少 36 頁。清單見 src/data/searchDemandPolicy.mjs。
  searchDemandPrune001: Object.freeze({
    previousBuildPages: 1464,
    previousSitemapUrls: 1454,
    heldBlogArticles: 904,
    removedPaginationRoutes: 36,
  }),
  productionRepair001: Object.freeze({
    previousBuildPages: 1458,
    previousSitemapUrls: 1448,
    addedRoutes: Object.freeze([
      '/en/about/',
      '/en/privacy/',
      '/en/terms/',
      '/en/contact/',
      '/en/disclaimer/',
      '/en/changelog/',
    ]),
  }),
  transition: Object.freeze({
    previousBuildPages: 1457,
    previousSitemapUrls: 1447,
    addedRoute: '/en/contractor-margin-guard/',
    sourcePullRequest: 103,
    baselineCorrectionPullRequest: 104,
  }),
});
