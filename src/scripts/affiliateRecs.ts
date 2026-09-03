import { trackAffiliateClick, trackAffiliateItemView, trackAffiliateModuleView, trackAffiliateRefresh } from '../lib/affiliateAnalytics';
import type { AffiliateProduct } from '../data/affiliateProducts';

const trackingRefreshers = new WeakMap<HTMLElement, () => void>();

const getLinks = (section: HTMLElement): HTMLAnchorElement[] => [...section.querySelectorAll('a[data-affiliate-product-link]')]
  .filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement);

const getContext = (section: HTMLElement) => ({
  placement: section.dataset.affiliatePlacement || 'product_card',
  surface_type: section.dataset.affiliateSurface || 'tool',
  batch_id: section.dataset.affiliateBatch || 'catalog-legacy',
});

const linkParams = (section: HTMLElement, link: HTMLAnchorElement) => ({
  ...getContext(section),
  affiliate_network: link.dataset.affiliateNetwork || 'other',
  product_id: link.dataset.affiliateProductId || 'unknown',
  product_category: link.dataset.affiliateProductCategory || 'general',
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
    const context = getContext(section);
    const networks = [...new Set(links.map((link) => link.dataset.affiliateNetwork || 'other'))];
    moduleObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
        trackAffiliateModuleView({
          ...context,
          affiliate_network: networks.length === 1 ? networks[0] : 'mixed',
        });
        moduleObserver?.disconnect();
      }
    }, { threshold: [0.5] });
    moduleObserver.observe(section);
    itemObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
        const link = entry.target;
        if (!(link instanceof HTMLAnchorElement)) continue;
        trackAffiliateItemView(linkParams(section, link));
        itemObserver?.unobserve(link);
      }
    }, { threshold: [0.5] });
    links.forEach((link) => {
      itemObserver?.observe(link);
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
    image.alt = `${product.name} 商品參考圖`;
    delete image.dataset.fallbackApplied;
    delete image.dataset.fallbackBound;
    bindAffiliateImageFallback(image);
  }
  const name = card.querySelector<HTMLElement>('[data-affiliate-field="name"]');
  const description = card.querySelector<HTMLElement>('[data-affiliate-field="description"]');
  const price = card.querySelector<HTMLElement>('[data-affiliate-field="price"]');
  const shop = card.querySelector<HTMLElement>('[data-affiliate-field="shop"]');
  const tags = card.querySelector<HTMLElement>('[data-affiliate-field="tags"]');
  if (name) name.textContent = product.name;
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
  const link = card.querySelector('[data-affiliate-product-link]');
  if (link instanceof HTMLAnchorElement) {
    link.href = product.affiliate_url;
    link.dataset.affiliateProductId = product.product_id;
    link.dataset.affiliateProductCategory = product.category;
    link.dataset.affiliateNetwork = product.affiliate_network;
    link.dataset.affiliateBatch = product.batch_id;
    link.textContent = `前往${product.affiliate_network === 'coupang' ? '酷澎' : product.affiliate_network === 'amazon' ? 'Amazon' : '蝦皮'}查看商品`;
  }
};

document.querySelectorAll('[data-affiliate-image]').forEach(bindAffiliateImageFallback);
document.querySelectorAll('[data-affiliate-recs]').forEach((section) => {
  if (!(section instanceof HTMLElement) || section.dataset.affiliateBatchBound === 'true') return;
  const data = section.querySelector('[data-affiliate-products]');
  const button = section.querySelector('[data-affiliate-next]');
  const status = section.querySelector('[data-affiliate-batch-status]');
  const cards = [...section.querySelectorAll<HTMLElement>('[data-affiliate-card]')];
  if (cards.length === 0) return;
  const refreshTracking = bindAffiliateTracking(section);
  let products: AffiliateProduct[] = [];
  try { products = data ? JSON.parse(data.textContent || '[]') as AffiliateProduct[] : []; } catch (_) { return; }
  const batchSize = Number(section.dataset.batchSize) || cards.length;
  const batchCount = Math.ceil(products.length / batchSize);
  let batchIndex = 0;
  const renderBatch = () => {
    const batch = products.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
    cards.forEach((card, index) => updateAffiliateCard(card, batch[index]));
    if (status && batchCount > 0) status.textContent = `第 ${batchIndex + 1} 組／共 ${batchCount} 組`;
    if (button instanceof HTMLButtonElement && batchCount > 0) {
      button.setAttribute('aria-label', `換一批商品（目前第 ${batchIndex + 1} 組，共 ${batchCount} 組）`);
    }
  };
  if (button instanceof HTMLButtonElement && batchCount > 1) button.addEventListener('click', () => {
    batchIndex = (batchIndex + 1) % batchCount;
    renderBatch();
    const batch = products.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
    const networks = [...new Set(batch.map((product) => product.affiliate_network || 'other'))];
    trackAffiliateRefresh({
      ...getContext(section),
      affiliate_network: networks.length === 1 ? networks[0] : 'mixed',
      batch_id: batch[0]?.batch_id || getContext(section).batch_id,
    });
    refreshTracking();
  });
  section.dataset.affiliateBatchBound = 'true';
  renderBatch();
});
