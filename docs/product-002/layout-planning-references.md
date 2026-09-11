---
name: product-002-layout-planning-references
status: phase-1-evidence
checked: 2026-09-11
---

# Layout planning references

這些資料只支持尺寸與規劃語境，不是建築法規；產品文案使用 `planning guideline`、`practical guideline` 或 `furniture-function requirement`，不使用 legal／illegal 判斷。

| 類別 | Source | Date checked | Source type | What it supports |
| --- | --- | --- | --- | --- |
| US mattress dimensions | [Casper Mattress Size Comparison Guide](https://casper.com/pages/mattress-size-comparison-guide) | 2026-09-11 | Manufacturer / established retailer reference | Twin 38×75 in、Twin XL 38×80 in、Full 53×75 in、Queen 60×80 in、King 76×80 in、California King 72×84 in；PRODUCT-002 只把它當 mattress footprint |
| Bed frame distinction | [Casper Bed Frame Size Guide](https://casper.com/blogs/article/bed-frame-size) | 2026-09-11 | Manufacturer reference | 床架可能比 mattress footprint 寬／長；schema 因此要求 `footprintBasis` 與 `frameAllowanceMm` |
| Metric mattress dimensions | [IKEA Germany mattress size guide](https://www.ikea.com/de/de/rooms/bedroom/leitfaden-fuer-matratzengroessen-pub63d34391/) | 2026-09-11 | Manufacturer reference | 80×200、90×200、100×200、140×200、160×200、180×200 cm 等 common metric / brand-market presets；不是 legal standard |
| Taiwan common mattress dimensions | [Fukurou Home Taiwan mattress product](https://www.fukurouhome.com.tw/zh-TW/products/zhumeng-mattress) | 2026-09-11 | Taiwan manufacturer / product reference | 3 尺 90×188、3.5 尺 105×188、5 尺 152×188、6 尺 182×188、6 尺加長 182×212；只標為 Taiwan common market size，購買前仍需核對品牌與床架 |
| Bed planning clearance | [Dimensions.com Queen Bedroom Layouts](https://www.dimensions.com/element/queen-bedroom-layouts) | 2026-09-11 | Established dimensions reference | 約 30 in minimum、36 in comfortable 的 bedroom planning guidance；產品只標為 guideline，不當建築碼 |
| Compact-room planning context | [Livingetc bedroom measurement guidance](https://www.livingetc.com/advice/measurements-to-know-for-a-better-bedroom-layout) | 2026-09-11 | Editorial / design reference | 床周圍與抽屜／衣櫃操作空間需要依家具功能保留；只作 practical guidance |
| Market comparison | [Etsy 10x10 Bedroom Layout Guide](https://www.etsy.com/listing/4458484279/1010-bedroom-layout-guide-printable) | 2026-09-11 | Competitor / editorial | 10×10 高意圖需求與靜態 PDF 交付存在；不可作 geometry truth |

## Regional preset policy

- US presets：標記 `mattress footprint`，實際床架由使用者確認；不把 mattress 寬度直接當 frame 寬度。
- Taiwan presets：`Taiwan common market size`，不是全球通用標準；品牌、床架與床墊仍要重新量測。
- European-style presets：`common metric / brand-market preset`，不是 European legal standard。
- 任何尺寸不確定時，custom size 優先於品牌／地區猜測。
