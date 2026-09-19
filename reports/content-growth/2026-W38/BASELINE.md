# RoomFeng Content Growth Loop — 2026-W38 BASELINE

建立日期：2026-09-19（Asia/Taipei）
Production：<https://roomfeng.win>
GSC property：`sc-domain:roomfeng.win`
GA4 property：`543532668`

## 生產 surface

| 檢查 | 結果 | 證據／限制 |
|---|---:|---|
| sitemap index | HTTP 200 | `https://roomfeng.win/sitemap-index.xml` |
| sitemap child count | 1 | `sitemap-0.xml` |
| sitemap URL count | 1,447 | 2026-09-19 live readback |
| `/zh/` | HTTP 200 | live readback |
| `/en/` | HTTP 200 | live readback |
| `/` | HTTP 200 | live readback |
| zh URLs | 1,403 | 依 live sitemap URL path 分類 |
| en URLs | 36 | 依 live sitemap URL path 分類 |
| other URLs | 8 | 依 live sitemap URL path 分類 |

Sitemap URL 數是可公開發現的 URL surface，不等於 Google 已索引 URL 數。這一輪沒有做 URL Inspection，因此逐 URL indexing status 為 `UNKNOWN`。

## GSC Search Analytics

官方週報（資料約延遲三天）涵蓋 2026-09-10–2026-09-16：

| 指標 | 本週 | 前週 |
|---|---:|---:|
| clicks | 309 | 311 |
| impressions | 13,501 | 14,510 |
| CTR | 2.3% | 2.1% |
| average position | 7.6 | 7.8 |

28 天分頁／查詢／國家／裝置／日期切片（2026-08-19–2026-09-16）顯示：

- 主要 query cluster 仍是繁中床位與實際動線問題：`床左邊靠牆風水`（33 impressions、position 5.70）、`床左邊靠牆怎麼辦`（22、5.23）、`床頭靠窗`（25、13.64）、`床頭一定要靠牆嗎`（14、8.43）、`床頭不靠牆化解`（18、9.17）。
- `5坪` 有 46 impressions、position 7.4；`5坪房間平面圖` 已有 query evidence，現有 5 坪內容 owner 應先觀察，不開同義新 URL。
- 最高曝光頁：`/zh/blog/bed-facing-door-feng-shui/`（961 impressions、21 clicks、CTR 2.19%、position 8.48）、`/zh/blog/bed-head-against-wall/`（859、21、2.44%、8.95）、`/zh/blog/desk-facing-door-layout/`（917、15、1.64%、7.47）。
- 國家切片的主要市場是 TW（17,586 impressions、471 clicks），其次 HK（2,999、77）；US 有 4,300 impressions、16 clicks，顯示 EN-US surface 有曝光但目前不足以支持大量新增英文內容。
- 裝置切片：mobile 19,249 impressions／528 clicks／position 7.24；desktop 11,155／134／9.29；tablet 233／5／7.24。後續內容 QA 應優先確認 mobile 首屏答案與表格可讀性。

以上切片的 query/page rows 是 bounded Search Analytics rows；週報 aggregate 才是本週總量來源，不以 row-limit 結果取代 aggregate。

## GA4、Cloudflare、AI observation

2026-W38 週報真實資料：

- GA4：23 active users、40 sessions、52 pageviews、35.0% engagement rate；前週為 195、223、281、56.5%。這是流量觀測，不用來推估搜尋需求。
- Cloudflare 28 天：91,360 requests、43,238 pageviews、15,941 unique visitors、507 threats blocked。
- Cloudflare AI crawler observation：本週共記錄多個自我識別 crawler，並有 745 筆疑似敏感路徑探測；這不是 GSC Generative AI exposure 證據。
- GSC Generative AI export／AI Search page rows：本輪沒有可用的第一方匯出，記錄為 `UNKNOWN`。Cloudflare crawler pages 只能作 crawl observation，不能宣稱 AI citation 或 AI Search 曝光。

## 內容 registry 與既有治理

- `src/content/blog/` 目前是既有大型內容 surface；`src/data/contentQuality.mjs` 負責 review-ready／held boundary。
- `src/data/wave2_content_clusters.json` 登記 32 個既有內容候選，不能視為本輪需求或自動發布佇列。
- `content-library/` 目前有 3 份 scheduled markdown；本輪沒有新增 scheduled page。
- 目前隔離 worktree 以 `origin/main`（`03128a5`）為基準；使用者原本 dirty branch 未讀寫、未 reset、未 stash。

## Baseline conclusion

本輪最強證據是既有繁中床位／書桌頁在 position 5–9 仍有曝光，但 CTR 偏低；因此先做三頁 `OPTIMIZE_EXISTING`。現有 5 坪與床側靠牆內容已能承接 query，不建立 keyword permutation pages。索引狀態、GSC AI Search 與持續轉化仍維持 `UNKNOWN`／`NOT YET EVALUATED`。
