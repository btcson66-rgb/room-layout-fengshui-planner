# RoomFeng US SEO Growth 002 — Baseline

Date: 2026-09-21 (Asia/Taipei)

## Authority and scope

- Base repository: `D:\room-layout-fengshui-planner`
- Isolated worktree: `D:\Fable company\worktrees\roomfeng-us-seo-growth-002-20260921`
- Base branch: `origin/main`
- Base SHA: `b6f60521c47e7f739c128cfb557b7dc38ab0f992`
- Build authority: 1,458 pages (`scripts/release-authority.mjs`)
- Sitemap authority: 1,448 URLs (`scripts/release-authority.mjs`)
- Latest GSC evidence boundary: 2026-09-18
- United States, three-month GSC evidence supplied by task brief: 22 clicks, 4,610 impressions, 0.48% CTR, average position 7.45.
- Interpretation boundary: USA totals are not English-US SEO proof; the KPI is English pages + English queries + United States intent.

## Production snapshot

All five target URLs returned HTTP 200 from `https://roomfeng.win` on 2026-09-21. The public sitemap index and child sitemap also returned HTTP 200; the child response was `application/xml`, with 1,448 total and 1,448 unique URLs. All five targets were present.

| Target | Source SHA-256 | HTTP | Sitemap | Canonical | Hreflang set |
|---|---|---:|---|---|---|
| `/en/moving-furniture-size-check/` | `204B8DD0D47705BF4CBB59AD9FC96FAFE973AA3A23DFDD765D6C31CFF4A106C2` | 200 | present | self | `zh`, `en`, `x-default` preserved |
| `/en/bed-desk-wardrobe-layout/` | `3814E3B511723E94CCD77DA750333857F5C60D0D0746A93825C5D5B67283780B` | 200 | present | self | `zh`, `en`, `x-default` preserved |
| `/en/small-bedroom-layout-planner/` | `F19C21DD9521BEAF0F40D4353783EE90D1DC6A425EF1FB176BC8B7D985529440` | 200 | present | self | `zh`, `en`, `x-default` preserved |
| `/en/studio-apartment-layout/` | `36A10DC3D08F57B8B261F33B6C16458EF73820B8371EC047D60E647058D109C1` | 200 | present | self | `zh`, `en`, `x-default` preserved |
| `/en/furniture-fit-checker/` | `A1A2D752BD91116B4D4DEB16AAF4442D503FFC0F3618D9C745C453CBF69D30C9` | 200 | present | self | `zh`, `en`, `x-default` preserved |

## Pre-change metadata

| URL | Title | Description | H1 |
|---|---|---|---|
| `/en/moving-furniture-size-check/` | Will It Fit Through the Door or Up the Stairs? \| Size Check | Check whether furniture will fit through the door and up the stairs before moving. Measure the item’s widest, deepest, and tallest rigid dimensions, plus every doorway and turn. | Moving furniture size check |
| `/en/bed-desk-wardrobe-layout/` | Bed Desk Wardrobe Layout \| Arrange Core Bedroom Furniture | Plan a bedroom around the bed, desk, and wardrobe with practical clearance tips for walking, working, storage access, and room fit. | Bed desk wardrobe layout |
| `/en/small-bedroom-layout-planner/` | Small Bedroom Layout Planner \| Bed Desk Wardrobe Ideas for Tight Rooms | Plan a small bedroom layout with practical bed, desk, wardrobe, storage, and walkway tips for renters, students, and compact apartments. | Small bedroom layout planner |
| `/en/studio-apartment-layout/` | Studio Apartment Layout Planner \| Plan Sleep Work and Dining Zones | Plan a studio apartment layout with practical zoning tips for sleeping, working, eating, storage, walkways, and furniture fit in one open room. | Studio apartment layout planner |
| `/en/furniture-fit-checker/` | Furniture Fit Checker \| Will It Fit Your Room and Door? | Will your sofa fit through the door? Check in seconds by comparing furniture dimensions with room size, clearances, door swings, and moving paths. | Furniture fit checker |

## Existing internal-link signals

Before the change, all five pages linked to the Room Layout Planner. The moving, bed/desk/wardrobe, small-bedroom, studio, and furniture-fit pages also linked through the existing related-link component to nearby English guides. The small-bedroom and studio pages already contained measured SVG prototypes. The furniture-fit page already loaded the existing interactive `FurnitureFitTool`; the untouched furniture-fit calculator remained a separate US Expansion 001 page.

## GSC page signals supplied by the task brief

| URL | Clicks | Impressions | Average position |
|---|---:|---:|---:|
| `/en/moving-furniture-size-check/` | 1 | 138 | 15.52 |
| `/en/bed-desk-wardrobe-layout/` | 0 | 54 | 5.63 |
| `/en/small-bedroom-layout-planner/` | 0 | 28 | 8.11 |
| `/en/studio-apartment-layout/` | 2 | 36 | 19.94 |
| `/en/furniture-fit-checker/` | 0 | 50 | 26.16 |

Visible English query clusters supplied by the brief include studio apartment layout planner, studio apartment planner, apartment furniture planner, small bedroom layout with desk and wardrobe, small bedroom layout planner, furniture fit, furniture fit calculator, will it fit through my door calculator, and furniture fit through door calculator. The brief also records high-intent US apartment-shopping evidence about checking a dining table against an elevator and apartment door before ordering.

## URL-surface baseline

- New SEO URLs: 0 required.
- Expected sitemap count after implementation: 1,448.
- Canonical, redirect, noindex, robots, hreflang, and sitemap architecture are out of scope and must remain unchanged.
