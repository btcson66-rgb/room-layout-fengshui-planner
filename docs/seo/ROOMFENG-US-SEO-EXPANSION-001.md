# ROOMFENG-US-SEO-EXPANSION-001

## Evidence status

- Date: 2026-09-16, Asia/Taipei.
- Scope: RoomFeng US-English SEO expansion for `https://roomfeng.win`.
- Implementation branch: `seo/roomfeng-us-expansion-001`.
- Isolated base: `5ac235f7d830fd5ce11a58eb3cfbd775c80dd4dc` (`feat(roomfeng): launch small space layout vault`).
- The pre-existing dirty RoomFeng worktree at `D:\room-layout-fengshui-planner` was not modified, reset, stashed, or overwritten.
- No commit, push, merge, Cloudflare deployment, GSC submission, or Request Indexing action was performed in this work order.

## Production baseline captured before changes

Read-only public checks were captured before implementation:

| Check | Observation |
| --- | --- |
| `https://roomfeng.win/robots.txt` | HTTP 200; public crawl allowed; sitemap index referenced. |
| `https://roomfeng.win/sitemap-index.xml` | HTTP 200; one child sitemap referenced. |
| Live sitemap URL count | 1,430 URLs. |
| Live sitemap English count | 19 `/en/` URLs. |
| Existing English architecture | Homepage, planner, room-size templates, studio pillar, furniture-fit guide, moving guide, Product-002 layout guides/vault/matcher, and related planner routes. |
| Existing production collision pages | `/en/layout-guides/10x10-bedroom-layout/`, `/en/layout-guides/10x12-bedroom-queen-desk/`, and `/en/layout-guides/300-sq-ft-studio-layout/` were live, 200, self-canonical, and contained dimension-validated content. |
| Analytics boundary | Existing consent-gated analytics conventions were retained. New calculator events contain calculator id/result only; room measurements are not sent. |

The baseline source gates on the production-aligned isolated checkout passed before expansion: `npm.cmd run check` (184 files, 0 errors/warnings/hints), `npm.cmd run build` (1,440 pages; 1,430 sitemap URLs), and `npm.cmd run audit:content` (1,000,265 checks, 0 failures).

## Collision and URL decision

The brief requires 20 intents, collision review, preservation of relevant pages, and no cannibalizing duplicate URLs. Therefore the three already-live production guide URLs remain the owners of their intents. The requested flat forms are not generated as duplicate pages.

| Intent | Canonical implementation | Action |
| --- | --- | --- |
| 8×10 bedroom | `/en/8x10-bedroom-layout/` | New |
| 9×10 bedroom | `/en/9x10-bedroom-layout/` | New |
| 10×10 bedroom | `/en/layout-guides/10x10-bedroom-layout/` | Existing production page enhanced with adjacent-size links |
| 10×12 bedroom | `/en/layout-guides/10x12-bedroom-queen-desk/` | Existing production page retained and linked from the new size cluster |
| 11×12 bedroom | `/en/11x12-bedroom-layout/` | New |
| 12×12 bedroom | `/en/12x12-bedroom-layout/` | New |
| 300 sq ft studio | `/en/layout-guides/300-sq-ft-studio-layout/` | Existing production page retained and linked from the studio cluster |
| 350 sq ft studio | `/en/350-sq-ft-studio-apartment-layout/` | New |
| 400 sq ft studio | `/en/400-sq-ft-studio-apartment-layout/` | New |
| 450 sq ft studio | `/en/450-sq-ft-studio-apartment-layout/` | New |
| 500 sq ft studio | `/en/500-sq-ft-studio-apartment-layout/` | New |
| Long narrow living room | `/en/long-narrow-living-room-layout/` | New |
| Awkward living room | `/en/awkward-living-room-layout/` | New |
| Fireplace and TV living room | `/en/living-room-layout-with-fireplace-and-tv/` | New |
| Couch fit through door | `/en/couch-fit-through-door-calculator/` | New calculator |
| Furniture fit | `/en/furniture-fit-calculator/` | New calculator; existing `/en/furniture-fit-checker/` remains the guide |
| Bed room fit | `/en/bed-room-fit-calculator/` | New calculator |
| Feng shui bed placement | `/en/feng-shui-bed-placement/` | New traditional-reference page |
| Bed facing door feng shui | `/en/bed-facing-door-feng-shui/` | New traditional-reference page |
| Mirror facing bed feng shui | `/en/mirror-facing-bed-feng-shui/` | New traditional-reference page |

The generated flat routes `/en/10x10-bedroom-layout/`, `/en/10x12-bedroom-layout/`, and `/en/300-sq-ft-studio-layout/` are intentionally absent. The build audit fails if any of those duplicate routes appear.

## Implementation rules

- Bedroom pages use the specified US mattress anchors: Twin 38×75 in, Twin XL 38×80 in, Full 54×75 in, Queen 60×80 in, King 76×80 in, and California King 72×84 in. Content distinguishes mattress footprint from actual bed frame.
- Bedroom diagrams are static HTML/SVG planning studies with declared room dimensions, different strategies, circulation trade-offs, furniture compatibility, mistakes, and measure-next steps.
- Studio pages keep `/en/studio-apartment-layout/` as the pillar. Each new size compares two different equal-area footprint examples and two zoning scenarios, and states that square footage is not automatically usable furniture area.
- Living-room pages use measurable illustrative geometry and compare circulation trade-offs. The fireplace page compares TV-over-fireplace, adjacent-wall, and opposite-wall options without electrical, structural, heat, or fire-safety guarantees.
- Calculators are deterministic and client-side. They use the existing small-space canonical millimetre/unit system, default to US feet plus inches, offer metric centimetres, test both rectangle orientations, and keep physical fit separate from requested clearance/access fit.
- The couch tool is explicitly a preliminary two-orientation opening check. It reports PASSED, TIGHT, or FAILED and does not claim a 3D moving guarantee.
- Feng shui pages use traditional-reference language, separate measurable room checks from cultural concepts, and state that the planner does not perform feng shui checks. The English homepage FAQ now uses that same meaning.
- New pages use unique title, description, H1, self-canonical, English language metadata, OG metadata, visible FAQ content, and FAQ JSON-LD. No fabricated ratings, reviews, prices, authorship, or outcomes were added.
- New calculator analytics uses the existing consent-gated convention and never sends room or furniture dimensions.

## Reproducible gates

Commands added for this scope:

```text
npm.cmd run test:us-seo
npm.cmd run audit:us-seo
```

`audit:us-seo` checks all 20 records, built HTML existence, English language, unique title/H1, description and OG metadata, self-canonical, noindex absence, placeholder absence, planner context, static diagrams/calculator controls, internal links, sitemap inclusion, expected 1,447 sitemap URL count, and absence of the three duplicate flat collision routes.

## Current isolated-build evidence

After the expansion implementation, the static build produced 1,457 pages and a 1,447-URL sitemap: the 1,430-URL baseline plus 17 genuinely new indexable URLs. The exact automated SEO audit passed:

```text
[us-seo-audit] PASS: 20 intents, 17 new URLs, 1447 sitemap URLs, noindex/canonical/title/H1/internal-link checks passed.
```

Production results remain unevaluated until an explicitly authorized deploy/readback. GSC indexing, impressions, ranking, traffic, conversions, and hosted rendering are not inferred from this local build.
