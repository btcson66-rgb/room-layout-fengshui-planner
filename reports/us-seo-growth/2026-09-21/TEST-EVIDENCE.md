# RoomFeng US SEO Growth 002 — Test Evidence

Date: 2026-09-21 (Asia/Taipei)

## Result summary

All required local checks and scoped browser checks passed against the isolated candidate worktree. Production was read-only during this task; no deployment, merge, indexing request, or sitemap submission was performed.

| Check | Result | Evidence |
|---|---|---|
| `npm.cmd run check` | PASS | 243 files; 0 errors, warnings, or hints |
| `npm.cmd run build` | PASS | 1,458 pages; sitemap 1,448; postbuild sitemap and redirects completed |
| `node --test scripts/test/us-seo-growth-002.test.mjs` | PASS | `sitemapBefore:1448,sitemapAfter:1448,addedUrls:0,removedUrls:0,canonicalDelta:0,redirectDelta:0,noindexDelta:0,targets:5` |
| `npm.cmd run audit:us-seo` | PASS | 20 intents, 17 US SEO URLs plus 1 commercial route, 1,448 sitemap URLs |
| `npm.cmd run test:us-seo` | PASS | 8/8 |
| `npm.cmd run test:seo-production-parity` | PASS | Representative production readback passed; sitemap 1,448; robots 200; legacy sitemap alias 404 |
| `npm.cmd run preflight` | PASS | Full preflight passed, including 63/63 scripts, content audit with 0 failures, heading audit, sitemap and redirect checks |
| `PUBLIC_ADSENSE_CLIENT=ca-pub-9117672212804270 npm.cmd run build` | PASS | Production-like static build; 1,458 pages; sitemap 1,448; existing Vite chunk-size warning only |
| `git diff --check` | PASS | No whitespace errors |
| Browser QA | PASS | 25 page/viewport combinations; no horizontal overflow, page errors, console errors, or same-origin response failures |
| Furniture-fit interaction | PASS | Form interaction at 390 px produced result text |

## Independent review fix

- Fixed the measured-content consistency issue on `/en/bed-desk-wardrobe-layout/`.
- The `36 in` value remains as the `idealized cross-room arithmetic screen` for `120 − 60 − 24`; copy now states that it ignores placement offsets and is not the exact SVG gap.
- The actual diagram gap is calculated from the existing source constants: `232 − (12 + 152.4) = 67.6 cm`, rendered as approximately `26.6 in`.
- The scoped regression test verifies the rendered data attributes, recalculates the relationship, checks the approximately `26.6 in` result, and requires the distinction/caveat wording.
- Targeted browser QA was rerun for the bed/desk/wardrobe page at 375, 390, 768, 1024, and 1440 px; all passed with readable arithmetic and actual-gap facts, no SVG clipping, no horizontal overflow, and no console/page errors.
- Targeted machine-readable result: `reports/us-seo-growth/2026-09-21/browser/bed-desk-wardrobe-layout-fix-browser.json`.
- Targeted screenshots: `reports/us-seo-growth/2026-09-21/browser/bed-desk-wardrobe-layout-fix-375.png` and `bed-desk-wardrobe-layout-fix-1440.png`.

The production-like build was served locally and the complete 25-combination browser matrix was rerun against that output. A first immediate pass observed one non-reproducible third-party-looking page error (`Vl`) on the moving page; a direct diagnostic and the final complete rerun produced no page errors, console errors, or first-party response failures. The scoped browser result recorded above is the final rerun.

## Browser matrix

- Pages: moving furniture size check, bed/desk/wardrobe, small-bedroom planner, studio apartment layout, furniture-fit checker.
- Widths: 375, 390, 768, 1024, 1440 px.
- HTTP status: all local preview responses 200.
- Required elements: H1, header, CTA and page-specific content present.
- Tables: contained at narrow widths.
- Measured SVG: bounded within its container at tested widths.
- Screenshots: `reports/us-seo-growth/2026-09-21/browser/` at 375 and 1440 px for all five pages.
- Machine-readable result: `reports/us-seo-growth/2026-09-21/browser/browser-report.json`.

## URL and SEO invariants

- Sitemap before: 1,448 URLs.
- Candidate sitemap after: 1,448 URLs.
- Live sitemap readback: 1,448 URLs.
- Added SEO URLs: 0.
- Removed SEO URLs: 0.
- Canonical delta: 0.
- Redirect delta: 0.
- Noindex delta: 0.
- All five target pages retained self-canonical, `zh`, `en`, and `x-default` hreflang links and remained indexable.

## Warnings and unresolved risks

- The build emits the existing Vite chunk-size warning; it did not fail the build or alter the requested scope.
- `npm.cmd ci` reported deprecated transitive packages and 3 moderate audit findings in the existing dependency tree; no dependency files were changed.
- GSC, GA4, ranking, indexing, CTR, and revenue uplift are `NOT_YET_EVALUATED`. The supplied GSC snapshot is a baseline, not a post-release result.
- A diagonal or rectangle screen is intentionally not represented as a guaranteed three-dimensional route PASS. Door hardware, fixtures, packaging, stair landings, elevator approach space, and disassembly can change the outcome.
- Browser QA validates the local production build and interaction; it is not evidence of a deployment or Google indexing outcome.
