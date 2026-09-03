# RoomFeng Affiliate GA4 追蹤

## RoomFeng audit result

- Existing GA4 remains `PUBLIC_GA_ID` in `src/components/BaseHead.astro`; the existing destination is not replaced.
- No Google Tag Manager container or separate consent/dataLayer integration was found. The site keeps the existing single `gtag.js` loader.
- The public catalogue is `src/data/support-products.json` (195 raw records, 194 active records) and is consumed through `src/data/affiliateProducts.ts`. It is a mirrored static catalogue, not a database.
- Real surfaces are `/support/` (full catalogue, three visible cards with unlimited rotation), review-ready `/zh/blog/[slug]/` article cards, and the existing standalone Chinese tool/product cards. Held or noindex content does not render affiliate output.
- Existing direct `affiliate_product_click` tracking was removed from the RoomFeng affiliate UI and replaced by the shared contract. Legacy catalogue fields and page aliases remain supported by the adapter.

## Destination and loader

- Property/stream: Btcson Affiliate Network
- Stream ID: `15689413334`
- Affiliate Measurement ID: `G-Q78WN8NZ0R`
- Build variable: `PUBLIC_AFFILIATE_GA_ID`; the production workflow supplies the contract ID.
- The affiliate destination is sent with event-level `send_to`; it is not configured as a page-view destination. Existing `PUBLIC_GA_ID`, when present, keeps its normal config and page view. Affiliate events use beacon transport, and the shared head emits one loader without waiting for analytics before navigation.

## Shared event contract

| Event | Required parameters | RoomFeng trigger |
| --- | --- | --- |
| `affiliate_module_view` | `site_name`, `placement`, `surface_type`, `affiliate_network`, `batch_id` | Module reaches 50% visibility |
| `affiliate_item_view` | Module fields plus `product_id`, `product_category`, `card_position` | Product link reaches 50% visibility; no page-load bulk exposure |
| `affiliate_click` | Item fields | Native affiliate anchor click |
| `affiliate_refresh` | Module fields | Existing `換一批商品` button only |
| `affiliate_close` | Module fields plus `close_method` | Not emitted: RoomFeng has no real closeable affiliate UI |

RoomFeng mappings are `/support/` → `support_page`/`support`, `/zh/blog/` → `article_inline`/`article`, and existing standalone recommendation cards → `product_card`/`tool`. A module containing more than one network uses `affiliate_network: mixed`; item and click events retain the exact card network (`shopee` or `coupang`).

The normalized adapter exposes `product_id`, `name`, `category`, `image`, `price`, `affiliate_url`, `affiliate_network`, `batch_id`, and `active`, while retaining the current UI fields. Current source records do not contain a batch field, so the honest compatibility value is `catalog-legacy`; no price is fabricated (`price: null`).

## Safeguards and debug

- `?ga_debug=1` adds `debug_mode: true` and prints `[Affiliate GA4]`; normal visits are quiet.
- Module and item views are permanently deduplicated per page/context; rapid repeated click, refresh, or close events are briefly suppressed.
- gtag errors, blocked scripts, missing gtag, failed requests, and ad blockers are non-fatal. Links remain native anchors, including new-tab, middle-click, modifier-click, and mobile behavior.
- No PII, room draft data, URL dimensions, client/session IDs, revenue, commission, purchase, or new GA4 backend object is sent.
- No custom dimensions or Key Events are configured in this task. After production readback, an operator may manually mark `affiliate_click` as a Key Event if desired.

## Four-site destination mapping

| Site | `site_name` | Existing analytics preserved | Current affiliate surface |
| --- | --- | --- | --- |
| funnytools.win | `funnytools` | `G-SV027MPXK4`, `G-SJ90CBM9ZV` | tool result, article, support shelf |
| roomfeng.win | `roomfeng` | `PUBLIC_GA_ID` | support catalogue, article, product cards |
| worthcalc.win | `worthcalc` | `PUBLIC_GA_ID` | prepared calculator/article contract; empty pool stays empty |
| familyboard.win | `familyboard` | `PUBLIC_GA4_MEASUREMENT_ID` | public article/category Amazon recommendations; private app excluded |

All four sites send the same five event names to `G-Q78WN8NZ0R` with the same parameter names. The static RoomFeng mirror is the current adapter boundary; a future canonical export may add stable batches and validation, but this Astro-only site does not add a database or backend.

## Validation

Run `npm run check`, `npm run build`, `npm run audit:content`, `npm run test:www-redirect`, and `node --experimental-strip-types --test tests/affiliate-ga4.test.mjs`.

## Production readback (2026-09-03)

- Merged PR #78 deployed the initial integration at merge commit `2071a87`; PR #79 fixed long-catalog module observation and beacon delivery at merge commit `a57462c`.
- Deployment runs: [33754733590](https://github.com/btcson66-rgb/room-layout-fengshui-planner/actions/runs/33754733590) and [33756171738](https://github.com/btcson66-rgb/room-layout-fengshui-planner/actions/runs/33756171738); both completed successfully, including Cloudflare Pages and the existing sitemap step.
- Smoke URLs: `https://roomfeng.win/support/?ga_debug=1` and `https://roomfeng.win/zh/blog/balcony-clothes-rack-feng-shui/?ga_debug=1`.
- Support page returned HTTP 200 with 194 links; initial item views were 0, and after scrolling to the first visible cards only the visible first batch was observed. Returning to the first card did not duplicate its item view. The module view payload used `site_name=roomfeng`, `placement=support_page`, `surface_type=support`, `affiliate_network=mixed`, `batch_id=catalog-legacy`.
- Article browser readback reached `G-Q78WN8NZ0R` with `affiliate_item_view` for `shopee-6376946507`, category `home`, position `1`; a real browser mouse click invoked `affiliate_click` with the same item fields. The link opened a native new tab; no close event is emitted because no close UI exists.
- Public page views remained on the existing `G-9SCRT8E036`; no affiliate page view was observed after removing the affiliate config command. These browser requests do not confirm GA4 DebugView ingestion.
