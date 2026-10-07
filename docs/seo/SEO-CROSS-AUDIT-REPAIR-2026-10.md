# SEO-CROSS-AUDIT-AND-REPAIR-2026-10 — roomfeng

**RESULT:**

PARTIAL：local verified；正式交付／部署狀態見下列欄位，未證實 search outcome。

**SITE:**

roomfeng.win

**BING BASELINE:**

short description 81；IndexNow HIGH；Known 727 / Indexed 714 / Warning 2 / Excluded 11；約 2.9K sitemap references 不等於 unique URLs。（使用者任務書提供歷史報表，沒有假設console已更新）

**AHREFS BASELINE:**

只分析 2 internal URLs；hreflang crawl incomplete。（同上）

**CURRENT PRODUCTION BASELINE:**

HTML/anchor+sitemap collection 1457 content URLs；home-anchor reachable 1446（raw CF endpoint計數可能含1）；unique sitemap 1454；fetch errors 0。

**GSC BASELINE:**

2026-07-05–2026-10-04，1482 clicks / 64138 impressions；CTR 2.31%。ZIP SHA-256 5e7e61f16225b965e6849e8e339fff1c102647613a29cf05c40b6ef753b59a24。query/page/country/device 為獨立 aggregate，不虛构 joint query-page。

**CONFIRMED ISSUES:**

新增成功部署基線差分 IndexNow（新增／修改／移除、驗證公開 key、100 URL 小批次、重試、安全日誌、1000 delta 上限）；初次 baseline 不全量提交。改善首頁功能摘要。只優化兩篇既有文章：床墊落地與窗膜反光，新增可見 FAQ、準確摘要，修正床墊案例標題 190×200 與正文150×188不一致；沒有動 indexability/layout/廣告。

**STALE ISSUES:**

工具歷史數量與 current production 不一致的部分保留 STALE_CRAWL / DIFFERENT_THRESHOLD；未訪問console設定不標為已修。

**INTENTIONAL CONDITIONS:**

保持 contentQuality、held/review-ready、所有 canonical/hreflang/locale owner；短 frontmatter 並不是模板截斷。Ahrefs two-URL anomaly 應視 crawl/project scope 待查，不可重構站點。

**ROOT CAUSES:**

沒有IndexNow source/trigger；metadata為frontmatter，不存在共用截斷bug。

**FIXES:**

新增成功部署基線差分 IndexNow（新增／修改／移除、驗證公開 key、100 URL 小批次、重試、安全日誌、1000 delta 上限）；初次 baseline 不全量提交。改善首頁功能摘要。只優化兩篇既有文章：床墊落地與窗膜反光，新增可見 FAQ、準確摘要，修正床墊案例標題 190×200 與正文150×188不一致；沒有動 indexability/layout/廣告。

**FILES CHANGED:**

.github/workflows/deploy-cloudflare-pages.yml、.gitignore、src/content/blog/floor-mattress-feng-shui.md、src/content/blog/living-room-window-film-feng-shui.md、src/pages/index.astro；新增 crawler/compare/fixture、CSV、本報告及GSC evidence（raw response gzip僅本機）。

**SITEMAP BEFORE / AFTER:**

1454 / 1454（production baseline / local output）。Invalid canonical/indexable200 members after=0；active empty errors after=0。

**INDEXABLE BEFORE / AFTER:**

1454 / 1454 canonical eligibility rows；主表以sitemap authority和compare為準，非Google索引數。

**NOINDEX BEFORE / AFTER:**

2 / 2；source政策沒有重開或移除。

**4XX BEFORE / AFTER:**

0 / 0 content routes；CF email endpoint原raw404為INFO，source mailto+Cloudflare transformation，保留raw證據。

**5XX BEFORE / AFTER:**

0 / 0。

**BROKEN LINKS BEFORE / AFTER:**

0 / 0 content edges。

**SHORT DESCRIPTION BEFORE / AFTER:**

769 / 767（en120/zh70 advisory；不為字數改無關內容）。

**DUPLICATE DESCRIPTION BEFORE / AFTER:**

0 / 0。

**TITLE ISSUES BEFORE / AFTER:**

length signals 19 / 19；missing 0 / 0；duplicate 0 / 0。

**HREFLANG:**

after indexable groups anomalies=0；locale/canonical/robots比對維持；noindex private groups不當成索引缺陷。

**INDEXNOW:**

已實作差分+tests；INDEXNOW_KEY repository secret已安全設定，僅readback name，沒有把key寫入repo或報告。尚未部署公開verification file／真實提交；首deploy建立baseline0URLs。

**INTERNAL LINKS:**

after broken=0 / redirect edges=0；orphan-like=12為discovery signal，未批量footer補鏈。FunnyTools所有重要indexable有2+distinct來源（代表contextual需人讀）。

**BUILD:**

PASS (local logs)

**TESTS:**

完整 preflight PASS；final script tests（含 IndexNow）PASS；既有 local browser 27 runs與6 viewports PASS；calculator、product geometry、Phase3、entitlement與redirect tests PASS。

**SEO CRAWL:**

見 evidence/optimization-regression.json 或 evidence/regression.json；local comparison

**PRODUCTION READBACK:**

基線已取得；modified output未部署，NOT_VERIFIED_AFTER_DEPLOY。

**COMMIT:**

待最後測試後commit

**PR:**

待最後測試後Draft PR

**DEPLOYMENT:**

NOT_DEPLOYED；RoomFeng/WorthCalc須依公司規範由老闆審核PR。

**REMAINING RISKS:**

GSC匯出為三個月aggregate且最後日期10-04；沒有comparable final query-page分群與因果證據。rawCF edge與HTML content分開。RoomFeng crawl config未登入Ahrefs驗證。既有實驗歸因限制保留。

**WHAT BING SHOULD SEE NEXT:**

成功部署後重新crawl可取得修復後有效sitemap/摘要；告知變更是submission signal，不承諾warning即時消失。

**WHAT AHREFS SHOULD SEE NEXT:**

依Domain/Prefix範圍重新crawl，確認工具專案scope與crawl limits；intentional noindex不要求清零。

**MANUAL ACTION REQUIRED:**

Review concrete Draft PR；RoomFeng key已設定，部署後再驗證publickey/changed submit。

資料來源：使用者任務書、四份GSC ZIP、保存之production response與source。技術參考：[IndexNow protocol](https://www.indexnow.org/documentation)、[Google snippet guidance](https://developers.google.com/search/docs/appearance/snippet)。
