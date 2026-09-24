/**
 * Current release authority for the RoomFeng static site.
 *
 * Update this manifest only when an intentional, reviewed route change has
 * provenance. Historical baselines remain in their original evidence files.
 */
export const ROOMFENG_RELEASE_AUTHORITY = Object.freeze({
  buildPages: 1464,
  sitemapUrls: 1454,
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
