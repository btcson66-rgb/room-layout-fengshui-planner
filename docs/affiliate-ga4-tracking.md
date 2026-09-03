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
- The affiliate config uses `send_page_view: false`. Existing `PUBLIC_GA_ID`, when present, keeps its normal config and page view. The shared head emits one loader and never waits for analytics before navigation.

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

Run `npm run check`, `npm run build`, `npm run audit:content`, `npm run test:www-redirect`, and `node --experimental-strip-types --test tests/affiliate-ga4.test.mjs`. Production DebugView, CI, deployment, and public click readback are intentionally outside this task.
