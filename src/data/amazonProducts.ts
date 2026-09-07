import catalogue from './amazon-products.json';
import type { AffiliateProduct } from './affiliateProducts';

interface AmazonCatalogueRecord {
  product_id: string;
  asin: string;
  product_title: string;
  product_summary: string;
  affiliate_url_full: string;
  tracking_id: string;
  image_url: string;
  internal_category: string;
  suggested_cta: string;
  alt_text: string;
  target_site: string;
  target_locale: string;
  priority_score: number;
  weight: number;
  status: string;
  enabled: boolean;
}

const isHttpsUrl = (value: string) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

export const amazonProducts: AffiliateProduct[] = (catalogue as AmazonCatalogueRecord[])
  .filter((product) => product.enabled && product.status === 'active')
  .filter((product) => product.target_site === 'RoomFeng' && product.target_locale !== 'zh')
  .filter((product) => Boolean(product.asin && product.product_title && product.product_summary && product.tracking_id === 'roomfeng-20'))
  .filter((product) => isHttpsUrl(product.affiliate_url_full) && isHttpsUrl(product.image_url))
  .map((product) => ({
    product_id: product.asin,
    category: product.internal_category,
    image: product.image_url,
    price: null,
    affiliate_url: product.affiliate_url_full,
    affiliate_network: 'amazon',
    batch_id: 'amazon-master-20260907',
    active: true,
    id: product.product_id,
    sourceProductId: product.asin,
    name: product.product_title,
    shop: 'Amazon',
    description: product.product_summary,
    tags: [product.internal_category],
    url: product.affiliate_url_full,
    platform: 'amazon',
    priority: product.priority_score,
    tracking_id: product.tracking_id,
    alt_text: product.alt_text,
    suggested_cta: product.suggested_cta,
  }));

export const amazonProductsById = new Map(amazonProducts.map((product) => [product.id, product]));
