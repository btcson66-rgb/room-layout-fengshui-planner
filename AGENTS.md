# AGENTS.md — room-layout-fengshui-planner

This file is the authoritative spec for this project. Follow it exactly. It is built in phases; each delegated task references the relevant section here.

## 0. Product summary

A **statically deployable** room furniture layout planning website for ordinary people:
renters, people moving house, and anyone checking furniture sizes before buying — NOT
interior designers or engineers. The Chinese site adds **风水格局参考 (feng shui layout
reference)** as an SEO differentiator.

**CRITICAL CONTENT RULE for all feng shui content:** Write everything as folk-culture and
spatial-comfort reference only. Use language like「参考」「常见说法」「可考虑」「民俗上」.
NEVER guarantee wealth, health, relationships, luck, or any outcome. NEVER write fortune-telling
or deterministic claims. Every feng shui section must carry a disclaimer linking to /disclaimer/.

## 1. Hard technical constraints

1. MUST be statically deployable to Cloudflare Pages / Vercel / GitHub Pages (`astro build` → static `dist/`).
2. NO database.
3. NO AI API.
4. NO backend server.
5. ALL computation, drawing, storage happen in the browser.
6. Drafts saved in `localStorage`.
7. May follow product direction of `fedepaj/arcada-planner` (MIT). Do NOT copy non-MIT assets/icons/fonts. If MIT code is reused, keep LICENSE attribution. Replace any unclear assets/icons/fonts with self-made SVG or commercially usable assets. (In practice we build our own SVG icons — see §6.)
8. Maintain `license-audit.md` listing every third-party package and its license.

## 2. Tech stack (decided — do not change)

- **Astro** (latest stable) with static output. TypeScript `strict`.
- **@astrojs/sitemap** for sitemap.xml.
- **jspdf** (MIT) for PDF export.
- PNG export: serialize the planner SVG to a `<canvas>` via `XMLSerializer` + `Image` + `canvas.toBlob` — no extra dependency.
- No CSS framework: hand-written CSS with design tokens in `src/styles/global.css`. Mobile-first, responsive.
- Planner tool: a single TypeScript module rendered into an Astro page via a `<script>` island (client-side only). Uses inline SVG + pointer events. No UI framework.

## 3. Site config

- `site` in `astro.config.mjs` = `https://room-layout-fengshui-planner.pages.dev` (placeholder; document in README that it must be changed for production).
- Default language: Chinese at `/zh/`. English at `/en/`. Root `/` redirects to `/zh/`.
- Env var `PUBLIC_GA_ID`. If set at build time, inject GA4 `gtag` site-wide in `<head>`. If empty, inject nothing. Read via `import.meta.env.PUBLIC_GA_ID`. Provide `.env.example` with `PUBLIC_GA_ID=`.

## 4. Shared components (src/components)

- `BaseHead.astro` — props: `title`, `description`, `canonical` (path), `lang`, optional `ogImage`, optional `jsonLd` (object or array). Renders: `<title>`, meta description, canonical `<link>`, Open Graph tags (og:title, og:description, og:type, og:url, og:locale, og:image), Twitter card, hreflang alternates where a translated page exists, and `<script type="application/ld+json">`. Also injects GA4 if `PUBLIC_GA_ID`.
- `Header.astro` — site nav: logo (self-made SVG), links to planner tool, key landing pages, language switcher (zh/en).
- `Footer.astro` — links to /about/ /privacy/ /terms/ /contact/ /disclaimer/ /changelog/, copyright, short folk-culture disclaimer line on zh.
- `AdSlot.astro` — props: `id`, `slot` label. Renders a clearly-marked placeholder box (e.g. dashed border, "广告位 / Ad placeholder") that NEVER overlaps or breaks tool interaction. Reserve fixed height to avoid layout shift. Comment where the real AdSense `<ins>` would go.
- `Faq.astro` — props: array of {q, a}. Renders accessible FAQ markup AND emits FAQPage JSON-LD.
- `RelatedLinks.astro` — props: array of {href, title}. Renders a "相关页面 / Related" block.
- `Layout.astro` — base layout wrapping BaseHead + Header + slot + Footer.

## 5. SEO requirements (every page)

Every page must have: unique `<title>`, unique meta description, one `<h1>`, real body copy (NOT thin content — aim 400+ words on landing/content pages), an FAQ block, a tool entry CTA, related-page links, canonical, Open Graph, and JSON-LD (WebPage/WebApplication/Article/FAQPage as appropriate, plus BreadcrumbList). No broken internal links. Mobile layout must work. Pass Lighthouse SEO basics.

## 6. Self-made SVG furniture icons

All furniture/door/window/mirror representations are simple self-drawn SVG shapes (rectangles with labels, door arc, window double-line, mirror with hatch). No third-party icon sets. Document this in license-audit.md.

## 7. Planner tool MVP (the core feature)

Location: rendered on `/zh/room-layout-planner/` and `/en/room-layout-planner/` (shared TS module, i18n strings passed in). Features:

1. Inputs: room length, width, unit (cm / m / ft — store internally in cm).
2. Generate a to-scale floor plan (SVG, auto-fit viewBox, draw a grid).
3. Draggable furniture: bed, desk, wardrobe, sofa, dining table, door, window, mirror.
4. Each item: rotate (90° steps + free), resize (drag handles or numeric inputs), delete.
5. Show room area (in current unit, e.g. m²).
6. Check: furniture out of room bounds → warn.
7. Check: door opening blocked by furniture → warn.
8. Check: main walkway too narrow (< ~60cm threshold, configurable) → warn.
9. Export PNG.
10. Export PDF (jspdf).
11. Save to localStorage (draft, auto + manual).
12. Clear design (with confirm).
13. Example templates: 小套房 studio, 学生房 student room, 双人房 double room, 客厅 living room.
14. Chinese feng shui reference checks (folk-culture worded, all "参考/常见说法/可考虑"):
    - bed directly facing the door
    - mirror directly facing the bed
    - desk with no wall/support behind it
    - doorway circulation path blocked
    - headboard not against a wall
    Each result links to /disclaimer/ and is framed as 民俗参考 + 空间舒适度, never a guarantee.

Warnings panel: a side/below panel listing structural checks (bounds/door/aisle) and a separate "风水参考" section (zh only). Each warning has severity (info/warn) and plain-language explanation.

State model: a typed `Design` object { room:{w,h,unit}, items: FurnitureItem[] }. FurnitureItem { id, type, x, y, w, h, rotation, label }. Serialize to JSON for localStorage and templates.

## 8. Pages to build

### Trust/AdSense pages (build full, non-thin content):
/about/ /privacy/ /terms/ /contact/ /disclaimer/ /changelog/
- /privacy/: state that room layout data is stored by default in the user's browser localStorage and NOT uploaded to a server. Cover GA4/cookies if PUBLIC_GA_ID used, AdSense cookies note.
- /disclaimer/: state feng shui content is folk-culture and spatial-arrangement reference only; no guarantee of any outcome.

### Chinese pages (/zh):
/zh/ (home)
/zh/room-layout-planner/ (the tool)
/zh/furniture-fit-checker/
/zh/small-bedroom-layout/
/zh/studio-apartment-layout/
/zh/bed-desk-wardrobe-layout/
/zh/rental-room-layout/
/zh/moving-furniture-size-check/
/zh/bed-facing-door-feng-shui/
/zh/desk-placement-feng-shui/
/zh/mirror-facing-bed-feng-shui/
/zh/bedroom-feng-shui-layout/
/zh/living-room-furniture-layout/

### English pages (/en):
/en/ (home)
/en/room-layout-planner/ (the tool)
/en/furniture-fit-checker/
/en/small-bedroom-layout-planner/
/en/studio-apartment-layout/
/en/bed-desk-wardrobe-layout/
/en/apartment-furniture-planner/
/en/moving-furniture-size-check/

Each content (non-tool) landing page: intro, how-to use the planner for that scenario, practical sizing tips, the relevant feng shui reference notes (zh feng shui pages only, folk-worded), FAQ, CTA to the planner, related links.

## 9. Infra files

- `robots.txt` in `public/` allowing all, with `Sitemap: https://<site>/sitemap-index.xml`.
- Sitemap via @astrojs/sitemap (covers all pages).
- `README.md`: setup, dev, build, deploy (CF Pages/Vercel/GH Pages), env vars, and a **GSC submission flow**: 1) deploy then add domain property 2) verify DNS 3) submit sitemap.xml 4) check indexing 5) connect GA4.
- `license-audit.md`: every dependency + license + note on self-made assets and arcada-planner MIT attribution stance.
- `LICENSE` for this project (MIT).

## 10. Quality gates (must pass)

1. `npm run build` succeeds.
2. No TypeScript errors (`astro check` clean).
3. No broken internal links.
4. Mobile layout usable.
5. Lighthouse SEO basics pass.
6. AdSense slots are placeholders only, never breaking tool UX.
7. No paid API or backend.

## 11. i18n

Keep a `src/i18n/` with `zh.ts` and `en.ts` string tables for shared UI (nav, tool labels, common CTAs). Page bodies can be authored directly in each page file.
