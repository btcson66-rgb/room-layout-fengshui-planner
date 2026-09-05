/**
 * 站內 301 轉址的單一事實來源。
 *
 * 為什麼需要這個檔案：RoomFeng 之前沒有任何轉址機制，所以「合併重複主題」
 * 只有兩種結果——留著薄頁面互相競爭，或直接刪檔造成 404。兩種都會丟權重。
 * 這裡集中登記 `from → to`，由 `scripts/postbuild-redirects.mjs` 產出
 * Cloudflare Pages 的 `dist/_redirects`，並由 `scripts/test/redirects.test.mjs`
 * 與 `scripts/content-quality-audit.mjs` 一起把守規則：
 *
 * 1. `from` 不能同時是一個真實存在的頁面（Pages 的靜態檔會優先於轉址）。
 * 2. `to` 必須是實際 build 出來的路由。
 * 3. 不能有轉址鏈（A→B 且 B→C），Google 會多花一跳而且權重遞減。
 * 4. `to` 不得一律指向首頁——必須語意高度相關的一對一或多對一。
 * 5. sitemap 不得再包含任何 `from`。
 *
 * 新增合併時：先把舊 .md 從 src/content/blog/ 刪除、從 contentQuality.mjs
 * 的 reviewReadyBlogSlugs 移除，再在這裡登記轉址。順序反了 preflight 會擋下來。
 */

/** @typedef {{ from: string; to: string; note: string }} Redirect */

/** 橫樑（樑下床）系列：15 篇情境分頁合併回床位總指南。 */
const beamBedRedirects = [
  ['beam-over-bed-head-clearance-feng-shui', '床頭與枕頭區淨高'],
  ['beam-over-bed-pillow-zone-feng-shui', '枕頭區量測'],
  ['beam-over-bed-shared-sleeping-feng-shui', '雙人床兩側'],
  ['beam-over-bed-bedframe-storage-feng-shui', '掀床與床下收納'],
  ['beam-over-bed-bunk-bed-clearance-feng-shui', '上下舖淨高'],
  ['beam-over-bed-child-height-feng-shui', '兒童床'],
  ['beam-over-bed-bedside-table-feng-shui', '床邊桌'],
  ['beam-over-bed-reading-light-feng-shui', '床頭閱讀燈'],
  ['beam-over-bed-ceiling-fan-clearance-feng-shui', '吊扇'],
  ['beam-over-bed-wardrobe-door-sweep-feng-shui', '衣櫃門片掃掠'],
  ['beam-over-bed-window-condensation-feng-shui', '床頭靠窗與結露'],
  ['beam-over-bed-night-exit-feng-shui', '夜間離床動線'],
  ['beam-over-bed-pet-route-feng-shui', '寵物床動線'],
  ['beam-over-bed-rental-furniture-shift-feng-shui', '租屋不能移床'],
  ['beam-over-bed-seasonal-reset-feng-shui', '換季重排'],
].map(([slug, note]) => ({
  from: `/zh/blog/${slug}/`,
  to: '/zh/blog/beam-over-desk-bed-layout/',
  note: `橫樑壓床完整指南「${note}」段落`,
}));

/** 橫樑（樑下書桌）系列：5 篇情境分頁合併進新的書桌總指南。 */
const beamDeskRedirects = [
  ['beam-over-desk-chair-height-clearance-feng-shui', '椅子座高與靠背'],
  ['beam-over-desk-standing-up-route-feng-shui', '起身與離桌路線'],
  ['beam-over-desk-monitor-glare-zone-feng-shui', '螢幕反光與樑面陰影'],
  ['beam-over-desk-low-ceiling-storage-boundary-feng-shui', '桌旁高櫃邊界'],
  ['beam-over-desk-rental-no-drill-lighting-feng-shui', '租屋不能鑽孔'],
].map(([slug, note]) => ({
  from: `/zh/blog/${slug}/`,
  to: '/zh/blog/beam-over-desk-workspace-guide/',
  note: `橫樑壓書桌完整指南「${note}」段落`,
}));

/**
 * 舊的 /tools/* 是 /zh/* 工具頁的重複版本，長期只靠 canonical 指走。
 * canonical 只是建議，轉址才是明確訊號，同時省掉 5 個重複頁的爬取成本。
 */
const legacyToolRedirects = [
  ['/tools/room-planner/', '/zh/room-layout-planner/'],
  ['/tools/bedroom-layout/', '/zh/bed-desk-wardrobe-layout/'],
  ['/tools/desk-placement/', '/zh/desk-placement-feng-shui/'],
  ['/tools/small-room-layout/', '/zh/small-bedroom-layout/'],
  ['/tools/feng-shui-bedroom-checker/', '/zh/feng-shui-bedroom-checker/'],
].map(([from, to]) => ({ from, to, note: '舊 /tools/ 重複頁，canonical 早已指向此頁' }));

/** /zh/ 之前是 meta refresh 假轉址（回傳 200），改成真正的 301。 */
const languageRootRedirects = [
  { from: '/zh/', to: '/', note: '中文站首頁就是網站根目錄' },
];

/** @type {Redirect[]} */
export const redirects = [
  ...beamBedRedirects,
  ...beamDeskRedirects,
  ...legacyToolRedirects,
  ...languageRootRedirects,
];

export const redirectSources = new Set(redirects.map((entry) => entry.from));
export const redirectTargets = new Set(redirects.map((entry) => entry.to));

/** Cloudflare Pages `_redirects` 內容（每行 `from to 301`）。 */
export function renderRedirectsFile() {
  const header = [
    '# 由 scripts/postbuild-redirects.mjs 從 src/data/redirects.mjs 產生，請勿手動編輯。',
    `# 共 ${redirects.length} 條 301。`,
    '',
  ];
  const lines = redirects.map((entry) => `${entry.from} ${entry.to} 301`);
  return `${[...header, ...lines].join('\n')}\n`;
}
