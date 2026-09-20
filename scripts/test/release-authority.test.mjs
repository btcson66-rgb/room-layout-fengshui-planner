import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOMFENG_RELEASE_AUTHORITY } from '../release-authority.mjs';

test('current release authority records the approved PRODUCT-006 transition', () => {
  assert.deepEqual(ROOMFENG_RELEASE_AUTHORITY, {
    buildPages: 1458,
    sitemapUrls: 1448,
    transition: {
      previousBuildPages: 1457,
      previousSitemapUrls: 1447,
      addedRoute: '/en/contractor-margin-guard/',
      sourcePullRequest: 103,
      baselineCorrectionPullRequest: 104,
    },
  });
});
