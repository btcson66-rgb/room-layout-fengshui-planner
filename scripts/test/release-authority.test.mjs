import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('post-deploy SEO parity cannot accept the pre-deploy sitemap count', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/deploy-cloudflare-pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /- name: Run post-deploy production SEO parity gate[\s\S]{0,180}ROOMFENG_SEO_REQUIRE_DEPLOYED: '1'/);
});
