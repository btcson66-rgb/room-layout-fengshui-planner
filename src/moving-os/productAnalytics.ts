export type ProductEvent = 'product_view' | 'product_cta_view' | 'product_cta_click' | 'product_preview_view' | 'product_checkout_click' | 'product_activation_view' | 'product_activation_success' | 'product_activation_error';

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

export function trackProductEvent(event: ProductEvent, placement: string, locale: string, extra: Record<string, string> = {}): void {
  try {
    window.gtag?.('event', event, { product_id: 'roomfeng-moving-new-home-os-v1', placement, locale, ...extra });
  } catch {
    // Product use and navigation never depend on analytics availability.
  }
}
