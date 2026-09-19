import { trackAffiliateClick, trackAffiliateItemView, trackAffiliateModuleView, trackAffiliateRefresh } from '../lib/affiliateAnalytics';
import type { AffiliateProduct } from '../data/affiliateProducts';

const trackingRefreshers = new WeakMap<HTMLElement, () => void>();
const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

const getLinks = (section: HTMLElement): HTMLAnchorElement[] => [...section.querySelectorAll('a[data-affiliate-product-link]')]
  .filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement);

const getContext = (section: HTMLElement) => ({
  placement: section.dataset.affiliatePlacement || 'product_card',
  affiliate_placement: section.dataset.affiliatePlacement || 'product_card',
  surface_type: section.dataset.affiliateSurface || 'article',
  affiliate_site: section.dataset.affiliateSite || 'roomfeng',
  locale: section.dataset.affiliateLocale || document.documentElement.lang || 'zh',
  page_type: section.dataset.affiliatePageType || 'article',
  amazon_content_mode: section.dataset.affiliateContentMode || undefined,
  batch_id: section.dataset.affiliateBatch || 'catalog-legacy',
});

const getRotationCopy = (locale: string, currentBatch: number, totalBatches: number) => locale === 'en'
  ? {
      status: `Batch ${currentBatch} of ${totalBatches}`,
      ariaLabel: `Refresh products — currently batch ${currentBatch} of ${totalBatches}`,
    }
  : {
      status: `第 ${currentBatch} 組／共 ${totalBatches} 組`,
      ariaLabel: `換一批商品（目前第 ${currentBatch} 組，共 ${totalBatches} 組）`,
    };

const linkParams = (section: HTMLElement, link: HTMLAnchorElement) => ({
  ...getContext(section),
  affiliate_network: link.dataset.affiliateNetwork || 'other',
  product_id: link.dataset.affiliateProductId || 'unknown',
  product_category: link.dataset.affiliateProductCategory || 'general',
  affiliate_tracking_id: link.dataset.affiliateTrackingId || undefined,
  batch_id: link.dataset.affiliateBatch || getContext(section).batch_id,
  card_position: Number(link.dataset.affiliatePosition || 0),
});

const bindAffiliateTracking = (section: HTMLElement): (() => void) => {
  const existing = trackingRefreshers.get(section);
  if (existing) return existing;
  let moduleObserver: IntersectionObserver | null = null;
  let itemObserver: IntersectionObserver | null = null;
  const observe = () => {
    moduleObserver?.disconnect();
    itemObserver?.disconnect();
    const links = getLinks(section);
    const cards = [...section.querySelectorAll<HTMLElement>('[data-affiliate-card]')];
    const context = getContext(section);
    const networks = [...new Set(links.map((link) => link.dataset.affiliateNetwork || 'other'))];
    const moduleTarget = section.querySelector<HTMLElement>('[data-affiliate-module-sentinel]') ?? section;
    moduleObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
        trackAffiliateModuleView({
          ...context,
          affiliate_network: networks.length === 1 ? networks[0] : 'mixed',
        });
        moduleObserver?.disconnect();
      }
    }, { threshold: [0.5] });
    moduleObserver.observe(moduleTarget);
    itemObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
        const card = entry.target;
        if (!(card instanceof HTMLElement)) continue;
        const link = card.querySelector<HTMLAnchorElement>('a[data-affiliate-product-link]');
        if (!(link instanceof HTMLAnchorElement)) continue;
        trackAffiliateItemView(linkParams(section, link));
        itemObserver?.unobserve(card);
      }
    }, { threshold: [0.5] });
    cards.forEach((card) => itemObserver?.observe(card));
    links.forEach((link) => {
      if (link.dataset.affiliateClickBound === 'true') return;
      link.dataset.affiliateClickBound = 'true';
      link.addEventListener('click', () => trackAffiliateClick(linkParams(section, link)));
    });
  };
  const refresh = () => observe();
  trackingRefreshers.set(section, refresh);
  observe();
  window.addEventListener('pagehide', () => {
    moduleObserver?.disconnect();
    itemObserver?.disconnect();
  }, { once: true });
  return refresh;
};

const bindAffiliateImageFallback = (image: Element): void => {
  if (!(image instanceof HTMLImageElement) || image.dataset.fallbackBound === 'true') return;
  image.dataset.fallbackBound = 'true';
  image.addEventListener('error', () => {
    if (!image.dataset.fallbackApplied) {
      image.dataset.fallbackApplied = 'true';
      image.src = '/assets/support-products/fallback.webp';
    }
  }, { once: true });
};

const updateAffiliateCard = (card: Element, product: AffiliateProduct | undefined): void => {
  if (!(card instanceof HTMLElement) || !product) {
    if (card instanceof HTMLElement) card.hidden = true;
    return;
  }
  card.hidden = false;
  const image = card.querySelector('[data-affiliate-field="image"]');
  if (image instanceof HTMLImageElement) {
    image.src = product.image;
    image.alt = product.alt_text || `${product.name} product image`;
    delete image.dataset.fallbackApplied;
    delete image.dataset.fallbackBound;
    bindAffiliateImageFallback(image);
  }
  const name = card.querySelector<HTMLElement>('[data-affiliate-field="name"]');
  const description = card.querySelector<HTMLElement>('[data-affiliate-field="description"]');
  const price = card.querySelector<HTMLElement>('[data-affiliate-field="price"]');
  const shop = card.querySelector<HTMLElement>('[data-affiliate-field="shop"]');
  const tags = card.querySelector<HTMLElement>('[data-affiliate-field="tags"]');
  const nameLink = name?.querySelector<HTMLAnchorElement>('a[data-affiliate-product-link]');
  if (nameLink) nameLink.textContent = product.name;
  else if (name) name.textContent = product.name;
  if (description) description.textContent = product.description;
  if (price) {
    price.textContent = product.optionalPriceLabel || '';
    price.hidden = !product.optionalPriceLabel;
  }
  if (shop) shop.textContent = `來源平台：${product.shop}`;
  if (tags) {
    tags.replaceChildren(...(product.tags || []).map((tag) => {
      const item = document.createElement('li');
      item.textContent = tag;
      return item;
    }));
  }
  const links = [...card.querySelectorAll<HTMLAnchorElement>('a[data-affiliate-product-link]')];
  links.forEach((link) => {
    link.href = product.affiliate_url;
    link.dataset.affiliateProductId = product.product_id;
    link.dataset.affiliateProductCategory = product.category;
    link.dataset.affiliateNetwork = product.affiliate_network;
    link.dataset.affiliateTrackingId = product.tracking_id || '';
    link.dataset.affiliateContentMode = product.amazon_content_mode || '';
    link.dataset.affiliateBatch = product.batch_id;
    link.dataset.affiliatePosition = String(Number(card.dataset.productIndex || 0) + 1);
    if (link.classList.contains('button')) {
      link.textContent = product.suggested_cta || `前往${product.affiliate_network === 'coupang' ? '酷澎' : product.affiliate_network === 'amazon' ? 'Amazon' : '蝦皮'}查看商品`;
    }
  });
};

document.querySelectorAll('[data-affiliate-image]').forEach(bindAffiliateImageFallback);
document.querySelectorAll('[data-affiliate-recs]').forEach((section) => {
  if (!(section instanceof HTMLElement) || section.dataset.affiliateBatchBound === 'true') return;
  if (section.dataset.affiliateAmazon === 'true') {
    const expiresAt = Date.parse(section.dataset.affiliateContentExpiresAt || '');
    const removeExpiredContent = () => {
      if (Date.now() >= expiresAt) section.remove();
    };
    if (Number.isFinite(expiresAt)) {
      removeExpiredContent();
      if (!section.isConnected) return;
      window.setTimeout(removeExpiredContent, Math.max(0, expiresAt - Date.now() + 1));
    }
  }
  const data = section.querySelector('[data-affiliate-products]');
  const button = section.querySelector('[data-affiliate-next]');
  const status = section.querySelector('[data-affiliate-batch-status]');
  const cards = [...section.querySelectorAll<HTMLElement>('[data-affiliate-card]')];
  if (cards.length === 0) return;
  const refreshTracking = bindAffiliateTracking(section);
  let products: AffiliateProduct[] = [];
  try { products = data ? JSON.parse(data.textContent || '[]') as AffiliateProduct[] : []; } catch (_) { return; }
  if (section.dataset.affiliateAmazon === 'true') products = shuffle(products);
  const batchSize = Number(section.dataset.batchSize) || cards.length;
  const batchCount = Math.max(1, Math.ceil(products.length / batchSize));
  let batchIndex = 0;
  let refreshCount = 0;
  const getBatch = (startIndex: number): AffiliateProduct[] => {
    if (products.length === 0) return [];
    const count = Math.min(batchSize, products.length);
    return Array.from({ length: count }, (_, offset) => products[(startIndex + offset) % products.length]);
  };
  const renderBatch = () => {
    const batch = getBatch(batchIndex * batchSize);
    cards.forEach((card, index) => updateAffiliateCard(card, batch[index]));
    const locale = section.dataset.affiliateLocale || document.documentElement.lang || 'zh';
    const copy = getRotationCopy(locale, batchIndex + 1, batchCount);
    if (status) status.textContent = copy.status;
    if (button instanceof HTMLButtonElement) {
      button.setAttribute('aria-label', copy.ariaLabel);
    }
  };
  if (button instanceof HTMLButtonElement && batchCount > 1) button.addEventListener('click', () => {
    batchIndex = (batchIndex + 1) % batchCount;
    refreshCount += 1;
    renderBatch();
    const batch = getBatch(batchIndex * batchSize);
    const networks = [...new Set(batch.map((product) => product.affiliate_network || 'other'))];
    trackAffiliateRefresh({
      ...getContext(section),
      affiliate_network: networks.length === 1 ? networks[0] : 'mixed',
      batch_id: batch[0]?.batch_id || getContext(section).batch_id,
      affiliate_tracking_id: batch[0]?.tracking_id || 'unknown',
      product_id: batch[0]?.product_id || 'unknown',
      product_category: batch[0]?.category || 'general',
      products_shown: batch.length,
      refresh_count: refreshCount,
    });
    refreshTracking();
  });
  section.dataset.affiliateBatchBound = 'true';
  renderBatch();
});
