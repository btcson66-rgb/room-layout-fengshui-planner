# ROOMFENG UIUX BASELINE 002

日期：2026-09-19
範圍：PR #100 `codex/roomfeng-uiux-20260919`；只做 local branch / same-PR revision，未 merge、未 deploy、未修改 production。此文件保留 Review 01/02/03 歷史基線，並補記 Review 04 Phase G whole-site rollout 的 observation 與 acceptance contract。

## Baseline identity

- Review target：`ROOMFENG-UIUX-REDESIGN-002-REVIEW-01.md` → `ROOMFENG-UIUX-REDESIGN-002-REVIEW-02.md` → `ROOMFENG-UIUX-REDESIGN-002-REVIEW-03.md` → `ROOMFENG-UIUX-REDESIGN-002-REVIEW-04.md`
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

## Review-04 Phase G baseline and acceptance contract

Review 04 的剩餘 blocker 是 whole-site rollout 與 trust/localization/consistency，而不是推翻已通過的中文核心 prototype。觀察到的修正範圍：英文 Homepage 尚未與中文 measurement-first product system 對齊；英文 Furniture Fit 仍 article-only；英文 bedroom/studio landing 與 Guide template 尚未 measured parity；中文 nav 仍是英文 labels；Planner 的「After the plan」仍使用 emoji；PDF cultural section 會重複標題與內文；Furniture Fit diagram 未依不對稱 clearance 放置家具；date locale 依標題猜測；CI 沒有獨立 browser gate。

本輪 contract：

- 英文首頁保留既有 canonical/alternates/SEO copy，但 Hero 改為「Will it fit? Check before you buy or move it.」，以實際 `360 × 300 cm` room、`150 × 190 cm` bed、`120 × 60 cm` desk、`72 cm` clearance band 與 `80 cm` door opening code-rendered SVG 呈現；primary 為 `Start Planning — Free`，secondary 為 `Check Furniture Fit`。
- `FurnitureFitTool` 改為 `locale="zh"|"en"` 共用計算與 handoff 邏輯；英文工具在既有 SEO article 前渲染，支援 unit、room/furniture dimensions、requested clearance、physical/requested clearance 結果與 exact Planner handoff。
- English bedroom (`/en/small-bedroom-layout-planner/`) 與 studio (`/en/studio-apartment-layout/`) 使用與中文相同的 `248 × 400 cm` / `560 × 500 cm` prototype、家具外框、SVG 座標與 `Try this size` payload；English Guide 加入 shared `MEASURE → COMPARE → TRY` template 與 Planner CTA。
- Furniture Fit asymmetric pass 使用 `left + extra/2`、`back + extra/2` placement；fail 仍顯示實際 furniture footprint 與超出的 requested clearance box，不把示意圖當成通過結果。
- zh nav 改為 房間規劃／家具適配／房間尺寸／指南／搬家／關於；emoji 改為文字編號；English export 預設不輸出 Feng Shui cultural section；日期改由 explicit `dateLocale`。
- CI 增加 `uiux-browser` job：build、Astro preview、Playwright Chromium、`test:uiux-review-04-browser`、清理 preview；無 merge/deploy job 變更。

Review-04 本地驗證 authority（source validation）：`1,457 build pages / 1,447 sitemap pages / 1,315 source articles / 1,000,350 audit checks / 0 failures`; `test:scripts 42/42`; Review-04 browser PASS，evidence 在 `docs/uiux/evidence/review-04/`。Bundle 為 `33 JS / 1,937,876 bytes / 929,901 max`、`10 CSS / 83,642 bytes / 17,760 max`；Review-03 comparison 為 `33 JS / 1,935,906 bytes / 929,901 max`、`9 CSS / 78,470 bytes / 17,760 max`。Local Lighthouse 已嘗試但套件未安裝，沒有虛構分數。

本 baseline 仍是 local observation record；PR #100 的 OPEN / UNMERGED / UNDEPLOYED 狀態與 final exact head 由 final local review、CI readback 與最後一次 authoritative validation 確認。

## Final Hardening 003 baseline and release contract

本分支以 production `6a9f43d5a7312652236b6df5c3601327803aca97` 為觀察基準，建立 `codex/roomfeng-uiux-final-hardening-003`，不修改原始 repo `D:\room-layout-fengshui-planner`。本輪只修正已確認的 semantic heading、Lighthouse/CLS、測試與 release evidence gate；不改 URL、canonical、hreflang、robots、sitemap architecture、indexability、payment、entitlement 或 production analytics。

Hardening acceptance contract：

- `/en/furniture-fit-checker/` 與 `/zh/furniture-fit-checker/` 各 exactly one H1，且 page H1 在第一個 Furniture Fit H2 之前；semantic audit 掃描整個 `dist`。
- Planner 的 ad slot 與 client mount 具有穩定的 reserved height；desktop/mobile canvas-first interaction、rail/drawer/bottom-sheet、Furniture Fit exact handoff、measured SVG、PNG/PDF output contract 維持通過。
- Lighthouse script 可用 production origin（預設 `https://roomfeng.win`），CI PR job 以同一 script 對 build preview 執行 release thresholds；production URL 另以 final release readback 執行。
- production SEO parity script 驗證 canonical、hreflang、robots/indexability、JSON-LD、H1、internal anchors、sitemap index/child、1,447 unique URLs，以及 `/sitemap.xml` 維持 404 architecture。
- browser smoke 三次覆蓋 zh/en homepage、Planner、Furniture Fit、Bedroom、Studio、Guide；只允許已分類的外部 Google/Cloudflare request signal，RoomFeng first-party errors 必須為 0。
- bundle comparison 由 `npm run audit:bundle` 重新讀取 `dist/_astro`，並與 Review-04 baseline 對照。

本輪 local Lighthouse 首次抓到 Planner CLS `0.36/0.27`，因此未往下宣告通過；修正 ad slot 與 Planner mount reservation 後，最新 local Lighthouse 9/9 routes PASS，zh/en Planner CLS 均為 `0`。這是 hardening 的可追溯修正基線。

## Final Hardening 003 source authority correction

Source head `18089398f9e52f12c7ba9a82739ff3d4c12bc2d7` is the authoritative hardening head after the CI heading-audit regression fix. The heading audit now removes only `script` and `style` blocks before evaluating document headings, so consent markup embedded in JavaScript cannot be mistaken for a visible H2. Production-like local preflight and GitHub Actions run `35489635586` both report:

- Build: `1,457` static pages.
- Sitemap: `1,447` URLs in the existing sitemap-index/child architecture.
- Content audit: `1,315` source / `1,315` review-ready / `0` held / `1,000,350` checks / `0` failures.
- Astro check: `225` files / `0` errors / `0` warnings / `0` hints.
- Semantic heading audit: `1,457` HTML files / `1,448` indexable documents.
- CI checks: `preflight`, `UIUX browser evidence`, and `Production Lighthouse` all PASS.

The earlier `1,153 / 995,810` pair remains historical only and is not part of this authority set.

## Final Live Crawl Fix 006 authority correction

This source package starts from the merged production head `b4804899299047a5c0b3cca95416307de3d07c66`. The current authority is the single manifest `scripts/release-authority.mjs` and is not inferred from historical reports:

- Build authority: `1,458` HTML pages.
- Sitemap authority: `1,448` URLs.
- Content audit: `1,315` source / `1,315` review-ready / `0` held / `1,000,355` checks / `0` failures.
- Authority transition: previous `1,457` build / `1,447` sitemap; added `/en/contractor-margin-guard/` from merged PR #103; baseline correction from merged PR #104; current `1,458` / `1,448`.

Only current release authority uses these values. Historical baselines remain unchanged for traceability. No URL, canonical, hreflang, robots, sitemap architecture, indexability, payment, entitlement, or production analytics contract was changed.

## Final Header Closeout 007 baseline

Final Header Closeout 007 starts from production `f679082f4219e03d91825073ec45837792a006cd` and is limited to the measured desktop header regression. At the old `1080px` desktop state, English header fit had only `3.44px` measured safety margin; the cross-platform CI measurement was `-28.14px` at 1120, `31.86px` at 1180 and `43.86px` at 1200, so `1200px` is the minimum tested breakpoint meeting the `>=32px` margin contract across the authoritative browser environment. The candidate keeps compact navigation at `390/768/1024/1080/1120/1180` and desktop navigation at `1200/1280/1440` for both zh and en.

The source-local authority remains `1,458` build pages / `1,448` sitemap URLs / `1,315` source and review-ready articles / `1,000,355` content-audit checks / `0` failures. The new regression gate requires desktop nav item top deltas `<=2px`, language/CTA control row delta `<=2px`, header height `<=82px`, no horizontal overflow, and desktop nav `flex-wrap: nowrap`. Existing URLs, canonical, hreflang, robots, sitemap architecture, indexability, payment, entitlement and production analytics are protected.
