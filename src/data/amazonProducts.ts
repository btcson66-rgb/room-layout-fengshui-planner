import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import catalogue from './amazon-products.json';
import type { AffiliateProduct } from './affiliateProducts';

interface AmazonCatalogueRecord {
  product_id: string;
  asin: string;
  internal_display_name: string;
  internal_description: string;
  internal_alt_text: string;
  official_product_link_code?: string;
  product_link_type?: string;
  affiliate_url_full: string;
  tracking_id: string;
  internal_category: string;
  suggested_cta: string;
  target_site: string;
  target_locale: string;
  priority_score: number;
  weight: number;
  status: string;
  enabled: boolean;
}

interface AmazonContentCache {
  schema_version: number;
  source: string;
  fetched_at: string | null;
  expires_at: string | null;
  ttl_seconds: number;
  records: Array<AmazonContentRecord>;
}

interface AmazonContentRecord {
  asin: string;
  title: string;
  image_url: string;
}

const configuredMode = String(import.meta.env.AMAZON_AFFILIATE_BOOTSTRAP_MODE || 'auto').trim().toLowerCase();
const amazonMode = ['false', 'creators_api', 'creators-api'].includes(configuredMode)
  ? 'creators_api'
  : ['true', 'bootstrap'].includes(configuredMode) ? 'bootstrap' : 'auto';

const isHttpsUrl = (value: string) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

const cachePath = fileURLToPath(new URL('./.generated/amazon-product-content.json', import.meta.url));
const contentCache: AmazonContentCache | null = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf8')) as AmazonContentCache
  : null;
const cacheIsFresh = Boolean(
  contentCache
  && contentCache.schema_version === 1
  && contentCache.source === 'amazon-creators-api'
  && Number.isInteger(contentCache.ttl_seconds)
  && contentCache.ttl_seconds > 0
  && contentCache.ttl_seconds <= 24 * 60 * 60
  && contentCache.fetched_at
  && contentCache.expires_at
  && Date.now() < Date.parse(contentCache.expires_at)
  && Date.parse(contentCache.expires_at) - Date.parse(contentCache.fetched_at) <= 24 * 60 * 60 * 1000,
);
const freshRecords: AmazonContentRecord[] = cacheIsFresh && contentCache ? contentCache.records : [];
const contentByAsin = new Map(freshRecords.map((record) => [record.asin, record]));
export const amazonContentExpiresAt = amazonMode !== 'bootstrap' && cacheIsFresh ? contentCache?.expires_at ?? null : null;

export const amazonProducts: AffiliateProduct[] = (catalogue as AmazonCatalogueRecord[])
  .filter((product) => product.enabled && product.status === 'active')
  .filter((product) => product.target_site === 'RoomFeng' && product.target_locale !== 'zh')
  .map((product) => {
    const content = contentByAsin.get(product.asin);
    const useCreators = amazonMode !== 'bootstrap' && Boolean(content?.title && content?.image_url && isHttpsUrl(content.image_url));
    if (amazonMode === 'creators_api' && !useCreators) return null;
    return {
      product_id: product.asin,
      category: product.internal_category,
      image: useCreators ? content?.image_url || '' : '',
      price: null,
      affiliate_url: product.affiliate_url_full,
      affiliate_network: 'amazon',
      batch_id: 'amazon-master-20260907',
      active: true,
      id: product.product_id,
      sourceProductId: product.asin,
      name: useCreators ? content?.title || product.internal_display_name : product.internal_display_name,
      shop: 'Amazon',
      description: product.internal_description,
      tags: [product.internal_category],
      url: product.affiliate_url_full,
      platform: 'amazon',
      priority: product.priority_score,
      tracking_id: product.tracking_id,
      alt_text: useCreators ? `${content?.title || product.internal_display_name} product image` : product.internal_alt_text,
      suggested_cta: product.suggested_cta,
      amazon_content_mode: useCreators ? 'creators_api' : product.official_product_link_code ? 'product_link' : 'text_only',
    };
  })
  .filter((product) => Boolean(product && product.tracking_id === 'roomfeng-20' && isHttpsUrl(product.affiliate_url))) as AffiliateProduct[];

export const amazonProductsById = new Map(amazonProducts.map((product) => [product.id, product]));
