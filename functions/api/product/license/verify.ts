import { createEntitlementToken, createSessionToken, entitlementCookie, ENTITLEMENT_TTL_SECONDS, MOVING_OS_PRODUCT_ID, type LicenseEnv, type LicenseProvider, maskedLicenseKey, MAX_REQUEST_BYTES, normalizeLicenseKey, sameOriginRequest, sessionCookie, type EntitlementPayload } from '../../../_lib/moving-os-license.ts';
import { verifyAndActivateLicense } from '../../../_lib/license-provider.ts';

interface Context { request: Request; env: LicenseEnv }
const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) { return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...headers } }); }

async function rateLimited(request: Request): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return false;
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const id = Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const key = new Request(`https://moving-os-rate-limit.invalid/${id}`);
    const hit = await cache.match(key); const count = hit ? Number(await hit.text()) || 0 : 0;
    if (count >= RATE_LIMIT_MAX) return true;
    await cache.put(key, new Response(String(count + 1), { headers: { 'cache-control': `max-age=${RATE_LIMIT_WINDOW_SECONDS}` } }));
  } catch { /* soft rate limiter: provider and origin validation remain active */ }
  return false;
}

export async function onRequestPost({ request, env }: Context) {
  if (!sameOriginRequest(request)) return json({ ok: false, code: 'forbidden_origin' }, 403);
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) return json({ ok: false, code: 'invalid_payload' }, 413);
  const productId = env.MOVING_OS_PRODUCT_ID || MOVING_OS_PRODUCT_ID;
  if (!env.MOVING_OS_SESSION_SECRET || env.MOVING_OS_SESSION_SECRET.length < 32 || !env.ENTITLEMENT_ENCRYPTION_KEY) return json({ ok: false, code: 'not_configured' }, 503);
  if (await rateLimited(request)) return json({ ok: false, code: 'rate_limited' }, 429);
  let raw: string;
  try { raw = await request.text(); } catch { return json({ ok: false, code: 'invalid_payload' }, 400); }
  if (new TextEncoder().encode(raw).length > MAX_REQUEST_BYTES) return json({ ok: false, code: 'invalid_payload' }, 413);
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return json({ ok: false, code: 'invalid_payload' }, 400); }
  const body = payload as { provider?: unknown; product?: unknown; licenseKey?: unknown };
  const provider = body?.provider;
  if (provider !== 'payhip' && provider !== 'gumroad') return json({ ok: false, code: 'invalid_provider' }, 400);
  if (body?.product !== productId) return json({ ok: false, code: 'invalid_product' }, 400);
  const licenseKey = normalizeLicenseKey(body?.licenseKey);
  if (!licenseKey) return json({ ok: false, code: 'invalid_license' }, 400);
  const result = await verifyAndActivateLicense(provider as LicenseProvider, licenseKey, {
    productId,
    payhip: env.PAYHIP_PRODUCT_SECRET && env.PAYHIP_PRODUCT_LINK ? { productSecret: env.PAYHIP_PRODUCT_SECRET, productLink: env.PAYHIP_PRODUCT_LINK } : undefined,
    gumroad: env.GUMROAD_PRODUCT_ID ? { productId: env.GUMROAD_PRODUCT_ID } : undefined,
  });
  if (!result.ok) {
    console.warn(JSON.stringify({ event: 'moving_os_activation_error', category: result.code, key: maskedLicenseKey(licenseKey), timestamp: new Date().toISOString() }));
    const status = result.code === 'disabled_license' ? 403 : result.code === 'network_error' ? 503 : 401;
    return json({ ok: false, code: result.code }, status);
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = await createSessionToken(env.MOVING_OS_SESSION_SECRET, licenseKey, productId, provider as LicenseProvider, nowSeconds);
  const entitlement: EntitlementPayload = { v: 1, product: productId, provider: provider as LicenseProvider, licenseKey, issuedAt: nowSeconds, lastVerifiedAt: nowSeconds, expiresAt: nowSeconds + ENTITLEMENT_TTL_SECONDS };
  const entitlementToken = await createEntitlementToken(entitlement, env.ENTITLEMENT_ENCRYPTION_KEY);
  if (!entitlementToken) return json({ ok: false, code: 'not_configured' }, 503);
  const response = json({ ok: true, expiresIn: 24 * 60 * 60 }, 200, { 'set-cookie': sessionCookie(token) });
  response.headers.append('set-cookie', entitlementCookie(entitlementToken));
  return response;
}

export function onRequestOptions() { return new Response(null, { status: 204, headers: { allow: 'POST, OPTIONS', 'cache-control': 'no-store' } }); }
export function onRequestGet() { return json({ ok: false, code: 'method_not_allowed' }, 405, { allow: 'POST, OPTIONS' }); }
