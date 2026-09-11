export type LayoutAnalyticsEvent =
  | 'layout_match_started'
  | 'layout_match_completed'
  | 'layout_view'
  | 'layout_compare'
  | 'layout_saved'
  | 'layout_open_planner';

export interface LayoutAnalyticsPayload {
  product_id: typeof PRODUCT_IDS.layoutVault;
  locale: 'en' | 'zh';
  family?: string;
  strategy?: string;
  result_count?: number;
  compare_count?: number;
  placement?: string;
}

const PRODUCT_ID = PRODUCT_IDS.layoutVault;
const ALLOWED_KEYS = new Set(['product_id', 'locale', 'family', 'strategy', 'result_count', 'compare_count', 'placement']);

export function sanitiseLayoutAnalytics(payload: Omit<LayoutAnalyticsPayload, 'product_id'>): LayoutAnalyticsPayload {
  const clean: LayoutAnalyticsPayload = { product_id: PRODUCT_ID, locale: payload.locale };
  Object.entries(payload).forEach(([key, value]) => {
    if (ALLOWED_KEYS.has(key) && key !== 'product_id' && value !== undefined) {
      (clean as unknown as Record<string, unknown>)[key] = value;
    }
  });
  return clean;
}

/** Wiring is opt-in so Phase 2 QA never enables production analytics. */
export function trackLayoutEvent(event: LayoutAnalyticsEvent, payload: Omit<LayoutAnalyticsPayload, 'product_id'>): void {
  if (typeof window === 'undefined' || window.__RF_PRODUCT_002_ANALYTICS_ENABLED__ !== true) return;
  const clean = sanitiseLayoutAnalytics(payload);
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', event, clean);
  window.dispatchEvent(new CustomEvent('roomfeng:layout-analytics', { detail: { event, ...clean } }));
}

declare global {
  interface Window { __RF_PRODUCT_002_ANALYTICS_ENABLED__?: boolean; }
}

export { PRODUCT_ID };
import { PRODUCT_IDS } from '../config/product-registry.ts';
