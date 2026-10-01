import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROOMFENG_RELEASE_AUTHORITY } from '../release-authority.mjs';

test('current release authority preserves repair 001 and records the Wave 1 alias transition', () => {
  assert.deepEqual(ROOMFENG_RELEASE_AUTHORITY, {
    buildPages: 1463,
    sitemapUrls: 1454,
    productionRepair001: {
      previousBuildPages: 1458,
      previousSitemapUrls: 1448,
      addedRoutes: ['/en/about/', '/en/privacy/', '/en/terms/', '/en/contact/', '/en/disclaimer/', '/en/changelog/'],
    },
    transition: {
      previousBuildPages: 1464,
      previousSitemapUrls: 1454,
      removedRoute: '/zh/bed-facing-door-feng-shui/',
      reason: 'Canonical alias replaced by a server-side 301',
      sourcePullRequest: 116,
    },
  });
});

test('post-deploy SEO parity cannot accept the pre-deploy sitemap count', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/deploy-cloudflare-pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /- name: Run post-deploy production SEO parity gate[\s\S]{0,180}ROOMFENG_SEO_REQUIRE_DEPLOYED: '1'/);
});
