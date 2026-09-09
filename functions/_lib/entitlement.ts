import { revalidateLicense, type NormalizedLicenseResult, type ProviderConfig } from './license-provider.ts';
import { createEntitlementToken, createSessionToken, ENTITLEMENT_COOKIE, entitlementCookie, expiredEntitlementCookie, expiredSessionCookie, hashLicenseKey, MOVING_OS_PRODUCT_ID, OFFLINE_GRACE_SECONDS, REVALIDATION_INTERVAL_SECONDS, readCookie, readEntitlementToken, readVerifiedSession, sessionCookie, type EntitlementPayload, type LicenseEnv } from './moving-os-license.ts';

export type EntitlementReason = 'verified' | 'provider_unavailable_grace' | 'invalid_session' | 'revoked' | 'invalid' | 'verification_unavailable' | 'not_configured';
export interface EntitlementStatus { active: boolean; reason: EntitlementReason; nextCheckAt: number; setCookies?: string[]; clearCookies?: boolean }

const REVALIDATION_RATE_LIMIT_MAX = 30;
const REVALIDATION_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

/** Soft edge rate limit for the status endpoint; provider verification remains authoritative. */
export async function revalidationRateLimited(request: Request): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return false;
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const id = Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const key = new Request(`https://moving-os-revalidation-rate.invalid/${id}`);
    const hit = await cache.match(key);
    const count = hit ? Number(await hit.text()) || 0 : 0;
    if (count >= REVALIDATION_RATE_LIMIT_MAX) return true;
    await cache.put(key, new Response(String(count + 1), { headers: { 'cache-control': `max-age=${REVALIDATION_RATE_LIMIT_WINDOW_SECONDS}` } }));
  } catch { /* soft limiter: never bypass entitlement verification */ }
  return false;
}

function providerConfig(env: LicenseEnv, productId: string): ProviderConfig {
  return {
    productId,
    payhip: env.PAYHIP_PRODUCT_SECRET && env.PAYHIP_PRODUCT_LINK ? { productSecret: env.PAYHIP_PRODUCT_SECRET, productLink: env.PAYHIP_PRODUCT_LINK } : undefined,
    gumroad: env.GUMROAD_PRODUCT_ID ? { productId: env.GUMROAD_PRODUCT_ID } : undefined,
  };
}

function reasonForResult(result: Extract<NormalizedLicenseResult, { ok: false }>): EntitlementReason {
  if (result.code === 'disabled_license') return 'revoked';
  if (result.code === 'network_error') return 'verification_unavailable';
  return 'invalid';
}

function resultIsNetworkError(result: NormalizedLicenseResult): boolean {
  return !result.ok && result.code === 'network_error';
}

export async function revalidateEntitlement(request: Request, env: LicenseEnv, nowSeconds = Math.floor(Date.now() / 1000), fetcher: typeof fetch = fetch): Promise<EntitlementStatus> {
  const productId = env.MOVING_OS_PRODUCT_ID || MOVING_OS_PRODUCT_ID;
  const session = await readVerifiedSession(readCookie(request), env.MOVING_OS_SESSION_SECRET, productId);
  const credential = await readEntitlementToken(readCookie(request, ENTITLEMENT_COOKIE), env.ENTITLEMENT_ENCRYPTION_KEY, productId, nowSeconds);
  if (!credential || (session && (session.provider !== credential.provider || session.product !== credential.product || session.licenseHash !== await hashLicenseKey(credential.licenseKey)))) {
    return { active: false, reason: 'invalid_session', nextCheckAt: nowSeconds, clearCookies: true };
  }

  const result = await revalidateLicense(credential.provider, credential.licenseKey, providerConfig(env, productId), fetcher);
  if (result.ok) {
    const refreshed: EntitlementPayload = { ...credential, lastVerifiedAt: nowSeconds };
    const token = await createEntitlementToken(refreshed, env.ENTITLEMENT_ENCRYPTION_KEY);
    if (!token || !env.MOVING_OS_SESSION_SECRET) return { active: false, reason: 'not_configured', nextCheckAt: nowSeconds, clearCookies: true };
    const refreshedSession = await createSessionToken(env.MOVING_OS_SESSION_SECRET, credential.licenseKey, productId, credential.provider, nowSeconds);
    return { active: true, reason: 'verified', nextCheckAt: nowSeconds + REVALIDATION_INTERVAL_SECONDS, setCookies: [sessionCookie(refreshedSession), entitlementCookie(token)] };
  }
  if (resultIsNetworkError(result) && nowSeconds - credential.lastVerifiedAt <= OFFLINE_GRACE_SECONDS) {
    return { active: true, reason: 'provider_unavailable_grace', nextCheckAt: nowSeconds + REVALIDATION_INTERVAL_SECONDS };
  }
  return { active: false, reason: reasonForResult(result), nextCheckAt: nowSeconds, clearCookies: true };
}

export function clearEntitlementCookies(): string[] {
  return [expiredSessionCookie(), expiredEntitlementCookie()];
}

export { ENTITLEMENT_COOKIE };
