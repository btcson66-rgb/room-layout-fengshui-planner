# RoomFeng US SEO Growth 002 — Implementation

Date: 2026-09-21 (Asia/Taipei)

## Change boundary

- Base: `origin/main` at `b6f60521c47e7f739c128cfb557b7dc38ab0f992`.
- Branch: `codex/roomfeng-us-seo-growth-002-20260921`.
- Production URL surface: unchanged. No new SEO URL, sitemap, canonical, redirect, robots, hreflang, noindex, layout, global CSS, planner engine, ads, affiliate, payment, or release-authority change.
- PR #101 and its branch were not modified.
- `src/pages/en/furniture-fit-calculator.astro` was intentionally left untouched as the existing US Expansion 001 owner.

## Page-by-page implementation

### `/en/moving-furniture-size-check/`

- Reframed title, description, JSON-LD headline, and H1 around measuring furniture for delivery before purchase or moving.
- Put the direct room-fit-versus-delivery-route answer first.
- Added an item-in-travel-form measurement table covering assembled, packaged, rigid, diagonal, and removable-part checks.
- Added an ordered route table from building entrance through lobby, hallways, doorways, stairs, landings, elevator, apartment door, and final room.
- Added a clearly non-definitive dining-table example and cautions about turns, fixtures, packaging, and three-dimensional maneuvering.
- Added contextual links to the existing room-fit, everyday-clearance, and couch-doorway owners plus practical retailer references.

### `/en/bed-desk-wardrobe-layout/`

- Reframed metadata and H1 around the exact small-bedroom bed + desk + wardrobe intent.
- Added measured 8 × 10, 9 × 10, and 10 × 10 ft screening studies with explicit assumptions and caveats.
- Added one original measured `MeasuredPlan` diagram using the existing component and stylesheet; diagram furniture was positioned with safe label clearance after visual QA.
- Added the mattress-versus-bed-frame caveat and links to the general small-bedroom workflow and existing planner.

### `/en/small-bedroom-layout-planner/`

- Preserved the existing measured planner and added a concise room-size decision section.
- Linked the general planner to the six existing exact-size bedroom owners from 8 × 10 through 12 × 12 ft.
- Added a focused handoff to the bed + desk + wardrobe owner without creating a size-permutation page.

### `/en/studio-apartment-layout/`

- Preserved the existing measured studio prototype and added a room-size owner map for the existing 300, 350, 400, 450, and 500 sq ft pages.
- Added the listing-area-versus-clear-open-floor caveat.
- Added geometry-only 16 × 25 ft versus 20 × 20 ft studies for the 400 sq ft intent and linked to the existing dedicated 400 sq ft owner.

### `/en/furniture-fit-checker/`

- Clarified metadata, visible copy, and FAQ ownership around destination-room footprint and requested in-room clearance.
- Explicitly separated room fit from full delivery-route checks and linked to Moving Furniture Size Check for doors, hallways, stairs, and elevators.
- Left the existing `FurnitureFitTool` interactive implementation unchanged.

## New validation support

- `scripts/test/us-seo-growth-002.test.mjs`: scoped metadata, intent ownership, internal-link, noindex, canonical/hreflang, and URL/sitemap invariants.
- `scripts/test/us-seo-growth-002.browser.mjs`: 5 target pages × 5 viewport widths, overflow/table/SVG checks, console and same-origin failure checks, and the furniture-fit interaction.
- Evidence and screenshots are under `reports/us-seo-growth/2026-09-21/`.
