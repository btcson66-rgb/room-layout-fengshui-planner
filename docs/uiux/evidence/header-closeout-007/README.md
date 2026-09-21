# RoomFeng UIUX REDESIGN 002 — Final Header Closeout 007 Evidence

## Scope

This evidence package covers only the measured English desktop header regression. The final fix changes the compact/desktop transition to `1200px` and explicitly keeps the desktop navigation on one row. No URL, canonical, hreflang, robots, sitemap architecture, indexability, payment, entitlement, AdSense, Planner, Furniture Fit, content or production analytics contract was changed.

## Source-local authority

- Base production / `origin/main`: `f679082f4219e03d91825073ec45837792a006cd`.
- Candidate branch: `codex/roomfeng-final-header-closeout-007`.
- Build: `1458` HTML pages.
- Sitemap: `1448` URLs.
- Content audit: `1,000,355` checks, `0` failures.
- Authority manifest: `scripts/release-authority.mjs`.
- Generated readback: `local-build-authority.json`.

## Header matrix

`local-browser/responsive-header-summary.json` contains zh/en runs at `390`, `768`, `1024`, `1080`, `1120`, `1180`, `1200`, `1280`, and `1440`.

- `390 / 768 / 1024 / 1080 / 1120 / 1180`: compact menu, desktop nav hidden.
- `1200 / 1280 / 1440`: desktop nav visible.
- CI English `1200px` safety margin: `43.86px`; CI `1180px` was `31.86px` and therefore correctly remained compact.
- Desktop nav item row delta: `0px` in every desktop run.
- Language/CTA control row delta: `0px` in every desktop run.
- Header height: `77px` in every run; gate `<=82px`.
- Horizontal overflow: `0px` in every run.

## Required screenshots

The `local-browser/` directory contains the complete zh/en matrix, including:

- `en-header-1024.png`, `en-header-1080.png`, `en-header-1200.png`, `en-header-1280.png`, `en-header-1440.png`.
- `zh-header-1024.png`, `zh-header-1080.png`, `zh-header-1200.png`, `zh-header-1280.png`, `zh-header-1440.png`.
- Additional `390`, `768`, `1120`, and `1180` screenshots for both locales.

## Regression and release evidence

- `local-browser/live-crawl-summary.json`: 15 route runs, 18 header runs, first-party browser errors `0`, AdSense 400 `0`, invalid slots `0`, duplicate initialization `0`, PASS.
- `local-browser/responsive-header-summary.json`: row, breakpoint, height, overflow and safety-margin assertions, PASS.
- `local-review-04-browser/`: existing zh/en functional regression rerun, including measured plans, exact handoff, rail routing, mobile sheets and real PNG/PDF output, PASS.
- `local-lighthouse/lighthouse-summary.json`: 18/18 desktop/mobile entries PASS under the configured thresholds; Lighthouse emits its existing cleanup warning after valid report generation.
- `bundle-comparison.json`: current vs Review-04 baseline bundle comparison; largest JS chunk unchanged.

## Limitations

Local evidence is not production verification. The final production browser, production Lighthouse, commit equality, sitemap readback and GSC readback are recorded by the protected release workflow after merge/deploy. Existing Vite `>500 kB` warning remains observable; the header patch does not increase the largest chunk.
