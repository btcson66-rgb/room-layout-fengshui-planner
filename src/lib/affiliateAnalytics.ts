export type AffiliateEventName =
  | 'affiliate_module_view'
  | 'affiliate_item_view'
  | 'affiliate_click'
  | 'affiliate_refresh'
  | 'affiliate_close';

export type AffiliateEventParams = {
  placement: string;
  surface_type: string;
  affiliate_network: string;
  batch_id: string;
  product_id?: string;
  product_category?: string;
  card_position?: number;
  close_method?: 'button' | 'overlay' | 'escape';
};

declare global {
  interface Window {
    __btcsonAffiliateTrack?: (eventName: AffiliateEventName, params: AffiliateEventParams) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const buildEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
export const AFFILIATE_GA_ID = buildEnv?.PUBLIC_AFFILIATE_GA_ID?.trim() || 'G-Q78WN8NZ0R';
const dedupe = new Map<string, number>();
const transientDedupeMs = 1200;

export function getAffiliateSiteName(hostname = typeof window === 'undefined' ? '' : window.location.hostname): string {
  const host = hostname.toLowerCase().split(':')[0];
  if (host === 'funnytools.win' || host === 'www.funnytools.win') return 'funnytools';
  if (host === 'roomfeng.win' || host === 'www.roomfeng.win') return 'roomfeng';
  if (host === 'worthcalc.win' || host === 'www.worthcalc.win') return 'worthcalc';
  if (host === 'familyboard.win' || host === 'www.familyboard.win') return 'familyboard';
  return 'development';
}

function isDebugMode(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ga_debug') === '1';
}

function shouldDedupe(eventName: AffiliateEventName, params: AffiliateEventParams): boolean {
  if (typeof window === 'undefined') return false;
  const page = window.location.pathname;
  const key = eventName === 'affiliate_module_view'
    ? `${eventName}|${page}|${params.placement}|${params.surface_type}`
    : `${eventName}|${page}|${params.placement}|${params.product_id || ''}|${params.batch_id}|${params.card_position || ''}`;
  const now = Date.now();
  const previous = dedupe.get(key);
  const permanent = eventName === 'affiliate_module_view' || eventName === 'affiliate_item_view';
  if (previous !== undefined && (permanent || now - previous < transientDedupeMs)) return true;
  dedupe.set(key, now);
  return false;
}

export function trackAffiliateEvent(eventName: AffiliateEventName, params: AffiliateEventParams): void {
  if (typeof window === 'undefined' || shouldDedupe(eventName, params)) return;
  const payload: Record<string, string | number | boolean> = {
    site_name: getAffiliateSiteName(),
    placement: params.placement,
    surface_type: params.surface_type,
    affiliate_network: params.affiliate_network,
    batch_id: params.batch_id,
  };
  for (const key of ['product_id', 'product_category', 'card_position', 'close_method'] as const) {
    const value = params[key];
    if (value !== undefined) payload[key] = value;
  }
  if (isDebugMode()) {
    payload.debug_mode = true;
    console.debug('[Affiliate GA4]', eventName, payload);
  }
  try {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, { ...payload, send_to: AFFILIATE_GA_ID });
  } catch {
    // Affiliate navigation must never depend on analytics availability.
  }
}

export function trackAffiliateModuleView(params: Omit<AffiliateEventParams, 'product_id' | 'product_category' | 'card_position' | 'close_method'>): void {
  trackAffiliateEvent('affiliate_module_view', params);
}

export function trackAffiliateItemView(params: Omit<AffiliateEventParams, 'close_method'>): void {
  trackAffiliateEvent('affiliate_item_view', params);
}

export function trackAffiliateClick(params: Omit<AffiliateEventParams, 'close_method'>): void {
  trackAffiliateEvent('affiliate_click', params);
}

export function trackAffiliateRefresh(params: Omit<AffiliateEventParams, 'product_id' | 'product_category' | 'card_position' | 'close_method'>): void {
  trackAffiliateEvent('affiliate_refresh', params);
}

export function trackAffiliateClose(params: Omit<AffiliateEventParams, 'product_id' | 'product_category' | 'card_position'>): void {
  trackAffiliateEvent('affiliate_close', params);
}

export function installAffiliateAnalytics(): void {
  if (typeof window !== 'undefined') window.__btcsonAffiliateTrack = trackAffiliateEvent;
}
