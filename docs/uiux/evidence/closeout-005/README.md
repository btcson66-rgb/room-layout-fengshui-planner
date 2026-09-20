# RoomFeng Final Performance Closeout 005 Evidence

This evidence package covers the performance-only hardening change. It does not replace the Review-04 visual package and does not claim public deployment.

## Authoritative candidate evidence

- `build-authority.json`: exact candidate build and sitemap counts from the shared release authority manifest.
- `bundle-comparison.json`: current first-party bundle size versus the Review-04 baseline.
- `adsense-browser.json`: zh/en Planner sequencing evidence. It records first-party JavaScript bytes and long-task observations before activation, then AdSense loader requests and initialization stats after activation.
- `seo-production-baseline/seo-parity.json`: same parity script against the current production origin before this candidate release; it confirms the `1,448` authority and preserved canonical/hreflang/indexability contract.

## Visual and responsive evidence

The performance change does not alter the approved visual system. The required screenshot set remains tracked in:

- `docs/uiux/evidence/review-04/` — Homepage, Planner, Furniture Fit, measured bedroom/studio, Guide, rail states, mobile sheets and export outputs for the required viewport matrix.
- `docs/uiux/evidence/hardening-003/final-local-browser/` — current approved local visual/export set, including real PNG/PDF output.

Required viewport coverage is `375`, `390`, `768`, `1024`, `1280`, and `1440`. The closeout local browser run also wrote raw screenshots to `release-evidence/closeout-005-local-uiux-final/` in the working tree.

## Local Lighthouse

The final local run was `18/18` across 9 routes × desktop/mobile. Both Planner locales were evaluated with the same hard LCP/TBT thresholds as every other route; there is no Planner exemption.
