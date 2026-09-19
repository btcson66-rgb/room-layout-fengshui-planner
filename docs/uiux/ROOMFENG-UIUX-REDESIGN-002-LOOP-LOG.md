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
