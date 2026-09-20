# Final Live Crawl Fix 006 evidence

This directory is the local source evidence package for the exact candidate head. The browser gates regenerate the JSON summaries and screenshots in CI and in the production deploy workflow.

## Required screenshot evidence

- Homepage: `zh-home-390.png`, `en-home-1440.png`
- Planner: `zh-planner-390.png`, `en-planner-1024.png`, `en-planner-1440.png`
- Furniture Fit: `zh-fit-768.png`, `en-fit-1280.png`
- English measured bedroom: `en-bedroom-1024.png`
- English Guide: `en-guide-1280.png`
- Header responsive matrix: `zh-header-390.png`, `zh-header-768.png`, `zh-header-1024.png`, `zh-header-1080.png`, `zh-header-1440.png`, and the matching `en-header-*` files
- Review-03/04 measured prototypes and export evidence: `review-03/` and `review-04/`

The earlier Review-03/04 browser evidence also covers the `375/390/768/1024/1280/1440` viewport matrix, measured bedroom/studio diagrams, rail and sheet states, and actual PNG/PDF export blobs.

## Machine-readable summaries

- `live-crawl-summary.json`: required route status, canonical/hreflang/H1, overflow, first-party signals and rail/Furniture Fit interactions
- `adsense-network-summary.json`: manual slot, invalid slot, HTTP 400, zero-width and duplicate-init counts
- `localization-summary.json`: English FAQ/Related and zh/en Furniture Fit copy checks
- `responsive-header-summary.json`: compact/desktop breakpoint, overlap and 44px target checks
- `lighthouse/lighthouse-summary.json`: 9 routes × desktop/mobile threshold result
- `production-hardening/console-network-summary.json`: repeated first-party browser smoke
- `production-hardening/adsense-network-summary.json`: repeated AdSense safety result

## Source authority

- Build: `1,458` pages
- Sitemap: `1,448` URLs
- Content audit: `1,000,355` checks / `0` failures
- Authority source: `scripts/release-authority.mjs`
- Transition: previous `1,457` / `1,447`; `/en/contractor-margin-guard/` from merged PR #103; baseline correction merged in PR #104

The Product-006 English-only route is the documented hreflang exception. No URL, canonical, robots, sitemap architecture, indexability, payment, entitlement, or production analytics configuration was changed by this fix.
