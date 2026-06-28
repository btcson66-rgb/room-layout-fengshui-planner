export const siteUrl = 'https://roomfeng.win';
export const siteName = 'RoomFeng';
export const zhBrandName = 'RoomFeng 房間規劃與風水佈局工具';
export const enBrandName = 'RoomFeng Room Layout Planner';

export const toolLinks = [
  { href: '/zh/room-layout-planner/', title: '房間家具配置工具' },
  { href: '/zh/furniture-fit-checker/', title: '家具尺寸檢查' },
  { href: '/zh/small-bedroom-layout/', title: '小房間佈局規劃' },
  { href: '/zh/bed-desk-wardrobe-layout/', title: '床桌衣櫃配置' },
  { href: '/zh/feng-shui-bedroom-checker/', title: '臥室風水格局檢查' },
];

type CategoryMeta = {
  title: string;
  description: string;
  intro: string;
};

export const categoryMeta: Record<string, CategoryMeta> = {
  'feng-shui': {
    title: '臥室風水與民俗參考',
    description: '以民俗常見說法與空間舒適度角度整理床位、鏡子、書桌、門口動線等臥室配置參考。',
    intro:
      '這個分類整理床對門、鏡子對床、床頭靠牆、租屋風水改善等主題。所有內容都以民俗文化與空間舒適度作為參考，不保證任何財運、健康、感情或其他結果；實際配置仍應以安全、採光、通風、動線與個人需求為準。',
  },
  'small-room': {
    title: '小房間與租屋佈局',
    description: '小房間、套房與租屋族可執行的床位、書桌、收納、走道與分區配置方法。',
    intro:
      '小空間規劃重點不是塞進最多家具，而是保留能走、能開門、能坐下、能整理的使用距離。這裡收集小臥室、小套房、租屋房間與收納分區的實用文章。',
  },
  'room-planning': {
    title: '房間規劃與尺寸檢查',
    description: '從房間尺寸、家具外徑、門窗位置、走道寬度到搬家前檢查的完整房間規劃指南。',
    intro:
      '房間規劃需要同時看平面尺寸、門窗位置、家具外框與日常動線。這個分類幫你在買家具或搬家前先檢查放不放得下，以及放下之後是否仍然好住。',
  },
  bedroom: {
    title: '臥室家具配置',
    description: '臥室床、書桌、衣櫃、燈光與雙人房、學生房、長輩房等常見配置建議。',
    intro:
      '臥室通常同時承擔睡眠、工作、收納與換衣功能。這裡整理不同使用者與家具組合的配置順序，讓床、桌、衣櫃與走道比較容易取得平衡。',
  },
  storage: {
    title: '收納與衣櫃配置',
    description: '小房間收納分區、衣櫃位置、床下收納與門口整理的實用配置建議。',
    intro:
      '收納不是單純買更多盒子，而是依照使用頻率安排位置。這個分類聚焦衣櫃、床下、門口、牆面與桌面收納，讓房間維持可用動線。',
  },
  moving: {
    title: '搬家與家具尺寸',
    description: '搬家前確認新家房間、門口、電梯、走廊與家具外徑，降低家具買錯或搬不進去的風險。',
    intro:
      '搬家前只量房間長寬並不夠，還要確認門口、樓梯、電梯、轉角與家具拆解方式。這裡整理搬家家具尺寸檢查與新家配置前的準備步驟。',
  },
  tutorial: {
    title: '房間規劃工具教學',
    description: '用 RoomFeng 畫房間平面圖、檢查家具尺寸、匯出配置圖與閱讀格局警示的教學。',
    intro:
      '這個分類示範如何用 RoomFeng 建立房間尺寸、放入家具、檢查門口與走道，再把配置圖匯出成 PNG 或 PDF，方便買家具與搬家前溝通。',
  },
  faq: {
    title: '房間規劃常見問題',
    description: '整理房間配置、家具尺寸、風水參考、動線、收納與租屋佈局的常見搜尋問題。',
    intro:
      '如果你只是想快速確認某個配置問題，這個分類會把常見問題集中整理，並連到更完整的工具頁與教學文章。',
  },
  'living-room': {
    title: '客廳與沙發配置',
    description: '客廳、套房沙發、臥室沙發與公共空間家具配置的動線檢查建議。',
    intro:
      '客廳與沙發配置要同時考慮通行、視線、收納與使用習慣。這裡整理沙發位置、套房分區與生活動線的檢查方法。',
  },
};

export const categorySlugs = Object.keys(categoryMeta);

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
