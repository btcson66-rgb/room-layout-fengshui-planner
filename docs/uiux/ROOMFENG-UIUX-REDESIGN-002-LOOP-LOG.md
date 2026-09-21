# ROOMFENG UIUX REDESIGN 002 — LOOP LOG

日期：2026-09-19
PR：#100 ᐧ branch `codex/roomfeng-uiux-20260919`
流程規則：每一階段固定執行 `Observe → Plan → Implement → Build → Functional → Visual QA → SEO Parity → Accessibility → Performance → Self-Critique → PASS/FAIL`。任何 FAIL 在修正前不得進入下一階段。

## Loop 0 — review intake and baseline

- Observe：讀取 user-supplied `ROOMFENG-UIUX-REDESIGN-002-REVIEW-01.md`；核對 PR #100 為 OPEN / UNMERGED / UNDEPLOYED；確認 worktree 與原始 dirty checkout 分離。
- Plan：以 review 的 REQUEST CHANGES 為 acceptance contract；不改 production URL、canonical、hreflang、robots、sitemap architecture、indexability、payment、entitlement 或 production analytics。
- Implement：建立 baseline 文件與 evidence scope；未修改 production。
- Build：baseline branch record 已有 Astro check 210 files、0/0/0；build 1,457；content audit 1,000,350 checks / 0 failures。
- Functional：確認 PR head 與 branch 狀態；PASS。
- Visual QA：review-01 evidence 顯示原 Planner 為三欄／mobile stack，缺 prototype surface；FAIL（原始狀態）。
- SEO Parity：保護清單列出；PASS（未作任何 SEO architecture 變更）。
- Accessibility：skip/focus/keyboard/status/reduced-motion strengths 保留；PASS。
- Performance：baseline build 完成，但缺完整 responsive evidence；PASS with evidence gap。
- Self-Critique：原本只有 partial refresh，不能宣稱 redesign 完成；修正方向鎖定 foundation、planner interaction model、required prototype set、evidence。
- Result：FAIL → 修正後重新跑。

## Loop 1 — neutral foundation and measurement-first homepage

- Observe：global CSS 仍有 gold-first token、decorative grid、global `h1 max-width:13ch`、display serif defaults；Hero secondary action 指向 Feng Shui。
- Plan：neutral-first surface + restrained RoomFeng green；移除 global restrictions；Hero 改成 `Measure · Plan · Check`，第二 CTA 改 Furniture Fit；只使用 CSS / inline SVG。
- Implement：更新 `src/styles/global.css`、`src/pages/index.astro`；移除全站 grid background，取消 global h1 max width，font default 回 sans，Hero 內容改 measurement-first。
- Build：`npm.cmd run check` → 210 files, 0 errors, 0 warnings, 0 hints；`npm.cmd run build` → 1,457 pages。
- Functional：首頁 H1、兩個 CTA、measurement ribbon、三步流程均出現在 DOM；PASS。
- Visual QA：reload after Vite cache refresh，確認 desktop/mobile neutral surface、green primary、no grid、SVG measured plan；初次 screenshot cache 顯示舊 CSS，reload 後 PASS；同步移除 Hero caption 與 decorative footer label overlap。
- SEO Parity：首頁 canonical `/`、alternates `/` + `/en/`、JSON-LD structure unchanged；PASS。
- Accessibility：skip link、single H1、no missing image alt、no horizontal overflow at 390 and 1280；PASS。
- Performance：static build completed; no new external image/font dependency; PASS。
- Self-Critique：首頁仍保留既有內容區與 Feng Shui links，但它們被移到 measurement-first path 之後；PASS。
- Result：PASS。

## Loop 2 — planner interaction model and export report

- Observe：原 Planner DOM 是 controls / canvas / side 三欄，mobile 只是 order change。
- Plan：desktop 用 compact tool rail + temporary drawer + canvas-first + inspector；mobile 用 canvas-first + fixed bottom action bar + fixed bottom-sheet drawer；保留既有 drag / resize / keyboard / local save / PNG / PDF。
- Implement：更新 `src/planner/planner.ts`、`src/styles/planner.css`；新增 rail buttons、drawer、mobile actions、dynamic local Export report preview；report preview 由同一個 design state 更新尺寸、家具數與 check status。
- Build：post-implementation `npm.cmd run check` → 210 files, 0 errors, 0 warnings, 0 hints；build passed at 1,457 pages。
- Functional：desktop 點 `家具` 開 drawer；mobile 點 `加家具` 開 bottom sheet；新增書桌後 report 由 4 件變 5 件、checks 同步為 2；keyboard Enter 選取 SVG furniture；PASS。
- Visual QA：Planner screenshots at 375/390/768/1024/1280/1440；canvas-first and no horizontal overflow；PASS。
- SEO Parity：planner canonical `/zh/room-layout-planner/`, alternates and WebApplication/Breadcrumb JSON-LD unchanged；PASS。
- Accessibility：named SVG group, role button furniture, aria-pressed, visible focus, status/live region retained; no missing image alt; PASS。
- Performance：no new remote asset; static JS path unchanged except local report rendering; PASS.
- Self-Critique：`checks` rail action scrolls to the inspector and closes the setup drawer; desktop inspector remains compact and visible; PASS.
- Result：PASS。

## Loop 3 — required prototypes and guide template

- Observe：Furniture Fit、bedroom-size、studio-size、guide/article、export report prototypes were absent or lacked the requested handoff.
- Plan：add measured SVG / CSS prototypes only; keep existing page URLs, canonical, hreflang and content routes; add at least one real Planner deep-link flow.
- Implement：add `src/styles/uiux-prototypes.css`; update `src/pages/zh/furniture-fit-checker.astro`, `src/pages/zh/small-bedroom-layout.astro`, `src/pages/zh/studio-apartment-layout.astro`, `src/pages/zh/layout-guides/[slug].astro`, `src/styles/layout-guide.css`.
- Build：Astro check and static build passed; content audit passed with 1,315 source articles / 1,447 sitemap pages / 1,000,350 checks / 0 failures.
- Functional：Furniture Fit has 3 `Try this size` links; bedroom and studio each have a Planner handoff; guide renders 3 approved strategy diagrams and Measure / Compare / Try flow; export preview renders in Planner; PASS.
- Visual QA：evidence includes full-page Furniture Fit, bedroom, studio and guide screenshots plus export preview; PASS.
- SEO Parity：all touched SEO pages retain their original canonical/alternate routes and page JSON-LD type; no robots/sitemap/indexability changes; PASS.
- Accessibility：each prototype has labelled section/SVG, one page H1, no unlabeled images; PASS.
- Performance：no image download or third-party visual dependency; PASS.
- Self-Critique：prototype diagrams are deliberately schematic measured SVGs, not AI/stock room imagery; PASS.
- Result：PASS。

## Loop 4 — Review-01 authoritative validation (historical, superseded)

This is the final gate. It is rerun after this document commit at the exact final head returned by `git rev-parse HEAD`; no source changes are allowed afterward.

- Observe：working tree diff, protected token diff, PR state and screenshot manifest.
- Plan：run one `npm.cmd run preflight`, one content audit readback, one sitemap count readback, one responsive/a11y smoke readback and one performance readback; record only this set.
- Implement：none during the final measurement run.
- Build：1,457 static pages; Astro check 210 files, 0 errors, 0 warnings, 0 hints.
- Functional：PASS — rail/drawer, mobile bottom sheet, report sync, `Try this size`, keyboard furniture selection.
- Visual QA：PASS — homepage and Planner at 375/390/768/1024/1280/1440; required prototype evidence present.
- SEO Parity：PASS — canonical, hreflang, robots, sitemap architecture and indexability unchanged.
- Accessibility：PASS — skip link, focus visible, role/status/live, keyboard selection, reduced motion, no overflow in required matrix.
- Performance：PASS — local static HTTP smoke returned 200 for all six routes, 4.270–24.747 ms in the recorded run; no new remote assets.
- Self-Critique：the only historical conflict is 1,153/995,810; final authority is 1,457/1,447/1,000,350 on the exact final head. PR remains OPEN / UNMERGED / UNDEPLOYED.
- Result：PASS。

## Loop 5 — Review-02 blocker repair

- Observe：Review 02 明確指出 exact-dimension handoff、measured SVG、Furniture Fit 計算、真實 PDF/PNG output、rail panel routing、SEO H1 order、Hero measurement facts、newsletter placement、measurement-first nav、footer copy 與 authoritative PR numbers 仍有 blocker。
- Plan：先建立一份共用 `roomfeng.planner.quick-handoff/v1` payload，所有 preset、Bedroom、Studio、Furniture Fit 都從同一份 schema 送入 Planner；再把 Fit calculation、measured SVG、export metadata/output 與 rail drawer routing 做成可測試的 source contracts；保留既有 canonical、hreflang、robots、sitemap、indexability、payment、entitlement 與 analytics 邊界。
- Implement：新增 `src/planner/quick-handoff.ts`、`src/tools/furniture-fit.ts`、`src/components/MeasuredPlan.astro`、`src/components/PlannerHandoffLink.astro`、`src/components/FurnitureFitTool.astro`；更新 `src/planner/planner.ts`、`src/planner/export.ts`、Furniture Fit / Bedroom / Studio / Homepage / Header / Footer / planner styles；新增 `scripts/test/uiux-review-03.test.mjs` 與 `scripts/test/uiux-review-03.browser.mjs`。
- Build：`npm.cmd run check` → `217 files, 0 errors, 0 warnings, 0 hints`；static build → `1,457 page(s) built`；Vite 仍只出現既有 >500 kB chunk warning，未新增 remote image/font dependency。
- Functional：`npm.cmd run test:uiux-review` → `5/5 PASS`；browser smoke → `PASS`，驗證 exact payload（300 × 300 / 105 × 188、150 × 190、180 × 85）、Furniture Fit physical/requested clearance、Bedroom 248 × 400、Studio 560 × 500、rail Room/Furniture/Templates/Checks、mobile Report drawer 與 Guide template。
- Visual QA：產生 `docs/uiux/evidence/review-02/` 截圖；Homepage 375/390/768/1024/1280/1440、Furniture Fit、Planner handoff、Bedroom、Studio、Guide、desktop export preview、mobile report 均可讀，沒有 AI/stock room image。
- SEO Parity：content audit 重新 PASS：`1,315 sourceArticles / 1,315 reviewReady / 0 heldNoindex / 1,447 sitemapPages / 1,000,350 checks / 0 failed`；修正英文 nav `/en/blog/` broken link 為既有 `/en/layout-guides/10x10-bedroom-layout/`；未改 canonical、hreflang、robots、sitemap architecture 或 indexability。
- Accessibility：保留 skip link、focus visible、keyboard furniture selection、`aria-live` / `role=status`、reduced motion；browser smoke 覆蓋 H1、labelled SVG、mobile drawer 與 required viewport matrix；PASS。
- Performance：browser navigation evidence 寫入 `docs/uiux/evidence/review-02/performance.json`；local DOMContentLoaded/load 約 136–255 ms / 137–255 ms，transferSize 34,055–59,771 bytes；bundle comparison 另在 Loop 6 authority set 記錄；local Lighthouse unavailable because package is not installed and `npx --no-install lighthouse` refused missing package。
- Self-Critique：本輪仍沒有真正 production/public URL readback，也沒有將 gated export 變成付款或 entitlement 流程；實際 PNG/PDF 的輸出內容已在 export module 改為含 RoomFeng title/date/room/area/items/checks/disclaimer，並以 metadata contract test 鎖定。
- Result：PASS。

## Loop 6 — single-head authoritative closeout

- Observe：完成 source、test、screenshot、documentation 與 protected-route diff readback；PR #100 仍只允許同一 branch 更新，禁止 merge/deploy。
- Plan：在所有 docs/evidence commit 完成後，以同一個 `git rev-parse HEAD` 執行一次 `npm.cmd run preflight`，重讀 build page count、sitemap count、content audit totals、tests、bundle delta、browser/performance evidence、SEO parity 與 accessibility；最後以 GitHub PR head/CI readback 對齊，不混用歷史數字。
- Implement：不再新增 production、canonical、hreflang、robots、sitemap、payment、entitlement 或 analytics mutation；只更新本地 review package 與同一 PR body authority set。
- Build：authority set 以 exact final head 重跑並記錄 `1,457 build pages`、`1,447 sitemap pages`、`1,315 source/review-ready articles`、`1,000,350 checks`、`0 failures`、`217 Astro files 0/0/0`；bundle comparison：baseline `31 JS / 1,924,581 bytes / 929,901 max; 8 CSS / 71,829 bytes / 17,760 max` → current `34 JS / 1,934,629 bytes / 929,901 max; 9 CSS / 78,470 bytes / 17,760 max`（JS +10,048 / +0.52%；CSS +6,641 / +9.25%；最大 chunk 未增加）。Vite >500 kB warning 仍存在，但沒有被當成 PASS 掩蓋。
- Functional：authority tests must remain `uiux-review 5/5`, `browser smoke PASS`, `test:scripts 35/35`, `www redirect 4/4`, `moving-os 26/26`; export output is local gated download behavior, not a payment claim。
- Visual QA：authority screenshots are under `docs/uiux/evidence/review-02/`; required viewports are explicitly listed in `README.md` and the browser script.
- SEO Parity：PASS only when audit has 0 failures and the protected route/source diff remains empty for canonical/hreflang/robots/sitemap/indexability/payment/entitlement/production analytics.
- Accessibility：PASS only when check/browser evidence preserves skip link, focus, keyboard item selection, live status, reduced-motion and no horizontal overflow at 375/390/768/1024/1280/1440.
- Performance：record local navigation JSON and bundle-size delta; report Lighthouse as unavailable rather than inventing a score. This is local evidence, not a production performance claim.
- Self-Critique：the old `1,153 / 995,810` pair is historical only; no merged/deployed/public outcome is claimed. Any remaining limitation is reported explicitly in `ROOMFENG-UIUX-LOCAL-REVIEW-002.md`.
- Result：PASS only after the final exact-head preflight and PR readback; otherwise FAIL and repeat Loop 6.

## Loop 7 — Review-03 blocker repair

- Observe：Review 03 found shared Planner chrome and export output still hardcoded Chinese, the Bedroom clearance copy did not match its coordinates, Furniture Fit presets lost exact cm geometry after unit changes, current-head evidence was incomplete, and the preflight log was stale.
- Plan：repair only the shared Planner/export strings, measured geometry, unit conversion and validation paths; add executable zh/en export assertions, cm/m/ft preset assertions, computed Bedroom clearance assertions, current-head browser evidence, and a local export harness. Keep routes, canonical, hreflang, robots, sitemap architecture, indexability, payment, entitlement and analytics unchanged.
- Implement：extended `PlannerStrings` navigation/drawer/report/accessibility/export groups; localized zh/en Planner rail, drawer, mobile actions, report preview and PNG/PDF metadata; moved the Bedroom desk to a non-overlapping measured position and derived 127 cm / 47 cm from the same geometry; fixed Furniture Fit unit-aware presets and invalid-input handling; added real browser PNG/PDF Blob evidence and current-head screenshots.
- Build：`npm.cmd run preflight` PASS — Astro check `217 files, 0 errors, 0 warnings, 0 hints`; static build `1,457 page(s)`; content audit `1,315 source / 1,315 review-ready / 0 held / 1,447 sitemap / 1,000,350 checks / 0 failures`; Vite existing >500 kB warning remains explicitly recorded.
- Functional：`test:scripts` `38/38 PASS`; Review-03 unit contract includes exact handoff, Furniture Fit Fit/Clearance, zh/en export localization, cm/m/ft conversion, computed Bedroom clearance, rail routing and H1 order. Browser smoke PASS includes preset geometry in cm/m/ft, exact handoff, no horizontal overflow, six Planner viewports, zh Guide and actual PNG/PDF Blob signatures/dimensions.
- Visual QA：new current-head evidence is under `docs/uiux/evidence/review-03/`: Homepage and Planner at 375/390/768/1024/1280/1440; Furniture Fit; exact handoff; Bedroom; Studio; Planner report preview; zh Guide; browser-produced PNG/PDF.
- SEO Parity：PASS — current touched routes preserve canonical, hreflang/alternates, JSON-LD and indexability; no protected SEO architecture or production configuration changed. Authority readback remains `1,457 / 1,447 / 1,315 / 1,000,350 / 0`.
- Accessibility：PASS — existing skip link, focus-visible, keyboard furniture selection, `aria-live` / `role=status`, reduced motion and no-overflow checks are retained; Planner labels now localize without losing named SVG/role semantics.
- Performance：PASS as local non-regression — browser `performance.json` records navigation timings for all current evidence routes; bundle comparison is current `33 JS / 1,935,906 bytes / 929,901 max; 9 CSS / 78,470 bytes / 17,760 max` versus prior baseline `31 JS / 1,924,581 bytes / 929,901 max; 8 CSS / 71,829 bytes / 17,760 max` (JS +11,325 / +0.59%; CSS +6,641 / +9.25%; max chunks unchanged). Lighthouse remains unavailable locally and is not claimed.
- Self-Critique：PDF generation remains behind the existing local email/download gate in the product flow; the browser evidence calls the underlying real Blob builder because submitting an email would cross the task’s external coordination boundary. The output itself is validated as non-empty `image/png` and `application/pdf`, with saved binary evidence.
- Result：PASS pending exact final-head commit, PR push, CI readback and Review 04 handoff. PR remains OPEN / UNMERGED / UNDEPLOYED.

## Loop 8 — Review-04 Phase G whole-site rollout

- Observe：Review 04 accepted the zh core prototype and Review-03 functional blockers, but found the English Homepage/Furniture Fit/Guide/bedroom/studio surfaces still on the old architecture; zh navigation and Planner emoji were inconsistent; export cultural metadata could duplicate; asymmetric clearance placement was not honest; date locale was inferred from title text; and CI lacked a browser release gate.
- Plan：roll out the already-approved measurement-first system through shared locale props, measured SVG geometry, shared Furniture Fit math, shared Guide flow, explicit export locale metadata, and a CI-safe local browser job. Preserve every existing URL, canonical, hreflang, robots, sitemap architecture, indexability, payment, entitlement and production analytics boundary.
- Implement：updated `src/pages/en/index.astro`, English Furniture Fit, Guide, bedroom and studio routes; localized `Header.astro`; added `locale/dateLocale` and cultural export fields to Planner types/export; added shared asymmetric placement in `src/tools/furniture-fit.ts`; removed Planner emoji actions; added `uiux-review-04.test.mjs` and `uiux-review-04.browser.mjs`; added `.github/workflows/preflight.yml` browser job; captured `docs/uiux/evidence/review-04/`.
- Build：source validation reports `1,457` static pages, `1,447` sitemap pages, `1,315` source articles, `1,315` review-ready articles, `0` held noindex, `1,000,350` checks, `0` failures. `test:scripts` is `42/42`; `test:uiux-review` is `12/12`.
- Functional：PASS — exact English/zh handoff dimensions, shared bedroom/studio payloads, canonical cm/m/ft Furniture Fit conversion, asymmetric clearance placement, distinct desktop Room/Furniture/Templates/Checks rail controls, mobile bottom sheets, localized export metadata, and real PNG/PDF bytes are covered by unit and browser tests.
- Visual QA：PASS — zh/en Homepage and Planner screenshots cover `375/390/768/1024/1280/1440`; Furniture Fit, handoff, measured bedroom/studio, Guide, rail states, mobile sheets, and export outputs are in `docs/uiux/evidence/review-04/`.
- SEO Parity：PASS — `seo-parity.json` readback for Homepage, Planner, Furniture Fit, bedroom, studio and Guide in both locales confirms canonical, hreflang, indexability, sitemap membership and JSON-LD; no protected SEO architecture changed.
- Accessibility：PASS — skip link, focus-visible, keyboard furniture selection, `aria-live` / `role=status`, reduced motion, labelled SVGs and no horizontal overflow matrix remain intact; browser smoke includes both locales and all required widths.
- Performance：PASS as local non-regression — `performance.json` records local preview navigation and transfer sizes; current bundle is `33 JS / 1,937,876 bytes / 929,901 max; 10 CSS / 83,642 bytes / 17,760 max`, versus Review-03 `33 JS / 1,935,906 bytes / 929,901 max; 9 CSS / 78,470 bytes / 17,760 max`; the maximum chunk is unchanged. Lighthouse was attempted with `npx --no-install` and is unavailable locally, so no score is claimed.
- Self-Critique：measured SVGs are code-rendered planning diagrams rather than certified architectural drawings; local browser and CI evidence do not prove production/public readback; PDF/PNG export is validated through the existing local gated builder and does not submit email, payment or entitlement data. The Vite large-chunk warning remains recorded and is not hidden.
- Result：PASS pending exact final-head commit, GitHub CI readback and Independent Review 05. PR #100 remains OPEN / UNMERGED / UNDEPLOYED.

## Loop 9 — Final Hardening 003 zero-known-defect release gate

- Observe：以 production `6a9f43d5a7312652236b6df5c3601327803aca97` 為基準重新檢查 Review 04 後的可控缺陷。English Furniture Fit 的 page H1 仍在 tool H2 後；整站缺少 reusable heading audit；Planner 在首次 real Lighthouse 上報 CLS `0.36`（zh）與 `0.27`（en）；Cloudflare Web Analytics beacon 仍製造可避免的 production signal；production SEO 數字需用同一腳本對齊；bundle comparison 與 CI release gate 需固化。
- Plan：只修 semantic order、reusable audits、layout reservation、可重跑 Lighthouse/SEO/bundle scripts、CI jobs 與 release evidence。保留現有 accessibility、prototype、export、SEO freeze 與 payment/entitlement boundaries；先在 local source gate PASS，再建立新 PR，再做 merge/deploy 與 production readback。
- Implement：English Furniture Fit 加入 page-level H1/lead header；unit/browser tests 改驗 semantic contract；新增 `scripts/semantic-heading-audit.mjs`、`scripts/seo-production-parity.mjs`、`scripts/lighthouse-production.mjs`、`scripts/bundle-size-audit.mjs` 與對應 tests；Planner ad slot / mount reserved height 消除 CLS；CI 加入 heading、bundle、production SEO parity、preview Lighthouse 與 UIUX browser jobs。Cloudflare Web Analytics 已在 dashboard 停用，GA4/AdSense code、payment、entitlement、production analytics configuration 未改。
- Build：最新 local build `1,457 page(s) built`；postbuild sitemap architecture unchanged；`npm run audit:content` `1,315 source / 1,315 review-ready / 0 held / 1,000,350 checks / 0 failed`；`npm run audit:headings` `1,457 HTML / 1,448 indexable` PASS；Astro check `224 files, 0 errors, 0 warnings, 0 hints`。
- Functional：`test:scripts` `45/45 PASS`；`test:uiux-review` `12/12 PASS`；www redirect `4/4`; Moving OS `26/26`; Product geometry `16/16`; Product Phase 3 `9/9`; Product entitlement `8/8`; Review-04 browser gate PASS with exact-dimension handoff, measured SVG, distinct rails, mobile sheets and real PNG/PDF output.
- Visual QA：local browser evidence records Homepage, Planner, Furniture Fit, Bedroom, Studio, Guide, report/export preview and actual PNG/PDF at `375/390/768/1024/1280/1440`; production smoke records 27 runs (three iterations across nine representative routes) with no first-party errors and no horizontal overflow.
- SEO Parity：local production-origin parity script PASS with `1,447` unique child sitemap URLs, sitemap index/child HTTP 200, robots HTTP 200, `/sitemap.xml` HTTP 404 by design, canonical/hreflang/indexability/JSON-LD/H1/internal-anchor checks PASS. Final post-deploy readback must rerun the same script at the deployed head.
- Accessibility：semantic heading audit, existing skip link, focus-visible, keyboard furniture selection, `aria-live`/`role=status`, reduced-motion, labelled SVGs, named controls and no-overflow matrix all PASS. No accessibility code was removed.
- Performance：local Lighthouse 9/9 PASS after CLS repair; content Accessibility/Best Practices/SEO scores `98–100`, all CLS `0`, content LCP `243.59–326.05 ms`, content TBT `0`; Planner scores Accessibility `98/99`, Best Practices `100`, SEO `100`, CLS `0`, LCP `369.5/369.6 ms`. Current bundle is `33 JS / 1,937,919 bytes / 929,901 max` and `10 CSS / 83,852 bytes / 17,760 max`; Review-04 baseline was `33 JS / 1,937,876 bytes / 929,901 max` and `10 CSS / 83,642 bytes / 17,760 max`.
- Self-Critique：首次 Lighthouse FAIL 被當作 blocker 並修正，而非調高 threshold；production beacon 以 dashboard 設定處理，不以第三方訊號掩蓋 first-party errors；historical `1,153 / 995,810` 數字不進入 hardening authority set。尚未在此段宣告 merge/deploy，直到新 PR checks、branch protection、部署與同一 head production readback 全部通過。
- Result：source hardening PASS；release remains gated on exact-head PR/CI, branch protection, merge/deploy, production browser, Lighthouse and SEO readback。

## Loop 10 — Final Hardening 003 CI regression correction

- Observe：PR run `35489164931` failed its new semantic heading gate on all `1,448` indexable documents when `PUBLIC_GA_ID` was present. The failure came from `<h2>` strings inside the inline consent script, not from rendered page headings.
- Plan：correct the reusable audit to exclude only non-document `script` and `style` blocks, add a regression test for heading-like markup inside both blocks, and rerun the same production-like env locally and in GitHub Actions.
- Implement：updated `scripts/semantic-heading-audit.mjs` and `scripts/test/semantic-heading-audit.test.mjs`; no page markup, analytics code, URL, canonical, hreflang, robots, sitemap, payment or entitlement behavior changed.
- Build：production-like local build `1,457` pages and heading audit `1,457 HTML / 1,448 indexable` PASS; local `npm.cmd run preflight` PASS with Astro check `225 files 0/0/0`, content audit `1,315 / 1,315 / 0 / 1,000,350 / 0`, and script tests `46/46`.
- Functional：semantic heading unit tests `4/4` and full CI preflight regression suite PASS; existing Furniture Fit, Planner, export, responsive and accessibility contracts remain green.
- Visual QA：previous final-local browser evidence remains the source visual package; this fix changes audit parsing only and does not alter rendered UI.
- SEO Parity：CI production-origin parity PASS with `1,447` unique sitemap URLs and unchanged canonical/hreflang/robots/indexability architecture.
- Accessibility：CI UIUX browser evidence PASS at `375/390/768/1024/1280/1440`; existing focus, keyboard, live status and reduced-motion contracts remain present.
- Performance：CI Production Lighthouse PASS for all nine preview routes; local final Lighthouse remains `9/9` PASS with Planner CLS `0`.
- Self-Critique：the first CI FAIL was retained as evidence and corrected at the parser boundary; no threshold was weakened and no production claim was made from the failed run.
- Result：PASS — source head `18089398f9e52f12c7ba9a82739ff3d4c12bc2d7`; CI run `35489635586`; PR #102 is ready for the branch-protected merge gate.

## Loop 11 — Final Performance Closeout 005

- Observe：production baseline was `056bc7ac031259f7b2b2cb10d89f06b750b92d4f`; the Lighthouse runner still exempted Planner LCP/TBT, and local AdSense activation reproduced `21` zero-width slot errors before the fix. The release authority is the single manifest `scripts/release-authority.mjs`: build `1,458`, sitemap `1,448`, content audit `1,000,355` checks / `0` failures.
- Plan：remove the Planner Lighthouse exemption; defer the AdSense loader and Planner slot initialization until Planner-ready, user interaction, idle time and near-viewport visibility; require connected measurable widths and one initialization marker; preserve ownership meta, consent, route/canonical/hreflang/robots/sitemap architecture, payment, entitlement and analytics boundaries.
- Implement：updated `src/components/BaseHead.astro`, `src/components/AdSlot.astro`, `src/components/Layout.astro`, both Planner routes and `src/planner/planner.ts`; made Lighthouse hard LCP/TBT checks apply to every route; added zero-width/duplicate-init telemetry and `scripts/test/adsense-integration.{test,browser}.mjs`; added the browser regression to `.github/workflows/preflight.yml`.
- Build：production-like Astro build PASS — `1,458` pages; release authority PASS — `1,448` sitemap URLs; authoritative content audit remains `1,000,355` checks / `0` failures; `git diff --check` PASS. The existing Vite >500 kB warning remains visible; no new remote visual asset was introduced.
- Functional：AdSense browser contract PASS for zh/en Planner — no AdSense resource before activation, loader request after activation, exactly one initialized slot per route, resize does not duplicate initialization; local production-browser smoke PASS `27/27`, zero-width `0`, duplicate initialization `0`, controllable first-party errors `0`.
- Visual QA：Review-04 responsive browser evidence remains valid for Homepage, Planner, Furniture Fit, bedroom/studio measured landings, Guide, rail/sheet states and export outputs at `375/390/768/1024/1280/1440`; this closeout changes loading behavior, not visual composition. Existing tracked screenshots remain under `docs/uiux/evidence/review-04/` and `docs/uiux/evidence/hardening-003/final-local-browser/`.
- SEO Parity：the candidate build preserved the production canonical/hreflang/sitemap contract; the authoritative parity script PASSed against the current production origin with `1,448` unique sitemap URLs, robots `200`, sitemap index/child `200`, legacy `/sitemap.xml` `404`, representative canonical/hreflang/indexability/JSON-LD/H1/internal-anchor checks PASS. A localhost run was rejected because it incorrectly expected localhost canonicals; it was not used as evidence.
- Accessibility：`npm.cmd run check` PASS with `237` files, `0` errors/warnings/hints; semantic heading audit PASS `1,458 HTML / 1,449 indexable`; existing skip link, visible focus, keyboard furniture selection, `aria-live` / `role=status`, reduced motion and labelled SVG contracts remain intact. Lighthouse all-route Accessibility scores are `98–100`.
- Performance：local Lighthouse hard gate PASS `18/18` across 9 routes × desktop/mobile. English Planner mobile: Performance `100`, LCP `1,355.83 ms`, TBT `0 ms`, CLS `0`, Accessibility `98`, Best Practices `100`, SEO `100`. Chinese Planner mobile: Performance `100`, LCP `1,355.75 ms`, TBT `3.5 ms`, CLS `0`, Accessibility `98`, Best Practices `100`, SEO `100`. Planner engineering targets (`LCP ≤ 2,200`, `TBT ≤ 150`, `CLS = 0`) PASS. Bundle evidence records current `33 JS / 1,938,061 bytes / 929,901 largest` versus Review-04 `33 JS / 1,937,876 bytes / 929,901 largest`; CSS is inlined in the current build (`0` emitted CSS files versus the historical `10` file baseline), and the largest chunk is unchanged. AdSense browser evidence records first-party JS `24,161–24,993` transfer bytes before activation, AdSense requests `0` before and `1` after activation, plus long-task observations.
- Self-Critique：the local browser harness stubs the AdSense loader, so it proves sequencing, dimensions, and duplicate protection rather than ad inventory delivery; the production gates must still be the authority for real AdSense behavior. Lighthouse writes valid reports but emits the existing process-cleanup warning after report generation; every report parsed with `failures: []` and the aggregate gate PASSed. No production claim is made until the new PR checks, merge, deployment, production browser, production Lighthouse, production SEO parity, sitemap, commit equality and GSC steps all pass.
- Result：source closeout PASS; release remains gated on the exact PR head and all post-merge production gates. No rollback was performed and no production configuration was modified in this source change.

## Loop 12 — Final Live Crawl Fix 006

- Observe：production baseline is `b4804899299047a5c0b3cca95416307de3d07c66`; the remaining blockers were manual AdSense slot safety, shared English/Chinese residue, Chinese Furniture Fit localization, compact-header behavior, and permanent live-crawl regression coverage. The approved authority transition is `1,457/1,447` → `1,458/1,448` because merged PR #103 added `/en/contractor-margin-guard/` and merged PR #104 corrected the baseline.
- Plan：keep the existing UI direction and SEO architecture; add one AdSense placement resolver, make unresolved/manual publisher slots render no `<ins>`, localize shared components and Chinese Furniture Fit, keep the header compact below `1080px`, and gate production routes with the same browser checks used for local evidence. The approved English-only Product-006 route remains the sole documented hreflang exception.
- Implement：added `src/config/adsense.mjs`; separated placement keys from numeric `data-ad-slot`; updated `AdSlot`, `Faq`, `RelatedLinks`, `FurnitureFitTool`, `Header`, all localized callsites, header CSS, browser tests, release verdict, preflight, and Cloudflare post-deploy gates. Added `scripts/test/live-crawl-006.{browser,test}.mjs`; made the Review-03 browser harness honor its configured origin/evidence directory and retain exact-dimension handoff coverage. No protected SEO, payment, entitlement, or analytics architecture was changed.
- Build：`npm.cmd run check` PASS — `240 files, 0 errors, 0 warnings, 0 hints`; production-like build PASS — `1,458` pages; sitemap PASS — `1,448` URLs; content audit PASS — `1,000,355 checks / 0 failures`; release authority manifest PASS with the recorded PR #103 / #104 transition; `git diff --check` PASS.
- Functional：`npm.cmd run test:scripts` PASS — `61/61`; Review-03 browser PASS; Review-04 browser PASS; Final Live Crawl 006 local browser PASS — `14` required routes, `15` route runs including the second English Planner screenshot, and `10` header runs; AdSense browser PASS with no manual slots configured, invalid slots `0`, AdSense HTTP 400 `0`, zero-width `0`, duplicate init `0`.
- Visual QA：local evidence is under `docs/uiux/evidence/live-crawl-006/`; required Homepage, Planner, Furniture Fit, English bedroom, English Guide, header, measured-plan, export and review screenshots are present. Review-03 and Review-04 cover `375/390/768/1024/1280/1440`; Final Live Crawl header covers `390/768/1024/1080/1440`. No AI-generated, stock, or decorative room imagery was introduced.
- SEO Parity：the candidate build retains the current canonical/hreflang/robots/indexability/sitemap architecture. The live-crawl route gate checks HTTP 200, canonical, paired hreflang except the approved English-only Product-006 route, exactly one H1, overflow, first-party errors, and AdSense response safety. The final authority is the single `scripts/release-authority.mjs` manifest rather than scattered counts.
- Accessibility：PASS. Existing skip link, visible focus, keyboard furniture selection, `aria-live` / `role=status`, labelled SVGs, named controls, 44px touch targets and reduced-motion behavior were retained; no accessibility feature was removed.
- Performance：local Lighthouse PASS `18/18` across 9 routes × desktop/mobile; scores `98–100` for Accessibility/Best Practices/SEO and Performance `99–100`; Planner mobile LCP approximately `1.36s`, TBT `0–3.5ms`, CLS `0`. Bundle comparison PASS: `33 JS / 1,938,043 bytes / 929,901 max`, delta `+167 bytes` from Review-04 baseline, largest chunk unchanged; CSS is inlined in this build (`0` emitted CSS files), recorded as observed output. Lighthouse emits the existing post-report process-cleanup warning while each parsed report has `failures: []`.
- Self-Critique：local AdSense uses a deterministic loader stub and therefore proves sequencing and invalid-slot protection, not ad inventory delivery. Local evidence is not production proof; merge, deploy, production browser, production Lighthouse, SEO readback, sitemap readback, commit equality and GSC submission remain release gates. The source workflow now runs the Review-03, Review-04, AdSense and Final Live Crawl browser checks together.
- Result：PASS — source package is ready for the protected PR gate; no merge or deployment claim is made at this loop stage.

## Loop 13 — Final Header Closeout 007

- Observe：production `f679082f4219e03d91825073ec45837792a006cd` 的 English desktop header 在 `1080px` 存在兩列回歸風險；live measurement 顯示 English 1080 的原始可用餘裕只有 `3.44px`，而 1120 為 `43.44px`。
- Plan：只把 compact/desktop breakpoint 調整到最小有 `>=32px` safety margin 的 `1120px`；desktop nav 使用顯式 `flex-wrap: nowrap`；保留所有 44px touch target、brand、language、CTA、URL/SEO/AdSense/Planner/Furniture Fit 與 production analytics 邊界。
- Implement：更新 `src/styles/global.css` 的 breakpoint 與 desktop nav row contract；擴充 `scripts/test/live-crawl-006.browser.mjs` 的 9-width zh/en header matrix、nav item row delta、language/CTA row delta、header height、overflow、nowrap 與 safety-margin assertions；新增 `scripts/test/header-closeout-007.test.mjs`。
- Build：`npm.cmd run check` PASS（241 files, 0 errors, 0 warnings, 0 hints）；static build PASS（1,458 pages）；sitemap child PASS（1,448 URLs）；content audit PASS（1,315 source / 1,315 review-ready / 0 held / 1,000,355 checks / 0 failures）。
- Functional：`npm.cmd run test:scripts` PASS（62/62）；local live crawl PASS（15 required route runs, 18 header runs, first-party errors/network 0, AdSense 400 0, invalid slots 0, duplicate init 0）；existing Review-04 browser regression PASS（zh/en prototype, rail, handoff, export checks）。
- Visual QA：`docs/uiux/evidence/header-closeout-007/local-browser/` 產出 zh/en `390/768/1024/1080/1120/1180/1200/1280/1440` 截圖；desktop nav row delta `0px`、language/CTA row delta `0px`、header `77px`、overflow `0px`；PASS。
- SEO Parity：只變更 CSS 與測試/evidence/docs；authority manifest 仍為 build `1,458`、sitemap `1,448`；canonical、hreflang、robots、sitemap architecture、indexability、payment、entitlement、production analytics 未修改；PASS。
- Accessibility：保留 skip link、focus-visible、keyboard furniture selection、`aria-live` / `role=status`、reduced motion 與 44px interactive targets；新 header gate 驗證所有 required widths 無 overflow 與 row wrap；PASS。
- Performance：local Lighthouse `18/18` desktop/mobile threshold PASS（含 zh/en Planner/Furniture Fit）；bundle audit current JS `33 files / 1,937,995 bytes / 929,901 largest` 對 Review-04 `1,937,876 bytes`，增加 `119 bytes`，largest chunk unchanged；existing Vite `>500 kB` warning and Lighthouse cleanup warning remain explicitly recorded。
- Self-Critique：這是 production visual regression closeout，未在 local evidence 中宣稱 production 已驗證；production browser/Lighthouse/SEO parity/sitemap/commit equality/GSC 仍以 merge 後唯一 release workflow readback 為 authoritative source。
- Result：PASS pending exact final-head CI, merge, deploy and production readback。
