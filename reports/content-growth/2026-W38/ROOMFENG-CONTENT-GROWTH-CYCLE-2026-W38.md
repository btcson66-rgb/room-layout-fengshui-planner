# ROOMFENG-CONTENT-GROWTH-CYCLE-2026-W38

## DISCOVERY

- GSC queries：繁中床位／門／書桌問題為主；最高機會集中在既有頁 position 5–9 的 CTR 改善，不是新 keyword 數量。
- AI Search：`UNKNOWN`。本輪沒有 GSC Generative AI export；Cloudflare crawler observation 不當作 citation 證據。
- SERP gaps：
  - `床左邊靠牆怎麼辦`：RoomFeng 已有 300 × 360 公分三方案、雙人／單人分流、換床單與七晚驗收；外部結果多為一般原則，保持既有 owner 並觀察。
  - `床頭一定要靠牆嗎`：RoomFeng 已有靠牆／靠窗／懸空判斷，但標題未直接使用問題句；本輪優化 title、description、H1 與首屏決策表。
  - `5坪房間平面圖`：已有 5 坪內容與坪數範本 owner；SERP 已出現 RoomFeng 兩個互補頁，不再建立 5 坪同義頁。
  - `書桌對門好嗎`：既有頁有 3 天紀錄與桌椅／門口動線模型；不拆正對、背對、斜對三頁。

## DECISIONS

### BUILD

0。沒有證據顯示本輪有一個「不能留在既有頁 H2」的新 user problem。`wave2_content_clusters.json` 的 32 個候選不自動升格為 BUILD。

### OPTIMIZE_EXISTING

3 個既有 URL，已在隔離 branch 產出候選改動：

1. `/zh/blog/bed-head-against-wall/`：對齊「床頭一定要靠牆嗎」query，加入三問決策表，保留床頭靠窗／床側靠牆的差異。
2. `/zh/blog/bed-facing-door-feng-shui/`：對齊「床對門怎麼辦／化解」query，標題與 H1 改成問題導向，保留床頭／床尾／床側單一 owner。
3. `/zh/blog/desk-facing-door-layout/`：對齊「書桌對門好嗎」query，標題與 H1 改成正對／背對／斜對的 decision framing。

### MERGE

0。`bed-head-against-wall` 與 `bedroom-bed-left-wall-access-feng-shui` 是相鄰而非同意圖：前者解答頭部支撐／靠窗／懸空，後者解答床側靠牆的兩側使用、清掃與夜間路徑；本輪不誤合併。

### OBSERVE

- `/zh/blog/tiny-room-layout-under-5-ping/` 與既有 5 坪 floor-plan owner：持續看 query/page split、CTR 與是否出現新的實際問題，不因 `5坪` 曝光就拆頁。
- EN-US：USA 有 4,300 impressions／16 clicks 的 28 天 country evidence，但目前只有 36 個 sitemap URLs；先查 exact page/query owner 與 shared shell stability，再決定是否優化英文既有頁。
- GSC URL Inspection、GSC Generative AI、T+7/T+14/T+28：尚未可判定，維持 `UNKNOWN`／`NOT YET EVALUATED`。

### REJECT

- 每個 query variation 一頁。
- 325／375／425／475 平方英尺或相鄰坪數 permutation。
- 把 Cloudflare crawler request 當 AI citation、排名或 conversion 證據。
- 在 shared page shell 尚未被另一個 UI/UX workflow 宣告穩定前，另造 page shell。

## CONTENT

- Approved：0 個新頁；0 個 scheduled page。
- Rejected：本輪候選 keyword-permutation pages 全部拒絕。
- Rewritten：3 個既有頁的本地 candidate edit；狀態為 `DRAFT`／PR review，尚未 production。
- Content score：新頁 `N/A`（本輪沒有 BUILD）；既有頁依既有內容品質治理與 targeted QA 驗證，不用分數替代 release gate。

## MARKET

- ZH：主要 evidence 來自 TW/HK 的床位、門、書桌與小房間 query；本輪優先 zh existing winners。
- EN-US：有曝光但量與 clicks 不足以支持大量新增；先觀察與補 exact page/query evidence。

## QUALITY

- Average score：`N/A`（沒有新頁 score cohort）。
- Lowest score：`N/A`。
- Duplicate audit：本輪只改三個既有 canonical owners；沒有新增 URL、slug、hreflang 或 sitewide link。
- Source audit：新增表格只整理既有可觀察條件，沒有新增統計、安全法規或醫療宣稱；既有 EPA／USFA／CDC／NIOSH／CPSC／NFPA 引用保留。
- Traditional Feng Shui boundary：三頁均把風水保留為民俗文化／空間舒適度參考，不承諾財運、健康、感情、專注力或其他結果。

## RELEASE

- Content bank：既有 `content-library/` 未新增檔案。
- Scheduled：0。
- Pages/day：0（本輪是 existing-page candidate，不是 publishing cohort）。
- Release status：local candidate only；待 PR review／merge 後才可進入既有 release workflow。未 push production、未提交 Google Request Indexing。

## PRODUCTION DELTA

- New URLs：0。
- Updated URLs：production 0；local candidate 3。
- Unexpected changes：0。產品原 dirty branch 未讀寫；本輪只在 `D:\Fable company\worktrees\roomfeng-content-growth-20260919` 變更。

## OBSERVATION

- T+7：`NOT DUE`，候選尚未 production。
- T+14：`NOT DUE`。
- T+28：`NOT DUE`。

## NEXT CYCLE

1. 若三頁正式上線，固定以同一 GSC query/page/date slice 於 T+7、T+14、T+28 比較 clicks、impressions、CTR、position；另查 URL Inspection，不能用 sitemap count 代替。
2. 先讀三頁 post-change evidence，再決定是否深化床位 cluster；若 CTR 沒改善，不用新增更多同義頁解決。
3. 對 EN-US 先做 exact page/query evidence 與 shell readiness check；沒有明確新 user problem 就不 BUILD。
