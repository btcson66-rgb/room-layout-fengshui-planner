import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOMFENG_RELEASE_AUTHORITY } from '../release-authority.mjs';

test('current release authority records the six English trust routes and preserves prior transition', () => {
  assert.deepEqual(ROOMFENG_RELEASE_AUTHORITY, {
    buildPages: 1464,
    sitemapUrls: 1454,
    productionRepair001: {
      previousBuildPages: 1458,
      previousSitemapUrls: 1448,
      addedRoutes: ['/en/about/', '/en/privacy/', '/en/terms/', '/en/contact/', '/en/disclaimer/', '/en/changelog/'],
    },
    transition: {
      previousBuildPages: 1457,
      previousSitemapUrls: 1447,
      addedRoute: '/en/contractor-margin-guard/',
      sourcePullRequest: 103,
      baselineCorrectionPullRequest: 104,
    },
  });
});
