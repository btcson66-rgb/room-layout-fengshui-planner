/**
 * 聯盟行銷（affiliate）的唯一開關與唯一文案來源。
 *
 * 為什麼要集中：2026-09-05 之前 `AffiliateRecs.astro` 自己判斷
 * `PUBLIC_AFFILIATE_ENABLED`，而首頁「編輯與審查流程」區塊另外**寫死**
 * 「商品與聯盟推薦在 AdSense 重新審查期間預設關閉」。正式 build 沒有設這個
 * 環境變數 → 預設是開啟 → 線上同時出現「文字說關閉」與「實際顯示蝦皮／酷澎
 * 商品卡」，前後矛盾。任何頁面都不得再自行 hardcode 這件事的狀態。
 *
 * 開關規則（單一環境變數）：
 *   PUBLIC_AFFILIATE_ENABLED=false → 全站關閉商品模組、商品卡、affiliate 連結、
 *                                    揭露聲明，首頁說明同步改成「目前關閉」。
 *   其他值或未設定           → 開啟，首頁說明描述實際行為與揭露方式。
 *
 * 這個檔案不碰 GA4：affiliate 事件（affiliate_module_view / affiliate_item_view /
 * affiliate_click / affiliate_refresh）與其參數仍由 src/lib/affiliateAnalytics.ts
 * 負責，模組關閉時自然不會有可追蹤的互動，不需要也不應該改事件名稱或參數。
 */

export const AFFILIATE_ENABLED = import.meta.env.PUBLIC_AFFILIATE_ENABLED !== 'false';

/** 商品區塊底部的揭露聲明。開啟時才會輸出。 */
export const AFFILIATE_DISCLOSURE =
  'RoomFeng 的免費工具與內容優先；商品圖片為本站保存的公開商品圖，款式與顏色仍以商品頁為準。本區塊含蝦皮與酷澎聯盟行銷連結，透過連結購買時本站可能獲得分潤，不影響你的購買價格。價格標示為 2026-09-01 快照，客製或規格型商品可能顯示「依規格報價」；商品名稱、規格、庫存與其他資訊可能變動，請以商品頁為準。';

/** 首頁與 /about/ 的編輯政策說明，必須跟著開關走，不得各頁自行描述。 */
export const AFFILIATE_POLICY_LINE = AFFILIATE_ENABLED
  ? '文章與工具頁的商品推薦為蝦皮與酷澎聯盟行銷連結，區塊內會標示揭露；推薦不影響內容結論，也不會取代先量尺寸、先確認動線的建議。'
  : '商品與聯盟推薦目前全站關閉，任何頁面都不會顯示商品卡或聯盟連結。';
