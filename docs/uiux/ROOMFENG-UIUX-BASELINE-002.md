# ROOMFENG UIUX BASELINE 002

日期：2026-09-19
範圍：PR #100 `codex/roomfeng-uiux-20260919`；只做 local branch / same-PR revision，未 merge、未 deploy、未修改 production。

## Baseline identity

- Review target：`ROOMFENG-UIUX-REDESIGN-002-REVIEW-01.md`
- PR：[#100](https://github.com/btcson66-rgb/room-layout-fengshui-planner/pull/100)
- Baseline head at observation：`0b934e60d48523b55238c63ab67eb469b262061e`
- Base branch：`main`
- Working tree：isolated worktree `D:\Fable company\worktrees\roomfeng-uiux-20260919`
- Production boundary：production URL, canonical, hreflang, robots, sitemap architecture, indexability, payment/entitlement and production analytics were kept out of scope.
- Asset boundary：no AI-generated image, AI room image, stock photo or generic SaaS illustration was added. New visual evidence uses CSS and inline measured SVG diagrams only.

## Observed review-01 FAIL state

Review-01 identified a partial visual refresh instead of a complete prototype system. The baseline evidence confirmed these gaps:

1. Homepage was not measurement-first enough; Feng Shui was too close to the primary decision path.
2. Global CSS used a gold-led palette, decorative grid background, global `h1` width restriction, and a display serif default that leaked into tools and SEO pages.
3. Planner still behaved as a three-panel editor; mobile was a stacked version of the desktop controls.
4. Furniture Fit, bedroom-size, studio-size, guide/article template and export report were not represented as a coherent prototype set.
5. There was no complete local review package, loop log or screenshot matrix.
6. Earlier validation records contained conflicting authority sets: 1,153 vs 1,457 build pages and 995,810 vs 1,000,350 content checks.

## Existing strengths retained

- Skip link and `#main-content` focus target.
- Visible focus treatment.
- Keyboard-selectable SVG furniture with `role="button"`, `tabindex="0"`, `aria-pressed`, Enter/Space activation and focus return.
- `aria-live` / `role="status"` save feedback.
- Reduced-motion rule.
- Existing local-only planner draft and export behavior.
- Existing canonical, hreflang, robots, sitemap and content-audit architecture.

## Initial quantitative reference

The previous branch preflight record at the observed PR head reported:

- Astro check：210 files, 0 errors, 0 warnings, 0 hints.
- Build：1,457 static pages.
- Content audit：1,315 source articles; 1,315 review-ready; 0 held noindex; 1,447 sitemap pages; 1,000,350 checks; 0 failures.
- Script tests：30 passed.
- `www` redirect tests：4 passed.
- Moving OS tests：26 passed.

The review-01 record also preserved an older run with 1,153 build pages and 995,810 checks. Those values are treated as historical input only; the final package will use one fresh build/audit run on one final head SHA as the sole authority.

## Prototype acceptance contract

The revised package must visibly include:

- Homepage: `Measure → Plan → Check`, with “先確認放不放得下，再搬、再買” and Furniture Fit as the secondary Hero action.
- Planner desktop: compact rail, temporary/collapsible drawer, canvas-first workspace, compact properties/checks inspector.
- Planner mobile: canvas-first layout, bottom action bar and bottom-sheet drawer.
- Furniture Fit: measured furniture options with at least one `Try this size` handoff.
- Bedroom-size landing: measured SVG prototype and Planner handoff.
- Studio-size landing: measured zoning SVG prototype and Planner handoff.
- Guide/article template: measured guide flow plus strategy comparison.
- Export report: local report preview containing dimensions, item list and check status.
- Screenshot evidence for 375, 390, 768, 1024, 1280 and 1440 widths.

This baseline is an observation record, not a deployment claim.
