/**
 * Shared affiliate catalogue adapter.
 *
 * `support-products.json` is copied from FunnyTools' canonical public catalogue.
 * Keep the raw records intact so every company site can consume the same IDs,
 * platforms, URLs, images, and price snapshots while this adapter provides the
 * fields used by RoomFeng's contextual cards.
 */
import catalogue from './support-products.json';

export type AffiliatePlatform = 'shopee' | 'coupang' | 'amazon' | string;

interface SharedAffiliateProduct {
  id: string;
  status?: string;
  category?: string;
  title?: string;
  shortTitle?: string;
  description?: string;
  platform?: AffiliatePlatform;
  affiliateUrl?: string;
  fallbackUrl?: string;
  imageUrl?: string;
  tags?: string[];
  priority?: number;
  optionalDescription?: string;
  optionalPriceLabel?: string;
  batch_id?: string;
}

export interface AffiliateProduct {
  // Canonical company schema fields.
  product_id: string;
  category: string;
  image: string;
  price: number | string | null;
  affiliate_url: string;
  affiliate_network: AffiliatePlatform;
  batch_id: string;
  active: boolean;

  // Compatibility fields retained for the current RoomFeng UI.
  id: string;
  sourceProductId: string;
  name: string;
  shortTitle?: string;
  shop: string;
  description: string;
  tags: string[];
  url: string;
  platform: AffiliatePlatform;
  optionalPriceLabel?: string;
  priority?: number;
}

export const affiliateCatalog = catalogue as SharedAffiliateProduct[];
const platformLabels: Record<string, string> = { shopee: '蝦皮', coupang: '酷澎', amazon: 'Amazon' };
const isHttpsUrl = (value: string | undefined) => {
  try { return Boolean(value && new URL(value).protocol === 'https:'); } catch { return false; }
};

/** Active records mirror FunnyTools' public loader: inactive history stays in the raw catalogue. */
export const affiliateProducts: AffiliateProduct[] = affiliateCatalog
  .filter((product) => product.status === 'active' && isHttpsUrl(product.affiliateUrl || product.fallbackUrl))
  .map((product) => ({
    product_id: product.id,
    category: product.category || 'general',
    image: product.imageUrl || '/assets/support-products/fallback.webp',
    price: null,
    affiliate_url: product.affiliateUrl || product.fallbackUrl || '',
    affiliate_network: product.platform || 'other',
    batch_id: product.batch_id || 'catalog-legacy',
    active: true,
    id: product.id,
    sourceProductId: product.id.replace(/^[^-]+-/, ''),
    name: product.title || product.shortTitle || '實用支持商品',
    shortTitle: product.shortTitle,
    shop: platformLabels[product.platform || ''] || product.platform || '其他',
    description: product.optionalDescription || product.description || '請先核對商品頁的尺寸、規格、庫存與最新資訊。',
    tags: Array.isArray(product.tags) ? product.tags : [],
    url: product.affiliateUrl || product.fallbackUrl || '',
    platform: product.platform || 'other',
    optionalPriceLabel: product.optionalPriceLabel,
    priority: product.priority,
  }));

export const affiliateProductsById = new Map(affiliateProducts.map((product) => [product.id, product]));

/** Existing page ids resolve to current verified products while page files migrate gradually. */
export const affiliateProductAliases: Record<string, string> = {
  'hopma-glass-display-cabinet': 'shopee-18252003703',
  'nordic-bedroom-rug': 'shopee-10826760335',
  'hopma-monitor-riser': 'shopee-7160059458',
  'washable-cushion': 'shopee-18081885505',
  'hopma-two-door-wardrobe': 'shopee-13827568158',
  'clear-waterproof-desk-mat': 'shopee-9359491416',
  'hopma-four-door-storage-cabinet': 'shopee-3442325099',
  'custom-wall-hanging': 'shopee-7207184461',
  'led-wall-clock': 'shopee-29965372348',
  'adjustable-clothes-rack': 'shopee-14296820642',
  'office-chair-floor-mat': 'shopee-11699140235',
  'amethyst-cave': 'shopee-3442325099',
  'lucky-cat': 'shopee-29965372348',
  'gold-koi-painting': 'shopee-7207184461',
  'obsidian-turtle': 'shopee-18252003703',
  'white-crystal-cluster': 'shopee-10826760335',
  'fengshui-mousepad': 'shopee-9359491416',
  'amethyst-egg': 'shopee-18081885505',
  'gold-koi-9-painting': 'shopee-14851084009',
  'stibnite-ore': 'shopee-9584341351',
  'topaz-ring': 'shopee-7160059458',
  'owl-carving': 'shopee-7207184461',
};

export function resolveAffiliateProductId(id: string) { return affiliateProductAliases[id] ?? id; }

const contextKeywords: Record<string, string[]> = {
  bedroom: ['臥室', '床', '寢具'],
  'feng-shui': ['臥室', '床', '鏡子', '書桌'],
  'small-room': ['小房間', '收納', '租屋'],
  'room-planning': ['房間', '家具', '收納'],
  storage: ['收納', '衣櫃', '層架'],
  'living-room': ['客廳', '沙發', '地毯'],
  moving: ['搬家', '收納', '家具'],
};

export function selectAffiliateProducts(options: { category?: string; tags?: string[]; slug?: string; maxItems?: number } = {}) {
  const maxItems = Math.max(1, Math.min(options.maxItems ?? 3, affiliateProducts.length));
  const context = [options.category, ...(options.tags ?? []), options.slug].filter(Boolean).join(' ').toLowerCase();
  const keywords = [...(contextKeywords[options.category ?? ''] ?? []), ...Object.entries(contextKeywords)
    .filter(([key]) => context.includes(key)).flatMap(([, values]) => values)];
  return affiliateProducts.map((product, index) => {
    const haystack = [product.name, product.description, product.category, ...product.tags].join(' ').toLowerCase();
    const score = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword.toLowerCase()) ? 2 : 0), 0);
    return { product, score, index };
  }).sort((a, b) => b.score - a.score || (b.product.priority ?? 0) - (a.product.priority ?? 0) || a.index - b.index)
    .slice(0, maxItems).map(({ product }) => product);
}
