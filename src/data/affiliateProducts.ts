/** Central Shopee support catalogue. Fast-changing price, sales and commission fields are intentionally omitted. */
export type AffiliateProductCategory = 'furniture' | 'storage' | 'mats' | 'bedding' | 'decor' | 'moving';

export interface AffiliateProduct {
  id: string;
  sourceProductId: string;
  name: string;
  shop: string;
  description: string;
  category: AffiliateProductCategory;
  tags: string[];
  image: string;
  url: string;
}

const image = (id: string) => `/assets/support-products/${id}.webp`;
const p = (id: string, sourceProductId: string, name: string, shop: string, description: string, category: AffiliateProductCategory, tags: string[], url: string): AffiliateProduct => ({ id, sourceProductId, name, shop, description, category, tags, image: image(sourceProductId), url });

export const affiliateProducts: AffiliateProduct[] = [
  p('hopma-four-door-storage-cabinet', '3442325099', '四門收納櫃', 'HOPMA 合馬家具', '適合把書籍、日用品或備品集中分區；購買前請依實際牆面與開門範圍核對尺寸。', 'storage', ['收納', '客廳', '臥室'], 'https://s.shopee.tw/8AVkZycyb2'),
  p('hopma-two-door-wardrobe', '13827568158', '二門衣櫃', 'HOPMA 合馬家具', '以垂直空間整理衣物的衣櫃選項；請先量門片、走道與衣櫃預留深度。', 'storage', ['衣櫃', '臥室', '收納'], 'https://s.shopee.tw/80CKNfdbw1'),
  p('hopma-glass-display-cabinet', '20152008452', '玻璃門展示收納櫃', 'HOPMA 合馬家具', '讓收藏或常用物品分層整理，也方便從外部查看；請留意玻璃門開啟所需空間。', 'storage', ['展示', '收納', '客廳'], 'https://s.shopee.tw/8V8ayabhv8'),
  p('hopma-tall-shoe-cabinet', '2043712388', '玄關高鞋櫃', 'HOPMA 合馬家具', '可用於玄關鞋類與小物分區；配置時保留出入口通行、鞋櫃門片和清潔距離。', 'storage', ['玄關', '鞋櫃', '收納'], 'https://s.shopee.tw/8KpAmHcLG7'),
  p('hopma-kitchen-storage-cabinet', '1183247257', '廚房電器收納櫃', 'HOPMA 合馬家具', '提供電器與備品分層位置；請依家電散熱、插座和工作檯高度確認適配性。', 'storage', ['廚房', '收納', '電器櫃'], 'https://s.shopee.tw/8plRNCaRFE'),
  p('hopma-four-tier-shelf', '3077605111', '多格層櫃', 'HOPMA 合馬家具', '以格層整理書籍、雜物或玄關用品；請將較重物品放在較低層並固定好櫃體。', 'storage', ['層架', '書櫃', '小房間'], 'https://s.shopee.tw/8fS1Atb4aD'),
  p('hopma-drawer-storage-unit', '966814838', '組合式抽屜斗櫃', 'HOPMA 合馬家具', '適合床邊、梳妝區或衣物分區使用；請先確認抽屜拉出後仍有足夠走道。', 'storage', ['抽屜', '床邊', '衣物收納'], 'https://s.shopee.tw/904rZVZnuJ'),
  p('hopma-entryway-shoe-bench', '23347214737', '玄關穿鞋收納椅', 'HOPMA 合馬家具', '把坐下穿鞋與玄關收納整合在一起；請量入口轉身空間與椅面高度。', 'furniture', ['玄關', '穿鞋椅', '收納'], 'https://s.shopee.tw/1Vyqdj2M7s'),
  p('hopma-nine-cube-shelf', '9584341351', '九格組合式書櫃', 'HOPMA 合馬家具', '以九格分隔書籍、盒物和展示品；小房間使用時請預留清潔與取物動線。', 'storage', ['書櫃', '層架', '小房間'], 'https://s.shopee.tw/1gIGq21imx'),
  p('hopma-two-door-shoe-cabinet', '18777878605', '二門鞋櫃', 'HOPMA 合馬家具', '玄關鞋類的垂直收納選項；請將櫃體深度、門片開啟和出入口寬度一起核對。', 'storage', ['玄關', '鞋櫃', '小房間'], 'https://s.shopee.tw/2VrNpYyY6A'),
  p('hopma-glass-door-storage-cabinet', '18252003703', '玻璃門收納櫃', 'HOPMA 合馬家具', '適合展示與收納並用的分層櫃；請確認玻璃門前方不會被床、桌或走道擋住。', 'storage', ['展示', '收納', '客廳'], 'https://s.shopee.tw/gPjeC5Wov'),
  p('hopma-monitor-riser', '1375404941', '桌上螢幕架', 'HOPMA 合馬家具', '增加桌面上下分層，讓螢幕與鍵盤有較清楚的位置；請依桌深和設備重量核對。', 'furniture', ['書桌', '工作區', '收納'], 'https://s.shopee.tw/4qFIbqpfMq'),
  p('hopma-work-desk', '1335022832', '日系層架工作桌', 'HOPMA 合馬家具', '桌面與層架整合的工作區家具；規劃時先量椅子後移與桌旁通道。', 'furniture', ['書桌', '工作區', '層架'], 'https://s.shopee.tw/4fvsPXqIhp'),
  p('hopma-glass-cabinet-set', '18674368578', '組合式玻璃門櫃', 'HOPMA 合馬家具', '組合式展示櫃可依牆面安排；購買前確認組合後尺寸、承重與防傾倒固定方式。', 'storage', ['展示', '收納', '客廳'], 'https://s.shopee.tw/5As90SoOgw'),
  p('hopma-sliding-door-shoe-cabinet', '14776761987', '滑門鞋櫃', 'HOPMA 合馬家具', '滑門設計可減少門片向外占用的範圍；仍要保留櫃前操作及出入口通行距離。', 'storage', ['玄關', '鞋櫃', '小房間'], 'https://s.shopee.tw/5VUzP4n81J'),
  p('hopma-two-door-wardrobe-905', '22477987025', '二門五格衣櫃', 'HOPMA 合馬家具', '以多格層整理衣物與配件；請依衣櫃深度、房門寬度與日常取物動線確認。', 'storage', ['衣櫃', '臥室', '收納'], 'https://s.shopee.tw/9fKYMjXGZG'),
  p('silica-soft-mat-direct', '29070538302', '加厚硅藻土軟墊', '蝦皮直營生活超市', '浴室、廚房等需要腳下分區的空間可參考；請依地面材質與清潔方式確認。', 'mats', ['地墊', '浴室', '廚房'], 'https://s.shopee.tw/20v7Ee0S73'),
  p('long-pile-bedroom-rug', '16019224350', '長毛床邊地毯', '易購商城', '可用來界定床邊或客廳的小區域；先量家具腳位與門片開啟後的可用範圍。', 'mats', ['地毯', '臥室', '客廳'], 'https://s.shopee.tw/4LJ20vrZNj'),
  p('nordic-bedroom-rug', '10826760335', '北歐風地毯地墊', 'HOMU生活市集', '臥室或床邊的柔軟地面分區選項；請依清潔習慣、門縫與地面止滑狀況確認。', 'mats', ['地毯', '臥室', '床邊'], 'https://s.shopee.tw/3B74cmw0kc'),
  p('clear-waterproof-desk-mat', '9359491416', '透明防水桌墊', 'A X居家生活館', '可作為書桌或工作桌表面保護層；請依桌面大小、邊角與使用方式確認。', 'mats', ['桌墊', '書桌', '工作區'], 'https://s.shopee.tw/3LQUp5vNPh'),
  p('clear-thick-table-mat', '8460075834', '透明厚款桌墊', 'ZX居家生活館', '適合替餐桌、辦公桌或書桌增加一層表面保護；請先量桌面及圓角形狀。', 'mats', ['桌墊', '餐桌', '書桌'], 'https://s.shopee.tw/3qMlQ0tTOo'),
  p('cotton-duvet-set', '6376946507', '精梳純棉兩用被床包組', 'HOYACASA 禾雅寢具官方旗艦', '床包與被套的寢具組合；請依床墊尺寸、季節與洗滌方式確認是否合用。', 'bedding', ['寢具', '床包', '臥室'], 'https://s.shopee.tw/2BEXQwzom4'),
  p('tencel-duvet-set', '9678417818', '天絲床包兩用被組', '夢之語寢具生活館', '作為臥室寢具配置的材質選項；請以床墊規格、個人觸感和洗滌標示為準。', 'bedding', ['寢具', '床包', '臥室'], 'https://s.shopee.tw/40gBcJsq3d'),
  p('cool-summer-sleeping-mat', '26800541800', '涼感涼蓆組', '最優居家生活', '可依季節替換床面配置的寢具選項；請確認床墊尺寸、收納方式與洗滌標示。', 'bedding', ['寢具', '臥室', '夏季'], 'https://s.shopee.tw/50Yio9p21v'),
  p('cool-summer-quilt', '24628932210', '素色涼感被', '夢之語寢具生活館', '以素色與季節性材質搭配臥室；請依床寬、冷氣使用習慣與清潔需求挑選。', 'bedding', ['寢具', '臥室', '夏季'], 'https://s.shopee.tw/9pdyZ2WdEJ'),
  p('custom-wall-hanging', '7207184461', '客製掛布／掛畫', 'Wish&Box', '可用於牆面視覺分區或房間布置；懸掛前請確認牆面承重、固定方式與通行安全。', 'decor', ['牆面', '房間布置', '客廳'], 'https://s.shopee.tw/2LXxdFzBR9'),
  p('linen-tablecloth', '14851084009', '棉麻桌巾／桌墊', '卡厚買', '可替餐桌或工作桌做表面分區；請依桌面大小、清洗方式和桌腳通行空間確認。', 'decor', ['桌面', '餐桌', '居家'], 'https://s.shopee.tw/1BM0F73co2'),
  p('led-wall-clock', '29965372348', 'LED 壁掛鐘', '購思購生活 GOSGO', '可作為客廳、書房或工作區的時間提示；請依觀看距離、插座和牆面位置安排。', 'decor', ['牆面', '客廳', '工作區'], 'https://s.shopee.tw/4VcSDEqw2k'),
  p('sofa-cover', '11674641952', '沙發坐墊套／靠背套', '寶來小舖', '可作為沙發表面保護與空間整理選項；請量沙發寬度、扶手和坐墊厚度。', 'decor', ['沙發', '客廳', '居家'], 'https://s.shopee.tw/2qUEEAxHQW'),
  p('waterproof-sofa-cover', '26605438710', '防水沙發套', 'T&J 特惠場', '可作為沙發日常整理與表面保護用品；請依沙發形狀、固定方式和清洗標示挑選。', 'decor', ['沙發', '客廳', '居家'], 'https://s.shopee.tw/9V18AQXtuD'),
  p('washable-cushion', '18081885505', '可拆洗抱枕／靠墊', 'HOMU生活市集', '用於沙發、床邊或閱讀角落的柔軟配件；請依套子尺寸、填充與清潔方式確認。', 'decor', ['抱枕', '沙發', '臥室'], 'https://s.shopee.tw/9zxOlLVztM'),
  p('adjustable-clothes-rack', '27063737943', '升降吊衣架', 'Truelife Outlet 盒理收納', '可在租屋或換季時增加衣物掛放區；請量天花板高度、輪座位置與通道寬度。', 'storage', ['衣物收納', '租屋', '臥室'], 'https://s.shopee.tw/2gAo1rxulV'),
  p('folding-step-ladder', '22753177498', '折疊梯凳', '興星嚴選店', '可收折存放，用於拿取高處收納物；請依收納位置、踏面穩定和使用安全說明評估。', 'moving', ['收納', '居家', '搬家'], 'https://s.shopee.tw/5foPbNmUgM'),
  p('drain-pipe-connector', '42701426369', '排水管接頭', '178 小舖官方旗艦館', '整理洗衣或居家排水配置時的零件選項；請先核對管徑、接法和防漏需求。', 'moving', ['居家', '配置', '浴室'], 'https://s.shopee.tw/6AkgCIkafV'),
  p('filtered-shower-head', '19982450309', '蓮蓬頭組', '夢巴黎', '浴室設備替換時可作為配置參考；請確認接頭規格、軟管長度與安裝方式。', 'moving', ['浴室', '居家', '配置'], 'https://s.shopee.tw/1gIGq21iny'),
  p('folding-shopping-cart', '22524549146', '折疊購物車', '金多多生活本舖', '可收折存放並協助搬運日用品；請依收納位置、樓梯與電梯使用情境確認。', 'moving', ['搬家', '收納', '居家'], 'https://s.shopee.tw/8fS1Atb4bE'),
  p('folding-hand-cart', '17468232287', '折疊手推車', '好物臻選', '搬運採買物品或整理房間時的輔助用品；請依載重、收折後尺寸與動線評估。', 'moving', ['搬家', '居家', '收納'], 'https://s.shopee.tw/1LfQRQ2zSr'),
  p('stainless-clothes-hangers', '51200280563', '不鏽鋼衣架組', '夢巴黎', '可協助統一衣櫃掛放方式；請依衣櫃桿寬度、衣物重量與收納數量挑選。', 'storage', ['衣櫃', '衣物收納', '臥室'], 'https://s.shopee.tw/20v7Ee0S84'),
];

export const affiliateProductsById = new Map(affiliateProducts.map((product) => [product.id, product]));
/** Existing page ids resolve to practical products while page files migrate gradually. */
export const affiliateProductAliases: Record<string, string> = {
  'amethyst-cave': 'hopma-four-door-storage-cabinet', 'lucky-cat': 'led-wall-clock', 'gold-koi-painting': 'custom-wall-hanging',
  'obsidian-turtle': 'hopma-glass-display-cabinet', 'white-crystal-cluster': 'nordic-bedroom-rug', 'fengshui-mousepad': 'clear-waterproof-desk-mat',
  'amethyst-egg': 'washable-cushion', 'gold-koi-9-painting': 'linen-tablecloth', 'stibnite-ore': 'hopma-nine-cube-shelf',
  'topaz-ring': 'hopma-monitor-riser', 'owl-carving': 'custom-wall-hanging',
};
export function resolveAffiliateProductId(id: string) { return affiliateProductAliases[id] ?? id; }

const contextKeywords: Record<string, string[]> = {
  bedroom: ['臥室', '床', '寢具'], 'feng-shui': ['臥室', '床', '鏡子', '書桌'], 'small-room': ['小房間', '收納', '租屋'],
  'room-planning': ['房間', '家具', '收納'], storage: ['收納', '衣櫃', '層架'], 'living-room': ['客廳', '沙發', '地毯'], moving: ['搬家', '收納', '家具'],
};
export function selectAffiliateProducts(options: { category?: string; tags?: string[]; slug?: string; maxItems?: number } = {}) {
  const maxItems = Math.max(2, Math.min(options.maxItems ?? 3, 3));
  const context = [options.category, ...(options.tags ?? []), options.slug].filter(Boolean).join(' ').toLowerCase();
  const keywords = [...(contextKeywords[options.category ?? ''] ?? []), ...Object.entries(contextKeywords).filter(([key]) => context.includes(key)).flatMap(([, values]) => values)];
  return affiliateProducts.map((product, index) => {
    const haystack = [product.name, product.description, product.category, ...product.tags].join(' ').toLowerCase();
    const score = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword.toLowerCase()) ? 2 : 0), 0);
    return { product, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, maxItems).map(({ product }) => product);
}
