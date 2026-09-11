import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const analyticsSource = readFileSync(new URL('../src/lib/affiliateAnalytics.ts', import.meta.url), 'utf8');
const headSource = readFileSync(new URL('../src/components/BaseHead.astro', import.meta.url), 'utf8');
const clientSource = readFileSync(new URL('../src/scripts/affiliateRecs.ts', import.meta.url), 'utf8');

test('RoomFeng affiliate events keep Amazon tracking metadata separate from GA destination', async () => {
  assert.match(analyticsSource, /affiliate_tracking_id\?: string/);
  assert.doesNotMatch(analyticsSource, /\btracking_id\?:/);
  assert.match(analyticsSource, /send_to: AFFILIATE_GA_ID/);
  assert.match(analyticsSource, /VALID_AFFILIATE_GA_ID/);
  // The affiliate property remains an event-level `send_to` destination. It
  // must not be configured in the shared loader: doing so makes gtag.js fetch
  // a second stream script and can trigger ORB when that stream is unavailable.
  assert.doesNotMatch(headSource, /gtag\('config', '\$\{affiliateGaId\}', \{ send_page_view: false \}\)/);
  assert.match(clientSource, /affiliate_tracking_id: link\.dataset\.affiliateTrackingId/);
  assert.match(clientSource, /affiliate_tracking_id: batch\[0\]\?\.tracking_id/);
  assert.match(clientSource, /querySelectorAll<HTMLElement>\('\[data-affiliate-card\]'\)/);

  const { trackAffiliateItemView, trackAffiliateRefresh, trackAffiliateClick } = await import('../src/lib/affiliateAnalytics.ts');
  const events = [];
  globalThis.window = {
    location: { hostname: 'roomfeng.win', pathname: '/en/room-layout-planner/', search: '?ga_debug=1' },
    gtag: (...args) => events.push(args),
  };

  const base = {
    placement: 'tool_result',
    affiliate_placement: 'tool_result',
    surface_type: 'tool',
    affiliate_site: 'roomfeng',
    locale: 'en',
    page_type: 'tool',
    affiliate_network: 'amazon',
    affiliate_tracking_id: 'roomfeng-20',
    amazon_content_mode: 'text_only',
    batch_id: 'catalog-legacy',
    product_id: 'amazon-B000000001',
    product_category: 'home',
    card_position: 1,
  };

  trackAffiliateItemView(base);
  trackAffiliateRefresh({ ...base, products_shown: 3, refresh_count: 1 });
  trackAffiliateClick(base);

  assert.deepEqual(events.map(([kind, name, payload]) => [kind, name, payload.send_to, payload.affiliate_tracking_id, payload.debug_mode]), [
    ['event', 'affiliate_item_view', 'G-Q78WN8NZ0R', 'roomfeng-20', true],
    ['event', 'affiliate_refresh', 'G-Q78WN8NZ0R', 'roomfeng-20', true],
    ['event', 'affiliate_click', 'G-Q78WN8NZ0R', 'roomfeng-20', true],
  ]);
  for (const [, , payload] of events) {
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'tracking_id'), false);
    assert.notEqual(payload.send_to, 'roomfeng-20');
  }
});
