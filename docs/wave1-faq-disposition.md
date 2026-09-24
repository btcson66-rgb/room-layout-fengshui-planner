# RoomFeng Wave 1 FAQ candidate disposition

證據定義：以下 GSC observed queries 僅證明查詢出現在提供的**站點層級** GSC 匯出；`faq-seeds.csv` 以 slug/語意配對產生候選，沒有 query × page 維度。合格題目另經人工核對該頁主要意圖與正文。因此本表稱為 **GSC-observed query + manually verified page-intent match**，不宣稱 Google 已證明查詢對應該 URL。

Gate：每頁至少 4 個互不重複、意圖相符且可實質回答的查詢才新增 FAQ。0–3 題正確略過，不算失敗；T1 30 頁凍結。Google FAQ rich result 已停用；Schema validity ≠ Google rich-result eligibility。

| URL | GSC observed queries | Semantic candidates | Qualified unique queries | Rejected queries | Rejection reason | FAQ implemented | Question count | Schema validation | Notes |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| /zh/blog/living-room-window-film-feng-shui/ | 客廳窗戶風水 | 客廳窗戶風水 | — | 客廳窗戶風水 | ANOMALOUS_QUERY | NO | 0 | N/A | 僅一個一般語意候選；另有任務明令排除的異常反光查詢，不納入 FAQ。 |
| /zh/blog/small-room-wardrobe-door-turning-clearance-feng-shui/ | 房門打開看到衣櫃；開門對衣櫃角；房間開門見衣櫃；開門對衣櫃；開門見衣櫃側邊；衣櫃可以對門嗎；開門見衣櫃好嗎；開門見衣櫃 | 房門打開看到衣櫃；開門對衣櫃角；房間開門見衣櫃；開門對衣櫃；開門見衣櫃側邊；衣櫃可以對門嗎；開門見衣櫃好嗎；開門見衣櫃 | 房門打開看到衣櫃；開門對衣櫃角；開門見衣櫃側邊；衣櫃可以對門嗎 | 房間開門見衣櫃；開門對衣櫃；開門見衣櫃好嗎；開門見衣櫃 | QUALIFIED | YES | 4 | PASS: Schema.org 0 errors / 0 warnings (2026-09-24) | 四種任務分別是入口視線、櫃角、櫃側與雙門可用性；其餘為同義改寫。 |
| /zh/blog/bedroom-bed-head-wall-power-outlet-feng-shui/ | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解；冷氣在床頭上方 | — | — | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解；冷氣在床頭上方 | QUERY_PAGE_MISMATCH | NO | 0 | N/A | 候選集中於床頭靠牆或冷氣，未問本頁主題插座與床頭牆。 |
| /zh/blog/bedroom-air-conditioner-wardrobe-clearance-feng-shui/ | 冷氣下可以放衣櫃嗎；冷氣在床頭上方；客廳冷氣位置風水；冷氣在床側邊；冷氣室外機擺放位置風水；冷氣在頭上風水；床頭上方有冷氣；冷氣裝在床頭上 | 冷氣下可以放衣櫃嗎 | 冷氣下可以放衣櫃嗎 | 冷氣在床頭上方；客廳冷氣位置風水；冷氣在床側邊；冷氣室外機擺放位置風水；冷氣在頭上風水；床頭上方有冷氣；冷氣裝在床頭上 | INSUFFICIENT_QUERY_EVIDENCE | NO | 0 | N/A | 其餘偏床頭、客廳或室外機，不能搬進衣櫃淨空頁。 |
| /zh/blog/air-conditioner-bedroom-layout/ | 冷氣室外機擺放位置風水；冷氣在床頭上方；客廳冷氣位置風水；冷氣在床側邊；冷氣在頭上風水；床頭上方有冷氣；冷氣裝在床頭上；冷氣下可以放衣櫃嗎 | 冷氣在床頭上方；冷氣在床側邊；冷氣在頭上風水；床頭上方有冷氣；冷氣裝在床頭上；冷氣下可以放衣櫃嗎 | 冷氣在床頭上方；冷氣在床側邊；冷氣在頭上風水；冷氣下可以放衣櫃嗎 | 冷氣室外機擺放位置風水；客廳冷氣位置風水；床頭上方有冷氣；冷氣裝在床頭上 | QUALIFIED | YES | 4 | PASS: Schema.org 0 errors / 0 warnings (2026-09-24) | 分別回答床頭位置、床側風路、民俗解讀及高櫃維修；其他床頭措辭重複，客廳與室外機不屬本頁。 |
| /zh/storage-bed-selector/ | 掀床收納；小坪數收納床規劃 | 掀床收納；小坪數收納床規劃 | 掀床收納；小坪數收納床規劃 | — | INSUFFICIENT_QUERY_EVIDENCE | NO | 0 | N/A | 兩個不同候選，未達四題；工具既有內容照常保留。 |
| /zh/blog/bed-head-against-wall-small-room-wardrobe-zone-feng-shui/ | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解；床頭衣櫃風水 | 床頭衣櫃風水 | 床頭衣櫃風水 | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解 | QUERY_PAGE_MISMATCH | NO | 0 | N/A | 其他候選是一般床頭靠牆問題，不是此頁小房間衣櫃分區任務。 |
| /zh/blog/beam-over-bed-bunk-bed-clearance-feng-shui/ | 樑下床；鏡子對床側邊；冷氣在床頭上方；床頭靠窗怎麼辦；床左邊靠牆風水；床頭靠窗；衣櫃對床風水；床左邊靠牆怎麼辦 | 樑下床 | — | 樑下床；鏡子對床側邊；冷氣在床頭上方；床頭靠窗怎麼辦；床左邊靠牆風水；床頭靠窗；衣櫃對床風水；床左邊靠牆怎麼辦 | REDIRECTED_URL | NO | 0 | N/A | 此舊頁已轉址；其餘鏡子、冷氣、床窗查詢亦不匹配。 |
| /zh/blog/small-room-storage-shoes-entryway-capacity-feng-shui/ | 小房間 收納；小房間收納；玄關安全帽收納；小坪數收納床規劃 | 小房間 收納；小房間收納 | 小房間 收納 | 小房間收納；玄關安全帽收納；小坪數收納床規劃 | DUPLICATE_INTENT | NO | 0 | N/A | 有空格與無空格是同一搜尋意圖；安全帽與收納床是其他頁任務。 |
| /zh/blog/home-office-desk-window-opening-clearance-feng-shui/ | 書桌靠窗 | 書桌靠窗 | 書桌靠窗 | — | INSUFFICIENT_QUERY_EVIDENCE | NO | 0 | N/A | 僅一個相關查詢，未達四題。 |
| /zh/bed-desk-wardrobe-layout/ | 衣櫃對床風水；衣櫃對床尾；衣櫃對床；衣櫃可以對床嗎；衣櫃擺放位置；床尾對衣櫃；床頭衣櫃風水；床頭後面是衣櫃 | 衣櫃對床風水；衣櫃對床尾；衣櫃對床；衣櫃可以對床嗎；衣櫃擺放位置；床尾對衣櫃；床頭衣櫃風水；床頭後面是衣櫃 | 衣櫃對床風水；衣櫃對床尾；衣櫃可以對床嗎；衣櫃擺放位置 | 衣櫃對床；床尾對衣櫃；床頭衣櫃風水；床頭後面是衣櫃 | QUALIFIED | YES | 4 | PASS: Schema.org 0 errors / 0 warnings (2026-09-24) | 分別回答民俗解讀、床尾操作、對床可行性與櫃位比較；同義對床／床尾變體不另立題，床頭後櫃不由本頁回答。 |
| /zh/blog/bed-head-against-wall-bedside-access-feng-shui/ | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解；冷氣在床頭上方 | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解 | — | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解；冷氣在床頭上方 | DUPLICATE_INTENT | NO | 0 | N/A | 全是床頭靠牆主題的同義簇，且與本頁床側上下床走道主軸不同。 |
| /zh/blog/entryway-schoolbag-storage-feng-shui/ | 玄關安全帽收納 | — | — | 玄關安全帽收納 | QUERY_PAGE_MISMATCH | NO | 0 | N/A | 安全帽收納不是書包收納。 |
| /zh/blog/living-room-air-purifier-feng-shui/ | 客廳冷氣位置風水；客廳冷氣位置 | — | — | 客廳冷氣位置風水；客廳冷氣位置 | QUERY_PAGE_MISMATCH | NO | 0 | N/A | 冷氣位置不是空氣清淨機擺位。 |
| /zh/blog/bed-head-against-wall-pillow-gap-feng-shui/ | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解；冷氣在床頭上方 | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆 | — | 床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床頭要靠牆嗎；床頭沒有靠牆；床頭靠門牆化解；冷氣在床頭上方 | DUPLICATE_INTENT | NO | 0 | N/A | 同一床頭靠牆意圖的多種措辭；未針對本頁枕頭間隙提供四種獨立問題。 |
| /zh/blog/bedroom-bed-headboard-wall-clock-clearance-feng-shui/ | 床左邊靠牆風水；床左邊靠牆怎麼辦；床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床头老是晃动撞墙怎么办；時鐘對床尾 | 時鐘對床尾 | 時鐘對床尾 | 床左邊靠牆風水；床左邊靠牆怎麼辦；床頭不靠牆；床頭一定要靠牆嗎；床頭不靠牆化解；床頭靠牆；床头老是晃动撞墙怎么办 | INSUFFICIENT_QUERY_EVIDENCE | NO | 0 | N/A | 左側靠牆與床頭靠牆查詢屬其他意圖；本頁僅時鐘對床尾一題。 |
| /zh/blog/small-room-storage-lift-up-bed-opening-feng-shui/ | 小坪數收納床規劃；小房間 收納；小房間收納；掀床收納 | 小坪數收納床規劃；小房間 收納；小房間收納；掀床收納 | 小坪數收納床規劃；小房間 收納；掀床收納 | 小房間收納 | DUPLICATE_INTENT | NO | 0 | N/A | 小房間收納的空格變體不可拆成第四題；僅三個不同問題。 |
| /zh/blog/home-office-desk-chair-back-wall-clearance-feng-shui/ | 餐桌靠牆風水 | — | — | 餐桌靠牆風水 | QUERY_PAGE_MISMATCH | NO | 0 | N/A | 餐桌靠牆查詢不能搬到書桌椅背靠牆頁。 |
| /zh/blog/desk-placement-printer-ventilation-feng-shui/ | 書桌擺放位置圖 | 書桌擺放位置圖 | — | 書桌擺放位置圖 | QUERY_PAGE_MISMATCH | NO | 0 | N/A | 一般書桌位置圖未涵蓋本頁印表機與通風的主要意圖。 |

總計：19 reviewed candidates；3 qualified / implemented；16 evidence-gated skipped。

Reason breakdown：ANOMALOUS_QUERY 1；QUALIFIED 3；QUERY_PAGE_MISMATCH 6；INSUFFICIENT_QUERY_EVIDENCE 4；REDIRECTED_URL 1；DUPLICATE_INTENT 4。

三個實作頁的 Schema.org Validator 結果為本機 build JSON-LD 片段測試；正式站部署與 Google SERP 呈現不在此證據範圍。
