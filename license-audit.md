# License Audit

This audit covers the direct dependencies installed for this project. Licenses were checked from the installed package metadata in `node_modules`.

| Package | Version | License | Use | Notes |
| --- | ---: | --- | --- | --- |
| `astro` | 7.0.3 | MIT | Static site framework | Required by the agreed tech stack. |
| `@astrojs/sitemap` | 3.7.3 | MIT | Sitemap generation | Produces static sitemap output during build. |
| `@astrojs/check` | 0.9.9 | MIT | Astro and TypeScript diagnostics | Used by `npm run check`. |
| `jspdf` | 4.2.1 | MIT | PDF export | Used by the planner tool's "Export PDF" feature. PNG export uses the native Canvas API with no extra dependency. |
| `typescript` | 6.0.3 | Apache-2.0 | Type checking | Installed package metadata reports Apache-2.0. |
| `sharp` | 0.34.5 | Apache-2.0 | Build-time brand asset generation | Dev dependency used by `scripts/generate-brand-assets.mjs` to rasterize self-made SVG artwork into committed PNG files. |

## Self-Made Assets

All furniture, door, window, mirror, UI logo/icon, favicon, Apple touch icon, and Open Graph image representations in this project are self-made SVG or CSS shapes (see `src/planner/`, the shared components, and `scripts/generate-brand-assets.mjs`). No third-party icon set, font, or unclear visual asset is used. The site uses the system font stack only.

## Imported Editorial Content

The `roomfeng_seo_upgrade_pack` articles and structured feng shui rule data were imported as site editorial content supplied by the site owner. They are not third-party package code and are not included as a zip or temporary build artifact.

## Arcada Planner Attribution Stance

The product direction may be informed by `fedepaj/arcada-planner`, which is MIT licensed. This project did not copy code, assets, icons, fonts, or text from that project; the planner was implemented independently. If any MIT code pattern is reused in the future, the reused portions must be attributed here.

## Advertising Placeholders

`AdSlot.astro` renders clearly marked placeholder boxes when no AdSense client is configured. When `PUBLIC_ADSENSE_CLIENT` is set, `BaseHead.astro` loads the Google AdSense script and `AdSlot.astro` renders live ad units using each page's configured slot. The `ads.txt` record in `public/ads.txt` is a publisher verification file, not a code dependency.
