# ROOMFENG UIUX BASELINE 002

日期：2026-09-19
範圍：PR #100 `codex/roomfeng-uiux-20260919`；只做 local branch / same-PR revision，未 merge、未 deploy、未修改 production。此文件同時保留 Review 01/02 初始基線，並記錄 Review 03 blocker 的修正前狀態。

## Baseline identity

- Review target：`ROOMFENG-UIUX-REDESIGN-002-REVIEW-01.md` → `ROOMFENG-UIUX-REDESIGN-002-REVIEW-02.md` → `ROOMFENG-UIUX-REDESIGN-002-REVIEW-03.md`
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

## Review-02 blocker baseline

Review 02 的 blocker 在本輪實作前逐項核對如下：

1. `Try this size` 的 prototype payload 尚未保證與畫面文字完全相同；Bedroom / Studio handoff 仍有 template 尺寸不一致。
2. Bedroom measured SVG 仍以固定示意 viewBox 繪製；Furniture Fit 仍是文章下方的靜態 cards。
3. PDF/PNG export 的 report preview 已更新，但實際 export module 尚未同步輸出 RoomFeng report metadata。
4. Room / Furniture / Templates rail 共用同一組 controls；mobile report action 沒有自己的 bottom sheet content。
5. SEO landing prototype H2 出現在 page H1 前；Homepage Hero 缺少 room、furniture、door 與 clearance 的真實數字。
6. Newsletter 緊貼 Hero；英文 nav 指向不存在的 `/en/blog/`；footer 仍有 abstract slogan。

本輪 acceptance contract 因此加入 executable checks：exact-dimension handoff、Furniture Fit calculation、export metadata/output、rail panel selection，以及 H1-before-prototype SEO order。所有 prototype 圖均使用 inline measured SVG / CSS，沒有加入 AI 圖片、室內 stock photo 或 generic SaaS 素材。

## Initial quantitative reference

The previous branch preflight record at the observed PR head reported:

- Astro check：210 files, 0 errors, 0 warnings, 0 hints.
- Build：1,457 static pages.
- Content audit：1,315 source articles; 1,315 review-ready; 0 held noindex; 1,447 sitemap pages; 1,000,350 checks; 0 failures.
- Script tests：30 passed.
- `www` redirect tests：4 passed.
- Moving OS tests：26 passed.

The review-01 record also preserved an older run with 1,153 build pages and 995,810 checks. Those values are treated as historical input only; the final package will use one fresh build/audit run on one final head SHA as the sole authority.

## Review-02 rebaseline after blocker fixes

The fresh build/audit authority used for this revision is the consistent set `1,457 build pages / 1,447 sitemap pages / 1,315 source articles / 1,000,350 audit checks / 0 failures`. The previous `1,153 / 995,810` pair is not mixed into the final result. The current Astro check result is `217 files, 0 errors, 0 warnings, 0 hints`; the full test and preflight result is recorded in the loop log and local review after the final head is committed.

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

## Review-03 blocker baseline and repair contract

Review 03 的修正前狀態補充如下：Planner shared chrome、report preview、PNG/PDF metadata 仍有中文硬編碼；Bedroom prototype 的文案 113 cm 與其實際座標不一致；Furniture Fit preset 在 m/ft 下把 cm 數字直接寫入表單；current-head Planner evidence 未覆蓋完整 viewport；Guide smoke 只測英文；PDF/PNG 尚未留下實際瀏覽器輸出 binary；`final-preflight.log` 仍是舊 run。

本輪 acceptance contract：

- zh/en Planner rail、drawer、mobile actions、report preview 與 accessibility label 必須使用 shared strings。
- zh/en export metadata、PNG header/footer、PDF rows 必須使用 shared strings；瀏覽器 evidence 必須產出非零 `image/png` 與 `application/pdf`。
- Bedroom 顯示的 clearance 必須由與 SVG/handoff 相同的 room/item geometry 計算；目前 route width `127 cm`、床尾至桌前 `47 cm`。
- Furniture Fit preset 在 `cm`、`m`、`ft` 顯示值轉回 canonical cm 後必須保留 preset dimensions；無效輸入不得產生 SVG 或 handoff。
- Homepage 與 Planner 在 `375/390/768/1024/1280/1440` 無水平溢出；current-head evidence 只採 `review-03/`。

Review-03 closeout authority（final docs/evidence commit 後再填 exact SHA）：`1,457 build pages / 1,447 sitemap pages / 1,315 source articles / 1,000,350 audit checks / 0 failures`; Astro check `217 files, 0/0/0`; `test:scripts 38/38`; browser smoke PASS。這些數字取代舊的 1,153 / 995,810 pair；後者只保留為歷史衝突，不進入 final authority set。
