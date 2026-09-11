export type ProductEvent = 'product_view' | 'product_cta_view' | 'product_cta_click' | 'product_preview_view' | 'product_checkout_click' | 'product_activation_view' | 'product_activation_success' | 'product_activation_error';

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

export function trackProductEvent(event: ProductEvent, placement: string, locale: string, extra: Record<string, string> = {}): void {
  try {
    // Keep PRODUCT-001's default identity, while allowing the shared funnel
    // schema to be reused by another registered product without a second
    // analytics implementation.
    const productId = extra.product_id ?? 'roomfeng-moving-new-home-os-v1';
    window.gtag?.('event', event, { product_id: productId, placement, locale, ...extra });
  } catch {
    // Product use and navigation never depend on analytics availability.
  }
}
