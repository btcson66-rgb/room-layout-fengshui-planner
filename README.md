# RoomFeng

A statically deployable room furniture layout planning website for renters, movers, and people checking furniture sizes before buying. The Chinese experience will include feng shui layout reference content written only as folk-culture and spatial-comfort reference, never as a guarantee of wealth, health, relationships, luck, or any outcome.

The site includes the Astro scaffold, static configuration, shared components, trust pages, the browser-only planner, SEO landing pages, blog content collection, category pages, tool pages, robots.txt, sitemap integration, and license audit.

## Tech Stack

- Astro static output
- TypeScript strict mode
- `@astrojs/sitemap`
- `jspdf` for the later PDF export feature
- Hand-written CSS in `src/styles/global.css`
- No database, backend server, AI API, or CSS framework

## Setup

```bash
npm install
```

This repository uses npm. If npm cache permissions fail on Windows, use a local cache:

```bash
npm install --cache ./.npm-cache
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

The site builds to `dist/` and is suitable for static hosting.

## Brand Assets

The favicon, Apple touch icon, and Open Graph image are generated from self-made SVG artwork with `sharp`:

```bash
npm run assets:brand
```

## Preview

```bash
npm run preview
```

## Type Check

```bash
npm run check
```

## Preflight

```bash
npm run preflight
```

This runs `astro check` and `astro build`.

## Environment Variables

Copy `.env.example` to `.env` if needed.

```bash
PUBLIC_GA_ID=
PUBLIC_ADSENSE_CLIENT=
BREVO_API_KEY=
BREVO_ROOMFENG_LIST_ID=
```

If `PUBLIC_GA_ID` is set at build time, the shared head component injects GA4 `gtag` site-wide. If it is empty, no GA4 script is injected.

If `PUBLIC_ADSENSE_CLIENT` is set at build time, the shared head component injects the Google AdSense script site-wide and `AdSlot.astro` renders live ad units with each page's configured slot. The production AdSense value for `roomfeng.win` is:

```bash
PUBLIC_ADSENSE_CLIENT=ca-pub-7052036786750044
```

The AdSense `ads.txt` verification record is published from `public/ads.txt`:

```text
google.com, pub-7052036786750044, DIRECT, f08c47fec0942fa0
```

The newsletter form posts to the Cloudflare Pages Function at `/api/newsletter`. Set `BREVO_API_KEY` and `BREVO_ROOMFENG_LIST_ID` in Cloudflare Pages project environment variables; do not expose the Brevo API key in client-side code. If either value is missing, or if the site is hosted on a purely static platform without Pages Functions, the form shows a "訂閱功能即將開放" message instead of failing noisily.

## Deployment

The production site in `astro.config.mjs` is:

```text
https://roomfeng.win
```

Change this value only if the production domain changes, because canonical URLs, Open Graph URLs, and sitemap output depend on it.

### Cloudflare Pages

1. Connect the repository.
2. Set build command to `npm run build`.
3. Set output directory to `dist`.
4. Add `PUBLIC_GA_ID` only if GA4 should be enabled.
5. Add `PUBLIC_ADSENSE_CLIENT=ca-pub-7052036786750044` when submitting the site to Google AdSense.
6. Add `BREVO_API_KEY` and `BREVO_ROOMFENG_LIST_ID` to enable the newsletter form.

### Vercel

1. Import the repository.
2. Use the Astro framework preset or set build command to `npm run build`.
3. Set output directory to `dist`.
4. Add `PUBLIC_GA_ID` only if GA4 should be enabled.
5. Add `PUBLIC_ADSENSE_CLIENT=ca-pub-7052036786750044` when submitting the site to Google AdSense.

### GitHub Pages

1. Build with `npm run build`.
2. Publish the `dist/` directory with a GitHub Actions workflow or another static deploy process.
3. Confirm the configured `site` URL matches the public domain.

## Google Search Console Submission Flow

1. Deploy, then add the domain property in Google Search Console.
2. Verify DNS for the domain property.
3. Submit `sitemap-index.xml` from the deployed domain.
4. Check indexing status and inspect important URLs.
5. Connect GA4 if analytics is needed.

## Privacy Direction

The later planner tool is intended to save drafts in the user's browser `localStorage` by default. Room layout data should not be uploaded to a server.

## Feng Shui Content Rule

All feng shui references must be written as folk-culture and spatial-comfort reference only. Use wording such as "參考", "常見說法", "可考慮", and "民俗上". Never guarantee wealth, health, relationships, luck, or any outcome. Every feng shui section must link to `/disclaimer/`.

## Content System

Blog articles live in `src/content/blog/` and use `/zh/blog/[slug]/`. Category pages are generated at `/zh/category/[category]/`. Imported content pack archives or temporary extraction folders should stay out of production builds.
