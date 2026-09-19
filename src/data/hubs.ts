/**
 * 主題 Hub 的導讀內容。
 *
 * 分類頁在這之前只是「短介紹 + 分頁文章清單」，對 Google 來說跟站內搜尋結果
 * 沒兩樣，也沒辦法承擔主題權威。這裡替每個分類補上真正的導讀、核心問題、
 * 精選指南、對應工具與 FAQ，讓 /zh/category/<slug>/ 成為該主題的入口頁，
 * 而不是再開一批新的 hub 網址（那會多產生 URL，與「更少、更強」的方向相反）。
 *
 * 規則：
 * - 只在分頁的第 1 頁輸出導讀（第 2 頁之後是純清單，避免重複內容）。
 * - featured 只放實際存在且值得排名的指南，不做 10-30 條無關連結的連結牆。
 * - faq 一定同時顯示在畫面上，才輸出 FAQPage schema。
 * - plannerPreset 對應 src/planner/templates.ts 的範例格局 key，
 *   讓 CTA 可以 deep-link 直接載入接近該主題的房型。
 */

export type PlannerPreset = 'studio' | 'student' | 'double' | 'living';

export interface HubLink {
  href: string;
  title: string;
  note?: string;
}

export interface HubQuestion {
  q: string;
  a: string;
  href: string;
  linkText: string;
}

export interface HubContent {
  /** 導讀段落，合計約 300–800 字。 */
  lead: string[];
  coreQuestions: HubQuestion[];
  featured: HubLink[];
  tools: HubLink[];
  faq: { q: string; a: string }[];
  plannerPreset: PlannerPreset;
  plannerCta: string;
}

export const hubContent: Record<string, HubContent> = {
  'feng-shui': {
    lead: [
      '這個主題整理臥室、廚房、浴室、玄關與陽台的民俗風水說法，但處理方式和一般風水站不同：每一條說法都會先拆成「可以量的東西」——樑下淨高、床到門的視線、鏡面反射角度、排水與濕氣、夜間動線的落腳點。能量的先量，量不出來的就說明它只是民俗描述。',
      '會這樣寫，是因為多數「化解」其實同時解決了兩件事：一件是文化上的心理安定，一件是真實的居住問題。床對門讓人睡不安穩，通常不是因為氣場，而是開門瞬間的視線與聲音；鏡子對床的不適，多半來自夜裡半醒時的反光。把兩件事分開講，讀者才知道哪些調整值得花錢、哪些只是心理層面的取捨。',
      '所有內容只作民俗文化與空間舒適度參考，不保證財運、健康、感情、事業或任何人生結果，也不取代建築、消防、電氣、醫療或法律專業建議。涉及配線、天花板施工、固定與消防設備時，一律交由合格人員處理。',
    ],
    coreQuestions: [
      { q: '床對門一定要移床嗎？', a: '先分清楚是床頭對門還是床尾對門，兩者的視線與動線問題完全不同；很多情況只要調整開門視線或加一道緩衝就夠。', href: '/zh/blog/bed-facing-door-feng-shui/', linkText: '床頭對門、床尾對門要分開處理' },
      { q: '橫樑壓床怎麼判斷要不要搬？', a: '量樑投影與躺下、坐起、站立三個高度；只有頭部所在的高頻區真的會碰撞才需要動床。', href: '/zh/blog/beam-over-desk-bed-layout/', linkText: '橫樑壓床完整指南' },
      { q: '床頭一定要靠牆嗎？', a: '重點是「有穩固支撐」，不是牆本身。床頭靠窗時要處理的是溫差、結露與窗簾操作。', href: '/zh/blog/bed-head-against-wall/', linkText: '床頭不靠牆可以，前提是有穩固支撐' },
      { q: '廚房的水火位置真的有講究嗎？', a: '民俗說法背後對應的是濺水、油煙與備餐動線；先把生熟食分區與清潔路線排好，形式問題通常一起解決。', href: '/zh/blog/kitchen-countertop-zoning-feng-shui/', linkText: '廚房檯面分區風水怎麼規劃' },
    ],
    featured: [
      { href: '/zh/blog/bed-facing-door-feng-shui/', title: '床頭對門、床尾對門要分開處理', note: '臥室最常見的風水問題，附實牆與開門視線判斷' },
      { href: '/zh/blog/beam-over-desk-bed-layout/', title: '橫樑壓床完整指南', note: '床型、床邊家具與不能移床時的完整處理順序' },
      { href: '/zh/blog/beam-over-desk-workspace-guide/', title: '橫樑壓書桌完整指南', note: '椅子、起身空間、螢幕反光與租屋工作區' },
      { href: '/zh/blog/bed-head-against-wall/', title: '床頭靠牆與床頭靠窗怎麼選', note: '支撐感、溫差與窗邊結露的處理順序' },
      { href: '/zh/blog/bed-under-window-solutions/', title: '床頭靠窗好嗎？7 晚檢查與改善順序' },
      { href: '/zh/blog/kitchen-sink-feng-shui/', title: '廚房水槽風水怎麼擺', note: '水火距離、濺水、排水與備餐動線' },
      { href: '/zh/blog/entryway-shoe-cabinet-feng-shui/', title: '玄關鞋櫃怎麼擺才順', note: '大門開啟範圍、收納容量與換鞋動線' },
      { href: '/zh/blog/bathroom-toilet-ventilation-feng-shui/', title: '浴室廁所通風風水怎麼做' },
    ],
    tools: [
      { href: '/zh/feng-shui-bedroom-checker/', title: '臥室風水格局檢查', note: '床、門、窗、鏡子與樑一次檢查' },
      { href: '/zh/bed-door-fix-selector/', title: '床對門化解方案選擇器', note: '依可行性排序化解做法並附最小尺寸' },
      { href: '/zh/beam-layout-fix-check/', title: '樑下配置化解檢查器' },
      { href: '/zh/desk-door-fix-check/', title: '書桌對門化解檢查' },
    ],
    faq: [
      { q: '這裡的風水建議可以當成保證嗎？', a: '不可以。所有內容都是民俗文化與空間舒適度參考，不保證財運、健康、感情或任何人生結果，請以實際安全、採光、通風、動線與個人需求為準。' },
      { q: '為什麼每篇都要求先量尺寸？', a: '因為多數「化解」其實在解決可觀察的問題：碰撞、視線、噪音、濕氣與動線。先量出來，才知道要不要真的搬家具，還是只需要調整燈光或視線。' },
      { q: '租屋不能施工，還能改善嗎？', a: '可以。家具位置、布簾、床頭板、矮櫃、收納盒與可移動燈具都是可恢復的調整，退租時能還原，不需要動到牆面或天花板。' },
    ],
    plannerPreset: 'double',
    plannerCta: '用 Room Planner 把床、門、窗與鏡子的實際位置畫出來，工具會直接標出床對門、鏡子對床與動線過窄的地方。',
  },

  bedroom: {
    lead: [
      '臥室通常同時承擔睡眠、工作、收納與換衣四種功能，所以「哪個家具先定位」比「買什麼家具」更關鍵。這個主題的文章都照同一個順序處理：先固定不能動的條件（門、窗、插座、樑），再放最大的家具（床），最後才排衣櫃、書桌與床邊收納。',
      '會反覆出現的三個數字是：床邊通道、衣櫃門片開啟後的淨空、椅子後退距離。多數「房間好像放得下卻很難用」的案例，問題都在這三個數字其中之一被壓到 60 公分以下。文章會告訴你每個數字要怎麼在現場量，而不是給一張通用對照表就結束。',
      '睡眠品質的部分只討論可控變因——光、聲音、溫濕度、床位與夜間動線。無法用配置改善的因素（作息、健康狀況）不在本站範圍，也不會拿房間佈局當成解方。',
    ],
    coreQuestions: [
      { q: '床要買多大才放得下？', a: '先量走道再挑床，不是先挑床再擠走道。床墊尺寸之外還要加床架外框。', href: '/zh/blog/bed-size-room-guide/', linkText: '床尺寸怎麼選' },
      { q: '衣櫃放哪裡才不會擋動線？', a: '衣櫃的實際佔用是「櫃體 + 門片掃掠 + 人取衣站的位置」三段相加。', href: '/zh/blog/wardrobe-placement-bedroom/', linkText: '衣櫃擺放位置怎麼選' },
      { q: '臥室燈光要怎麼配？', a: '分成主燈、床頭燈與夜間動線三層，各自解決不同問題，不要靠一盞主燈全包。', href: '/zh/blog/bedroom-lighting-guide/', linkText: '臥室照明怎麼配' },
      { q: '房間潮濕要先處理什麼？', a: '先分辨是滲水還是結露，兩者的處理方式與家具位置建議完全不同。', href: '/zh/blog/humid-bedroom-layout/', linkText: '潮濕房間怎麼配置' },
    ],
    featured: [
      { href: '/zh/blog/bed-size-room-guide/', title: '床尺寸怎麼選', note: '先量走道再挑尺寸，附床墊尺寸對照與外框加值' },
      { href: '/zh/blog/bedroom-lighting-guide/', title: '臥室照明怎麼配', note: '主燈、床頭燈與夜間動線的三層規劃' },
      { href: '/zh/blog/humid-bedroom-layout/', title: '潮濕房間怎麼配置' },
      { href: '/zh/blog/sleep-quality-bedroom-layout/', title: '睡眠環境的房間配置', note: '光、聲、溫濕度與床位的可控變因' },
      { href: '/zh/blog/air-conditioner-bedroom-layout/', title: '冷氣對床怎麼調', note: '不用猜距離的風向測試' },
      { href: '/zh/blog/desk-facing-door-layout/', title: '書桌對門不一定要移' },
    ],
    tools: [
      { href: '/zh/bed-desk-wardrobe-layout/', title: '床桌衣櫃配置工具' },
      { href: '/zh/room-furniture-size-advisor/', title: '房間傢俱尺寸建議器', note: '依房間長寬建議床、書桌與衣櫃尺寸' },
      { href: '/zh/room-layout-planner/', title: '房間家具配置工具' },
      { href: '/zh/feng-shui-bedroom-checker/', title: '臥室風水格局檢查' },
    ],
    faq: [
      { q: '床邊要留多少走道？', a: '一般建議至少 60 公分，因為那是一個人側身通過、彎腰換床單與夜間下床的最低寬度。雙人房兩側都要各留一條。' },
      { q: '小臥室該先犧牲什麼？', a: '通常先犧牲床邊櫃與大衣櫃，改用床下收納與牆面收納，保留地面動線；床與門的距離不要動。' },
      { q: '書桌一定要靠窗嗎？', a: '不一定。靠窗採光好但容易在螢幕上造成反光，先在早、午、晚各測一次視線再決定。' },
    ],
    plannerPreset: 'double',
    plannerCta: '用 Room Planner 模擬你的床、書桌與衣櫃位置，工具會即時檢查走道寬度與門片開啟範圍。',
  },

  'small-room': {
    lead: [
      '小房間與小套房的規劃重點不是「塞進最多家具」，而是保留能走、能開門、能坐下、能整理的使用距離。同樣 4 坪的房間，有人住得很順、有人天天被家具卡住，差別幾乎都在動線寬度與收納高度這兩件事上。',
      '這個主題把小空間拆成三個決策：第一，哪些家具是真的必要（床、桌、衣物存放）；第二，必要家具之外的需求能不能垂直化（牆面、床下、門後）；第三，剩下的地面留給誰。文章會給實際坪數的案例——5 坪以下、正方形小房、長型套房——而不是抽象的「善用垂直空間」。',
      '租屋族在這個主題會特別注意可恢復性：所有做法都以不鑽孔、不改牆、退租能還原為前提，並且會標示哪些做法需要事先取得房東同意。',
    ],
    coreQuestions: [
      { q: '5 坪以下的房間怎麼分配？', a: '先算扣掉樑柱與門片後的淨尺寸，再依床、桌、收納的順序分配，不要照坪數換算。', href: '/zh/blog/tiny-room-layout-under-5-ping/', linkText: '5 坪以下房間怎麼設計' },
      { q: '小套房怎麼分區？', a: '用家具當隔斷，把睡眠、工作、用餐、收納四區的視線與動線分開。', href: '/zh/blog/studio-zoning-layout/', linkText: '小套房怎麼分區' },
      { q: '小房間東西太多怎麼辦？', a: '先盤點 30 件常用物品，再決定五個存放區，而不是先買收納盒。', href: '/zh/blog/small-room-storage-zones/', linkText: '小房間收納分區' },
      { q: '租屋不能施工能改善哪些？', a: '床位、桌向、可移動收納、燈光與布簾都能調整，全部可恢復。', href: '/zh/blog/rental-room-layout-planning/', linkText: '租屋房間配置怎麼規劃' },
    ],
    featured: [
      { href: '/zh/blog/tiny-room-layout-under-5-ping/', title: '5 坪以下房間怎麼設計', note: '先算淨尺寸，再分配床、桌與收納' },
      { href: '/zh/blog/studio-zoning-layout/', title: '小套房怎麼分區', note: '睡眠、工作、用餐、收納的家具配置方法' },
      { href: '/zh/blog/rental-room-layout-planning/', title: '租屋房間配置怎麼規劃' },
      { href: '/zh/blog/small-5-ping-floorplan-zones-feng-shui/', title: '5 坪房間平面圖怎麼畫' },
      { href: '/zh/blog/renter-no-drill-storage/', title: '租屋不能釘牆怎麼收納' },
    ],
    tools: [
      { href: '/zh/small-bedroom-layout/', title: '小房間佈局規劃' },
      { href: '/zh/small-room-storage-planner/', title: '小房間收納規劃器', note: '輸入坪數估算剩餘空間與收納方案' },
      { href: '/zh/studio-apartment-layout/', title: '小套房配置' },
      { href: '/zh/room-size-layout-templates/', title: '坪數房間配置範本庫' },
    ],
    faq: [
      { q: '小房間可以放雙人床嗎？', a: '要看扣掉床架外框後，床的至少一側還留不留得到 60 公分。放得進去不等於用得順，建議先在地面貼出外框試走。' },
      { q: '收納櫃可以做多高？', a: '以你站著不墊腳能安全取放的高度為上限，再高的層板只適合放很少動的物品，而且櫃體要依說明做防傾倒固定。' },
      { q: '床下收納會不會潮濕？', a: '床下通風較差，建議放不怕潮的物品並定期通風清潔；濕度高的房間先處理除濕，再考慮床下收納量。' },
    ],
    plannerPreset: 'student',
    plannerCta: '用 Room Planner 輸入你的房間長寬，把床、書桌與衣櫃拖進去，馬上看得出哪一條走道被壓到 60 公分以下。',
  },

  'room-planning': {
    lead: [
      '房間規劃要同時看四件事：平面尺寸、門窗位置、家具外框與日常動線。多數買錯家具的案例，不是量錯房間，而是只量了房間卻沒量家具「使用時」佔的空間——抽屜拉開、椅子後退、櫃門打開、人站著取物，每一項都會往外再吃掉 40 到 60 公分。',
      '這個主題的文章都圍繞同一套方法：先在地面用紙膠帶貼出家具外框與門片掃掠線，再實際走一次日常動作（開門、坐下、起身、換床單、拿衣服、拖地），最後才決定買什麼、放哪裡。這一步能在買家具或搬家前就發現問題，成本遠低於退貨或重搬。',
      '走道寬度是整個主題的核心數字。60 公分是一個人側身通過的下限，主要通道建議 75 到 90 公分；但真正該用的是你自己家的實測值，因為門片、抽屜與椅子的尺寸各家不同。',
    ],
    coreQuestions: [
      { q: '房間走道要留多寬？', a: '用門片、抽屜與椅子的實際尺寸反推，而不是套用單一數字。', href: '/zh/blog/room-circulation-width-guide/', linkText: '房間走道要留多寬' },
      { q: '正方形房間怎麼擺才不浪費？', a: '正方形房容易四邊都放家具導致中央空轉，用三版比較法先選主牆。', href: '/zh/blog/square-bedroom-layout/', linkText: '正方形房間怎麼規劃' },
      { q: '買家具前要先做什麼？', a: '先畫一張有門窗與插座的房間配置圖，再拿家具外框去比對。', href: '/zh/blog/bedroom-layout-before-buying-furniture/', linkText: '買家具前先做房間配置圖' },
      { q: '長型房間怎麼分段？', a: '把長邊切成睡眠、通行與工作三段，避免全部沿同一面牆排開。', href: '/zh/blog/long-narrow-bedroom-layout/', linkText: '長型房間怎麼擺' },
    ],
    featured: [
      { href: '/zh/blog/room-circulation-width-guide/', title: '房間走道要留多寬', note: '用門片、抽屜與椅子實測動線' },
      { href: '/zh/blog/square-bedroom-layout/', title: '正方形房間怎麼規劃', note: '床位、衣櫃、書桌三版比較法' },
      { href: '/zh/blog/long-narrow-bedroom-layout/', title: '長型房間怎麼擺' },
      { href: '/zh/blog/bedroom-layout-before-buying-furniture/', title: '買家具前先做房間配置圖' },
      { href: '/zh/blog/small-room-storage-zones/', title: '小房間收納分區' },
    ],
    tools: [
      { href: '/zh/room-layout-planner/', title: '房間家具配置工具', note: '拖曳家具、檢查動線、匯出 PNG/PDF' },
      { href: '/zh/furniture-fit-checker/', title: '家具尺寸適配檢查' },
      { href: '/zh/room-size-layout-templates/', title: '坪數房間配置範本庫' },
      { href: '/zh/room-furniture-size-advisor/', title: '房間傢俱尺寸建議器' },
    ],
    faq: [
      { q: '要先量房間還是先看家具？', a: '先量房間與門窗，再去比對家具外框。反過來很容易挑到「規格上放得下、實際打不開門」的家具。' },
      { q: '為什麼量得剛剛好還是很擠？', a: '因為家具的使用空間比本體大：抽屜、櫃門、椅子後退與人站著取物都要另外算，通常每項再加 40 到 60 公分。' },
      { q: '平面圖一定要按比例畫嗎？', a: '要。不按比例的草圖看不出走道被壓縮，用工具直接輸入實際公分數最快也最不會出錯。' },
    ],
    plannerPreset: 'studio',
    plannerCta: '把量到的房間長寬直接輸入 Room Planner，拖進床、書桌與衣櫃，工具會自動算面積並標出過窄的走道。',
  },

  storage: {
    lead: [
      '收納做不好，很少是因為盒子不夠，而是因為位置和使用頻率沒有對上。這個主題的方法是先盤點你真正每天、每週、每季會動到的東西，再依取用頻率決定放高、放低、放遠或放近——常用的放入口與桌邊，季節性的放床下或高處，很少動的考慮不要留在房間裡。',
      '衣櫃是房間裡最大的收納變數。門片型式（開門、推拉、摺疊）會決定前方要留多少淨空，這個數字往往比櫃體深度更影響動線。床下收納則要先確認房間濕度與清潔可及性，否則收納量換來的是長期積灰與不敢打開。',
      '租屋族的限制是不能釘牆，但可用的做法比想像多：免釘掛架、落地層架、門後收納、可移動推車都不需要破壞牆面；需要注意的是承重、穩定與退租時的痕跡。任何高櫃都要依產品說明做防傾倒固定。',
    ],
    coreQuestions: [
      { q: '衣櫃門要選哪一種？', a: '開門、推拉、摺疊門的前方淨空需求差很多，先量房間再選門型。', href: '/zh/blog/wardrobe-door-types/', linkText: '衣櫃門怎麼選' },
      { q: '床底下適合收納嗎？', a: '要先確認濕度與清潔可及性，並列出適合放床下的物品清單。', href: '/zh/blog/under-bed-storage-feng-shui/', linkText: '床底下可以收納嗎' },
      { q: '租屋不能釘牆怎麼收納？', a: '免釘掛架、落地層架與床下收納都可行，重點在承重與穩定。', href: '/zh/blog/renter-no-drill-storage/', linkText: '租屋不能釘牆怎麼收納' },
      { q: '換季要怎麼重整？', a: '衣物、寢具、除濕與床位一起排，順便把上一季堆出來的東西歸位。', href: '/zh/blog/seasonal-room-reset-guide/', linkText: '換季房間整理怎麼做' },
    ],
    featured: [
      { href: '/zh/blog/renter-no-drill-storage/', title: '租屋不能釘牆怎麼收納' },
      { href: '/zh/blog/wardrobe-placement-bedroom/', title: '衣櫃擺放位置怎麼選' },
      { href: '/zh/blog/wardrobe-door-types/', title: '衣櫃門怎麼選', note: '開門、推拉、摺疊門的空間需求與適用房型' },
      { href: '/zh/blog/under-bed-storage-feng-shui/', title: '床底下可以收納嗎' },
      { href: '/zh/blog/seasonal-room-reset-guide/', title: '換季房間整理怎麼做' },
    ],
    tools: [
      { href: '/zh/small-room-storage-planner/', title: '小房間收納規劃器' },
      { href: '/zh/storage-bed-selector/', title: '收納床選擇器' },
      { href: '/zh/furniture-fit-checker/', title: '家具尺寸適配檢查' },
      { href: '/zh/room-layout-planner/', title: '房間家具配置工具' },
    ],
    faq: [
      { q: '收納盒買越多越好嗎？', a: '不是。先決定物品要放哪一區、多久拿一次，再買對應尺寸的盒子；先買盒子通常會變成盒子本身佔空間。' },
      { q: '高櫃一定要固定嗎？', a: '高櫃、書架與衣櫃都應依產品說明做防傾倒固定，靠牆或靠家具都不等於穩定，家中有兒童時尤其重要。' },
      { q: '衣櫃前面要留多少空間？', a: '開門式至少要留門片深度加一個人站的位置；推拉門可以少留，但要確認滑軌與旁邊家具不互相卡住。' },
    ],
    plannerPreset: 'student',
    plannerCta: '用 Room Planner 把衣櫃與收納櫃放進平面圖，先確認門片開啟後還走得過去，再決定買哪一種櫃子。',
  },

  moving: {
    lead: [
      '搬家最貴的錯誤不是家具買錯尺寸，而是家具搬不進去。只量房間長寬遠遠不夠：門框淨寬、樓梯轉角、電梯內部深度與門高、走廊寬度，任何一段不足都會讓已經付款的家具停在門口。',
      '這個主題把搬家前的準備拆成兩條檢查線。第一條是「搬得進去」——從大門到房間的整段路徑，每一個轉角與門框都要量，並確認家具能不能拆解。第二條是「放得下也用得順」——新家平面圖上先標出家具落點、插座與門窗，再排搬入順序，避免最後一件大家具沒有位置。',
      '租屋搬家還要加一條：退租回復。移動房東設備前先拍照記錄，安裝任何免釘用品前確認牆面材質與可能留下的痕跡。',
    ],
    coreQuestions: [
      { q: '搬家前要量哪些尺寸？', a: '房間、門框、樓梯轉角、電梯與家具外框，缺一段就可能搬不進去。', href: '/zh/blog/moving-furniture-checklist/', linkText: '搬家家具尺寸檢查清單' },
      { q: '新家要先畫平面圖嗎？', a: '要。先標出家具落點與插座位置，才能決定搬入順序。', href: '/zh/blog/floor-plan-before-moving-guide/', linkText: '搬家前先畫房間平面圖' },
      { q: '租屋買床要注意什麼？', a: '除了尺寸，還要確認能不能拆裝，以及退租時怎麼搬出去。', href: '/zh/blog/bed-size-room-rental-bed-disassembly-feng-shui/', linkText: '租屋買床要注意什麼' },
    ],
    featured: [
      { href: '/zh/blog/moving-furniture-checklist/', title: '搬家家具尺寸檢查清單', note: '新家放得下，也要搬得進去、用得順' },
      { href: '/zh/blog/floor-plan-before-moving-guide/', title: '搬家前先畫房間平面圖' },
      { href: '/zh/blog/bed-size-room-rental-bed-disassembly-feng-shui/', title: '租屋買床要注意什麼' },
    ],
    tools: [
      { href: '/zh/moving-furniture-size-check/', title: '搬家家具尺寸檢查' },
      { href: '/zh/furniture-fit-checker/', title: '家具尺寸適配檢查' },
      { href: '/zh/room-layout-planner/', title: '房間家具配置工具' },
    ],
    faq: [
      { q: '家具搬不進門怎麼辦？', a: '先確認能否拆解（床架、桌腳、櫃門），再考慮改走陽台或另找搬運方式；涉及吊掛作業要交給專業廠商評估。' },
      { q: '要不要先量電梯？', a: '要。電梯內部深度、門寬與門高常常比大門更窄，長型家具尤其容易卡在這一段。' },
      { q: '搬入順序怎麼排？', a: '從最大、最難移動的家具開始（通常是床與衣櫃），最後才放小件與收納盒。' },
    ],
    plannerPreset: 'studio',
    plannerCta: '搬家前先用 Room Planner 把新家的房間畫出來，把要帶走的家具外框放進去，確認每一件都有位置再打包。',
  },

  'living-room': {
    lead: [
      '客廳與沙發配置要同時處理通行、視線、收納與使用習慣。沙發是全家最常坐的家具，位置一旦選錯，每天都會用繞路與伸手不順來付代價。',
      '判斷順序通常是：先確定主要通行帶（大門到各房間的那條線）不能被家具切斷，再決定沙發面向哪裡、茶几留多少距離、電視或投影的視距是否舒適，最後才處理收納與裝飾。套房裡的沙發還多一層任務——它常常同時是隔斷，要一併考慮兩側的視線與噪音。',
      '這個主題也涵蓋臥室放沙發的情境：小空間放沙發不是不行，但要先確認它不會擋住床邊通道或衣櫃門片。',
    ],
    coreQuestions: [
      { q: '房間可以放沙發嗎？', a: '可以，但要先確認床邊通道與衣櫃門片不受影響。', href: '/zh/blog/sofa-bedroom-layout/', linkText: '房間可以放沙發嗎' },
      { q: '茶几要離沙發多遠？', a: '要留得下小腿與起身空間，同時不能切斷主要通行帶。', href: '/zh/blog/living-room-coffee-table-feng-shui/', linkText: '客廳茶几怎麼擺' },
    ],
    featured: [
      { href: '/zh/blog/sofa-bedroom-layout/', title: '房間可以放沙發嗎', note: '臥室、小套房與客廳沙發配置檢查' },
      { href: '/zh/blog/living-room-coffee-table-feng-shui/', title: '客廳茶几怎麼擺', note: '沙發距離、走道、尖角與聚氣參考' },
    ],
    tools: [
      { href: '/zh/living-room-furniture-layout/', title: '客廳家具配置' },
      { href: '/zh/room-layout-planner/', title: '房間家具配置工具' },
      { href: '/zh/furniture-fit-checker/', title: '家具尺寸適配檢查' },
    ],
    faq: [
      { q: '沙發一定要靠牆嗎？', a: '不一定。沙發背後有穩定的視覺依靠會比較安定，但在開放空間裡把沙發當隔斷也很常見，重點是背後留得下通行寬度。' },
      { q: '小客廳要選多大的沙發？', a: '先量主要通行帶要留多少，剩下的寬度再減去茶几距離，才是沙發可用的長度。' },
    ],
    plannerPreset: 'living',
    plannerCta: '用 Room Planner 把沙發、茶几與餐桌放進客廳平面圖，先確認主要通行帶沒有被切斷。',
  },

  tutorial: {
    lead: [
      '這個主題示範怎麼把 RoomFeng 的工具用在真實的房間上：建立房間尺寸、放入家具、檢查門口與走道，再把配置圖匯出成 PNG 或 PDF，方便買家具或搬家時跟家人、房東與搬家公司溝通。',
      '工具本身全部在瀏覽器裡運算，不需要註冊也不會把你的房間資料上傳；草稿存在瀏覽器的 localStorage，換裝置就不會帶著走，重要的配置建議直接匯出成檔案保存。',
    ],
    coreQuestions: [
      { q: '買家具前要怎麼用工具驗證？', a: '先畫房間與門窗，再把候選家具的外框放進去，實際檢查門片與走道。', href: '/zh/blog/bedroom-layout-before-buying-furniture/', linkText: '買家具前先做房間配置圖' },
    ],
    featured: [
      { href: '/zh/blog/bedroom-layout-before-buying-furniture/', title: '買家具前先做房間配置圖' },
    ],
    tools: [
      { href: '/zh/room-layout-planner/', title: '房間家具配置工具' },
      { href: '/zh/furniture-fit-checker/', title: '家具尺寸適配檢查' },
      { href: '/zh/room-size-layout-templates/', title: '坪數房間配置範本庫' },
    ],
    faq: [
      { q: '需要註冊才能使用嗎？', a: '不需要。所有工具都在瀏覽器端運算，沒有帳號也沒有資料庫。' },
      { q: '畫好的房間會存起來嗎？', a: '草稿存在你自己瀏覽器的 localStorage，不會上傳到伺服器；換瀏覽器或清除資料後就會消失，建議匯出 PNG 或 PDF 保存。' },
    ],
    plannerPreset: 'studio',
    plannerCta: '直接開 Room Planner 跟著操作一次：輸入長寬、拖進家具、看警示、匯出 PDF。',
  },

  faq: {
    lead: [
      '這裡集中整理房間配置、家具尺寸、風水參考、動線、收納與租屋佈局最常被問到的問題。如果你只想快速確認一件事，從這裡開始比翻文章列表快。',
      '每個答案都會連到更完整的指南或可以直接使用的工具，不會只給一句結論就結束。風水相關的問題一律標示為民俗文化參考，並說明背後可以實際檢查的居住條件。',
    ],
    coreQuestions: [
      { q: '常見問題總整理在哪裡？', a: '尺寸、風水、動線、收納與租屋配置的高頻問題都整理在同一頁。', href: '/zh/blog/room-layout-faq/', linkText: '房間規劃常見問題總整理' },
    ],
    featured: [
      { href: '/zh/blog/room-layout-faq/', title: '房間規劃常見問題總整理' },
    ],
    tools: [
      { href: '/zh/room-layout-planner/', title: '房間家具配置工具' },
      { href: '/zh/feng-shui-bedroom-checker/', title: '臥室風水格局檢查' },
      { href: '/zh/furniture-fit-checker/', title: '家具尺寸適配檢查' },
    ],
    faq: [
      { q: '走道最少要留多少？', a: '一般建議至少 60 公分，主要通道 75 到 90 公分較舒適；實際仍以你家的門片、抽屜與椅子尺寸實測為準。' },
      { q: '風水說法可以照做嗎？', a: '可以作為民俗文化參考，但不保證任何結果。建議先看它對應的可觀察問題（視線、噪音、濕氣、動線）再決定要不要調整。' },
      { q: '租屋能改的範圍到哪裡？', a: '家具位置、可移動燈具、布簾、免釘收納都可以；鑽孔、油漆與固定照明改動需要房東同意，退租時通常要還原。' },
    ],
    plannerPreset: 'studio',
    plannerCta: '有具體房間要規劃時，直接用 Room Planner 畫出來比看文字更快得到答案。',
  },
};

export const hubSlugs = Object.keys(hubContent);
