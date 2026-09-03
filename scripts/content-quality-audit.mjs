import fs from 'node:fs/promises';
import path from 'node:path';
import { reviewReadyBlogSlugs, reviewReadyCategorySlugs } from '../src/data/contentQuality.mjs';

const root = process.cwd();
const contentRoot = path.join(root, 'src', 'content', 'blog');
const distRoot = path.join(root, 'dist');
const failures = [];
const checks = [];
const expectedReviewReadyCount = 1270;
const expandedArticleRequirements = new Map([
  ['bed-facing-door-feng-shui', {
    required: [/15 分鐘/, /一晚/, /cdc\.gov\/sleep/i, /usfa\.fema\.gov/i, /cpsc\.gov/i, /\/disclaimer\//],
    forbidden: [/必定招|保證轉運|影響財運/],
  }],
  ['bed-under-window-solutions', {
    required: [/7 晚|七晚/, /epa\.gov/i, /260\s*×\s*300/],
    forbidden: [],
  }],
  ['air-conditioner-bedroom-layout', {
    required: [/紙條/, /energystar\.gov/i, /30 分鐘/, /3 晚/],
    forbidden: [/建議至少錯開\s*60\s*公分/],
  }],
  ['small-room-storage-zones', {
    required: [/30 件/, /cpsc\.gov/i, /防傾倒/, /7 天歸位測試/],
    forbidden: [],
  }],
  ['home-office-bedroom-layout', {
    minimumCharacters: 3200,
    required: [/7 天界線測試/, /osha\.gov\/etools\/computer-workstations\/components\/monitors/i, /270\s*×\s*330/, /視訊背景/],
    forbidden: [/保證專注|治療失眠|改善失眠/],
  }],
  ['long-narrow-bedroom-layout', {
    minimumCharacters: 3200,
    required: [/三條線測試/, /nfa\.gov\.tw/i, /240\s*×\s*420/, /直排版/],
    forbidden: [/法定走道|保證好住/],
  }],
  ['tiny-room-layout-under-5-ping', {
    minimumCharacters: 3200,
    required: [/功能預算/, /3\.3058/, /cpsc\.gov/i, /330\s*×\s*500/],
    forbidden: [/5\s*坪一定|保證收納/],
  }],
  ['sofa-back-door-window-feng-shui', {
    minimumCharacters: 3200,
    required: [/45 分鐘/, /240\s*×\s*360/, /AnchorItgov/i, /epa\.gov\/indoor-air-quality/i],
    forbidden: [/房屋能保證財運|房屋能保證健康|一定招財/],
  }],
  ['irregular-room-feng-shui-layout', {
    minimumCharacters: 3200,
    required: [/缺角/, /斜角/, /300\s*×\s*340/, /AnchorItgov/i, /一比一/],
    forbidden: [/缺角一定不好|保證好住|一定影響家人/],
  }],
  ['bed-direction-feng-shui', {
    minimumCharacters: 3200,
    required: [/東西南北/, /七晚/, /nfa\.gov\.tw/i, /320\s*×\s*300/],
    forbidden: [/方位一定旺|床頭一定吉利|一定改善睡眠/],
  }],
  ['tv-facing-bed-feng-shui', {
    minimumCharacters: 3200,
    required: [/七天/, /270\s*×\s*330/, /cpsc\.gov/i, /電視櫃/],
    forbidden: [/一定影響健康|保證感情|必定破財/],
  }],
  ['floor-mattress-feng-shui', {
    minimumCharacters: 3200,
    required: [/七天/, /300\s*×\s*300/, /epa\.gov\/indoor-air-quality/i, /床架/],
    forbidden: [/一定發霉|保證睡眠|必然潮濕/],
  }],
  ['bedroom-ceiling-light-feng-shui', {
    minimumCharacters: 3200,
    required: [/四場景/, /300\s*×\s*300/, /mtc\.ntnu\.edu\.tw/i, /床中央/],
    forbidden: [/一定招財|保證睡眠|必然壓床/],
  }],
  ['entryway-shoe-cabinet-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /大門開啟/, /玄關/, /furniture-fit-checker/i],
    forbidden: [/房屋能保證財運|房屋能保證健康|一定旺/],
  }],
  ['bedroom-wardrobe-door-hinge-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*320/, /衣櫃鉸鏈/, /固定/, /七日/],
    forbidden: [/一定改善睡眠|必然招財|保證不傾倒/],
  }],
  ['bathroom-washbasin-faucet-handle-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/150\s*×\s*220/, /洗手台水龍頭把手/, /水龍頭/, /七日/],
    forbidden: [/一定化煞|必然旺財|保證無細菌/],
  }],
  ['entryway-shoe-cabinet-hinge-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*90/, /鞋櫃鉸鏈/, /固定/, /七日/],
    forbidden: [/一定聚財|必然擋煞|保證不發霉/],
  }],
  ['bedroom-wardrobe-shelf-liner-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /衣櫃層板墊/, /灰塵/, /七日/],
    forbidden: [/一定防霉|必然聚財|保證不受潮/],
  }],
  ['bathroom-washbasin-soap-dispenser-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/120\s*×\s*180/, /洗手乳瓶/, /肥皂/, /七日/],
    forbidden: [/保證無細菌|一定化煞|必然旺財/],
  }],
  ['entryway-shoe-cabinet-shelf-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*120/, /鞋櫃層板/, /固定/, /七日/],
    forbidden: [/一定聚財|必然擋煞|保證不發霉/],
  }],
  ['kitchen-sink-faucet-base-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /水龍頭底座/, /漏水/, /七日/],
    forbidden: [/一定招財|必然聚財|保證不漏水/],
  }],
  ['bathroom-washbasin-toothbrush-cup-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/130\s*×\s*170/, /牙刷杯/, /杯底/, /七日/],
    forbidden: [/一定化煞|必然旺財|保證口腔健康/],
  }],
  ['entryway-shoe-cabinet-door-panel-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/200\s*×\s*140/, /鞋櫃門板/, /固定/, /七日/],
    forbidden: [/一定聚財|必然擋煞|保證不刮傷/],
  }],
  ['living-room-sofa-leg-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*360/, /沙發椅腳/, /穩固/, /七日/],
    forbidden: [/一定聚財|必然改善關係|保證不搖晃/],
  }],
  ['bedroom-bed-frame-foot-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*320/, /床架床腳/, /灰塵/, /七日/],
    forbidden: [/一定改善睡眠|必然招財|保證不過敏/],
  }],
  ['balcony-floor-drain-grate-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /陽台排水格柵/, /積水/, /七日/],
    forbidden: [/一定化煞|必然旺財|保證不淹水/],
  }],
  ['dining-room-chair-leg-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*320/, /餐椅椅腳/, /穩定/, /七日/],
    forbidden: [/一定聚財|必然改善關係|保證不搖晃/],
  }],
  ['bathroom-towel-ring-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*240/, /毛巾環/, /皂垢/, /七日/],
    forbidden: [/一定化煞|必然旺財|保證不發霉/],
  }],
  ['balcony-flower-pot-tray-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /花盆托盤/, /積水/, /七日/],
    forbidden: [/一定招財|必然防蚊|保證不漏水/],
  }],
  ['living-room-light-switch-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /電燈開關/, /斷電/, /七日/],
    forbidden: [/一定招財|必然旺運|保證不跳電/],
  }],
  ['bedroom-pillow-edge-seam-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*320/, /枕頭邊緣/, /縫線/, /七日/],
    forbidden: [/一定改善睡眠|必然除蟎|保證不過敏/],
  }],
  ['kitchen-food-container-seal-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /保鮮盒密封圈/, /乾燥/, /七日/],
    forbidden: [/一定保鮮|必然招財|保證不漏液/],
  }],
  ['bedroom-headboard-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*320/, /床頭板/, /牆面/, /七日/],
    forbidden: [/一定改善睡眠|必然除蟎|保證不發霉/],
  }],
  ['bathroom-toilet-paper-holder-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/150\s*×\s*220/, /衛生紙架/, /紙卷/, /七日/],
    forbidden: [/一定化煞|必然旺財|保證不受潮/],
  }],
  ['kitchen-wooden-spatula-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /木製鍋鏟/, /乾燥/, /七日/],
    forbidden: [/一定旺火|必然招財|保證不發霉/],
  }],
  ['bedroom-bedside-table-leg-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*320/, /床邊桌/, /桌腳/, /七日/],
    forbidden: [/一定改善睡眠|必然安床|保證不搖晃/],
  }],
  ['bathroom-shower-curtain-rod-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*240/, /浴簾桿/, /通風/, /七日/],
    forbidden: [/一定防霉|必然聚氣|保證不掉落/],
  }],
  ['kitchen-pot-lid-handle-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*190/, /鍋蓋把手/, /蒸氣/, /七日/],
    forbidden: [/一定聚財|必然旺火|保證不燙傷/],
  }],
  ['bedroom-mattress-side-seam-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*330/, /床墊側邊/, /通風/, /七日/],
    forbidden: [/一定改善睡眠|必然除蟎|保證不過敏/],
  }],
  ['bathroom-shower-hose-connector-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/170\s*×\s*230/, /軟管接頭/, /漏水/, /七日/],
    forbidden: [/一定防漏|必然聚財|保證不漏水/],
  }],
  ['kitchen-pot-rim-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*200/, /鍋具邊緣/, /塗層/, /七日/],
    forbidden: [/一定聚財|必然旺火|保證不刮傷/],
  }],
  ['living-room-rug-edge-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /地毯邊緣/, /止滑/, /七日/],
    forbidden: [/一定招財|必然防跌|保證不過敏/],
  }],
  ['entryway-doorframe-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /門框/, /開門/, /七日/],
    forbidden: [/一定招財|必然納氣|保證不掉漆/],
  }],
  ['kitchen-sink-drain-basket-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /水槽濾籃/, /排水/, /七日/],
    forbidden: [/一定聚財|必然通水|保證不堵塞/],
  }],
  ['bathroom-shower-threshold-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/170\s*×\s*230/, /淋浴門檻/, /防滑/, /七日/],
    forbidden: [/一定防漏|必然聚氣|保證不滑倒/],
  }],
  ['bedroom-bedside-table-under-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*320/, /床邊桌底部/, /電線/, /七日/],
    forbidden: [/一定改善睡眠|必然安床|保證不絆倒/],
  }],
  ['kitchen-cabinet-bottom-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /櫥櫃踢腳板/, /潮氣/, /七日/],
    forbidden: [/一定聚財|必然防蟲|保證不漏水/],
  }],
  ['living-room-curtain-rail-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*480/, /窗簾軌道/, /採光/, /七日/],
    forbidden: [/一定聚財|必然進氣|保證不發霉/],
  }],
  ['bedroom-bed-frame-slat-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*330/, /排骨條/, /支撐/, /七日/],
    forbidden: [/一定改善睡眠|必然安床|保證不受潮/],
  }],
  ['bathroom-shower-door-track-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*220/, /淋浴門滑軌/, /防滑/, /七日/],
    forbidden: [/一定防漏|必然聚氣|保證不滑倒/],
  }],
  ['living-room-ceiling-light-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /天花板燈具/, /照明/, /七日/],
    forbidden: [/一定聚財|必然明堂|保證不閃爍/],
  }],
  ['bedroom-bedside-floor-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*320/, /床邊地板/, /地墊/, /七日/],
    forbidden: [/一定改善睡眠|必然安床|保證不滑倒/],
  }],
  ['bathroom-shower-door-hinge-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*220/, /淋浴門鉸鏈/, /防滑/, /七日/],
    forbidden: [/一定防漏|必然聚氣|保證不夾手/],
  }],
  ['living-room-ceiling-fan-blade-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /吊扇葉片/, /斷電/, /七日/],
    forbidden: [/一定聚財|必然順氣|保證不晃動/],
  }],
  ['bedroom-wardrobe-back-panel-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*330/, /衣櫃背板/, /潮氣/, /七日/],
    forbidden: [/一定改善睡眠|必然留氣|保證不發霉/],
  }],
  ['bathroom-washbasin-faucet-aerator-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*220/, /起泡器/, /漏水/, /七日/],
    forbidden: [/一定聚財|必然節水|保證不漏水/],
  }],
  ['living-room-window-blind-rail-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /百葉窗軌道/, /拉繩/, /七日/],
    forbidden: [/一定聚財|必然進氣|保證不纏繞/],
  }],
  ['kitchen-range-hood-baffle-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /抽油煙機擋油板/, /排煙/, /七日/],
    forbidden: [/一定聚財|必然排煙|保證不失火/],
  }],
  ['bathroom-shower-drain-cover-cleaning-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*220/, /淋浴地漏蓋/, /排水/, /七日/],
    forbidden: [/一定防臭|必然聚財|保證不堵塞/],
  }],
  ['stove-facing-door-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /nfa\.gov\.tw/i, /epa\.gov/i, /排油煙/],
    forbidden: [/一定聚財|保證健康|水火沖一定/],
  }],
  ['living-room-coffee-table-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*360/, /紙膠帶/, /30–45/, /圓形/],
    forbidden: [/房屋能保證財運|一定旺|必然聚氣/],
  }],
  ['dining-table-facing-door-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*360/, /端菜/, /nfa\.gov\.tw/i, /紙膠帶/],
    forbidden: [/一定破財|房屋能保證財運|必然漏財/],
  }],
  ['wardrobe-facing-bed-feng-shui', {
    minimumCharacters: 3200,
    required: [/270\s*×\s*330/, /七天/, /cpsc\.gov/i, /鏡面/],
    forbidden: [/一定影響睡眠|保證感情|必然破財/],
  }],
  ['toilet-door-facing-living-room-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /epa\.gov/i, /排風/, /七天/],
    forbidden: [/一定破財|房屋能保證健康|必然漏財/],
  }],
  ['tv-facing-window-living-room-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*420/, /反光/, /cpsc\.gov/i, /紙箱/],
    forbidden: [/一定破財|房屋能保證健康|必然聚財/],
  }],
  ['dining-table-beam-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /紙膠帶/, /吊燈/, /樑/],
    forbidden: [/一定壓運|保證財運|必然破財/],
  }],
  ['bedroom-curtain-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*330/, /七天/, /遮光/, /隱私/],
    forbidden: [/一定旺|保證睡眠|必然聚財/],
  }],
  ['kitchen-island-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*360/, /排煙/, /水槽/, /紙箱/],
    forbidden: [/一定聚財|保證健康|水火沖一定/],
  }],
  ['living-room-air-conditioner-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*420/, /排水/, /直吹/, /三天/],
    forbidden: [/一定破財|房屋能保證健康|必然漏財/],
  }],
  ['dining-room-mirror-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /反射/, /眩光/, /紙板/],
    forbidden: [/一定招財|房屋能保證財運|必然漏財/],
  }],
  ['entryway-screen-feng-shui', {
    minimumCharacters: 3200,
    required: [/220\s*×\s*300/, /採光/, /通風/, /紙箱/],
    forbidden: [/一定聚財|房屋能保證財運|必然化煞/],
  }],
  ['living-room-fish-tank-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*420/, /水質/, /用電/, /魚缸/],
    forbidden: [/一定招財|房屋能保證財運|必然聚氣/],
  }],
  ['bedroom-foot-of-bed-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*330/, /床尾/, /衣櫃/, /七晚/],
    forbidden: [/一定改善睡眠|保證感情|必然破財/],
  }],
  ['living-room-rug-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*360/, /防滑/, /清潔/, /紙膠帶/],
    forbidden: [/一定聚財|房屋能保證健康|必然化煞/],
  }],
  ['balcony-feng-shui-layout', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*300/, /排水/, /通風/, /盆栽/, /紙箱/],
    forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
  }],
  ['kitchen-fridge-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /散熱/, /開門/, /LG/],
    forbidden: [/一定聚財|保證健康|水火沖一定/],
  }],
  ['living-room-column-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*400/, /柱角/, /走道/, /紙箱/],
    forbidden: [/一定化煞|房屋能保證財運|必然破財/],
  }],
  ['kitchen-door-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /油煙/, /通風/, /紙箱/],
    forbidden: [/一定聚財|房屋能保證健康|必然化煞/],
  }],
  ['entryway-doormat-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*220/, /防滑/, /清潔/, /七天/],
    forbidden: [/一定招財|房屋能保證財運|必然聚氣/],
  }],
  ['bathroom-mirror-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /防潮/, /通風/, /紙板/],
    forbidden: [/一定招財|房屋能保證健康|必然化煞/],
  }],
  ['dining-sideboard-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*330/, /固定/, /餐具/, /紙箱/],
    forbidden: [/一定聚財|房屋能保證財運|必然旺家/],
  }],
  ['living-room-floor-lamp-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*420/, /電線/, /眩光/, /七天/],
    forbidden: [/一定招財|房屋能保證事業|必然聚氣/],
  }],
  ['bedroom-bookshelf-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /固定/, /落塵/, /紙箱/],
    forbidden: [/一定旺學業|房屋能保證睡眠|必然文昌/],
  }],
  ['living-room-curtain-feng-shui', {
    minimumCharacters: 3200,
    required: [/320\s*×\s*420/, /隱私/, /西曬/, /拉繩/],
    forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
  }],
  ['bathroom-shower-door-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /乾濕分離/, /防滑/, /通風/],
    forbidden: [/一定化煞|房屋能保證健康|必然聚財/],
  }],
  ['laundry-room-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /排水/, /通風/, /洗衣籃/],
    forbidden: [/一定旺家|房屋能保證財運|必然聚財/],
  }],
  ['living-room-bookshelf-feng-shui', {
    minimumCharacters: 3200,
    required: [/320\s*×\s*400/, /固定/, /落塵/, /紙箱/],
    forbidden: [/一定旺學業|房屋能保證工作|必然文昌/],
  }],
  ['kitchen-window-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /爐具/, /油煙/, /開窗/],
    forbidden: [/一定聚財|房屋能保證健康|必然化煞/],
  }],
  ['living-room-plant-feng-shui', {
    minimumCharacters: 3200,
    required: [/320\s*×\s*400/, /採光/, /澆水/, /寵物/],
    forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
  }],
  ['dining-room-lighting-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /眩光/, /吊燈/, /端菜/],
    forbidden: [/一定聚財|房屋能保證健康|必然旺家/],
  }],
    ['bedroom-rug-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /防滑/, /清潔/, /七晚/],
      forbidden: [/一定旺財|房屋能保證睡眠|必然聚氣/],
    }],
    ['living-room-ceiling-fan-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*380/, /風向/, /清潔/, /兒童/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-range-hood-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /油煙/, /補風/, /濾網/],
      forbidden: [/一定聚財|房屋能保證健康|必然旺家/],
    }],
    ['entryway-wet-shoes-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /防滑/, /乾燥/, /雨傘/],
      forbidden: [/一定旺財|房屋能保證安全|必然聚氣/],
    }],
    ['bathroom-toilet-ventilation-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /通風/, /異味/, /清潔/],
      forbidden: [/一定化煞|房屋能保證健康|必然聚財/],
    }],
    ['bedside-table-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床頭櫃/, /電線/, /夜間/],
      forbidden: [/一定旺感情|房屋能保證睡眠|必然聚財/],
    }],
    ['living-room-tv-console-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /固定/, /反光/, /電線/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-air-purifier-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /濾網/, /臭氧/, /七天/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-sink-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /排水/, /濺水/, /水槽/],
      forbidden: [/一定聚財|房屋能保證健康|水火沖一定/],
    }],
    ['bedroom-mattress-height-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*330/, /床墊/, /上下床/, /三晚/],
      forbidden: [/一定旺|保證睡眠|必然聚財/],
    }],
    ['entryway-bench-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /穿鞋椅/, /起身/, /五天/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-garbage-bin-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*310/, /廚餘/, /有蓋/, /七天/],
      forbidden: [/一定聚財|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-window-feng-shui', {
      minimumCharacters: 3200,
      required: [/330\s*×\s*420/, /窗戶/, /通風/, /七天/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-side-table-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*380/, /邊桌/, /電線/, /六天/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-upper-cabinet-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*330/, /吊櫃/, /固定/, /油煙/],
      forbidden: [/一定聚財|房屋能保證健康|必然壓樑/],
    }],
    ['entryway-package-drop-zone-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*260/, /包裹/, /紙箱/, /六天/],
      forbidden: [/一定招財|房屋能保證安全|必然聚氣/],
    }],
    ['entryway-coat-rack-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*280/, /衣帽架/, /掛鉤/, /六天/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-spice-rack-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*320/, /調味料架/, /油污/, /七天/],
      forbidden: [/一定聚財|房屋能保證健康|水火沖一定/],
    }],
    ['living-room-wall-art-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /掛畫/, /固定/, /七天/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-charging-station-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*330/, /充電/, /電線/, /五晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['laundry-hamper-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /洗衣籃/, /濕衣/, /七天/],
      forbidden: [/一定招財|房屋能保證健康|必然去濁/],
    }],
    ['dining-chair-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /餐椅/, /起身/, /六天/],
      forbidden: [/一定旺|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-window-blinds-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /百葉窗/, /拉繩/, /六晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-towel-rack-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /毛巾架/, /濕毛巾/, /七天/],
      forbidden: [/一定招財|房屋能保證健康|必然去濁/],
    }],
    ['living-room-footstool-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*380/, /腳凳/, /沙發/, /六天/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['entryway-umbrella-stand-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /雨傘架/, /濕傘/, /七日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-dish-rack-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /瀝水架/, /碗盤/, /五日/],
      forbidden: [/一定招財|房屋能保證健康|必然水火相沖/],
    }],
    ['bedroom-wardrobe-lighting-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /衣櫃/, /燈具/, /六晚/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-bath-mat-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /防滑墊/, /止滑/, /七日/],
      forbidden: [/一定改善健康|房屋能保證健康|必然去濁/],
    }],
    ['kitchen-microwave-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*310/, /微波爐/, /插座/, /五日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['home-office-desk-lamp-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /檯燈/, /螢幕/, /六日/],
      forbidden: [/一定提升專注|房屋能保證健康|必然旺文昌/],
    }],
    ['balcony-clothes-rack-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*260/, /曬衣架/, /防墜/, /六日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['entryway-key-tray-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /鑰匙盤/, /備用鑰匙/, /七日/],
      forbidden: [/一定旺財|房屋能保證健康|必然鎖財/],
    }],
    ['kitchen-water-dispenser-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /飲水機/, /漏水/, /六日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-oven-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*320/, /電烤箱/, /烤盤/, /五日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-space-heater-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /電暖器/, /棉被/, /六晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['entryway-stroller-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /嬰兒車/, /逃生/, /七日/],
      forbidden: [/一定旺|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-rice-cooker-feng-shui', {
      minimumCharacters: 3200,
      required: [/230\s*×\s*300/, /電子鍋/, /專用插座/, /五日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-fan-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /電風扇/, /窗簾/, /六晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-play-mat-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /遊戲墊/, /防滑/, /七日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-toilet-paper-holder-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /衛生紙架/, /防潮/, /五日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['entryway-pet-leash-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /牽繩/, /扣環/, /七日/],
      forbidden: [/一定旺|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-high-chair-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /兒童用高腳椅/, /安全帶/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-shower-curtain-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /浴簾/, /防滑/, /五日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['entryway-bicycle-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*260/, /腳踏車/, /逃生/, /七日/],
      forbidden: [/一定旺|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-baby-gate-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /嬰兒安全門/, /固定/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-air-fryer-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /氣炸鍋/, /散熱/, /五日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-humidifier-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /加濕器/, /濕度/, /六晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-folding-table-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /折合桌/, /鎖定/, /七日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-toaster-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /烤麵包機/, /散熱/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['entryway-robot-vacuum-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*260/, /掃地機器人/, /充電座/, /六日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-drying-rack-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /曬衣架/, /通風/, /七日/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-dishwasher-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /洗碗機/, /排水/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-shower-stool-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /淋浴椅/, /防滑/, /六日/],
      forbidden: [/一定改善健康|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-projector-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /投影機/, /散熱/, /七日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-coffee-machine-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /咖啡機/, /蒸氣/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-hair-dryer-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /吹風機/, /潮濕/, /五日/],
      forbidden: [/一定改善健康|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-exercise-bike-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /室內腳踏車/, /踩踏/, /七日/],
      forbidden: [/一定減重|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-blender-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /果汁機/, /高速刀片/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-electric-blanket-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /電熱毯/, /平鋪/, /六晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-bidet-seat-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /免治馬桶座|電子式馬桶/, /防水/, /六日/],
      forbidden: [/一定改善健康|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-induction-cooker-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /電磁爐/, /專用插座/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-air-purifier-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /空氣清淨機/, /臭氧/, /六晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-dehumidifier-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /除濕機/, /散熱/, /六日/],
      forbidden: [/一定改善健康|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-pressure-cooker-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /壓力鍋/, /洩氣/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bedroom-electric-mosquito-repellent-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /電蚊香/, /通風/, /六晚/],
      forbidden: [/一定改善睡眠|房屋能保證健康|必然聚氣/],
    }],
    ['entryway-doorbell-camera-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /門鈴攝影機|門口攝影機/, /隱私/, /七日/],
      forbidden: [/一定防盜|房屋能保證安全|必然聚氣/],
    }],
    ['kitchen-electric-kettle-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /快煮壺|電熱水壺/, /水位/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['laundry-washing-machine-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*260/, /洗衣機/, /接地/, /六日/],
      forbidden: [/一定改善健康|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-water-heater-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /熱水器/, /通風/, /七日/],
      forbidden: [/一定改善健康|房屋能保證安全|必然聚氣/],
    }],
    ['kitchen-electric-hot-pot-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*360/, /電火鍋/, /乾燒/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-medicine-cabinet-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /藥櫃/, /濕熱/, /七日/],
      forbidden: [/一定改善健康|房屋能保證健康|必然治癒/],
    }],
    ['entryway-fire-extinguisher-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /滅火器/, /逃生/, /五日/],
      forbidden: [/一定防火|房屋能保證安全|必然鎮火/],
    }],
    ['living-room-extension-cord-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*420/, /延長線/, /散熱/, /五日/],
      forbidden: [/一定旺財|房屋能保證安全|必然聚氣/],
    }],
    ['bedroom-baby-monitor-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /嬰兒監視器/, /3 英尺/, /七晚/],
      forbidden: [/一定改善睡眠|房屋能保證安全|必然守護/],
    }],
    ['balcony-plant-shelf-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*300/, /植栽架|花架/, /防墜/, /六日/],
      forbidden: [/一定招財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-electric-griddle-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*330/, /電烤盤/, /集油盤/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['bathroom-electric-heater-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /電暖器/, /防水/, /六日/],
      forbidden: [/一定改善健康|房屋能保證安全|必然聚氣/],
    }],
    ['entryway-luggage-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /行李箱/, /逃生/, /七日/],
      forbidden: [/一定帶來遠行|房屋能保證安全|必然聚氣/],
    }],
    ['bathroom-floor-drain-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /地漏/, /水封/, /七日/],
      forbidden: [/一定聚財|房屋能保證健康|必然排走壞運/],
    }],
    ['bedroom-smoke-alarm-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /住警器|住宅用火災警報器/, /誤報/, /六晚/],
      forbidden: [/一定叫醒|房屋能保證安全|必然守護/],
    }],
    ['kitchen-sandwich-maker-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /熱壓吐司機/, /鉸鏈/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['home-office-printer-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /印表機/, /散熱/, /五日/],
      forbidden: [/一定升職|房屋能保證健康|必然旺文/],
    }],
    ['living-room-wifi-router-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*330/, /路由器/, /散熱/, /七日/],
      forbidden: [/一定網速|房屋能保證健康|必然聚氣/],
    }],
    ['balcony-gas-cylinder-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*240/, /瓦斯桶/, /通風/, /六日/],
      forbidden: [/一定旺財|房屋能保證平安|必然鎮火/],
    }],
    ['bedroom-smart-speaker-feng-shui', {
      minimumCharacters: 3200,
      required: [/210\s*×\s*300/, /智慧音箱/, /隱私/, /四日/],
      forbidden: [/一定好眠|房屋能保證健康|必然旺感情/],
    }],
    ['home-office-monitor-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /電腦螢幕/, /反光/, /五日/],
      forbidden: [/一定升職|房屋能保證視力|必然旺學/],
    }],
    ['balcony-air-conditioner-outdoor-unit-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*260/, /室外機/, /散熱/, /六日/],
      forbidden: [/一定降溫|房屋能保證健康|必然旺家運/],
    }],
    ['entryway-electric-bicycle-charging-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /電動自行車/, /充電/, /五日/],
      forbidden: [/一定平安|房屋能保證健康|必然旺財/],
    }],
    ['kitchen-gas-stove-ventilation-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /瓦斯爐/, /通風/, /七日/],
      forbidden: [/一定旺財|房屋能保證健康|必然旺家/],
    }],
    ['bathroom-toothbrush-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /牙刷/, /乾燥/, /四日/],
      forbidden: [/一定健康|房屋能保證口才|必然旺感情/],
    }],
    ['living-room-tv-viewing-distance-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*360/, /觀看距離/, /電視/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['laundry-detergent-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*240/, /洗衣精/, /陰涼乾燥/, /五日/],
      forbidden: [/一定去穢|房屋能保證健康|必然洗淨/],
    }],
    ['bedroom-water-bottle-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/210\s*×\s*300/, /水瓶/, /防漏/, /四日/],
      forbidden: [/一定好眠|房屋能保證健康|必然旺財/],
    }],
    ['entryway-helmet-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /安全帽/, /乾燥通風/, /五日/],
      forbidden: [/一定平安|房屋能保證健康|必然旺財/],
    }],
    ['bathroom-electric-toothbrush-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /電動牙刷/, /防濺/, /四日/],
      forbidden: [/一定健康|房屋能保證口腔|必然旺財/],
    }],
    ['living-room-candle-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*330/, /蠟燭/, /火源/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['kitchen-thermos-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/210\s*×\s*270/, /保溫瓶/, /防漏/, /五日/],
      forbidden: [/一定旺財|房屋能保證健康|必然聚氣/],
    }],
    ['living-room-diffuser-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*330/, /擴香器/, /通風/, /六日/],
      forbidden: [/一定旺財|房屋能保證健康|必然淨化/],
    }],
    ['entryway-raincoat-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /雨衣/, /晾乾/, /五日/],
      forbidden: [/一定平安|房屋能保證健康|必然擋煞/],
    }],
    ['kitchen-sponge-cloth-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /海綿/, /抹布/, /乾燥/, /五日/],
      forbidden: [/一定旺財|保證食品安全|必然去濁/],
    }],
    ['bedroom-window-condensation-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /結露/, /通風/, /六晚/],
      forbidden: [/一定健康|保證睡眠|必然化解/],
    }],
    ['living-room-smart-plug-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*420/, /智慧插座/, /額定負載/, /五日/],
      forbidden: [/一定旺財|保證節能|必然不起火/],
    }],
    ['bathroom-toilet-brush-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /馬桶刷/, /通風/, /五日/],
      forbidden: [/一定健康|保證除臭|必然除煞/],
    }],
    ['bedroom-bedding-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床包/, /乾燥/, /七日/],
      forbidden: [/一定好眠|必然安睡|必然和諧/],
    }],
    ['dining-table-napkin-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐巾紙/, /餐具/, /五日/],
      forbidden: [/一定旺家|固定旺家|必然聚財/],
    }],
    ['balcony-drainage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*300/, /排水孔/, /防颱/, /五日/],
      forbidden: [/一定旺財|固定平安|必然防颱/],
    }],
    ['kitchen-reusable-shopping-bag-feng-shui', {
      minimumCharacters: 3200,
      required: [/210\s*×\s*270/, /環保購物袋/, /清洗/, /五日/],
      forbidden: [/一定聚財|固定帶財|必然聚財/],
    }],
    ['home-office-cable-management-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /線材/, /額定負載/, /五日/],
      forbidden: [/一定升遷|保證效率|必然聚財/],
    }],
    ['bedroom-mattress-protector-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /保潔墊/, /洗滌|洗燙/, /五日/],
      forbidden: [/一定好眠|保證防潮|必然旺財/],
    }],
    ['dining-room-water-pitcher-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /飲水壺/, /飲用水/, /五日/],
      forbidden: [/一定聚財|固定帶財|必然健康/],
    }],
    ['home-office-webcam-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /網路攝影機/, /隱私/, /五日/],
      forbidden: [/一定升遷|保證成交|必然聚財/],
    }],
    ['bedroom-pillow-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /枕頭/, /乾燥/, /五日/],
      forbidden: [/一定好眠|保證除蟎|必然旺財/],
    }],
    ['entryway-recycling-station-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*260/, /資源回收/, /分類/, /五日/],
      forbidden: [/一定招財|固定聚財|必然清淨/],
    }],
    ['home-office-headset-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /耳機/, /音量/, /五日/],
      forbidden: [/一定專注|保證升遷|必然開運/],
    }],
    ['kitchen-food-container-lid-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /保鮮盒/, /盒蓋/, /五日/],
      forbidden: [/一定聚財|保證保鮮|必然健康/],
    }],
    ['living-room-toy-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*420/, /玩具/, /適齡/, /五日/],
      forbidden: [/一定聰明|保證開運|必然旺家/],
    }],
    ['bathroom-hand-towel-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /擦手巾/, /乾燥/, /五日/],
      forbidden: [/一定健康|保證除菌|必然招財/],
    }],
    ['kitchen-cutting-board-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /砧板/, /生熟/, /五日/],
      forbidden: [/一定聚財|保證安全|必然健康/],
    }],
    ['bedroom-worn-clothes-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*330/, /穿過一次/, /通風/, /五日/],
      forbidden: [/一定好眠|保證防潮|必然除蟎/],
    }],
    ['entryway-schoolbag-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*260/, /書包/, /12\.5%|八分之一/, /五日/],
      forbidden: [/一定高分|保證學業|必然聰明/],
    }],
    ['kitchen-knife-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*290/, /刀具/, /生熟/, /五日/],
      forbidden: [/一定安全|保證防刀傷|必然聚財/],
    }],
    ['bedroom-suitcase-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*350/, /行李箱/, /臭蟲/, /五日/],
      forbidden: [/一定防臭蟲|保證好眠|必然旺財/],
    }],
    ['dining-room-tablecloth-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /桌巾/, /拉扯/, /五日/],
      forbidden: [/一定防燙|保證安全|必然旺家/],
    }],
    ['living-room-remote-control-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /遙控器/, /電池/, /五日/],
      forbidden: [/一定聚氣|保證省電|必然和氣/],
    }],
    ['bathroom-shower-slippers-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /拖鞋/, /防滑/, /五日/],
      forbidden: [/一定防滑|保證安全|必然平安/],
    }],
    ['balcony-folding-chair-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /摺疊椅/, /防颱/, /五日/],
      forbidden: [/一定防颱|保證不倒|必然旺家/],
    }],
    ['living-room-blanket-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/330\s*×\s*420/, /毛毯/, /乾燥/, /五日/],
      forbidden: [/一定保暖|保證健康|必然和氣/],
    }],
    ['entryway-hand-sanitizer-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*260/, /乾洗手/, /火源/, /五日/],
      forbidden: [/一定消毒|保證防火|必然淨宅/],
    }],
    ['bedroom-jewelry-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /珠寶/, /防潮/, /五日/],
      forbidden: [/一定招財|保證保值|必然守財/],
    }],
    ['bedroom-bedside-lamp-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床頭燈/, /眩光/, /五日/],
      forbidden: [/一定好眠|保證護眼|必然和氣/],
    }],
    ['kitchen-apron-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /圍裙/, /生熟/, /五日/],
      forbidden: [/一定防燙|保證衛生|必然聚財/],
    }],
    ['balcony-rainwater-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*320/, /儲水/, /加蓋/, /五日/],
      forbidden: [/一定招財|保證防蚊|必然聚氣/],
    }],
    ['bathroom-toilet-cleaner-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /清潔劑/, /混用|混合/, /五日/],
      forbidden: [/一定除菌|保證安全|必然淨宅/],
    }],
    ['laundry-ironing-board-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*260/, /熨衣板/, /熨斗/, /五日/],
      forbidden: [/一定防燙|保證安全|必然整齊/],
    }],
    ['living-room-cushion-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/330\s*×\s*360/, /坐墊/, /清潔/, /五日/],
      forbidden: [/一定舒適|保證健康|必然和氣/],
    }],
    ['kitchen-dish-towel-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /擦碗巾|抹布/, /乾燥/, /五日/],
      forbidden: [/一定衛生|保證健康|必然聚財/],
    }],
    ['home-office-ergonomic-chair-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /辦公椅/, /人體工學/, /六日/],
      forbidden: [/一定改善腰痛|保證不疲勞|必然升職/],
    }],
    ['living-room-pet-bed-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /寵物床/, /清潔/, /五日/],
      forbidden: [/一定旺財|保證健康|必然招財/],
    }],
    ['kitchen-food-waste-bin-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /廚餘桶/, /瀝水/, /五日/],
      forbidden: [/一定守財|保證除臭|必然聚財/],
    }],
    ['entryway-mail-sorting-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /信件/, /機敏/, /五日/],
      forbidden: [/一定不破財|保證隱私|必然好消息/],
    }],
    ['bedroom-bedside-book-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /書籍/, /承重/, /六日/],
      forbidden: [/一定考運|保證睡眠|必然文昌/],
    }],
    ['kitchen-dry-goods-cabinet-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*320/, /乾貨/, /先進先出/, /五日/],
      forbidden: [/一定聚財|保證財運|必然旺財/],
    }],
    ['bedroom-night-walkway-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /夜間/, /照明/, /七晚/],
      forbidden: [/一定好眠|保證健康|必然平安/],
    }],
    ['living-room-display-cabinet-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /展示櫃/, /固定/, /七天/],
      forbidden: [/一定招財|保證名聲|必然聚氣/],
    }],
    ['entryway-bag-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /包包/, /濕袋/, /七日/],
      forbidden: [/一定招財|保證平安|必然旺運/],
    }],
    ['balcony-storage-cabinet-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*320/, /收納櫃/, /排水孔/, /五日/],
      forbidden: [/一定聚財|保證防颱|必然平安/],
    }],
    ['dining-room-serving-cart-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*360/, /餐車/, /熱食/, /七日/],
      forbidden: [/一定旺財|保證團圓|必然健康/],
    }],
    ['living-room-tv-wall-mount-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /電視/, /壁掛/, /六日/],
      forbidden: [/一定招財|保證和睦|必然升運/],
    }],
    ['bathroom-shower-caddy-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴/, /固定/, /六日/],
      forbidden: [/風水一定聚財|收納保證健康|配置必然平安/],
    }],
    ['entryway-hat-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /帽子/, /濕帽/, /五日/],
      forbidden: [/帽子一定招財|收納保證平安|配置必然旺運/],
    }],
    ['living-room-speaker-placement-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /喇叭/, /音量/, /七日/],
      forbidden: [/喇叭一定旺財|配置保證名聲|擺位必然和睦/],
    }],
    ['bathroom-grab-bar-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /扶手/, /固定/, /七日/],
      forbidden: [/扶手一定能化解|保證不跌倒|必然健康/],
    }],
    ['kitchen-gas-leak-detector-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /檢知器/, /天然瓦斯/, /七日/],
      forbidden: [/一定能測出|保證不漏氣|必然聚財/],
    }],
    ['entryway-emergency-bag-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /避難包/, /防潮/, /五日/],
      forbidden: [/一定保命|保證安全|必然平安/],
    }],
    ['kitchen-smoke-alarm-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /住警器/, /油煙/, /七日/],
      forbidden: [/一定能防火|保證逃生|必然平安/],
    }],
    ['entryway-walking-cane-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /手杖|助行器/, /防跌/, /五日/],
      forbidden: [/一定防跌|保證不絆倒|必然健康/],
    }],
    ['living-room-robot-vacuum-dock-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /掃地機器人/, /充電/, /七日/],
      forbidden: [/一定能除煞|保證乾淨|必然招財/],
    }],
    ['bedroom-carbon-monoxide-alarm-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /一氧化碳/, /熱水器/, /六晚/],
      forbidden: [/一定能防中毒|保證健康|必然平安/],
    }],
    ['kitchen-fire-blanket-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /滅火毯/, /油鍋/, /七日/],
      forbidden: [/一定能滅火|保證安全|必然旺財/],
    }],
    ['living-room-electric-heater-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /電暖器/, /一公尺/, /七日/],
      forbidden: [/一定保暖|保證防火|必然聚財/],
    }],
    ['kitchen-fire-extinguisher-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /滅火器/, /油鍋/, /七日/],
      forbidden: [/一定能滅火|保證安全|必然旺財/],
    }],
    ['bedroom-night-light-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /小夜燈/, /眩光/, /六晚/],
      forbidden: [/一定防跌|保證好睡|必然安神/],
    }],
  ['living-room-fire-extinguisher-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /滅火器/, /兒童/, /七日/],
      forbidden: [/一定能防火|保證平安|必然聚財/],
  }],
  ['bedroom-ceiling-fan-feng-shui', {
    minimumCharacters: 3200,
    required: [/四場景/, /300\s*×\s*330/, /nfa\.gov\.tw/i, /三晚/],
    forbidden: [/一定改善睡眠|保證健康|必然招財/],
  }],
  ['kitchen-water-filter-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*360/, /濾心/, /飲用水/, /十四日/],
    forbidden: [/一定能淨化|保證健康|必然聚財/],
  }],
  ['entryway-umbrella-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /濕傘/, /防滑/, /五日/],
    forbidden: [/一定防跌|保證財運|必然招財/],
  }],
  ['bathroom-exhaust-fan-feng-shui', {
    minimumCharacters: 3200,
    required: [/220\s*×\s*260/, /通風扇/, /潮濕/, /五日/],
    forbidden: [/一定除濕|保證健康|必然聚財/],
  }],
  ['home-office-paper-shredder-feng-shui', {
    minimumCharacters: 3200,
    required: [/220\s*×\s*300/, /碎紙機/, /文件/, /七日/],
    forbidden: [/一定保密|保證專注|必然旺文昌/],
  }],
  ['balcony-mosquito-screen-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /紗窗/, /防墜/, /六日/],
    forbidden: [/一定防墜|保證防蚊|必然擋煞/],
  }],
  ['laundry-drying-rack-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /曬衣架/, /通風/, /六日/],
    forbidden: [/一定乾|保證安全|必然旺財/],
  }],
  ['dining-room-high-chair-feng-shui', {
    minimumCharacters: 3200,
    required: [/260\s*×\s*320/, /高腳椅/, /安全帶/, /五餐/],
    forbidden: [/一定不會倒|保證成長|必然旺家/],
  }],
  ['bathroom-shower-squeegee-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /刮水器/, /防滑/, /七日/],
    forbidden: [/一定防滑|保證乾燥|必然除煞/],
  }],
  ['bathroom-skylight-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /天窗/, /凝結水/, /五日/],
    forbidden: [/一定乾燥|保證不漏水|必然旺財/],
  }],
  ['balcony-plant-pot-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*180/, /盆栽/, /防墜/, /六日/],
    forbidden: [/一定不掉落|保證生長|必然招財/],
  }],
  ['home-office-document-cabinet-feng-shui', {
    minimumCharacters: 3200,
    required: [/220\s*×\s*300/, /文件櫃/, /防傾倒/, /七日/],
    forbidden: [/一定安全|保證升遷|必然旺文昌/],
  }],
  ['living-room-acoustic-panel-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /吸音板/, /耐燃/, /五日/],
    forbidden: [/一定隔音|保證安靜|必然聚財/],
  }],
  ['bedroom-blackout-curtain-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*330/, /遮光窗簾/, /通風/, /五日/],
    forbidden: [/一定助眠|保證睡著|必然招財/],
  }],
  ['entryway-walker-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /助行器/, /防跌/, /六日/],
    forbidden: [/一定防跌|保證獨立|必然旺家/],
  }],
  ['living-room-window-seat-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /窗台座/, /防墜/, /五日/],
    forbidden: [/一定採光|保證安全|必然聚財/],
  }],
  ['kitchen-pantry-door-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /儲藏室門/, /通風/, /五日/],
    forbidden: [/一定聚財|保證不發霉|必然旺財/],
  }],
  ['bedroom-bedside-clock-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /床邊時鐘/, /低亮度/, /五日/],
    forbidden: [/一定助眠|保證早起|必然招財/],
  }],
  ['living-room-window-film-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*400/, /隔熱窗膜/, /採光/, /五日/],
    forbidden: [/一定降溫|保證節能|必然旺財/],
  }],
  ['kitchen-countertop-zoning-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /檯面分區/, /生熟食/, /五日/],
    forbidden: [/一定聚財|保證無菌|必然旺財/],
  }],
  ['bedroom-mosquito-net-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /蚊帳/, /通風/, /五日/],
    forbidden: [/一定安神|保證不被叮|必然招財/],
  }],
  ['living-room-room-divider-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /活動隔間/, /採光/, /五日/],
    forbidden: [/一定隔音|保證安全|必然聚財/],
  }],
  ['kitchen-spice-drawer-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /香料抽屜/, /乾燥/, /五日/],
    forbidden: [/一定聚財|保證不變質|必然旺財/],
  }],
  ['bedroom-bedside-rail-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /床邊扶手/, /防跌/, /五日/],
    forbidden: [/一定防跌|保證起身|必然旺健康/],
  }],
  ['living-room-recliner-chair-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /躺椅/, /扶手/, /五日/],
    forbidden: [/一定舒壓|保證不跌倒|必然聚財/],
  }],
  ['kitchen-island-stool-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /中島椅/, /腳踏/, /五日/],
    forbidden: [/一定旺財|保證穩坐|必然聚財/],
  }],
  ['bedroom-pet-bed-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /寵物床/, /清潔/, /五日/],
    forbidden: [/一定不過敏|保證好眠|必然招財/],
  }],
  ['living-room-rocking-chair-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /搖椅/, /扶手/, /五日/],
    forbidden: [/一定舒壓|保證不跌倒|必然聚財/],
  }],
  ['kitchen-breakfast-nook-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /早餐角/, /採光/, /五日/],
    forbidden: [/一定旺財|保證健康|必然聚財/],
  }],
  ['bedroom-pet-crate-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /寵物籠/, /通風/, /五日/],
    forbidden: [/一定不焦慮|保證好眠|必然招財/],
  }],
  ['living-room-reading-nook-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /閱讀角/, /書燈/, /五日/],
    forbidden: [/一定專注|保證視力|必然旺文昌/],
  }],
  ['kitchen-baking-station-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /烘焙工作站/, /散熱/, /五日/],
    forbidden: [/一定成功|保證安全|必然旺家/],
  }],
  ['bedroom-cat-tree-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /貓跳台/, /固定/, /五日/],
    forbidden: [/一定招財|保證安神|必然健康/],
  }],
  ['living-room-family-calendar-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /家庭行事曆/, /可見性/, /七日/],
    forbidden: [/一定提升效率|保證和諧|必然旺財/],
  }],
  ['kitchen-bread-box-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /麵包盒/, /乾燥/, /五日/],
    forbidden: [/一定保鮮|保證不發霉|必然旺財/],
  }],
  ['bedroom-cat-litter-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /貓砂盆/, /通風/, /七日/],
    forbidden: [/一定不臭|保證健康|必然招財/],
  }],
  ['living-room-puzzle-table-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /拼圖桌/, /收合/, /五日/],
    forbidden: [/一定專注|保證和諧|必然旺財/],
  }],
  ['kitchen-fruit-bowl-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /水果碗/, /成熟/, /五日/],
    forbidden: [/一定新鮮|保證不發霉|必然招財/],
  }],
  ['bedroom-air-quality-monitor-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /空氣品質監測器/, /感測/, /七日/],
    forbidden: [/一定改善睡眠|保證健康|必然聚氣/],
  }],
  ['living-room-sewing-machine-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /縫紉機/, /針具/, /五日/],
    forbidden: [/一定旺文昌|保證安全|必然招財/],
  }],
  ['kitchen-tea-canister-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /茶葉罐/, /乾燥/, /五日/],
    forbidden: [/一定提神|保證不變質|必然旺財/],
  }],
  ['bedroom-wake-up-light-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /喚醒燈/, /夜間/, /七日/],
    forbidden: [/一定改善睡眠|保證早起|必然聚氣/],
  }],
  ['living-room-model-train-table-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /模型火車/, /電線/, /七日/],
    forbidden: [/保證財運|必然招財|一定改善家庭/],
  }],
  ['kitchen-tea-tray-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /茶盤/, /濕乾/, /五日/],
    forbidden: [/保證財運|必然聚財|一定茶味/],
  }],
  ['bedroom-air-purifier-filter-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /濾網/, /防潮/, /七日/],
    forbidden: [/保證健康|一定改善睡眠|必然淨化/],
  }],
  ['living-room-board-game-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /桌遊/, /小零件/, /五日/],
    forbidden: [/保證親子關係|必然招財|一定帶來運勢/],
  }],
  ['kitchen-reusable-food-bag-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /重複使用食物袋/, /晾乾/, /五日/],
    forbidden: [/保證財運|必然聚財|一定改善健康/],
  }],
  ['bedroom-sleep-mask-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /眼罩/, /清潔/, /七日/],
    forbidden: [/保證睡眠|治療失眠|一定改善睡眠/],
  }],
  ['living-room-digital-photo-frame-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /數位相框/, /隱私/, /七日/],
    forbidden: [/保證財運|必然旺家|一定改善關係/],
  }],
  ['kitchen-dishwashing-gloves-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /洗碗手套/, /晾乾/, /五日/],
    forbidden: [/保證衛生|必然聚財|一定保護皮膚/],
  }],
  ['bedroom-sleep-earplugs-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /耳塞/, /清潔/, /七日/],
    forbidden: [/保證睡眠|治療耳部|一定聽得到/],
  }],
  ['living-room-record-player-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /唱盤/, /唱片/, /七日/],
    forbidden: [/保證財運|必然招財|一定改善音質/],
  }],
  ['kitchen-food-thermometer-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /食品溫度計/, /中心溫度/, /五日/],
    forbidden: [/保證安全|必然防止食安|一定殺菌/],
  }],
  ['bedroom-pajama-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /睡衣/, /待洗/, /七日/],
    forbidden: [/保證睡眠|治療皮膚|一定改善健康/],
  }],
  ['living-room-3d-printer-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /3D\s*列印/, /通風/, /七日/],
    forbidden: [/保證創意|必然招財|一定安全/],
  }],
  ['kitchen-measuring-cup-spoon-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /量杯量匙/, /食品接觸面/, /五日/],
    forbidden: [/保證食安|必然聚財|一定安全/],
  }],
  ['bedroom-sleep-tracker-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /睡眠追蹤器/, /隱私/, /七日/],
    forbidden: [/保證睡眠|診斷疾病|一定改善健康/],
  }],
  ['living-room-guitar-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /吉他/, /防潮/, /七日/],
    forbidden: [/保證靈感|必然招財|一定改善音質/],
  }],
  ['kitchen-oil-bottle-tray-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /油瓶托盤/, /避熱/, /五日/],
    forbidden: [/保證聚財|必然招財|一定改善健康/],
  }],
  ['bedroom-sleep-journal-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /睡眠日誌/, /隱私/, /七日/],
    forbidden: [/保證睡眠|診斷疾病|一定改善健康/],
  }],
  ['living-room-craft-cart-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /手作推車/, /煞車/, /七日/],
    forbidden: [/保證靈感|必然招財|一定安全/],
  }],
  ['kitchen-peeler-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /削皮器/, /刀刃/, /五日/],
    forbidden: [/保證食安|必然聚財|一定安全/],
  }],
  ['bedroom-indoor-slippers-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /室內拖鞋/, /防滑/, /七日/],
    forbidden: [/保證平安|一定防跌|必然改善健康/],
  }],
  ['living-room-recycling-station-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*450/, /回收分類站/, /清洗/, /七日/],
    forbidden: [/保證財運|必然招財|一定改善環境/],
  }],
  ['kitchen-stainless-steel-container-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /不鏽鋼保鮮盒/, /酸性食物/, /五日/],
    forbidden: [/保證食安|必然聚財|一定改善健康/],
  }],
  ['bedroom-bedside-wastebasket-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*330/, /床邊垃圾桶/, /夜間/, /七日/],
    forbidden: [/保證平安|一定防跌|必然改善健康/],
  }],
  ['living-room-ottoman-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /收納腳凳/, /開蓋/, /七日/],
    forbidden: [/保證財運|必然招財|一定安全/],
  }],
  ['kitchen-colander-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*330/, /瀝水籃/, /網孔/, /五日/],
    forbidden: [/保證食安|必然聚財|一定改善健康/],
  }],
  ['bedroom-hairbrush-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /梳子/, /掉髮/, /七日/],
    forbidden: [/保證平安|一定改善健康|必然改善頭皮/],
  }],
  ['living-room-floor-cushion-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /地板坐墊/, /防滑/, /七日/],
    forbidden: [/保證財運|必然招財|一定安全/],
  }],
  ['kitchen-food-scale-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /食物秤/, /水平/, /五日/],
    forbidden: [/保證食安|必然聚財|一定準確/],
  }],
  ['bedroom-makeup-brush-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /化妝刷/, /刷毛/, /七日/],
    forbidden: [/保證平安|一定改善健康|必然改善皮膚/],
  }],
  ['living-room-vase-display-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /玻璃花瓶/, /重心/, /七日/],
    forbidden: [/保證財運|必然招財|一定安全/],
  }],
  ['kitchen-pot-lid-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /鍋蓋/, /滴水/, /五日/],
    forbidden: [/保證食安|必然聚財|一定安全/],
  }],
  ['bedroom-eyeglasses-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /眼鏡/, /鏡片/, /七日/],
    forbidden: [/保證視力|一定改善健康|必然改善睡眠/],
  }],
  ['living-room-wall-clock-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /掛鐘/, /固定/, /七日/],
    forbidden: [/保證財運|必然招財|一定改運/],
  }],
  ['kitchen-oven-mitt-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /隔熱手套/, /熱源/, /五日/],
    forbidden: [/保證食安|必然聚財|一定防燙/],
  }],
  ['bedroom-bedside-tissue-box-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /衛生紙盒/, /潮濕/, /七日/],
    forbidden: [/保證健康|一定改善睡眠|必然避邪/],
  }],
  ['dining-room-coaster-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*320/, /杯墊/, /水痕/, /五日/],
    forbidden: [/保證財運|必然聚財|一定安全/],
  }],
  ['bathroom-toilet-lid-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /馬桶蓋/, /飛濺/, /五日/],
    forbidden: [/保證健康|必然守財|一定不生病/],
  }],
  ['balcony-bicycle-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*300/, /腳踏車/, /避難/, /七日/],
    forbidden: [/保證財運|必然帶來好運|一定安全/],
  }],
  ['entryway-shoehorn-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/160\s*×\s*220/, /鞋拔/, /穿鞋/, /七日/],
    forbidden: [/保證財運|必然帶來好運|一定防跌/],
  }],
  ['kitchen-ladle-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /湯勺/, /滴湯/, /五日/],
    forbidden: [/必然聚財|一定安全|神奇改善/],
  }],
  ['bedroom-quilt-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /棉被/, /防潮/, /七日/],
    forbidden: [/必然除螨|保證睡眠|神奇改善/],
  }],
  ['dining-room-table-runner-feng-shui', {
    minimumCharacters: 3200,
    required: [/280\s*×\s*320/, /桌旗/, /垂落/, /五日/],
    forbidden: [/保證財運|必然聚財|一定防燙/],
  }],
  ['bathroom-toilet-plunger-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*240/, /馬桶吸盤/, /通風/, /五日/],
    forbidden: [/保證健康|必然除臭|一定不堵塞/],
  }],
  ['balcony-garden-tools-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/180\s*×\s*300/, /園藝工具/, /避難/, /七日/],
    forbidden: [/保證招財|必然旺運|一定安全/],
  }],
  ['living-room-floor-lamp-cord-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /立燈/, /電線/, /五日/],
    forbidden: [/保證平安|必然聚氣|一定不絆倒/],
  }],
  ['kitchen-tongs-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /食物夾/, /夾取/, /五日/],
    forbidden: [/保證食安|必然聚財|一定防燙/],
  }],
  ['bedroom-robe-hook-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /睡袍掛鉤/, /承重/, /七日/],
    forbidden: [/保證睡眠|必然招桃花|一定不掉落/],
  }],
  ['living-room-plant-watering-can-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /澆水壺/, /排水/, /五日/],
    forbidden: [/保證招財|必然旺運|一定不漏水/],
  }],
  ['kitchen-spatula-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /鍋鏟/, /耐熱/, /五日/],
    forbidden: [/保證食安|必然聚財|一定不燙傷/],
  }],
  ['bedroom-pajama-hamper-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /睡衣籃/, /通風/, /七日/],
    forbidden: [/保證睡眠|必然除臭|一定不發霉/],
  }],
  ['living-room-floor-mirror-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /落地鏡/, /固定/, /五日/],
    forbidden: [/保證招財|必然聚氣|一定不倒/],
  }],
  ['kitchen-food-processor-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /食物調理機/, /插頭/, /五日/],
    forbidden: [/保證食安|必然聚財|一定不割傷/],
  }],
  ['bedroom-laundry-bag-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /洗衣袋/, /乾濕/, /七日/],
    forbidden: [/保證睡眠|必然除臭|一定不發霉/],
  }],
  ['living-room-mail-organizer-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /信件/, /個資/, /五日/],
    forbidden: [/保證財運|必然招財|一定不遺失/],
  }],
  ['kitchen-lunch-box-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /便當盒/, /乾燥/, /五日/],
    forbidden: [/保證食安|必然聚財|一定不漏/],
  }],
  ['bedroom-hat-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /帽子/, /通風/, /七日/],
    forbidden: [/保證睡眠|必然除臭|一定不變形/],
  }],
  ['living-room-plant-stand-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /植物架/, /防倒/, /五日/],
    forbidden: [/保證招財|必然聚氣|一定不倒/],
  }],
  ['kitchen-food-wrap-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /保鮮膜/, /標示/, /五日/],
    forbidden: [/保證食安|必然聚財|一定不滲出/],
  }],
  ['bedroom-belt-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /皮帶/, /掛點/, /七日/],
    forbidden: [/保證睡眠|必然招桃花|一定不變形/],
  }],
  ['living-room-power-strip-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /延長線/, /負載/, /五日/],
    forbidden: [/保證平安|必然聚財|一定不過熱/],
  }],
  ['kitchen-rice-scoop-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /飯匙|米勺/, /乾燥/, /五日/],
    forbidden: [/保證健康|必然招財|一定不發霉/],
  }],
  ['bedroom-scarf-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /圍巾/, /標示/, /七日/],
    forbidden: [/保證姻緣|必然招桃花|一定不變形/],
  }],
  ['living-room-curtain-rod-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /窗簾桿/, /拉繩/, /五日/],
    forbidden: [/保證聚財|必然擋煞|一定不掉落/],
  }],
  ['kitchen-bowl-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /碗盤|碗/, /乾燥/, /五日/],
    forbidden: [/保證健康|必然聚財|一定不破/],
  }],
  ['bedroom-socks-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/240\s*×\s*300/, /襪子/, /乾燥/, /七日/],
    forbidden: [/保證睡眠|必然招桃花|一定不臭/],
  }],
  ['living-room-corner-shelf-feng-shui', {
    minimumCharacters: 3200,
    required: [/360\s*×\s*420/, /角落層架/, /防倒/, /五日/],
    forbidden: [/保證聚財|必然擋煞|一定不掉落/],
  }],
  ['kitchen-serving-tray-storage-feng-shui', {
    minimumCharacters: 3200,
    required: [/300\s*×\s*360/, /托盤/, /乾燥/, /五日/],
    forbidden: [/保證健康|必然聚財|一定不打翻/],
  }],
['bedroom-underwear-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /內衣|貼身衣物/, /乾燥/, /七日/],
  forbidden: [/保證睡眠|必然招桃花|一定不變形/],
}],
['living-room-network-cable-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /網路線/, /通風/, /五日/],
  forbidden: [/保證網速|必然聚財|一定不斷線/],
}],
['kitchen-fridge-door-condiment-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /調味料/, /門邊/, /五日/],
  forbidden: [/保證健康|必然聚財|一定不變質/],
}],
['bedroom-bed-pad-drying-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /保潔墊/, /乾燥/, /七日/],
  forbidden: [/保證睡眠|必然改善健康|一定不發霉/],
}],
['living-room-dehumidifier-drainage-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /除濕機/, /排水/, /五日/],
  forbidden: [/保證乾燥|必然聚財|一定不漏水/],
}],
['kitchen-cutting-board-rack-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /砧板/, /生熟/, /五日/],
  forbidden: [/保證健康|必然聚財|一定不發霉/],
}],
['bedroom-pillowcase-wash-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /枕頭套/, /乾燥/, /七日/],
  forbidden: [/保證睡眠|必然改善健康|一定不過敏/],
}],
['living-room-ceiling-fan-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /電風扇/, /清潔/, /五日/],
  forbidden: [/保證風水|必然聚財|一定不故障/],
}],
['kitchen-sponge-cloth-drying-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /海綿|抹布/, /乾燥/, /五日/],
  forbidden: [/保證健康|必然聚財|一定不發霉/],
}],
['bedroom-air-conditioner-filter-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /冷氣濾網/, /陰乾/, /七日/],
  forbidden: [/保證睡眠|必然改善健康|一定不過敏/],
}],
['living-room-folding-clothes-rack-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /衣帽架/, /承重/, /五日/],
  forbidden: [/保證財運|必然聚財|一定不傾倒/],
}],
['kitchen-cooking-oil-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /食用油/, /避光/, /五日/],
  forbidden: [/保證健康|必然聚財|一定不變質/],
}],
['bedroom-bedsheet-folding-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /床單/, /乾燥/, /七日/],
  forbidden: [/保證睡眠|必然改善健康|一定不發霉/],
}],
['living-room-playpen-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /遊戲圍欄/, /穩固/, /六日/],
  forbidden: [/保證安全|必然聚氣|一定不受傷/],
}],
['kitchen-chopstick-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /筷子/, /乾燥/, /五日/],
  forbidden: [/保證健康|必然聚財|一定不發霉/],
}],
['bedroom-mattress-protector-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /保潔墊/, /完全乾燥/, /七日/],
  forbidden: [/保證睡眠|必然改善健康|一定不發霉/],
}],
['living-room-pet-water-bowl-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /水碗/, /防滑/, /六日/],
  forbidden: [/保證健康|必然招財|一定不翻倒/],
}],
['kitchen-rice-cooker-cleaning-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /電子鍋/, /蒸氣孔/, /五日/],
  forbidden: [/保證財運|必然健康|一定不故障/],
}],
['bedroom-bedside-tray-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /床邊托盤/, /充電線/, /七日/],
  forbidden: [/保證睡眠|必然改善健康|一定不跌倒/],
}],
['kitchen-opened-food-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /開封日期/, /分裝/, /五日/],
  forbidden: [/保證食品安全|必然不變質|一定招財/],
}],
['living-room-pet-feeding-area-feng-shui', {
  minimumCharacters: 3200,
  required: [/330\s*×\s*420/, /食碗/, /水碗/, /六日/],
  forbidden: [/保證寵物健康|必然招財|一定不翻碗/],
}],
['bedroom-mattress-flip-rotation-feng-shui', {
  minimumCharacters: 3200,
  required: [/280\s*×\s*330/, /翻面/, /輪替/, /四週/],
  forbidden: [/保證睡眠|必然改運|一定改善疼痛/],
}],
['kitchen-leftover-food-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /剩菜/, /熟食/, /五日/],
  forbidden: [/保證食品安全|必然不變質|一定招財/],
}],
['living-room-pet-toy-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /寵物玩具/, /小零件/, /六日/],
  forbidden: [/保證寵物健康|必然招財|一定不受傷/],
}],
['bedroom-mattress-ventilation-dehumidifying-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*330/, /床墊/, /除濕/, /七日/],
  forbidden: [/保證睡眠|必然除濕|一定不發霉/],
}],
['kitchen-fridge-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/320\s*×\s*360/, /冰箱/, /漏液/, /七日/],
  forbidden: [/保證食品安全|必然除臭|一定招財/],
}],
['dining-room-table-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/280\s*×\s*360/, /食品接觸面/, /抹布/, /七日/],
  forbidden: [/保證健康|必然聚財|一定無菌/],
}],
['bedroom-mattress-vacuum-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*330/, /床墊/, /吸塵/, /七日/],
  forbidden: [/保證過敏改善|必然除蟎|一定無塵/],
}],
['kitchen-dish-rack-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/260\s*×\s*300/, /瀝水架/, /接水盤/, /七日/],
  forbidden: [/保證餐具衛生|必然聚財|一定乾燥/],
}],
['bedroom-fan-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/330\s*×\s*360/, /電風扇/, /電源線/, /七日/],
  forbidden: [/保證睡眠|必然招財|一定安靜/],
}],
['entryway-shoe-cabinet-ventilation-feng-shui', {
  minimumCharacters: 3200,
  required: [/220\s*×\s*160/, /鞋櫃/, /濕鞋/, /七日/],
  forbidden: [/保證除臭|必然聚財|一定乾燥/],
}],
['kitchen-dishwasher-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*320/, /洗碗機/, /濾網/, /七日/],
  forbidden: [/保證無菌|必然聚財|一定除垢/],
}],
['living-room-rug-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /地毯/, /吸塵/, /七日/],
  forbidden: [/保證除蟎|必然招財|一定無塵/],
}],
['bedroom-curtain-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/330\s*×\s*360/, /窗簾/, /結露/, /七日/],
  forbidden: [/保證過敏改善|必然除臭|一定乾燥/],
}],
['kitchen-range-hood-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /抽油煙機/, /油網/, /七日/],
  forbidden: [/保證排煙|必然聚財|一定除油/],
}],
['living-room-air-purifier-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*450/, /空氣清淨機/, /濾網/, /七日/],
  forbidden: [/保證除臭|必然招財|一定改善過敏/],
}],
['bedroom-pillow-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /枕頭/, /枕芯/, /七日/],
  forbidden: [/保證好眠|必然聚財|一定除蟎/],
}],
['kitchen-gas-stove-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*280/, /瓦斯爐/, /火孔/, /七日/],
  forbidden: [/保證燃燒|必然聚財|一定除油/],
}],
['living-room-sofa-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /布沙發/, /縫隙/, /七日/],
  forbidden: [/保證除蟎|必然招財|一定無味/],
}],
['bedroom-bed-frame-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /床架/, /床底/, /七日/],
  forbidden: [/保證好眠|必然聚財|一定除蟎/],
}],
['kitchen-dry-goods-cabinet-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*260/, /乾貨櫃/, /開封食品/, /七日/],
  forbidden: [/保證食品安全|必然聚財|一定防蟲/],
}],
['living-room-bookshelf-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /書櫃/, /書籍/, /七日/],
  forbidden: [/保證文昌|必然升學|一定防霉/],
}],
['bedroom-wardrobe-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /衣櫃/, /衣物/, /七日/],
  forbidden: [/保證好運|必然聚財|一定防霉/],
}],
['bathroom-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/180\s*×\s*220/, /浴室/, /霉斑/, /七日/],
  forbidden: [/保證除霉|必然聚財|一定乾燥/],
}],
['living-room-window-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /窗戶/, /紗窗/, /七日/],
  forbidden: [/保證通風|必然招財|一定無塵/],
}],
['bedroom-bedside-table-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*360/, /床頭櫃/, /充電線/, /七日/],
  forbidden: [/保證好眠|必然聚財|一定無塵/],
}],
['bathroom-toilet-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/180\s*×\s*240/, /馬桶/, /底座/, /七日/],
  forbidden: [/保證潔淨|必然聚財|一定除臭/],
}],
['living-room-curtain-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /布窗簾/, /吸塵/, /七日/],
  forbidden: [/保證好運|必然招財|一定除蟎/],
}],
['kitchen-sink-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /水槽/, /海綿/, /七日/],
  forbidden: [/保證無菌|必然聚財|一定不發臭/],
}],
['kitchen-sponge-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /海綿/, /抹布/, /七日/],
  forbidden: [/保證無菌|必然聚財|一定不發臭/],
}],
['dining-room-tablecloth-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/260\s*×\s*360/, /桌巾/, /油漬/, /七日/],
  forbidden: [/保證好運|必然招財|一定不沾污/],
}],
['bedroom-ceiling-fan-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*330/, /吊扇/, /扇葉/, /七日/],
  forbidden: [/保證好眠|必然聚財|一定無塵/],
}],
['bathroom-shower-curtain-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/180\s*×\s*260/, /浴簾/, /霉斑/, /七日/],
  forbidden: [/保證除霉|必然聚財|一定乾燥/],
}],
['living-room-floor-lamp-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /落地燈/, /電源線/, /七日/],
  forbidden: [/保證好運|必然招財|一定無塵/],
}],
['kitchen-cutting-board-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /砧板/, /刮痕/, /七日/],
  forbidden: [/保證無菌|必然聚財|一定不發霉/],
}],
['bathroom-towel-drying-feng-shui', {
  minimumCharacters: 3200,
  required: [/160\s*×\s*200/, /浴巾/, /潮味/, /七日/],
  forbidden: [/保證乾燥|必然聚財|一定除霉/],
}],
['living-room-air-conditioner-filter-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /濾網/, /出風口/, /七日/],
  forbidden: [/保證健康|必然招財|一定省電/],
}],
['kitchen-knife-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /菜刀/, /鏽斑/, /七日/],
  forbidden: [/保證無菌|必然聚財|一定不生鏽/],
}],
['bathroom-bath-mat-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/150\s*×\s*200/, /浴墊/, /防滑/, /七日/],
  forbidden: [/保證防滑|必然聚財|一定除霉/],
}],
['living-room-air-conditioner-drainage-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /冷凝水/, /排水/, /七日/],
  forbidden: [/保證不漏水|必然招財|一定乾燥/],
}],
['kitchen-knife-sharpening-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /磨刀/, /刀刃/, /七日/],
  forbidden: [/保證鋒利|必然聚財|一定不割傷/],
}],
['bathroom-floor-drain-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/150\s*×\s*200/, /地漏/, /防臭/, /七日/],
  forbidden: [/保證防臭|必然聚財|一定不積水/],
}],
['living-room-air-conditioner-condensation-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /結露/, /水珠/, /七日/],
  forbidden: [/保證不結露|必然招財|一定乾燥/],
}],
['kitchen-knife-handle-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /刀柄/, /鉚釘/, /七日/],
  forbidden: [/保證無菌|必然聚財|一定不滑手/],
}],
['bathroom-floor-drain-odor-feng-shui', {
  minimumCharacters: 3200,
  required: [/150\s*×\s*200/, /地漏/, /防臭/, /七日/],
  forbidden: [/保證防臭|必然聚財|一定不積水/],
}],
['living-room-air-conditioner-return-air-feng-shui', {
  minimumCharacters: 3200,
  required: [/360\s*×\s*420/, /回風口/, /濾網/, /七日/],
  forbidden: [/保證健康|必然招財|一定無塵/],
}],
['entryway-shoe-cabinet-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/180\s*×\s*240/, /鞋櫃/, /濕鞋/, /七日/],
  forbidden: [/保證除臭|必然招財|一定乾燥/],
}],
['bathroom-exhaust-fan-noise-feng-shui', {
  minimumCharacters: 3200,
  required: [/140\s*×\s*210/, /通風扇/, /異音/, /七日/],
  forbidden: [/保證安靜|必然聚財|一定無異音/],
}],
['living-room-air-purifier-sensor-feng-shui', {
  minimumCharacters: 3200,
  required: [/320\s*×\s*400/, /感測器/, /讀值/, /七日/],
  forbidden: [/保證過濾|必然招財|一定改善過敏/],
}],
['kitchen-range-hood-filter-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*330/, /濾網/, /油垢/, /七日/],
  forbidden: [/保證除油煙|必然聚財|一定不失火/],
}],
['bathroom-shower-caddy-rust-feng-shui', {
  minimumCharacters: 3200,
  required: [/150\s*×\s*220/, /置物架/, /鏽斑/, /七日/],
  forbidden: [/保證不生鏽|必然聚財|一定不掉落/],
}],
['living-room-dehumidifier-noise-feng-shui', {
  minimumCharacters: 3200,
  required: [/330\s*×\s*420/, /除濕機/, /異音/, /七日/],
  forbidden: [/保證安靜|必然招財|一定除濕/],
}],
['kitchen-sink-faucet-leak-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /水龍頭/, /漏水/, /七日/],
  forbidden: [/保證止漏|必然聚財|一定乾燥/],
}],
['bathroom-mirror-condensation-feng-shui', {
  minimumCharacters: 3200,
  required: [/150\s*×\s*220/, /結露/, /通風/, /七日/],
  forbidden: [/保證無霧|必然聚財|一定乾燥/],
}],
['living-room-dehumidifier-water-tank-feng-shui', {
  minimumCharacters: 3200,
  required: [/330\s*×\s*420/, /水箱/, /滿水/, /七日/],
  forbidden: [/保證不漏水|必然招財|一定乾爽/],
}],
['kitchen-sink-aerator-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /起泡器/, /水垢/, /七日/],
  forbidden: [/保證出水|必然聚財|一定無垢/],
}],
['bathroom-shower-door-water-stain-feng-shui', {
  minimumCharacters: 3200,
  required: [/150\s*×\s*220/, /水垢/, /滑輪/, /七日/],
  forbidden: [/保證無垢|必然聚財|一定不漏水/],
}],
['living-room-dehumidifier-cord-feng-shui', {
  minimumCharacters: 3200,
  required: [/330\s*×\s*420/, /電線/, /插座/, /七日/],
  forbidden: [/保證安全|必然招財|一定不過熱/],
}],
['kitchen-sink-strainer-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*300/, /濾網/, /菜渣/, /七日/],
  forbidden: [/保證不堵|必然聚財|一定無異味/],
}],
['bathroom-shower-threshold-seal-feng-shui', {
  minimumCharacters: 3200,
  required: [/160\s*×\s*240/, /止水門檻/, /防水膠條/, /七日/],
  forbidden: [/保證不漏水|必然聚財|一定防滑/],
}],
['living-room-dehumidifier-filter-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*400/, /濾網/, /散熱/, /七日/],
  forbidden: [/保證乾淨|必然招財|一定不過熱/],
}],
['kitchen-sink-under-cabinet-storage-feng-shui', {
  minimumCharacters: 3200,
  required: [/220\s*×\s*180/, /清潔劑/, /管線/, /七日/],
  forbidden: [/保證不漏|必然聚財|一定無菌/],
}],
['bathroom-shower-hose-kink-feng-shui', {
  minimumCharacters: 3200,
  required: [/150\s*×\s*210/, /軟管/, /掛架/, /七日/],
  forbidden: [/保證不漏|必然聚財|一定順流/],
}],
['living-room-dehumidifier-floor-protection-feng-shui', {
  minimumCharacters: 3200,
  required: [/320\s*×\s*380/, /地板/, /平坦/, /七日/],
  forbidden: [/保證不刮|必然招財|一定不晃/],
}],
['kitchen-sink-overflow-hole-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/240\s*×\s*180/, /溢水孔/, /異味/, /七日/],
  forbidden: [/保證不臭|必然聚財|一定暢通/],
}],
['bedroom-bedside-water-spill-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*330/, /水杯/, /夜燈/, /七日/],
  forbidden: [/保證不打翻|必然聚財|一定好睡/],
}],
['entryway-shoe-rack-dust-feng-shui', {
  minimumCharacters: 3200,
  required: [/180\s*×\s*160/, /灰塵/, /濕鞋/, /七日/],
  forbidden: [/保證無塵|必然招財|一定無味/],
}],
['dining-room-table-edge-safety-feng-shui', {
  minimumCharacters: 3200,
  required: [/280\s*×\s*260/, /桌角/, /熱食/, /七日/],
  forbidden: [/保證不撞|必然聚財|一定不燙/],
}],
['bedroom-pillow-protector-drying-feng-shui', {
  minimumCharacters: 3200,
  required: [/280\s*×\s*300/, /保潔墊/, /乾燥/, /七日/],
  forbidden: [/保證乾燥|必然聚財|一定不過敏/],
}],
['balcony-floor-drain-cover-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/300\s*×\s*150/, /地漏蓋/, /落葉/, /七日/],
  forbidden: [/保證不積水|必然聚財|一定暢通/],
}],
['laundry-washing-machine-detergent-drawer-feng-shui', {
  minimumCharacters: 3200,
  required: [/180\s*×\s*160/, /洗劑盒/, /殘留/, /七日/],
  forbidden: [/保證無殘留|必然聚財|一定不發霉/],
}],
['bedroom-mattress-label-warranty-feng-shui', {
  minimumCharacters: 3200,
  required: [/270\s*×\s*300/, /床墊/, /保固/, /七日/],
  forbidden: [/保證延長保固|必然招財|一定好睡/],
}],
['balcony-clothesline-pulley-maintenance-feng-shui', {
  minimumCharacters: 3200,
  required: [/320\s*×\s*140/, /滑輪/, /鋼索/, /七日/],
  forbidden: [/保證不掉落|必然聚財|一定安全/],
}],
['laundry-washing-machine-door-gasket-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/200\s*×\s*170/, /門封條/, /積水/, /七日/],
  forbidden: [/保證無霉|必然聚財|一定不漏水/],
}],
['bedroom-under-mattress-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/260\s*×\s*300/, /床底/, /灰塵/, /七日/],
  forbidden: [/保證除蟎|必然聚財|一定乾燥/],
}],
['balcony-clothes-hanger-rust-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/280\s*×\s*150/, /衣架/, /鏽蝕/, /七日/],
  forbidden: [/保證不生鏽|必然聚財|一定不掉落/],
}],
['laundry-washing-machine-filter-cleaning-feng-shui', {
  minimumCharacters: 3200,
  required: [/190\s*×\s*170/, /濾網/, /毛屑/, /七日/],
  forbidden: [/保證不堵塞|必然聚財|一定排水正常/],
}],
['balcony-privacy-screen-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /遮蔽/, /防墜/, /五日/],
      forbidden: [/一定擋煞|保證平安|必然聚氣/],
    }],
['home-office-standing-desk-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*200/, /升降桌/, /螢幕/, /七日/],
      forbidden: [/一定會升官|保證獲得升遷|必然帶來財富/],
    }],
    ['kitchen-refrigerator-door-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /門封條/, /結露/, /食藥署/, /七日/],
      forbidden: [/保證財運|必然聚財|一定不發霉/],
    }],
    ['living-room-window-track-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /窗溝/, /室外空品/, /環境部/, /七日/],
      forbidden: [/保證財運|必然聚氣|一定改善空氣/],
    }],
    ['entryway-shoe-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /鞋盤/, /積水/, /防滑/, /七日/],
      forbidden: [/保證財運|必然聚氣|一定平安/],
    }],
    ['bedroom-bed-frame-joint-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床架/, /接縫/, /灰塵/, /七晚/],
      forbidden: [/保證睡眠|必然招財|一定除蟎/],
    }],
    ['kitchen-rice-cooker-inner-pot-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /內鍋/, /塗層/, /標檢局/, /七日/],
      forbidden: [/保證健康|必然聚財|一定不沾/],
    }],
    ['bathroom-exhaust-fan-grille-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /外罩/, /排風/, /標準檢驗局/, /五日/],
      forbidden: [/保證乾燥|必然化煞|一定除霉/],
    }],
    ['bathroom-shower-silicone-mold-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /矽利康/, /霉斑/, /環境部/, /七日/],
      forbidden: [/保證防水|必然化煞|一定除霉/],
    }],
    ['living-room-air-conditioner-return-air-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /回風口/, /濾網/, /環境部/, /七日/],
      forbidden: [/保證健康|必然聚氣|一定改善空氣/],
    }],
    ['kitchen-pantry-expiry-check-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /有效日期/, /先進先出/, /食藥署/, /七日/],
      forbidden: [/保證安全|必然聚財|一定不受潮/],
    }],
    ['bedroom-bedside-table-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /抽屜/, /環境部/, /七日/],
      forbidden: [/保證睡眠|必然聚財|一定改善健康/],
    }],
    ['living-room-curtain-hem-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /下襬/, /臺大醫院/, /七日/],
      forbidden: [/保證健康|必然聚氣|一定改善過敏/],
    }],
    ['kitchen-spice-jar-label-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*320/, /有效日期/, /食藥署/, /七日/],
      forbidden: [/保證食安|必然聚財|一定不受潮/],
    }],
    ['bedroom-window-sill-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /窗台/, /臺大醫院/, /七日/],
      forbidden: [/保證睡眠|必然聚氣|一定改善健康/],
    }],
    ['living-room-sofa-under-cushion-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /坐墊/, /環境部/, /七日/],
      forbidden: [/保證健康|必然聚氣|一定消除過敏/],
    }],
    ['bathroom-toilet-seat-hinge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /鉸鏈/, /標準檢驗局/, /七日/],
      forbidden: [/保證健康|必然化煞|一定除垢/],
    }],
    ['bedroom-wardrobe-bottom-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /櫃底/, /環境部/, /七日/],
      forbidden: [/保證睡眠|必然聚財|一定除濕/],
    }],
    ['living-room-coffee-table-under-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*360/, /茶几/, /環境部/, /七日/],
      forbidden: [/保證健康|必然聚氣|一定防跌/],
    }],
    ['kitchen-drawer-crumbs-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /抽屜/, /食藥署/, /七日/],
      forbidden: [/保證食安|必然聚財|一定除蟲/],
    }],
    ['living-room-tv-console-back-cable-dust-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /電視櫃/, /標準檢驗局|環境部/, /七日/],
      forbidden: [/保證用電安全|必然聚氣|一定不起火/],
    }],
    ['bathroom-toilet-base-floor-edge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶底座/, /環境部|疾病管制署/, /七日/],
      forbidden: [/保證健康|必然化煞|一定除臭/],
    }],
    ['bedroom-clothes-hanger-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /衣架/, /臺大醫院|環境部/, /七日/],
      forbidden: [/保證睡眠|必然聚氣|一定改善過敏/],
    }],
    ['kitchen-under-sink-moisture-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*180/, /水槽下方/, /食藥署|環境部/, /七日/],
      forbidden: [/保證食安|必然聚財|一定不漏水/],
    }],
    ['entryway-door-bottom-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /門底/, /標準檢驗局|環境部/, /七日/],
      forbidden: [/保證平安|必然納氣|一定不滑/],
    }],
    ['bathroom-washbasin-drain-odor-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*220/, /洗手台/, /疾病管制署|環境部/, /七日/],
      forbidden: [/保證健康|必然化煞|一定除臭/],
    }],
    ['bedroom-closet-door-track-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /軌道/, /環境部/, /七日/],
      forbidden: [/保證睡眠|必然聚財|一定不卡/],
    }],
    ['living-room-sofa-armrest-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /扶手/, /臺大醫院|環境部/, /七日/],
      forbidden: [/保證健康|必然聚氣|一定改善過敏/],
    }],
    ['kitchen-cabinet-handle-grease-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*320/, /把手/, /食藥署|疾病管制署/, /七日/],
      forbidden: [/保證食安|必然聚財|一定無油/],
    }],
    ['entryway-door-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /門把/, /疾病管制署/, /七日/],
      forbidden: [/保證平安|必然納氣|一定除菌/],
    }],
    ['living-room-tv-speaker-grille-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /網罩/, /標準檢驗局/, /七日/],
      forbidden: [/保證音質|必然聚氣|一定除塵/],
    }],
    ['bathroom-mirror-frame-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*240/, /鏡框/, /環境部/, /七日/],
      forbidden: [/保證健康|必然化煞|一定不發霉/],
    }],
    ['bedroom-wardrobe-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /門把/, /環境部/, /七日/],
      forbidden: [/保證睡眠|必然聚財|一定除濕/],
    }],
    ['living-room-remote-control-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /遙控器/, /疾病管制署/, /七日/],
      forbidden: [/保證音質|必然聚氣|一定不漏液/],
    }],
    ['bathroom-shower-faucet-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /龍頭把手/, /標準檢驗局/, /七日/],
      forbidden: [/保證健康|必然化煞|一定不燙傷/],
    }],
    ['kitchen-refrigerator-handle-grease-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*320/, /冰箱門把/, /食藥署/, /七日/],
      forbidden: [/保證食安|必然聚財|一定不油/],
    }],
    ['living-room-window-latch-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /窗戶插銷/, /環境部/, /七日/],
      forbidden: [/保證通風|必然納氣|一定不漏風/],
    }],
    ['entryway-doorbell-button-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /門鈴按鍵/, /疾病管制署/, /七日/],
      forbidden: [/保證平安|必然迎財|一定不誤觸/],
    }],
    ['bedroom-bedside-drawer-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*340/, /抽屜把手/, /環境部/, /七日/],
      forbidden: [/保證睡眠|必然聚財|一定不黏/],
    }],
    ['living-room-coffee-table-edge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/340\s*×\s*380/, /茶几邊緣/, /環境部/, /七日/],
      forbidden: [/保證不跌倒|必然提升財運|一定治癒/],
    }],
    ['bathroom-toilet-flush-button-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/170\s*×\s*230/, /沖水按鈕/, /疾病管制署/, /七日/],
      forbidden: [/保證不漏水|必然改善感染|一定防霉/],
    }],
    ['kitchen-cutting-board-drying-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*320/, /砧板/, /食藥署/, /七日/],
      forbidden: [/保證食安|必然聚財|一定不發霉/],
    }],
    ['bedroom-nightstand-lamp-switch-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /檯燈開關/, /標準檢驗局/, /七晚/],
      forbidden: [/保證睡眠|必然升遷|一定不觸電/],
    }],
    ['bathroom-toilet-tank-lid-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/170\s*×\s*240/, /水箱蓋/, /疾病管制署/, /七日/],
      forbidden: [/保證衛生|必然化煞|一定不漏水/],
    }],
    ['entryway-intercom-button-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /對講機按鍵/, /標準檢驗局/, /七日/],
      forbidden: [/保證平安|必然納財|一定不進水/],
    }],
    ['living-room-coffee-table-caster-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /茶几腳輪/, /煞車/, /七日/],
      forbidden: [/保證不跌倒|必然聚氣|一定不滑動/],
    }],
    ['kitchen-sink-faucet-aerator-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /起泡器/, /食藥署/, /七日/],
      forbidden: [/保證飲水|必然聚財|一定不漏水/],
    }],
    ['bedroom-bedside-lamp-cord-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*300/, /檯燈電源線/, /標準檢驗局/, /七晚/],
      forbidden: [/保證睡眠|必然招財|一定不發熱/],
    }],
    ['living-room-window-screen-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /紗窗/, /環境部/, /五日/],
      forbidden: [/保證通風|必然納氣|一定無塵/],
    }],
    ['bathroom-floor-drain-grate-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*200/, /地漏蓋/, /疾病管制署/, /七日/],
      forbidden: [/保證乾燥|必然化煞|一定不堵塞/],
    }],
    ['bedroom-bedside-lamp-shade-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*340/, /燈罩/, /標準檢驗局/, /七晚/],
      forbidden: [/一定改善視力|必然聚財|保證無灰塵/],
    }],
    ['living-room-window-lock-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /窗戶鎖扣/, /環境部/, /七日/],
      forbidden: [/一定改善通風|必然納氣|保證不漏風/],
    }],
    ['bathroom-shower-door-bottom-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/170\s*×\s*230/, /門底膠條/, /環境部/, /七日/],
      forbidden: [/一定防水|必然化煞|保證不漏水/],
    }],
    ['kitchen-sink-faucet-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*370/, /水龍頭把手/, /標準檢驗局/, /七日/],
      forbidden: [/一定招財|必然聚水|保證不漏水/],
    }],
    ['bathroom-toilet-water-supply-valve-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /進水閥/, /水利署/, /七日/],
      forbidden: [/一定旺財|必然聚財|保證不漏水/],
    }],
    ['entryway-fire-door-closer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*180/, /門弓器/, /防火門/, /七日/],
      forbidden: [/一定聚氣|必然擋煞|保證防火/],
    }],
    ['living-room-sofa-cushion-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /沙發坐墊/, /環境部/, /七日/],
      forbidden: [/一定安眠|必然聚財|保證無過敏/],
    }],
    ['bathroom-hand-shower-head-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*230/, /蓮蓬頭/, /水利署/, /七日/],
      forbidden: [/一定旺財|必然化煞|保證無水垢/],
    }],
    ['kitchen-range-hood-grease-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /集油杯/, /標準檢驗局/, /七日/],
      forbidden: [/一定聚財|必然旺火|保證不失火/],
    }],
    ['bedroom-window-blind-cord-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*330/, /窗簾拉繩/, /消費者保護/, /七日/],
      forbidden: [/一定安眠|必然招財|保證不纏繞/],
    }],
    ['bathroom-washbasin-overflow-hole-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*220/, /溢水孔/, /環境部/, /七日/],
      forbidden: [/一定化煞|必然聚財|保證不堵塞/],
    }],
    ['living-room-sofa-seat-seam-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /沙發縫隙/, /環境部/, /七日/],
      forbidden: [/一定聚氣|必然留財|保證無塵蟎/],
    }],
    ['kitchen-range-hood-exhaust-duct-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*190/, /排煙管/, /回煙/, /七日/],
      forbidden: [/一定聚財|必然排煙|保證不失火/],
    }],
    ['bathroom-shower-wall-tile-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*230/, /牆面磁磚/, /皂垢/, /七日/],
      forbidden: [/一定防霉|必然化煞|保證不滑倒/],
    }],
    ['entryway-door-threshold-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*220/, /玄關門檻/, /高差/, /七日/],
      forbidden: [/一定守財|必然擋煞|保證不絆倒/],
    }],
    ['kitchen-island-work-triangle-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*220/, /工作三角/, /中島/, /七日/],
      forbidden: [/一定聚財|必然旺火|保證不碰撞/],
    }],
    ['entryway-door-opening-radius-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /門扇開啟半徑/, /門把/, /七日/],
      forbidden: [/一定招財|必然擋煞|保證不夾手/],
    }],
    ['home-office-window-glare-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*330/, /窗戶眩光/, /螢幕/, /七日/],
      forbidden: [/一定專注|必然改善視力|保證不頭痛/],
    }],
    ['laundry-washing-machine-inlet-hose-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*160/, /進水管/, /漏水/, /七日/],
      forbidden: [/一定聚財|必然順水|(?<!不能)保證不漏水/],
    }],
    ['balcony-floor-tile-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*150/, /陽台地磚/, /青苔/, /七日/],
      forbidden: [/一定聚氣|必然防滑|保證不積水/],
    }],
    ['living-room-wall-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/330\s*×\s*420/, /壁掛層板/, /承重/, /七日/],
      forbidden: [/一定聚財|必然穩固|保證不掉落/],
    }],
    ['kitchen-gas-stove-burner-cap-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*270/, /火蓋/, /火孔/, /七日/],
      forbidden: [/一定聚財|必然旺火|保證安全/],
    }],
    ['home-office-power-strip-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /延長線/, /額定容量/, /五日/],
      forbidden: [/一定旺文昌|必然升遷|保證不過載/],
    }],
    ['bedroom-mattress-wall-gap-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床墊/, /牆面/, /七日/],
      forbidden: [/一定聚財|必然好睡|保證不潮濕/],
    }],
    ['kitchen-microwave-door-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*260/, /微波爐/, /密封條/, /七日/],
      forbidden: [/一定聚財|必然加熱|保證不漏波/],
    }],
    ['bedroom-charging-station-cable-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /充電站/, /散熱/, /七日/],
      forbidden: [/一定安神|必然好睡|保證不過熱/],
    }],
    ['living-room-tv-console-leveling-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /電視櫃/, /水平/, /七日/],
      forbidden: [/一定聚財|必然鎮宅|保證不倒/],
    }],
    ['kitchen-refrigerator-vegetable-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*240/, /蔬果抽屜/, /水氣/, /七日/],
      forbidden: [/一定聚財|必然保鮮|保證不變質/],
    }],
    ['bathroom-medicine-cabinet-humidity-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /藥櫃/, /濕氣/, /七日/],
      forbidden: [/一定聚財|必然防潮|保證有效/],
    }],
    ['entryway-light-switch-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /開關/, /照明/, /五日/],
      forbidden: [/一定旺宅|必然明亮|保證安全/],
    }],
    ['kitchen-refrigerator-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/290\s*×\s*230/, /冰箱層板/, /滴液/, /七日/],
      forbidden: [/一定聚財|必然保鮮|保證不污染/],
    }],
    ['bedroom-headboard-stability-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*320/, /床頭板/, /固定/, /七日/],
      forbidden: [/一定聚財|必然有靠|保證不晃/],
    }],
    ['bathroom-toilet-seat-height-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /馬桶高度/, /起身/, /七日/],
      forbidden: [/一定聚財|必然好坐|保證不跌倒/],
    }],
    ['kitchen-freezer-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*230/, /冷凍庫抽屜/, /結霜/, /七日/],
      forbidden: [/一定聚財|必然保鮮|保證不退冰/],
    }],
    ['bathroom-toilet-flush-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*210/, /沖水把手/, /漏水/, /七日/],
      forbidden: [/一定聚財|必然除菌|保證不漏水/],
    }],
    ['bedroom-bedside-clock-battery-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /床邊時鐘/, /電池/, /七日/],
      forbidden: [/一定聚財|必然安神|保證不漏液/],
    }],
    ['kitchen-refrigerator-ice-maker-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /製冰機/, /濾芯/, /七日/],
      forbidden: [/一定聚財|必然冰塊衛生|保證不異味/],
    }],
    ['bathroom-toilet-tank-condensation-feng-shui', {
      minimumCharacters: 3200,
      required: [/170\s*×\s*200/, /水箱/, /結露/, /七日/],
      forbidden: [/一定聚財|必然乾燥|保證不漏水/],
    }],
    ['bedroom-bedside-clock-display-brightness-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /床邊時鐘/, /亮度/, /七日/],
      forbidden: [/一定聚財|必然好睡|保證不失眠/],
    }],
    ['kitchen-refrigerator-egg-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*240/, /蛋架/, /蛋殼/, /七日/],
      forbidden: [/一定聚財|必然新鮮|保證不變質/],
    }],
    ['bathroom-toilet-water-supply-hose-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*210/, /供水軟管/, /角閥/, /七日/],
      forbidden: [/一定聚財|必然不漏|保證不滲水/],
    }],
    ['bedroom-bedside-phone-notifications-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /手機通知/, /充電/, /七日/],
      forbidden: [/一定聚財|必然好睡|保證不失眠/],
    }],
    ['entryway-umbrella-drip-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /瀝水盤/, /防滑/, /七日/],
      forbidden: [/一定聚財|必然擋煞|保證不滑倒/],
    }],
    ['living-room-air-conditioner-remote-control-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /遙控器/, /電池/, /七日/],
      forbidden: [/一定聚財|必然降溫|保證不故障/],
    }],
    ['bedroom-bedside-earplugs-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*300/, /耳塞/, /乾燥/, /七日/],
      forbidden: [/一定聚財|必然安神|保證不發炎/],
    }],
    ['kitchen-rice-cooker-steam-vent-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /蒸氣孔/, /鍋蓋/, /七日/],
      forbidden: [/一定聚財|必然除臭|保證不故障/],
    }],
    ['entryway-raincoat-drying-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*220/, /雨衣/, /晾乾/, /七日/],
      forbidden: [/一定聚財|必然除臭|保證不發霉/],
    }],
    ['bedroom-heating-pad-cord-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*300/, /電熱毯/, /電源線/, /七日/],
      forbidden: [/一定聚財|必然保暖|保證不過熱/],
    }],
    ['kitchen-water-filter-replacement-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /濾芯/, /沖洗/, /七日/],
      forbidden: [/一定聚財|必然安全|保證水質/],
    }],
    ['balcony-dehumidifier-drain-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*260/, /除濕機/, /排水管/, /七日/],
      forbidden: [/一定聚財|必然乾燥|保證不漏水/],
    }],
    ['bathroom-toothbrush-sterilizer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /牙刷/, /乾燥/, /七日/],
      forbidden: [/一定聚財|必然消毒|保證無菌/],
    }],
    ['kitchen-microwave-turntable-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*320/, /轉盤/, /滾輪/, /七日/],
      forbidden: [/一定聚財|必然加熱|保證不冒煙/],
    }],
    ['living-room-curtain-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /窗簾/, /灰塵/, /七日/],
      forbidden: [/一定聚財|必然除蟎|保證空氣/],
    }],
    ['bathroom-shower-water-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /濾芯/, /水垢/, /七日/],
      forbidden: [/一定聚財|必然淨化|保證水質/],
    }],
    ['kitchen-toaster-crumb-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /烤麵包機/, /碎屑/, /七日/],
      forbidden: [/保證不冒煙|必然聚財|一定不燙/],
    }],
    ['living-room-blinds-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /百葉簾/, /葉片/, /七日/],
      forbidden: [/保證無塵|必然聚氣|一定改善空氣/],
    }],
    ['bedroom-pillowcase-drying-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*300/, /枕套/, /乾燥/, /七日/],
      forbidden: [/保證除蟎|必然招財|一定不過敏/],
    }],
    ['kitchen-blender-blade-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /果汁機/, /刀片/, /七日/],
      forbidden: [/保證健康|必然聚財|一定不漏液/],
    }],
    ['bathroom-shower-slippers-drying-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /拖鞋/, /瀝水/, /七日/],
      forbidden: [/保證防滑|必然化煞|一定不感染/],
    }],
    ['living-room-smart-speaker-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /智慧音箱/, /麥克風/, /七日/],
      forbidden: [/保證音質|必然聚氣|一定保護隱私/],
    }],
    ['bedroom-humidifier-water-tank-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*300/, /加濕器/, /水箱/, /七日/],
      forbidden: [/保證加濕|必然聚財|一定改善睡眠/],
    }],
    ['balcony-mosquito-screen-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*150/, /紗窗/, /灰塵/, /七日/],
      forbidden: [/保證防蚊|必然聚財|一定改善空氣/],
    }],
    ['bathroom-toothbrush-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*220/, /牙刷柄/, /乾燥/, /七日/],
      forbidden: [/保證無菌|必然化煞|一定不蛀牙/],
    }],
    ['home-office-keyboard-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /鍵盤/, /按鍵/, /七日/],
      forbidden: [/保證效率|必然升遷|一定不進水/],
    }],
    ['entryway-wet-shoes-drying-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*160/, /濕鞋/, /乾燥/, /七日/],
      forbidden: [/保證不滑|必然招財|一定除臭/],
    }],
    ['laundry-ironing-board-cover-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*140/, /燙衣板/, /布套/, /七日/],
      forbidden: [/保證平整|必然聚財|一定不焦/],
    }],
    ['living-room-floor-fan-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*180/, /電風扇/, /護網/, /七日/],
      forbidden: [/保證降溫|必然旺財|一定不觸電/],
    }],
    ['kitchen-air-fryer-basket-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*180/, /氣炸鍋/, /炸籃/, /七日/],
      forbidden: [/保證無油|必然招財|一定不致癌/],
    }],
    ['entryway-vacuum-cleaner-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*180/, /吸塵器/, /濾網/, /七日/],
      forbidden: [/保證除塵|必然聚財|一定無過敏/],
    }],
    ['kitchen-electric-kettle-scale-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*160/, /快煮壺/, /水垢/, /七日/],
      forbidden: [/保證水質|必然聚財|一定不結垢/],
    }],
    ['entryway-key-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*140/, /鑰匙盤/, /門把/, /七日/],
      forbidden: [/保證乾淨|必然招財|一定消毒/],
    }],
    ['bedroom-floor-lamp-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*180/, /落地燈/, /燈罩/, /七日/],
      forbidden: [/保證護眼|必然聚財|一定不燙/],
    }],
    ['kitchen-pressure-cooker-gasket-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*180/, /壓力鍋/, /墊圈/, /七日/],
      forbidden: [/保證安全|必然聚財|一定不堵塞/],
    }],
    ['bedroom-electric-blanket-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*200/, /電熱毯/, /電熱線/, /七日/],
      forbidden: [/保證保暖|必然安眠|一定不短路/],
    }],
    ['bathroom-hair-dryer-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*160/, /吹風機/, /進風口/, /七日/],
      forbidden: [/保證乾髮|必然旺運|一定不過熱/],
    }],
    ['kitchen-coffee-machine-water-tank-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /咖啡機/, /水箱/, /七日/],
      forbidden: [/保證咖啡|必然聚財|一定不結垢/],
    }],
    ['bedroom-smartphone-screen-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /手機螢幕/, /充電孔/, /七日/],
      forbidden: [/保證護眼|必然招財|一定不進水/],
    }],
    ['living-room-game-controller-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /遊戲手把/, /搖桿/, /七日/],
      forbidden: [/保證操控|必然旺運|一定不漂移/],
    }],
    ['kitchen-coffee-grinder-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*260/, /咖啡研磨機/, /刀盤/, /七日/],
      forbidden: [/咖啡一定更香|招財保證|零風險/],
    }],
    ['bedroom-hair-straightener-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*260/, /離子夾/, /夾板/, /七日/],
      forbidden: [/造型百分之百|桃花保證|零燙傷/],
    }],
    ['living-room-game-console-vent-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /遊戲主機/, /散熱孔/, /七日/],
      forbidden: [/保證降溫|必然旺運|一定不過熱/],
    }],
    ['kitchen-dishwasher-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /洗碗機/, /濾網/, /七日/],
      forbidden: [/保證洗淨|必然聚財|一定不堵塞/],
    }],
    ['bedroom-electric-heater-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /電暖器/, /濾網/, /七日/],
      forbidden: [/保證保暖|必然安眠|一定不過熱/],
    }],
    ['living-room-uv-disinfection-lamp-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /紫外線消毒燈/, /燈管/, /七日/],
      forbidden: [/保證消毒|必然淨化|一定無暴露/],
    }],
    ['kitchen-rice-cooker-inner-lid-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*260/, /電子鍋/, /內蓋/, /七日/],
      forbidden: [/保證飯香|必然聚財|一定不溢鍋/],
    }],
    ['bathroom-electric-shaver-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /電動刮鬍刀/, /刀頭/, /七日/],
      forbidden: [/保證清爽|必然旺面相|一定不割傷/],
    }],
    ['living-room-projector-lens-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /投影機/, /鏡頭/, /七日/],
      forbidden: [/保證畫質|必然旺名聲|一定不過熱/],
    }],
    ['kitchen-sandwich-maker-plate-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*260/, /熱壓吐司機/, /烤盤/, /七日/],
      forbidden: [/保證早餐|必然聚財|一定不焦/],
    }],
    ['bedroom-electric-mosquito-repellent-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /電蚊香器/, /藥液/, /七日/],
      forbidden: [/防蚊百分之百|安睡承諾|完全無害/],
    }],
    ['balcony-solar-panel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*260/, /太陽能板/, /積塵/, /七日/],
      forbidden: [/保證發電|必然聚財|一定增效/],
    }],
    ['kitchen-electric-hot-pot-plug-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /電火鍋/, /插頭/, /七日/],
      forbidden: [/保證圍爐|必然聚財|一定不發熱/],
    }],
    ['bedroom-massage-gun-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /筋膜槍/, /按摩頭/, /七日/],
      forbidden: [/保證恢復|必然安眠|一定不受傷/],
    }],
    ['balcony-electric-bug-zapper-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*260/, /電捕蚊燈/, /集蟲盒/, /七日/],
      forbidden: [/保證防蚊|必然驅濁|一定不短路/],
    }],
    ['kitchen-range-hood-grease-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /排油煙機/, /油杯/, /七日/],
      forbidden: [/保證吸力|必然聚財|一定不漏油/],
    }],
    ['bedroom-dehumidifier-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /除濕機/, /水箱/, /七日/],
      forbidden: [/保證除濕|必然安眠|一定不漏水/],
    }],
    ['living-room-air-purifier-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /空氣清淨機/, /濾芯/, /七日/],
      forbidden: [/保證過濾|必然淨化|一定無異味/],
    }],
    ['kitchen-gas-stove-burner-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /瓦斯爐/, /火孔/, /七日/],
      forbidden: [/保證燃燒|必然聚財|一定不漏氣/],
    }],
    ['bedroom-pillow-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /枕頭/, /枕芯/, /七日/],
      forbidden: [/保證除螨|必然安眠|一定無過敏/],
    }],
    ['living-room-rug-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /地毯/, /吸塵/, /七日/],
      forbidden: [/保證除塵|必然聚財|一定不過敏/],
    }],
    ['kitchen-microwave-door-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /微波爐/, /密封條/, /七日/],
      forbidden: [/保證加熱|必然聚財|一定不洩漏/],
    }],
    ['bedroom-fan-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /電風扇/, /扇葉/, /七日/],
      forbidden: [/保證降溫|必然安眠|一定不短路/],
    }],
    ['living-room-wall-fan-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /壁掛電扇/, /支架/, /七日/],
      forbidden: [/保證送風|必然旺運|一定不掉落/],
    }],
    ['kitchen-toaster-crumb-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /烤麵包機/, /屑盤/, /七日/],
      forbidden: [/保證烘烤|必然聚財|一定不焦/],
    }],
    ['bedroom-bedside-cabinet-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /床頭櫃/, /抽屜/, /七日/],
      forbidden: [/保證好眠|必然安眠|一定不受潮/],
    }],
    ['living-room-tv-remote-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /電視遙控器/, /電池/, /七日/],
      forbidden: [/保證遙控|必然旺運|一定不漏液/],
    }],
    ['kitchen-bread-box-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /麵包盒/, /麵包屑/, /七日/],
      forbidden: [/保證保存|必然聚財|一定不發霉/],
    }],
    ['bedroom-wardrobe-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /衣櫃/, /抽屜/, /七日/],
      forbidden: [/保證防潮|必然衣祿|一定不發霉/],
    }],
    ['living-room-speaker-grille-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /喇叭/, /網罩/, /七日/],
      forbidden: [/保證音質|必然旺人緣|一定不破音/],
    }],
    ['kitchen-spice-rack-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /調味料架/, /受潮/, /七日/],
      forbidden: [/保證料理|必然聚財|一定不受潮/],
    }],
    ['bedroom-curtain-rod-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /窗簾桿/, /支架/, /七日/],
      forbidden: [/保證好眠|必然藏風|一定不鬆動/],
    }],
    ['living-room-coffee-table-under-surface-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /茶几/, /底部/, /七日/],
      forbidden: [/保證承重|必然聚財|一定不搖晃/],
    }],
    ['kitchen-spice-jar-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /調味料瓶/, /瓶蓋/, /七日/],
      forbidden: [/保證料理|必然聚財|一定不受潮/],
    }],
    ['bedroom-mattress-protector-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /保潔墊/, /床墊/, /七日/],
      forbidden: [/保證好眠|必然除蟎|一定不發霉/],
    }],
    ['living-room-cushion-cover-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /坐墊套/, /泡棉/, /七日/],
      forbidden: [/保證人緣|必然舒適|一定不發霉/],
    }],
    ['kitchen-sink-drain-strainer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /水槽濾網/, /殘渣/, /七日/],
      forbidden: [/保證排水|必然聚財|一定不發臭/],
    }],
    ['bedroom-bed-frame-underbed-storage-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /床下收納/, /床架/, /七日/],
      forbidden: [/保證好眠|必然聚氣|一定不受潮/],
    }],
    ['living-room-bookshelf-bottom-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /書櫃/, /底層/, /七日/],
      forbidden: [/保證學業|必然旺文昌|一定不傾倒/],
    }],
    ['kitchen-drawer-organizer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /抽屜收納盒/, /餐具/, /七日/],
      forbidden: [/保證料理|必然聚財|一定不發霉/],
    }],
    ['bedroom-bedside-rug-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /床邊地毯/, /止滑/, /七日/],
      forbidden: [/保證好眠|必然安睡|一定不滑/],
    }],
    ['living-room-tv-stand-bottom-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /電視櫃/, /電線/, /七日/],
      forbidden: [/保證音效|必然旺人緣|一定不過熱/],
    }],
    ['kitchen-cabinet-shelf-liner-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /櫥櫃層板墊/, /油膜/, /七日/],
      forbidden: [/保證收納|必然聚財|一定不發霉/],
    }],
    ['bedroom-window-sill-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /臥室窗台/, /凝結水/, /七日/],
      forbidden: [/保證好眠|必然藏風|一定不結露/],
    }],
    ['living-room-tv-cabinet-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /電視櫃層板/, /散熱/, /七日/],
      forbidden: [/保證散熱|必然旺人緣|一定不傾倒/],
    }],
    ['kitchen-cabinet-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /櫥櫃把手/, /油膜/, /七日/],
      forbidden: [/保證收納|必然聚財|一定不發霉/],
    }],
    ['bedroom-blanket-storage-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /毛毯/, /乾燥/, /七日/],
      forbidden: [/保證好眠|必然聚氣|一定不受潮/],
    }],
    ['living-room-speaker-stand-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /喇叭架/, /支架/, /七日/],
      forbidden: [/保證音質|必然旺人緣|一定不傾倒/],
    }],
    ['kitchen-cabinet-door-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /櫥櫃門片/, /鉸鏈/, /七日/],
      forbidden: [/保證收納|必然聚財|一定不發霉/],
    }],
    ['bedroom-bed-throw-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /床上蓋毯/, /乾燥/, /七日/],
      forbidden: [/保證好眠|必然聚氣|一定不受潮/],
    }],
    ['living-room-speaker-cable-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /喇叭線材/, /走線/, /七日/],
      forbidden: [/保證音質|必然旺人緣|一定不絆倒/],
    }],
    ['kitchen-sink-faucet-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /廚房水龍頭/, /水垢/, /七日/],
      forbidden: [/保證洗淨|必然聚財|一定不漏水/],
    }],
    ['bedroom-bedside-table-lamp-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /床邊檯燈/, /電線/, /七日/],
      forbidden: [/保證好眠|必然聚氣|一定不過熱/],
    }],
    ['living-room-tv-screen-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /電視螢幕/, /散熱/, /七日/],
      forbidden: [/保證畫質|必然旺人緣|一定不反光/],
    }],
    ['kitchen-countertop-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /廚房檯面/, /油膜/, /七日/],
      forbidden: [/保證備餐|必然聚財|一定不殘留/],
    }],
    ['bedroom-bed-sheet-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /臥室床單/, /乾燥/, /七日/],
      forbidden: [/保證好眠|必然聚氣|一定不受潮/],
    }],
    ['living-room-coffee-table-top-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /茶几桌面/, /承重/, /七日/],
      forbidden: [/保證人緣|必然聚氣|一定不傾倒/],
    }],
    ['kitchen-cabinet-hinge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /櫥櫃鉸鏈/, /鏽蝕/, /七日/],
      forbidden: [/保證收納|必然聚財|一定不夾手/],
    }],
    ['bedroom-quilt-storage-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /臥室棉被/, /填充物/, /七日/],
      forbidden: [/保證好眠|必然聚氣|一定不受潮/],
    }],
    ['living-room-side-table-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /客廳邊桌/, /承重/, /七日/],
      forbidden: [/保證人緣|必然靠山|一定不傾倒/],
    }],
    ['kitchen-sink-basin-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /廚房水槽盆/, /積水/, /七日/],
      forbidden: [/保證洗淨|必然聚財|一定不回堵/],
    }],
    ['bedroom-pillowcase-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /臥室枕套/, /乾燥/, /七日/],
      forbidden: [/保證好眠|必然聚氣|一定不受潮/],
    }],
    ['living-room-sideboard-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /客廳邊櫃/, /固定/, /七日/],
      forbidden: [/保證人緣|必然靠山|一定不傾倒/],
    }],
    ['kitchen-sink-drain-pipe-leak-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /水槽下方排水管/, /潮痕/, /七日/],
      forbidden: [/保證不漏水|必然不破財|一定能修好/],
    }],
    ['bedroom-duvet-cover-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /臥室被套/, /完全乾燥/, /七日/],
      forbidden: [/保證好眠|必然安定|一定不受潮/],
    }],
    ['living-room-tv-cabinet-door-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /電視櫃門片/, /散熱/, /七日/],
      forbidden: [/保證人緣|必然聚氣|一定不過熱/],
    }],
    ['kitchen-dishwasher-rack-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /洗碗機籃架/, /排水/, /七日/],
      forbidden: [/保證洗淨|必然聚財|一定不積水/],
    }],
    ['bedroom-bedspread-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /臥室床罩/, /完全乾燥/, /七日/],
      forbidden: [/保證好眠|必然安定|一定不受潮/],
    }],
    ['living-room-display-cabinet-glass-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /展示櫃玻璃門/, /固定/, /七日/],
      forbidden: [/保證人緣|必然聚氣|一定不裂/],
    }],
    ['bathroom-shower-door-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /浴室淋浴門把/, /水垢/, /七日/],
      forbidden: [/保證桃花|必然旺運|一定不滑倒/],
    }],
    ['laundry-washing-machine-detergent-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機洗劑盒/, /乾燥/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不發霉/],
    }],
    ['entryway-door-lock-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關門鎖/, /鑰匙孔/, /七日/],
      forbidden: [/保證防盜|必然守財|一定能開/],
    }],
    ['bathroom-toilet-tank-chain-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶水箱鏈條/, /漏水/, /七日/],
      forbidden: [/保證健康|必然排濁|一定不漏水/],
    }],
    ['laundry-washing-machine-inlet-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機進水濾網/, /軟管/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不漏水/],
    }],
    ['entryway-door-peephole-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關門上貓眼/, /霧化/, /七日/],
      forbidden: [/保證防盜|必然守財|一定看清/],
    }],
    ['bathroom-toilet-tank-fill-valve-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶水箱進水閥/, /水位/, /七日/],
      forbidden: [/保證健康|必然補運|一定不漏水/],
    }],
    ['laundry-washing-machine-drum-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機內桶/, /空桶/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不發霉/],
    }],
    ['entryway-door-hinge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關大門鉸鏈/, /門扇下垂/, /七日/],
      forbidden: [/保證防盜|必然納財|一定不吱聲/],
    }],
    ['bathroom-toilet-tank-overflow-tube-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶溢水管/, /水位/, /七日/],
      forbidden: [/保證健康|必然聚財|一定不漏水/],
    }],
    ['laundry-washing-machine-door-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機門膠圈/, /摺層/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不漏水/],
    }],
    ['entryway-door-safety-chain-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關大門安全鏈/, /固定座/, /七日/],
      forbidden: [/保證防盜|必然守財|一定不脫扣/],
    }],
    ['bathroom-toilet-seat-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶座圈/, /鉸鏈/, /七日/],
      forbidden: [/必然安定|一定不晃動/],
    }],
    ['laundry-washing-machine-door-glass-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機門玻璃/, /異物/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不漏水/],
    }],
    ['entryway-door-threshold-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關大門門檻密封條/, /門底/, /七日/],
      forbidden: [/保證防水|必然守財|一定不進水/],
    }],
    ['bathroom-toilet-rim-hole-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶邊緣出水孔/, /水垢/, /七日/],
      forbidden: [/保證健康|必然排濁|一定不堵塞/],
    }],
    ['laundry-washing-machine-drain-pump-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機排水泵浦濾網/, /剩水/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不漏水/],
    }],
    ['entryway-door-closer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關大門閉門器/, /關門速度/, /七日/],
      forbidden: [/保證防盜|必然守財|一定不回彈/],
    }],
    ['bathroom-toilet-bowl-trapway-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶存水彎/, /排水/, /七日/],
      forbidden: [/保證健康|必然排濁|一定不回流/],
    }],
    ['laundry-washing-machine-door-latch-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機門鎖扣/, /Child Lock/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不漏水/],
    }],
    ['entryway-door-strike-plate-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關大門鎖舌扣片/, /鎖舌/, /七日/],
      forbidden: [/保證防盜|必然守財|一定不撞擊/],
    }],
    ['bathroom-toilet-seat-bumper-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶座圈緩衝墊/, /膠墊/, /七日/],
      forbidden: [/保證健康|必然安定|一定不滑動/],
    }],
    ['laundry-washing-machine-leveling-foot-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機水平腳/, /震動/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不震動/],
    }],
    ['entryway-door-sweep-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關大門底部掃條/, /門檻/, /七日/],
      forbidden: [/保證防水|必然守財|一定不進水/],
    }],
    ['bathroom-toilet-bowl-waterline-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬桶水位線/, /水垢/, /七日/],
      forbidden: [/保證健康|必然聚財|一定不回垢/],
    }],
    ['laundry-washing-machine-drain-hose-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*220/, /洗衣機排水管/, /虹吸/, /七日/],
      forbidden: [/保證洗淨|必然旺財|一定不漏水/],
    }],
    ['entryway-door-weatherstrip-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關大門框邊密封條/, /門框/, /七日/],
      forbidden: [/保證防水|必然守財|一定不進水/],
    }],
    ['kitchen-refrigerator-defrost-drain-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱除霜排水孔/, /積水/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不積水/],
    }],
    ['bedroom-bed-frame-center-support-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床架中央支撐梁/, /床架/, /七晚/],
      forbidden: [/必然安眠|一定不晃動/],
    }],
    ['living-room-ceiling-fan-light-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /客廳吊扇燈具/, /吊扇/, /七日/],
      forbidden: [/必然聚氣|一定不震動/],
    }],
    ['kitchen-stove-control-knob-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /瓦斯爐控制旋鈕/, /旋鈕/, /七日/],
      forbidden: [/保證安全|必然旺財|一定不漏氣/],
    }],
    ['bathroom-showerhead-screen-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴花灑濾網/, /出水/, /七日/],
      forbidden: [/保證洗淨|必然聚氣|一定不漏水/],
    }],
    ['kitchen-countertop-seam-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /廚房檯面接縫/, /接縫/, /七日/],
      forbidden: [/保證無菌|必然聚財|一定不裂/],
    }],
    ['bathroom-shower-door-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴門底部密封條/, /門檻/, /七日/],
      forbidden: [/保證防滑|必然除霉|一定不漏水/],
    }],
    ['bedroom-dresser-drawer-rail-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /臥室抽屜滑軌/, /滑軌/, /七晚/],
      forbidden: [/保證安靜|必然好收納|一定不卡住/],
    }],
    ['entryway-umbrella-stand-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /玄關雨傘架接水盤/, /接水盤/, /七日/],
      forbidden: [/保證乾燥|必然守財|一定不生鏽/],
    }],
    ['dining-room-table-leg-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐桌桌腳/, /桌腳/, /七日/],
      forbidden: [/一定聚財|必然改善關係|保證不搖晃/],
    }],
    ['dining-room-chair-back-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐椅椅背/, /椅背/, /七日/],
      forbidden: [/一定和諧|必然旺家|保證不疲勞/],
    }],
    ['kitchen-refrigerator-door-gasket-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱門密封條/, /密封條/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不漏冷/],
    }],
    ['dining-room-table-edge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐桌桌邊/, /桌邊/, /七日/],
      forbidden: [/一定聚財|必然和諧|保證不刮傷/],
    }],
    ['bedroom-dresser-top-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /臥室梳妝台面/, /桌面/, /七日/],
      forbidden: [/一定聚財|必然好眠|保證不受潮/],
    }],
    ['kitchen-refrigerator-door-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱門把手/, /門把手/, /七日/],
      forbidden: [/保證乾淨|必然聚財|一定不鬆脫/],
    }],
    ['dining-room-table-under-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐桌桌下/, /桌下/, /七日/],
      forbidden: [/一定聚財|必然和諧|保證沒有灰塵/],
    }],
    ['bedroom-dresser-bottom-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /臥室梳妝台底部/, /底部/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不受潮/],
    }],
    ['kitchen-refrigerator-door-bin-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱門架/, /門架/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不發臭/],
    }],
    ['dining-room-chair-seat-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐椅椅面/, /椅面/, /七日/],
      forbidden: [/一定和諧|必然旺家|保證不沾污/],
    }],
    ['bedroom-dresser-side-panel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /臥室梳妝台側板/, /側板/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不刮傷/],
    }],
    ['kitchen-refrigerator-shelf-rail-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱層架滑軌/, /滑軌/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不卡住/],
    }],
    ['dining-room-chair-foot-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐椅椅腳/, /椅腳/, /七日/],
      forbidden: [/一定和諧|必然旺家|保證不搖晃/],
    }],
    ['bedroom-dresser-back-panel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /臥室梳妝台背板/, /背板/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不傾倒/],
    }],
    ['kitchen-refrigerator-shelf-support-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱層架支撐點/, /支撐點/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不斷裂/],
    }],
    ['dining-room-chair-leg-joint-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐椅椅腳接合處/, /接合/, /七日/],
      forbidden: [/一定和諧|必然旺家|保證不鬆動/],
    }],
    ['bedroom-dresser-wall-gap-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /梳妝台牆距/, /牆距/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不潮濕/],
    }],
    ['kitchen-refrigerator-shelf-bracket-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱層架托架/, /托架/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不下沉/],
    }],
    ['dining-room-chair-underside-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐椅椅面下方/, /椅底/, /七日/],
      forbidden: [/一定和諧|必然旺家|保證不受潮/],
    }],
    ['bedroom-dresser-wall-anchor-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /梳妝台牆面固定件/, /固定件/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不傾倒/],
    }],
    ['kitchen-refrigerator-shelf-support-hole-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱層架支撐孔/, /支撐孔/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不歪斜/],
    }],
    ['dining-room-table-centerpiece-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐桌中央擺設/, /中央/, /七日/],
      forbidden: [/一定聚財|必然和諧|保證不擋視線/],
    }],
    ['bedroom-dresser-drawer-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /梳妝台抽屜把手/, /把手/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不鬆脫/],
    }],
    ['kitchen-refrigerator-egg-holder-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱蛋架/, /蛋架/, /七日/],
      forbidden: [/保證食物安全|必然聚財|一定不變質/],
    }],
    ['dining-room-table-runner-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐桌桌旗/, /中央/, /七日/],
      forbidden: [/一定聚財|必然和諧|保證不擋視線/],
    }],
    ['bedroom-dresser-drawer-front-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /梳妝台抽屜面板/, /面板/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不刮傷/],
    }],
    ['kitchen-refrigerator-ice-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱製冰盒/, /製冰盒/, /七日/],
      forbidden: [/保證食品安全|必然聚財|一定不結塊/],
    }],
    ['dining-room-placemat-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐桌餐墊/, /餐墊/, /七日/],
      forbidden: [/一定聚財|必然和諧|保證不滑動/],
    }],
    ['bedroom-dresser-drawer-bottom-panel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /梳妝台抽屜底板/, /底板/, /七日/],
      forbidden: [/一定好眠|必然聚財|保證不下陷/],
    }],
    ['kitchen-refrigerator-ice-bin-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*220/, /冰箱儲冰盒/, /儲冰盒/, /七日/],
      forbidden: [/保證食品安全|必然聚財|一定不結塊/],
    }],
    ['bathroom-washbasin-pop-up-stopper-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/170\s*×\s*240/, /洗手台彈跳排水塞/, /排水塞/, /七日/],
      forbidden: [/一定除臭|必然聚財|保證不漏水/],
    }],
    ['kitchen-dishwasher-spray-arm-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /洗碗機噴水臂/, /噴水臂/, /七日/],
      forbidden: [/一定洗乾淨|保證除菌|必然聚財/],
    }],
    ['living-room-recliner-footrest-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /躺椅腳踏/, /腳踏/, /七日/],
      forbidden: [/一定舒適|保證不夾|必然聚財/],
    }],
    ['dining-room-extendable-table-leaf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*320/, /伸縮餐桌隱藏桌板/, /隱藏桌板/, /七日/],
      forbidden: [/一定穩固|保證不夾|必然聚財/],
    }],
    ['bedroom-bed-frame-floor-protector-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*350/, /床架腳下地板保護墊/, /保護墊/, /七日/],
      forbidden: [/一定好眠|保證不滑|必然聚財/],
    }],
    ['kitchen-refrigerator-crisper-drawer-glide-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /冰箱蔬果抽屜滑槽/, /滑槽/, /七日/],
      forbidden: [/保證保鮮|一定不發霉|必然聚財/],
    }],
    ['bathroom-shower-drain-strainer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴排水過濾網/, /過濾網/, /七日/],
      forbidden: [/一定除臭|保證不堵|必然聚財/],
    }],
    ['laundry-washing-machine-agitator-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /洗衣機攪拌柱/, /攪拌柱/, /七日/],
      forbidden: [/一定洗淨|保證除菌|必然聚財/],
    }],
    ['living-room-coffee-table-lower-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /客廳茶几下層架/, /下層架/, /七日/],
      forbidden: [/一定穩固|保證不傾倒|必然聚財/],
    }],
    ['bathroom-exhaust-fan-cover-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /浴室排風扇外罩/, /排風/, /七日/],
      forbidden: [/一定除霉|保證健康|必然聚財/],
    }],
    ['entryway-doorbell-camera-lens-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*260/, /玄關門鈴攝影機鏡頭/, /鏡頭/, /七日/],
      forbidden: [/一定平安|保證防盜|必然聚財/],
    }],
    ['living-room-curtain-rod-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /客廳窗簾桿/, /支架/, /七日/],
      forbidden: [/一定採光|保證穩固|必然聚財/],
    }],
    ['bathroom-mirror-frame-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*220/, /浴室鏡面邊框/, /邊框/, /七日/],
      forbidden: [/一定招財|保證不發霉|必然化煞/],
    }],
    ['kitchen-faucet-aerator-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /廚房水龍頭起泡器/, /起泡器/, /七日/],
      forbidden: [/一定出水|保證飲用安全|必然聚財/],
    }],
    ['bedroom-bedside-lamp-base-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /臥室床頭燈底座/, /底座/, /七日/],
      forbidden: [/一定好眠|保證不傾倒|必然聚財/],
    }],
    ['bathroom-shower-mat-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴墊邊緣/, /止滑/, /七日/],
      forbidden: [/一定防滑|保證不發霉|必然聚財/],
    }],
    ['kitchen-cabinet-door-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /廚房櫃門封邊/, /封邊/, /七日/],
      forbidden: [/一定防潮|保證食材安全|必然聚財/],
    }],
    ['bedroom-bedside-table-top-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /臥室床頭櫃桌面/, /桌面/, /七日/],
      forbidden: [/一定好眠|保證不絆倒|必然聚財/],
    }],
    ['bathroom-towel-rack-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/160\s*×\s*240/, /浴室毛巾架/, /皂垢/, /七日/],
      forbidden: [/一定化煞|保證防跌|必然聚財/],
    }],
    ['kitchen-trash-bin-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /廚房垃圾桶/, /內桶/, /七日/],
      forbidden: [/一定招財|保證食品安全|必然除蟲/],
    }],
    ['laundry-room-drying-rack-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /洗衣間曬衣架/, /鏽斑/, /七日/],
      forbidden: [/一定乾燥|保證防霉|必然聚財/],
    }],
    ['entryway-shoe-rack-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /玄關鞋架/, /鞋底/, /七日/],
      forbidden: [/一定聚財|保證防霉|必然防滑/],
    }],
    ['home-office-desk-cable-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌線材/, /電源線/, /七日/],
      forbidden: [/一定專注|保證不跳電|必然旺文昌/],
    }],
    ['living-room-sideboard-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /客廳餐邊櫃抽屜/, /滑軌/, /七日/],
      forbidden: [/一定鎖財|保證承重|必然除蟲/],
    }],
    ['balcony-window-track-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /陽台窗軌/, /排水孔/, /七日/],
      forbidden: [/一定納財|保證防水|必然防墜/],
    }],
    ['bedroom-dresser-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /臥室斗櫃抽屜/, /底板/, /七日/],
      forbidden: [/一定好眠|保證承重|必然防霉/],
    }],
    ['home-office-desk-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌抽屜/, /文件/, /七日/],
      forbidden: [/一定專注|保證電氣安全|必然旺文昌/],
    }],
    ['kitchen-cooktop-knob-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /爐具旋鈕/, /密封件/, /七日/],
      forbidden: [/一定旺財|保證點火|必然聚財/],
    }],
    ['bathroom-mirror-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*220/, /玻璃層板/, /托架/, /七日/],
      forbidden: [/一定守財|保證防霉|必然安全/],
    }],
    ['living-room-floor-lamp-cord-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*400/, /立燈電線/, /插頭/, /七日/],
      forbidden: [/一定旺運|保證電氣|必然照明/],
    }],
    ['kitchen-countertop-corner-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /廚房檯面轉角/, /封邊/, /七日/],
      forbidden: [/一定聚財|保證防水|必然食品安全/],
    }],
    ['bedroom-dresser-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*320/, /臥室斗櫃把手/, /螺絲/, /七日/],
      forbidden: [/一定好眠|保證家具安全|必然聚財/],
    }],
    ['bathroom-vanity-cabinet-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/150\s*×\s*220/, /洗手台櫃層板/, /排水管/, /七日/],
      forbidden: [/一定守財|保證防水|必然防霉/],
    }],
    ['dining-room-table-corner-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /餐桌桌角/, /桌腳/, /七日/],
      forbidden: [/一定聚財|保證承重|必然和諧/],
    }],
    ['bedroom-wardrobe-door-track-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /衣櫃滑門軌道/, /滑軌/, /七日/],
      forbidden: [/一定好眠|保證防傾倒|必然整齊/],
    }],
    ['living-room-side-table-bottom-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /邊桌底部/, /腳墊/, /七日/],
      forbidden: [/一定旺運|保證承重|必然不絆倒/],
    }],
    ['dining-room-table-underside-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /餐桌底部/, /橫樑/, /七日/],
      forbidden: [/一定聚財|保證承重|必然和諧/],
    }],
    ['kitchen-water-dispenser-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /飲水機/, /儲水槽/, /七日/],
      forbidden: [/一定聚財|保證飲水品質|必然健康/],
    }],
    ['bathroom-shower-caddy-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴置物架/, /皂垢/, /七日/],
      forbidden: [/一定防滑|保證防水|必然不掉落/],
    }],
    ['dining-room-table-leaf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /隱藏桌葉/, /滑軌/, /七日/],
      forbidden: [/一定聚財|保證人緣|必然順利/],
    }],
    ['kitchen-water-filter-faucet-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /濾水龍頭/, /O 形環/, /七日/],
      forbidden: [/一定招財|保證飲水安全|必然健康/],
    }],
    ['bathroom-shower-niche-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴壁龕/, /填縫/, /七日/],
      forbidden: [/一定防霉|保證防水|必然乾燥/],
    }],
    ['dining-room-table-extension-rail-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /延伸滑軌/, /左右不同步/, /七日/],
      forbidden: [/一定聚財|保證人緣|必然順利/],
    }],
    ['bathroom-shower-hose-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /淋浴軟管/, /接頭/, /七日/],
      forbidden: [/一定防漏|保證安全|必然乾燥/],
    }],
    ['laundry-washing-machine-pedestal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/200\s*×\s*240/, /洗衣機底座/, /水平/, /七日/],
      forbidden: [/一定穩定|保證洗衣效果|必然不震動/],
    }],
    ['dining-room-table-apron-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /桌底框/, /油膜/, /七日/],
      forbidden: [/一定聚財|保證人際|必然穩定/],
    }],
    ['kitchen-electric-kettle-lid-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /電熱水壺/, /壺蓋/, /七日/],
      forbidden: [/一定招財|保證飲水安全|必然健康/],
    }],
    ['bedroom-wardrobe-drawer-rail-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*330/, /衣櫃抽屜滑軌/, /滑軌/, /七日/],
      forbidden: [/一定好睡|保證收納|必然不夾手/],
    }],
    ['living-room-sofa-seat-bottom-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /沙發座墊下方/, /支撐/, /七日/],
      forbidden: [/一定聚財|保證健康|必然舒適/],
    }],
    ['balcony-window-track-sill-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*300/, /窗軌/, /排水孔/, /七日/],
      forbidden: [/一定納氣|保證乾燥|必然防潮/],
    }],
    ['kitchen-dishwasher-door-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /門封條/, /漏水/, /七日/],
      forbidden: [/一定招財|保證洗程結果|必然不漏水/],
    }],
    ['bedroom-mattress-side-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*320/, /床墊側邊/, /保護套/, /七日/],
      forbidden: [/一定好眠|保證睡眠|必然除蟎/],
    }],
    ['kitchen-oven-door-hinge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /烤箱門鉸鏈/, /門封條/, /七日/],
      forbidden: [/一定旺財|保證烘烤|必然安全/],
    }],
    ['balcony-window-lock-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*300/, /鎖把手/, /密封條/, /七日/],
      forbidden: [/一定納氣|保證通風|必然防墜/],
    }],
    ['bedroom-mattress-edge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /床墊邊緣/, /包邊/, /七日/],
      forbidden: [/一定好眠|保證睡眠|必然除蟎/],
    }],
    ['kitchen-oven-door-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /烤箱門封條/, /門縫/, /七日/],
      forbidden: [/一定旺財|保證烘烤|必然安全/],
    }],
    ['entryway-door-threshold-corner-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /門檻轉角/, /密封膠/, /七日/],
      forbidden: [/一定聚財|保證防水|必然不滑/],
    }],
    ['kitchen-cooktop-control-panel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /控制面板/, /觸控/, /七日/],
      forbidden: [/一定招財|保證加熱|必然安全/],
    }],
    ['bathroom-exhaust-fan-backdraft-shutter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /逆止片/, /回風/, /七日/],
      forbidden: [/一定納氣|保證通風|必然除霉/],
    }],
    ['dining-room-table-extension-lock-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /延伸鎖扣/, /桌葉/, /七日/],
      forbidden: [/一定聚財|保證穩固|必然不夾手/],
    }],
    ['kitchen-microwave-turntable-ring-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /滾輪環/, /轉盤/, /七日/],
      forbidden: [/一定聚財|保證受熱|必然安全/],
    }],
    ['bedroom-window-condensation-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*320/, /窗戶結露/, /窗框/, /七日/],
      forbidden: [/一定好眠|保證乾燥|必然防霉/],
    }],
    ['balcony-sliding-door-roller-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*300/, /拉門滾輪/, /下軌/, /七日/],
      forbidden: [/一定納氣|保證防墜|必然順暢/],
    }],
    ['bathroom-shower-door-sweep-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /止水條/, /門檻/, /七日/],
      forbidden: [/一定聚財|保證防滑|必然不漏水/],
    }],
    ['bedroom-closet-door-bottom-seal-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*320/, /密封條/, /滑軌/, /七日/],
      forbidden: [/一定好眠|保證防潮|必然無塵/],
    }],
    ['living-room-bookshelf-back-panel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /書櫃背板/, /牆縫/, /七日/],
      forbidden: [/一定招財|保證穩固|必然防傾倒/],
    }],
    ['kitchen-refrigerator-ice-dispenser-chute-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /出冰口/, /結團/, /七日/],
      forbidden: [/一定聚財|保證出冰|必然安全/],
    }],
    ['living-room-sofa-cushion-zipper-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /拉鍊/, /坐墊/, /七日/],
      forbidden: [/一定好坐|保證舒適|必然乾淨/],
    }],
    ['bathroom-bath-overflow-cover-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /溢水孔蓋/, /水垢/, /七日/],
      forbidden: [/一定聚財|保證防漏|必然乾燥/],
    }],
    ['kitchen-refrigerator-spill-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /接水盤/, /水垢/, /七日/],
      forbidden: [/一定聚財|保證出水|必然安全/],
    }],
    ['dining-room-chair-felt-pad-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*300/, /毛氈墊/, /椅腳/, /七日/],
      forbidden: [/一定聚財|保證滑順|必然不刮/],
    }],
    ['entryway-door-hinge-squeak-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /鉸鏈異音/, /門片/, /七日/],
      forbidden: [/一定招財|保證無聲|必然安全/],
    }],
    ['kitchen-dishwasher-door-hinge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /門鉸鏈/, /彈簧/, /七日/],
      forbidden: [/一定旺財|保證防漏|必然安全/],
    }],
    ['bedroom-window-weatherstrip-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /氣密條/, /窗扇/, /七日/],
      forbidden: [/一定好眠|保證防水|必然乾燥/],
    }],
    ['living-room-tv-power-cable-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /電源線/, /插座/, /七日/],
      forbidden: [/一定聚財|保證用電|必然安全/],
    }],
    ['kitchen-refrigerator-door-shelf-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /門側層架/, /承重/, /七日/],
      forbidden: [/一定聚財|保證食品|必然安全/],
    }],
    ['bathroom-washbasin-faucet-base-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /水龍頭底座/, /檯面接縫/, /七日/],
      forbidden: [/一定聚財|保證防漏|必然健康/],
    }],
    ['bedroom-curtain-tieback-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /窗簾束帶/, /磁吸/, /七日/],
      forbidden: [/一定好眠|保證隱私|必然安全/],
    }],
    ['balcony-sliding-door-lock-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*300/, /拉門鎖具/, /鎖舌/, /七日/],
      forbidden: [/一定聚財|保證無鎖|必然安全/],
    }],
    ['kitchen-range-hood-light-cover-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /燈罩/, /燈泡/, /七日/],
      forbidden: [/一定旺財|保證照明|必然安全/],
    }],
    ['bedroom-ceiling-light-diffuser-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /吸頂燈/, /散熱/, /七日/],
      forbidden: [/一定好眠|保證亮度|必然安全/],
    }],
    ['kitchen-range-hood-light-switch-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /燈開關/, /按鍵/, /七日/],
      forbidden: [/一定旺財|保證照明|必然安全/],
    }],
    ['bedroom-bedside-lamp-switch-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床頭燈/, /開關/, /七日/],
      forbidden: [/一定好眠|保證照明|必然安全/],
    }],
    ['living-room-air-purifier-caster-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /腳輪/, /進風/, /七日/],
      forbidden: [/一定聚氣|保證空氣|必然安全/],
    }],
    ['kitchen-coffee-machine-drip-tray-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /滴水盤/, /浮標/, /七日/],
      forbidden: [/一定守財|保證咖啡|必然安全/],
    }],
    ['bathroom-bidet-seat-spray-nozzle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /噴桿/, /噴嘴/, /七日/],
      forbidden: [/一定化煞|保證健康|必然安全/],
    }],
    ['living-room-floor-fan-grille-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /護網/, /扇葉/, /七日/],
      forbidden: [/一定聚氣|保證風量|必然安全/],
    }],
    ['kitchen-coffee-machine-filter-basket-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /濾籃/, /濾孔/, /七日/],
      forbidden: [/一定旺財|保證咖啡|必然安全/],
    }],
    ['bathroom-bidet-remote-control-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /遙控器/, /電池/, /七日/],
      forbidden: [/一定化煞|保證健康|必然安全/],
    }],
    ['living-room-floor-fan-speed-button-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /速度/, /按鍵/, /七日/],
      forbidden: [/一定聚氣|保證風量|必然安全/],
    }],
    ['kitchen-dishwasher-detergent-dispenser-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /洗劑盒/, /盒蓋/, /七日/],
      forbidden: [/一定旺財|保證洗淨|必然安全/],
    }],
    ['bathroom-exhaust-fan-wall-switch-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /牆壁開關/, /斷路器/, /七日/],
      forbidden: [/一定化煞|保證健康|必然安全/],
    }],
    ['bedroom-air-conditioner-front-panel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /前面板/, /進風/, /七日/],
      forbidden: [/一定好睡|保證睡眠|必然安全/],
    }],
    ['kitchen-coffee-machine-portafilter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /portafilter/i, /密封/, /七日/],
      forbidden: [/一定旺財|保證咖啡|必然安全/],
    }],
    ['bathroom-bidet-water-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /進水濾網/, /止水/, /七日/],
      forbidden: [/一定守財|保證健康|必然安全/],
    }],
    ['kitchen-electric-kettle-spout-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /壺嘴濾網/, /底座/, /七日/],
      forbidden: [/一定留財|保證飲水|必然安全/],
    }],
    ['kitchen-electric-kettle-base-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /底座/, /接點/, /七日/],
      forbidden: [/一定破財|保證飲水|必然安全/],
    }],
    ['bathroom-bidet-seat-lid-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /便蓋/, /轉軸/, /七日/],
      forbidden: [/一定守財|保證健康|必然安全/],
    }],
    ['living-room-robot-vacuum-charging-contacts-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /充電接點/, /回充/, /七日/],
      forbidden: [/一定聚財|保證清掃|必然安全/],
    }],
    ['kitchen-coffee-machine-brew-head-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /沖煮頭/, /密封/, /七日/],
      forbidden: [/一定聚財|保證咖啡|必然安全/],
    }],
    ['bathroom-bidet-deodorizing-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /除臭濾網/, /異味/, /七日/],
      forbidden: [/一定化濕|保證健康|必然安全/],
    }],
    ['living-room-robot-vacuum-cliff-sensor-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /懸崖感測器/, /落差/, /七日/],
      forbidden: [/一定避煞|保證清掃|必然安全/],
    }],
    ['kitchen-electric-kettle-handle-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /把手/, /握持/, /七日/],
      forbidden: [/一定守財|保證飲水|必然安全/],
    }],
    ['bathroom-bidet-seat-base-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /座體底部/, /固定板/, /七日/],
      forbidden: [/一定守財|保證健康|必然安全/],
    }],
    ['living-room-robot-vacuum-front-caster-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /前輪/, /輪軸/, /七日/],
      forbidden: [/一定旺宅|保證清掃|必然安全/],
    }],
    ['kitchen-electric-kettle-cord-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /電源線/, /插頭/, /七日/],
      forbidden: [/一定破財|保證飲水|必然安全/],
    }],
    ['bathroom-bidet-seat-sensor-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /著座感測器/, /感應區/, /七日/],
      forbidden: [/一定守財|保證健康|必然安全/],
    }],
    ['living-room-robot-vacuum-side-wheel-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /側輪/, /輪槽/, /七日/],
      forbidden: [/一定平衡|保證清掃|必然安全/],
    }],
    ['kitchen-microwave-waveguide-cover-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /波導蓋/, /雲母片/, /七日/],
      forbidden: [/一定旺財|保證加熱|必然安全/],
    }],
    ['bathroom-bidet-seat-heater-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /加熱座圈/, /節能/, /七日/],
      forbidden: [/一定健康|保證舒適|必然安全/],
    }],
    ['living-room-robot-vacuum-side-brush-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /側刷/, /刷座/, /七日/],
      forbidden: [/一定旺宅|保證清掃|必然安全/],
    }],
    ['kitchen-dishwasher-spray-arm-hole-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /噴水臂/, /噴孔/, /七日/],
      forbidden: [/一定旺財|保證洗淨|必然安全/],
    }],
    ['bathroom-exhaust-fan-motor-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /馬達/, /扇葉/, /七日/],
      forbidden: [/一定除濕|保證通風|必然健康/],
    }],
    ['living-room-robot-vacuum-bumper-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /緩衝器/, /碰撞/, /七日/],
      forbidden: [/一定避煞|保證不撞|必然清掃/],
    }],
    ['bedroom-air-conditioner-drain-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /排水管/, /冷凝水/, /七日/],
      forbidden: [/一定好眠|保證乾燥|必然健康/],
    }],
    ['entryway-umbrella-stand-drip-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /雨傘/, /瀝水盤/, /七日/],
      forbidden: [/一定聚財|保證不滑|必然乾燥/],
    }],
    ['kitchen-refrigerator-water-dispenser-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /飲水機/, /出水嘴/, /七日/],
      forbidden: [/一定旺財|保證飲水|必然健康/],
    }],
    ['home-office-desk-chair-caster-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /腳輪/, /地板/, /七日/],
      forbidden: [/一定升遷|保證順利|必然工作/],
    }],
    ['laundry-washing-machine-door-hinge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /門鉸鏈/, /門片/, /七日/],
      forbidden: [/一定家運|保證洗淨|必然順利/],
    }],
    ['living-room-air-purifier-pre-filter-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*420/, /前置濾網/, /感測器/, /七日/],
      forbidden: [/一定健康|保證空氣|必然旺宅/],
    }],
    ['home-office-desk-chair-armrest-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /扶手/, /固定/, /六日/],
      forbidden: [/一定升遷|保證順利|必然工作/],
    }],
    ['living-room-air-purifier-outlet-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*420/, /出風口/, /感測器/, /六日/],
      forbidden: [/一定健康|保證空氣|必然旺宅/],
    }],
    ['kitchen-refrigerator-crisper-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /蔬果抽屜/, /滑軌/, /五日/],
      forbidden: [/一定聚財|保證保鮮|必然健康/],
    }],
    ['bedroom-bedside-table-cable-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /床邊桌線材/, /插座/, /五日/],
      forbidden: [/一定好眠|保證安全|必然旺財/],
    }],
    ['living-room-coffee-table-glass-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/320\s*×\s*360/, /玻璃茶几/, /邊角/, /五日/],
      forbidden: [/一定招財|保證安全|必然聚氣/],
    }],
    ['dining-room-chair-armrest-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /餐椅扶手/, /固定/, /五日/],
      forbidden: [/一定和氣|保證不搖晃|必然旺家/],
    }],
    ['kitchen-cutlery-drawer-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /餐具抽屜/, /滑軌/, /五日/],
      forbidden: [/一定聚財|保證衛生|必然順利/],
    }],
    ['bedroom-mirror-edge-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*320/, /鏡子邊緣/, /固定/, /五日/],
      forbidden: [/一定好眠|保證感情|必然化解/],
    }],
    ['balcony-plant-pot-drainage-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*180/, /花盆排水孔/, /托盤/, /五日/],
      forbidden: [/一定旺財|保證不淹水|必然旺家/],
    }],
    ['bedroom-bed-angle-to-door-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床尾斜對門/, /門片/, /七日/],
      forbidden: [/一定好眠|保證化解|必然旺財/],
    }],
    ['home-office-desk-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /書桌靠近房門/, /椅子/, /六日/],
      forbidden: [/一定升遷|保證專注|必然工作/],
    }],
    ['small-room-storage-doorway-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間門口收納/, /門片/, /七日/],
      forbidden: [/一定聚財|保證整齊|必然旺家/],
    }],
    ['double-bed-against-wall-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /雙人床靠牆/, /兩側/, /七晚/],
      forbidden: [/一定好眠|保證感情|必然和諧/],
    }],
    ['five-ping-bedroom-floor-plan-feng-shui', {
      minimumCharacters: 3200,
      required: [/330\s*×\s*500/, /5 坪房間平面圖/, /床、書桌、衣櫃/, /48 小時/],
      forbidden: [/一定放得下|保證好住|必然聚財/],
    }],
    ['small-room-vertical-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間垂直收納/, /高櫃/, /七日/],
      forbidden: [/一定省空間|保證安全|必然旺家/],
    }],
    ['bedroom-wardrobe-door-opening-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /衣櫃門對床/, /門片/, /七日/],
      forbidden: [/一定好眠|保證感情|必然聚財/],
    }],
    ['small-room-folding-desk-layout-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間折疊書桌/, /收合/, /六日/],
      forbidden: [/一定專注|保證升遷|必然工作/],
    }],
    ['bedroom-bedside-rug-walkway-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*320/, /床邊地毯/, /止滑/, /七日/],
      forbidden: [/一定好眠|保證防滑|必然健康/],
    }],
    ['bedroom-bed-head-wall-power-outlet-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床頭靠牆/, /插座/, /七日/],
      forbidden: [/一定好眠|保證感情|必然聚財/],
    }],
    ['small-room-window-storage-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /小房間窗邊收納/, /窗扇/, /七日/],
      forbidden: [/一定通風|保證防潮|必然旺家/],
    }],
    ['small-room-storage-bed-opening-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*320/, /小房間收納床/, /掀床/, /七日/],
      forbidden: [/一定好眠|保證收納|必然聚財/],
    }],
    ['entryway-shoe-cabinet-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /玄關鞋櫃/, /換鞋/, /七日/],
      forbidden: [/一定聚財|保證旺家|必然順利/],
    }],
    ['dining-room-table-chair-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /餐桌椅/, /拉椅/, /七日/],
      forbidden: [/一定和諧|保證聚財|必然旺家/],
    }],
    ['living-room-sofa-walkway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/360\s*×\s*420/, /客廳沙發/, /茶几/, /七日/],
      forbidden: [/一定聚財|保證人緣|必然旺家/],
    }],
    ['small-room-desk-chair-turning-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間書桌椅/, /椅子/, /七日/],
      forbidden: [/一定專注|保證升遷|必然工作/],
    }],
    ['small-room-folding-chair-storage-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*280/, /小房間折疊椅/, /收合/, /七日/],
      forbidden: [/一定省空間|保證安全|必然旺家/],
    }],
    ['bedroom-bed-foot-furniture-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*330/, /床尾家具/, /房門/, /七晚/],
      forbidden: [/一定好眠|保證感情|必然聚財/],
    }],
    ['kitchen-counter-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /廚房流理台/, /櫃門/, /七日/],
      forbidden: [/一定聚財|保證健康|必然旺家/],
    }],
    ['bathroom-shower-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /浴室淋浴門/, /乾濕/, /七日/],
      forbidden: [/一定健康|保證防滑|必然聚財/],
    }],
    ['entryway-bench-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/180\s*×\s*240/, /玄關穿鞋凳/, /坐下/, /七日/],
      forbidden: [/一定聚財|保證旺家|必然順利/],
    }],
    ['bedroom-bed-window-curtain-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床靠窗/, /窗簾/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然招財/],
    }],
    ['home-office-desk-window-curtain-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌靠窗/, /螢幕/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bed-window-opening-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間床靠窗/, /窗扇/, /七日/],
      forbidden: [/一定好眠|保證空間|必然聚財/],
    }],
    ['bedroom-bed-left-wall-access-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床左側靠牆/, /雙人床/, /七晚/],
      forbidden: [/一定好眠|保證感情|必然聚財/],
    }],
    ['small-room-open-shelf-door-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /開放層架/, /房門/, /七日/],
      forbidden: [/一定省空間|保證安全|必然旺家/],
    }],
    ['small-room-storage-aisle-turning-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /收納走道/, /轉身/, /七日/],
      forbidden: [/一定寬敞|保證收納|必然聚財/],
    }],
    ['bedroom-bed-window-sill-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床靠窗台/, /窗扇/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然招財/],
    }],
    ['home-office-desk-window-opening-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌靠窗/, /螢幕/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bedside-storage-turning-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /床邊收納/, /轉身/, /七日/],
      forbidden: [/一定安穩|保證收納|必然聚財/],
    }],
    ['bedroom-bed-head-wall-gap-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床頭靠牆/, /插座/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-facing-door-visibility-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌對門/, /視線/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-storage-corner-turning-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /收納轉角/, /轉身/, /七日/],
      forbidden: [/一定寬敞|保證收納|必然聚財/],
    }],
    ['bedroom-bed-doorway-line-of-sight-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床和房門同一直線/, /開門見床/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-doorway-sound-privacy-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌靠門/, /聲音/, /七日/],
      forbidden: [/一定專注|保證安靜|必然升遷/],
    }],
    ['small-room-wardrobe-door-turning-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間衣櫃門/, /轉身/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bed-foot-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床尾對房門/, /門片/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-chair-back-wall-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /椅背靠牆/, /工作姿勢/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-drawer-unit-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /抽屜櫃靠門/, /抽屜全開/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-nightstand-drawer-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床頭櫃抽屜/, /房門/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-monitor-wall-distance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /螢幕離牆/, /視距/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-clothes-rack-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /衣物掛架靠門/, /衣物/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-rug-night-route-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊地毯/, /夜間/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-document-holder-viewing-distance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /文件架/, /螢幕/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-folding-table-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /折疊桌靠門/, /收合/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-curtain-draft-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊窗簾/, /開窗/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-printer-paper-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌印表機/, /紙張/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-laundry-basket-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /洗衣籃靠門/, /滿籃/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-floor-lamp-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊立燈/, /夜間/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-phone-headset-reach-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌電話/, /耳機/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-floor-mirror-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /落地鏡靠門/, /反射/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-fan-cord-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊電風扇/, /電線/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-task-light-screen-glare-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /桌燈反光/, /螢幕眩光/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bedside-bookcase-doorway-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間書櫃靠門/, /書櫃固定/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-fan-airflow-angle-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊電風扇風向/, /氣流/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-window-reflection-glare-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌靠窗反光/, /螢幕眩光/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bedside-bookcase-bed-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間床邊書櫃/, /書櫃固定/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-fan-window-cross-ventilation-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /跨窗通風/, /電風扇/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-task-light-keyboard-shadow-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /鍵盤陰影/, /桌燈/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bedside-bookcase-shelf-height-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間床邊書櫃/, /書櫃固定/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-fan-dust-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊電風扇積塵/, /護網/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-task-light-diffuser-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /工作桌燈/, /擴散罩/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bedside-bookcase-corner-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間床邊書櫃/, /書櫃固定/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-fan-night-noise-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊電風扇噪音/, /震動/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-task-light-window-blinds-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌窗簾百葉/, /螢幕眩光/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bedside-bookcase-drawer-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間床邊書櫃抽屜/, /書櫃固定/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-fan-remote-control-night-route-feng-shui', {
      minimumCharacters: 3200,
      required: [/300\s*×\s*360/, /床邊電風扇遙控器/, /遙控器/, /七晚/],
      forbidden: [/一定好眠|保證安定|必然聚財/],
    }],
    ['home-office-desk-window-curtain-pulley-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /書桌旁窗簾拉繩/, /螢幕眩光/, /七日/],
      forbidden: [/一定專注|保證升遷|必然成功/],
    }],
    ['small-room-bedside-bookcase-doorway-sightline-feng-shui', {
      minimumCharacters: 3200,
      required: [/240\s*×\s*300/, /小房間床邊書櫃/, /書櫃固定/, /七日/],
      forbidden: [/一定省空間|保證收納|必然聚財/],
    }],
    ['bedroom-bedside-fan-timer-power-strip-feng-shui', {
      minimumCharacters: 3200,
      required: [/280\s*×\s*340/, /床邊電風扇定時/, /延長線/, /三晚/],
      forbidden: [/百分之百省電|永久安穩|完全好運/],
    }],
    ['home-office-desk-monitor-height-window-glare-feng-shui', {
      minimumCharacters: 3200,
      required: [/270\s*×\s*320/, /書桌螢幕高度/, /視線/, /五日/],
      forbidden: [/百分之百護眼|永久升遷|完全專注/],
    }],
    ['small-room-bedside-bookcase-outlet-access-feng-shui', {
      minimumCharacters: 3200,
      required: [/230\s*×\s*280/, /床邊書櫃/, /插座/, /七日/],
      forbidden: [/百分之百安全|永久收納|完全聚財/],
    }],
    ['bedroom-bed-headboard-wall-shelf-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*330/, /床頭牆面層板/, /頭部距離/, /六晚/],
      forbidden: [/百分之百招財|永久安眠|完全聚財/],
    }],
    ['home-office-desk-facing-door-monitor-privacy-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /書桌面向房門/, /工作隱私/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-basket-reach-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊收納籃/, /取物距離/, /七日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-art-lighting-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*330/, /床頭牆面掛畫/, /頭部/, /六晚/],
      forbidden: [/百分之百招財|永久安眠|完全化煞/],
    }],
    ['home-office-desk-facing-door-chair-turning-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*310/, /書桌面向房門/, /椅子轉身/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-hook-doorway-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*270/, /小房間床邊掛鉤/, /衣物外凸/, /七日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-clock-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*320/, /床頭牆面時鐘/, /滴答聲/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-webcam-angle-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /視訊鏡頭/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-folding-stool-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊折疊凳/, /收合/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-mirror-reflection-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*320/, /床頭牆面鏡子/, /反光/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-task-light-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /桌燈/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-wall-shelf-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊壁掛收納/, /突出/, /七日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-shadow-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾陰影/, /低照度/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-phone-call-privacy-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /電話通話隱私/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-rolling-cart-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊推車/, /推車輪子/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-rod-fix-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾桿/, /承重/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-headset-cable-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /耳機線/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-charging-cable-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊充電線/, /插座/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-fabric-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾/, /布料積塵/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-notice-board-privacy-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /公告板/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-underbed-drawer-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床下抽屜/, /拉出距離/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-length-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾/, /窗簾下擺/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-document-tray-privacy-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /文件托盤/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-underbed-seasonal-clothes-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床下收納換季衣物/, /防潮/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-side-return-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾/, /側邊回位/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-printer-paper-tray-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /印表機紙盤/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-hanging-pocket-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊掛袋/, /突出/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-privacy-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾/, /透光/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-stationery-organizer-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /文具收納/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-folding-crate-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊折疊箱/, /展開尺寸/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-glare-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾/, /反光/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-cable-channel-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /線槽/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-lid-box-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊有蓋收納箱/, /開蓋/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-condensation-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*310/, /床頭牆面窗簾/, /結露/, /六個早晨/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-drawer-clearance-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /抽屜/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-transparent-box-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊透明收納箱/, /可見性/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-air-gap-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /留縫/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-footrest-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /腳踏/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-label-system-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊收納/, /標籤/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-tieback-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /綁帶/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-monitor-height-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /螢幕高度/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-restock-cycle-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊/, /補貨週期/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-blackout-gap-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /側邊漏光/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-keyboard-distance-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /鍵盤距離/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-seasonal-rotation-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間/, /換季/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-sill-contact-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /窗台/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-mouse-placement-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /滑鼠/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-stacked-boxes-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊/, /堆疊/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-top-gap-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /上方漏光/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-phone-stand-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /電話/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-drawer-depth-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊/, /抽屜深度/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-rail-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /軌道/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-headphone-stand-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /耳機/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-box-bottom-cleaning-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊/, /箱底/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-window-opening-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /開窗/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-notebook-position-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /筆記本/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-basket-lid-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊/, /上蓋/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-side-light-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /側光/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-laptop-stand-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /筆電架/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-storage-bag-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊/, /收納袋/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
    ['bedroom-bed-headboard-wall-curtain-fabric-weight-feng-shui', {
      minimumCharacters: 3200,
      required: [/260\s*×\s*300/, /床頭牆面窗簾/, /布料重量/, /五晚/],
      forbidden: [/百分之百安眠|永久好眠|完全招財/],
    }],
    ['home-office-desk-facing-door-desk-mat-feng-shui', {
      minimumCharacters: 3200,
      required: [/250\s*×\s*300/, /書桌面向房門/, /桌墊/, /五日/],
      forbidden: [/百分之百專注|永久升遷|完全成功/],
    }],
    ['small-room-storage-bedside-underbed-label-feng-shui', {
      minimumCharacters: 3200,
      required: [/220\s*×\s*280/, /小房間床邊/, /標籤/, /六日/],
      forbidden: [/百分之百省空間|永久收納|完全財運/],
    }],
  ]);

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
  if (!pass) failures.push({ name, detail });
}

function bodyFromMarkdown(source) {
  const match = source.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
  return match ? match[1] : source;
}

function htmlText(source) {
  const main = source.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  return main
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function outputPathForUrl(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/') return path.join(distRoot, 'index.html');
  if (pathname.endsWith('/')) return path.join(distRoot, pathname.slice(1), 'index.html');
  return path.join(distRoot, pathname.slice(1));
}

const markdownFiles = (await fs.readdir(contentRoot)).filter((name) => name.endsWith('.md'));
const allSlugs = markdownFiles.map((name) => name.replace(/\.md$/, ''));
const heldSlugs = allSlugs.filter((slug) => !reviewReadyBlogSlugs.has(slug));

check('review-ready-count', reviewReadyBlogSlugs.size === expectedReviewReadyCount, reviewReadyBlogSlugs.size);
check('held-count', heldSlugs.length === markdownFiles.length - expectedReviewReadyCount, heldSlugs.length);

const expandedArticleBodies = new Map();

for (const slug of reviewReadyBlogSlugs) {
  const source = await fs.readFile(path.join(contentRoot, `${slug}.md`), 'utf8');
  const body = bodyFromMarkdown(source);
  const characters = body.replace(/\s/g, '').length;
  const h2Count = (body.match(/^##\s+/gm) ?? []).length;
  const linkCount = (body.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length;
  check(`source:${slug}:characters`, characters >= 1800, characters);
  check(`source:${slug}:h2`, h2Count >= 6, h2Count);
  check(`source:${slug}:links`, linkCount >= 3, linkCount);
  const updated = source.match(/updated:\s*["']?(\d{4}-\d{2}-\d{2})/)?.[1] ?? '';
  check(`source:${slug}:review-date`, updated >= '2026-07-15', updated || 'updated date is required');
  check(`source:${slug}:no-seo-copy`, !/SEO|搜尋流量|關鍵字叢集|建議保持免註冊/.test(body), 'no internal SEO/editorial instructions in reader content');
  const expandedRequirements = expandedArticleRequirements.get(slug);
  if (expandedRequirements) {
    expandedArticleBodies.set(slug, body);
    check(
      `source:${slug}:expanded-depth`,
      characters >= (expandedRequirements.minimumCharacters ?? 2500),
      characters,
    );
    for (const pattern of expandedRequirements.required) {
      check(`source:${slug}:required:${pattern.source}`, pattern.test(body), pattern.source);
    }
    for (const pattern of expandedRequirements.forbidden) {
      check(`source:${slug}:forbidden:${pattern.source}`, !pattern.test(body), pattern.source);
    }
  }
}

const expandedEntries = [...expandedArticleBodies.entries()];
for (let index = 0; index < expandedEntries.length; index += 1) {
  const [leftSlug, leftBody] = expandedEntries[index];
  const leftHeadings = new Set([...leftBody.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim()));
  const leftParagraphs = new Set(
    leftBody.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, ' ').trim()).filter((paragraph) => paragraph.length >= 120 && !paragraph.startsWith('#')),
  );
  for (let rightIndex = index + 1; rightIndex < expandedEntries.length; rightIndex += 1) {
    const [rightSlug, rightBody] = expandedEntries[rightIndex];
    const rightHeadings = new Set([...rightBody.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim()));
    const rightParagraphs = new Set(
      rightBody.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, ' ').trim()).filter((paragraph) => paragraph.length >= 120 && !paragraph.startsWith('#')),
    );
    const sharedHeadings = [...leftHeadings].filter((heading) => rightHeadings.has(heading));
    const sharedParagraphs = [...leftParagraphs].filter((paragraph) => rightParagraphs.has(paragraph));
    check(`distinct-structure:${leftSlug}:${rightSlug}`, sharedHeadings.length <= 2, sharedHeadings);
    check(`distinct-copy:${leftSlug}:${rightSlug}`, sharedParagraphs.length === 0, sharedParagraphs);
  }
}

// 廣告 loader 與版位一定出現在 markup，不會出現在樣式表裡；反過來說，
// CSS 選擇器可以合法地提到 AdSense 的類別或屬性（例如收合未填充版位的規則），
// 而 Astro 會把 global.css 內聯進「每一頁」，包含不放廣告的 noindex 頁。
// 因此比對前先去掉 <style> 區塊——檢查的是「有沒有廣告」，
// 不是「有沒有出現這串字」。同 CLAUDE.md 紅線第 5 條：原始碼字串 ≠ 線上實際行為。
const withoutStyleBlocks = (html) => html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
const AD_MARKUP_PATTERN = /pagead2\.googlesyndication|adsbygoogle|data-ad-slot/i;
const hasAdMarkup = (html) => AD_MARKUP_PATTERN.test(withoutStyleBlocks(html));

for (const slug of allSlugs) {
  const htmlPath = path.join(distRoot, 'zh', 'blog', slug, 'index.html');
  const html = await fs.readFile(htmlPath, 'utf8');
  const reviewReady = reviewReadyBlogSlugs.has(slug);
  check(`render:${slug}:robots`, reviewReady ? !/name="robots"[^>]+noindex/i.test(html) : /name="robots"[^>]+noindex/i.test(html), reviewReady ? 'indexable' : 'noindex');
  if (!reviewReady) {
    check(`render:${slug}:no-ad-loader`, !hasAdMarkup(html), 'held pages must not load or host ads');
    check(`render:${slug}:no-affiliate`, !/Shopee Affiliate|shopee\.tw/i.test(html), 'held pages must not show affiliate offers');
  } else {
    check(`render:${slug}:substantial-main`, htmlText(html).replace(/\s/g, '').length >= 1800, htmlText(html).replace(/\s/g, '').length);
  }
}

// 索引頁自 2026-09 起分頁，所以要合併所有分頁（/zh/blog/ 與 /zh/blog/<n>/）再檢查。
// 要守住的性質沒有變：每篇 review-ready 文章都能從索引到達，held 稿一篇都不能出現。
const blogIndexDirectory = path.join(distRoot, 'zh', 'blog');
const blogIndexPageFiles = [
  path.join(blogIndexDirectory, 'index.html'),
  ...(await fs.readdir(blogIndexDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => path.join(blogIndexDirectory, entry.name, 'index.html')),
];
const blogIndexSlugs = new Set();
for (const file of blogIndexPageFiles) {
  const html = await fs.readFile(file, 'utf8');
  for (const match of html.matchAll(/href="\/zh\/blog\/([^/"#?]+)\/"/g)) {
    if (!/^\d+$/.test(match[1])) blogIndexSlugs.add(match[1]);
  }
}
check('blog-index-pagination-pages', blogIndexPageFiles.length >= 1, blogIndexPageFiles.length);
check('blog-index-count', blogIndexSlugs.size === reviewReadyBlogSlugs.size, [...blogIndexSlugs]);
for (const slug of reviewReadyBlogSlugs) check(`blog-index:${slug}`, blogIndexSlugs.has(slug), 'must be linked');
for (const slug of heldSlugs) check(`blog-index-held:${slug}`, !blogIndexSlugs.has(slug), 'must not be linked');

const notFound = await fs.readFile(path.join(distRoot, '404.html'), 'utf8');
check('404:robots', /name="robots"[^>]+content="[^"]*noindex/i.test(notFound), 'error page must be noindex');
check(
  '404:no-ad-loader',
  !hasAdMarkup(notFound),
  'error page must not load or host ads',
);

const sitemapFiles = (await fs.readdir(distRoot)).filter((name) => /^sitemap.*\.xml$/.test(name));
const sitemapSource = (await Promise.all(sitemapFiles.map((name) => fs.readFile(path.join(distRoot, name), 'utf8')))).join('\n');
const sitemapUrls = [...sitemapSource.matchAll(/<loc>(https:\/\/roomfeng\.win\/[^<]*)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => !url.endsWith('.xml'));
for (const slug of reviewReadyBlogSlugs) check(`sitemap:${slug}`, sitemapUrls.includes(`https://roomfeng.win/zh/blog/${slug}/`), 'must be included');
for (const slug of heldSlugs) check(`sitemap-held:${slug}`, !sitemapUrls.includes(`https://roomfeng.win/zh/blog/${slug}/`), 'must be excluded');
for (const category of reviewReadyCategorySlugs) check(`sitemap-category:${category}`, sitemapUrls.includes(`https://roomfeng.win/zh/category/${category}/`), 'must be included');

for (const url of sitemapUrls) {
  const htmlPath = outputPathForUrl(url);
  let html = '';
  try {
    html = await fs.readFile(htmlPath, 'utf8');
  } catch {
    check(`sitemap-output:${url}`, false, htmlPath);
    continue;
  }
  check(`metadata:${url}:title`, /<title>[^<]{8,}<\/title>/i.test(html), 'title required');
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ?? '';
  check(
    `metadata:${url}:description`,
    description.replace(/\s/g, '').length >= 24,
    'description must contain at least 24 non-whitespace characters',
  );
  check(`metadata:${url}:canonical`, /<link\s+rel="canonical"\s+href="https:\/\/roomfeng\.win\/[^"]*"/i.test(html), 'canonical required');
  check(`metadata:${url}:h1`, (html.match(/<h1\b/gi) ?? []).length === 1, 'exactly one h1');
  check(`metadata:${url}:indexable`, !/name="robots"[^>]+noindex/i.test(html), 'sitemap pages cannot be noindex');
}

const htmlFiles = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(distRoot);

// 內部連結的目標必須真的存在。
// AGENTS.md 第 10 節第 3 項一直把「No broken internal links」列為 quality gate，
// 但在 2026-09 之前沒有任何檢查實作它，所以千頁內容上線時有 594 個頁面帶著
// 指向 404 的內部連結進了 main（其中 /zh/room-circulation-check/ 被 551 篇引用）。
const ASSET_EXTENSION = /\.(xml|txt|webp|png|jpe?g|svg|ico|pdf|css|js|json|webmanifest)$/i;
const toPosix = (value) => value.split(path.sep).join('/');
const distRoutes = new Set();
for (const file of htmlFiles) {
  const relative = toPosix(path.relative(distRoot, file));
  distRoutes.add(`/${relative}`);
  if (relative.endsWith('index.html')) {
    distRoutes.add(`/${relative.slice(0, -'index.html'.length)}`.replace(/\/{2,}/g, '/'));
  }
}
const brokenLinkSources = new Map();
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = match[1].split(/[?#]/)[0];
    if (href === '' || ASSET_EXTENSION.test(href)) continue;
    const target = href.endsWith('/') ? href : `${href}/`;
    if (distRoutes.has(target) || distRoutes.has(href)) continue;
    const sources = brokenLinkSources.get(href) ?? new Set();
    sources.add(toPosix(path.relative(distRoot, file)));
    brokenLinkSources.set(href, sources);
  }
}
for (const [href, sources] of brokenLinkSources) {
  check(`internal-link:${href}`, false, `${sources.size} page(s), e.g. ${[...sources][0]}`);
}
check('internal-links-resolve', brokenLinkSources.size === 0, brokenLinkSources.size);

const affiliateFiles = [];
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  if (/data-affiliate-product-link|Shopee Affiliate|shopee\.tw/i.test(html)) affiliateFiles.push({ file, html });
}
const supportFile = affiliateFiles.find(({ file }) => file.endsWith(`${path.sep}support${path.sep}index.html`));
check('affiliate-output-support-page', Boolean(supportFile), affiliateFiles.map(({ file }) => path.relative(distRoot, file)).join(', '));
if (supportFile) {
  const cardCount = (supportFile.html.match(/data-affiliate-product-link\s+data-affiliate-product-id/g) ?? []).length;
  // RoomFeng mirrors FunnyTools' shared catalogue: 164 Shopee + 30 Coupang active records.
  check('affiliate-support-catalog-count', cardCount === 194, cardCount);
  check('affiliate-support-links-safe', /rel="sponsored nofollow noopener"/.test(supportFile.html), 'sponsored/nofollow/noopener');
  check('affiliate-support-images-lazy', /loading="lazy"/.test(supportFile.html), 'lazy image loading');
}

const report = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  totals: {
    sourceArticles: markdownFiles.length,
    reviewReady: reviewReadyBlogSlugs.size,
    heldNoindex: heldSlugs.length,
    sitemapPages: sitemapUrls.length,
    checks: checks.length,
    failed: failures.length,
  },
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exitCode = 1;
