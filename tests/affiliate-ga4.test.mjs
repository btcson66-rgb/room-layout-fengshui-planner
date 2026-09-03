import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const {
  trackAffiliateClick,
  trackAffiliateItemView,
  trackAffiliateModuleView,
  trackAffiliateRefresh,
} = await import('../src/lib/affiliateAnalytics.ts');

const affiliateComponent = readFileSync(new URL('../src/components/AffiliateRecs.astro', import.meta.url), 'utf8');
const affiliateClient = readFileSync(new URL('../src/scripts/affiliateRecs.ts', import.meta.url), 'utf8');
const catalogue = JSON.parse(readFileSync(new URL('../src/data/support-products.json', import.meta.url), 'utf8'));

test('RoomFeng uses the four-site context and standard affiliate payload', () => {
  const realProduct = catalogue.find((product) => product.id === 'shopee-18252003703');
  assert.equal(realProduct.category, 'home');
  assert.equal(realProduct.platform, 'shopee');
  assert.match(affiliateComponent, /data-affiliate-product-id/);
  assert.match(affiliateComponent, /data-affiliate-network/);
  assert.match(affiliateComponent, /data-affiliate-module-sentinel/);
  assert.doesNotMatch(affiliateComponent, /affiliate_product_click/);
  assert.match(affiliateClient, /threshold: \[0\.5\]/);
  assert.match(affiliateClient, /data-affiliate-module-sentinel/);
  assert.match(affiliateClient, /link\.addEventListener\('click'/);
  assert.doesNotMatch(affiliateClient, /preventDefault\(/);

  const events = [];
  const previousWindow = globalThis.window;
  const previousDebug = console.debug;
  console.debug = () => {};
  globalThis.window = {
    location: { hostname: 'roomfeng.win', pathname: '/zh/blog/demo/', search: '?ga_debug=1' },
    gtag: (...args) => events.push(args),
  };

  trackAffiliateModuleView({
    placement: 'article_inline',
    surface_type: 'article',
    affiliate_network: 'shopee',
    batch_id: 'catalog-legacy',
  });
  trackAffiliateItemView({
    placement: 'article_inline',
    surface_type: 'article',
    affiliate_network: 'shopee',
    product_id: 'shopee-18252003703',
    product_category: 'home',
    batch_id: 'catalog-legacy',
    card_position: 1,
  });
  trackAffiliateClick({
    placement: 'article_inline',
    surface_type: 'article',
    affiliate_network: 'shopee',
    product_id: 'shopee-18252003703',
    product_category: 'home',
    batch_id: 'catalog-legacy',
    card_position: 1,
  });
  trackAffiliateRefresh({
    placement: 'article_inline',
    surface_type: 'article',
    affiliate_network: 'shopee',
    batch_id: 'catalog-legacy',
  });

  assert.deepEqual(events, [
    ['event', 'affiliate_module_view', {
      site_name: 'roomfeng', placement: 'article_inline', surface_type: 'article',
      affiliate_network: 'shopee', batch_id: 'catalog-legacy', debug_mode: true,
      send_to: 'G-Q78WN8NZ0R', transport_type: 'beacon',
    }],
    ['event', 'affiliate_item_view', {
      site_name: 'roomfeng', placement: 'article_inline', surface_type: 'article',
      affiliate_network: 'shopee', batch_id: 'catalog-legacy', product_id: 'shopee-18252003703',
      product_category: 'home', card_position: 1, debug_mode: true,
      send_to: 'G-Q78WN8NZ0R', transport_type: 'beacon',
    }],
    ['event', 'affiliate_click', {
      site_name: 'roomfeng', placement: 'article_inline', surface_type: 'article',
      affiliate_network: 'shopee', batch_id: 'catalog-legacy', product_id: 'shopee-18252003703',
      product_category: 'home', card_position: 1, debug_mode: true,
      send_to: 'G-Q78WN8NZ0R', transport_type: 'beacon',
    }],
    ['event', 'affiliate_refresh', {
      site_name: 'roomfeng', placement: 'article_inline', surface_type: 'article',
      affiliate_network: 'shopee', batch_id: 'catalog-legacy', debug_mode: true,
      send_to: 'G-Q78WN8NZ0R', transport_type: 'beacon',
    }],
  ]);

  trackAffiliateClick({
    placement: 'article_inline', surface_type: 'article', affiliate_network: 'shopee',
    product_id: 'shopee-18252003703', product_category: 'home',
    batch_id: 'catalog-legacy', card_position: 1,
  });
  assert.equal(events.length, 4, 'duplicate click in the same short window is suppressed');

  globalThis.window = { location: { hostname: 'roomfeng.win', pathname: '/no-gtag/', search: '' } };
  assert.doesNotThrow(() => trackAffiliateClick({
    placement: 'article_inline', surface_type: 'article', affiliate_network: 'shopee',
    product_id: 'shopee-18252003703', product_category: 'home',
    batch_id: 'catalog-legacy', card_position: 1,
  }));
  globalThis.window = previousWindow;
  console.debug = previousDebug;
});
