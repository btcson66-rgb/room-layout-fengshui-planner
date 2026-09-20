# PRODUCT-002 Dataset Specification v0.1

狀態：`DRAFT / PHASE 1`。這份規格只供隔離 branch 開發與測試，尚未形成商品交付承諾。

## Canonical model

- 所有房間與家具尺寸、座標、clearance 使用整數或有限小數的 millimetres。
- 使用者輸入接受 `mm | cm | m | in | ft`，先轉換至 mm，再做 fit 判斷；顯示單位不影響排序。
- v1 幾何引擎支援 `rectangle` 與 `square`。`l-shape` 先保留在 schema，未完成 boundary polygon 前不得進 Approved。
- rotation 僅接受 `0 | 90 | 180 | 270`，拒絕任意角度以避免「看起來能放」但 bounding-box 與真實旋轉不一致。

## Record fields

每筆 `LayoutRecord` 必須有：`id`、`version`、`roomWidthMm`、`roomLengthMm`、`shape`、`areaMm2`、`localeBasis`、`furniture`、`zones`、`clearances`、`targetUses`、`priorityTags`、`warnings`、`qualityStatus`。

每件 `LayoutItem` 必須有：`id`、`type`、`widthMm`、`depthMm`、`xMm`、`yMm`、`rotationDeg`、`clearanceMm`；bed／desk／wardrobe 等可標記 `required`。門可另有 `swingMm`，窗戶視為不可被家具遮擋的 fixture。

## Validation contract

1. 房間與 item 尺寸必須為正且有限數值。
2. item 的旋轉 footprint 必須在 room boundary 內。
3. item 有面積重疊即 invalid；精確 edge contact 本身允許。
4. 明確宣告的 clearance 若與另一件家具 footprint 相交，回傳 `clearance-blocked`。
5. door swing／access 被家具遮擋回傳 `door-swing-blocked`；window 被家具遮擋回傳 `window-blocked`。
6. 任一 geometry issue 時，`qualityStatus` 不得升級為 `geometry-validated` 以上。

## Score contract

固定權重：geometry 40、required furniture 25、circulation 20、priorities 10、shape 5。所有結果保留 breakdown、why it matches、tradeoffs；不得只顯示一個未解釋的總分。

## Quality ladder

`generated → geometry-validated → functional-reviewed → visual-reviewed → approved`；任何 gate 失敗進入 `rejected` 並保留 `rejectionReason`。只有 `approved` 可以被 matcher、preview、ZIP 或 marketplace artifact 使用。v1 hard stop 是至少 30 個真正不同且 Approved 的 layouts；鏡像、改名或微小座標變更不算新 layout。

## Open evidence gates

- regional bed dimensions 與 imperial room-size keywords 仍是 `draft-preset`，需補來源與搜尋／GSC evidence 才能進正式 copy。
- 尚未定義 L-shape polygon、door opening orientation 的完整 schema、視覺 review checklist 與 30-layout diversity matrix。
- 尚未與既有 Planner 完成 import contract，也尚未建立 PRODUCT-002 analytics／entitlement namespace。
