## Scope

Strengthen the five existing RoomFeng US-English winner/pillar pages for clearer intent ownership and better first-answer usefulness. This is an existing-page SEO quality pass; it does not expand the URL surface.

## What changed

- Clarified delivery-route measurement versus destination-room fit on Moving Furniture Size Check.
- Added measured 8 × 10, 9 × 10, and 10 × 10 bedroom studies to Bed Desk Wardrobe Layout using the existing measured-plan component.
- Connected the general small-bedroom planner to the six existing exact-size owners.
- Connected the studio pillar to existing 300/350/400/450/500 sq ft owners and added a geometry-only 400 sq ft comparison.
- Clarified Furniture Fit Checker ownership and routed full delivery-route questions to the dedicated guide.
- Added scoped tests, browser QA, and dated evidence under `reports/us-seo-growth/2026-09-21/`.

## SEO surface invariants

NEW SEO URLS: 0

SITEMAP DELTA: 0

CANONICAL DELTA: 0

REDIRECT DELTA: 0

PRODUCTION CHANGED: NO

MERGE AUTHORIZED: NO

## Validation

- `npm.cmd run preflight` PASS
- `npm.cmd run audit:us-seo` PASS
- `npm.cmd run test:us-seo` PASS (8/8)
- `npm.cmd run test:seo-production-parity` PASS
- `PUBLIC_ADSENSE_CLIENT=ca-pub-9117672212804270 npm.cmd run build` PASS (1,458 pages; 1,448 sitemap URLs)
- `node --test scripts/test/us-seo-growth-002.test.mjs` PASS
- Browser QA PASS: 25 page/viewport combinations across 375/390/768/1024/1440 px; furniture-fit interaction PASS.
- `git diff --check` PASS.

Full evidence: `reports/us-seo-growth/2026-09-21/TEST-EVIDENCE.md`.

## Review boundary

This PR is intentionally draft and stops before merge, deployment, indexing requests, or sitemap submission. GSC/GA4/ranking/indexing/revenue uplift remain `NOT_YET_EVALUATED` until an independently reviewed release and observation window.
