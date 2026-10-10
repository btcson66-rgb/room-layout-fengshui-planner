/**
 * Current release authority for the RoomFeng static site.
 *
 * Update this manifest only when an intentional, reviewed route change has
 * provenance. Historical baselines remain in their original evidence files.
 */
export const ROOMFENG_RELEASE_AUTHORITY = Object.freeze({
  buildPages: 1428,
  sitemapUrls: 514,
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
