import { createEntitlementToken, createSessionToken, entitlementCookie, ENTITLEMENT_TTL_SECONDS, MAX_REQUEST_BYTES, maskedLicenseKey, normalizeLicenseKey, sameOriginRequest, sessionCookie, type LicenseEnv, type LicenseProvider, type EntitlementPayload } from './moving-os-license.ts';
import { productEntitlementConfig } from './entitlement.ts';
import { verifyAndActivateLicense } from './license-provider.ts';

const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...headers } });
}

async function rateLimited(request: Request, productId: string): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return false;
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${productId}:${ip}`));
    const id = Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const key = new Request(`https://roomfeng-license-rate-limit.invalid/${id}`);
    const hit = await cache.match(key); const count = hit ? Number(await hit.text()) || 0 : 0;
    if (count >= RATE_LIMIT_MAX) return true;
    await cache.put(key, new Response(String(count + 1), { headers: { 'cache-control': `max-age=${RATE_LIMIT_WINDOW_SECONDS}` } }));
  } catch { /* soft rate limiter: provider and origin validation remain active */ }
  return false;
}

interface Context { request: Request; env: LicenseEnv }

/** Shared activation path for every RoomFeng product. The route supplies the
 * server-side product identity; the client value is only a consistency check. */
export async function activateProductLicense({ request, env }: Context, productId: string): Promise<Response> {
  if (!sameOriginRequest(request)) return json({ ok: false, code: 'forbidden_origin' }, 403);
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) return json({ ok: false, code: 'invalid_payload' }, 413);
  const config = productEntitlementConfig(env, productId);
  if (!config?.sessionSecret || config.sessionSecret.length < 32 || !config.encryptionKey) return json({ ok: false, code: 'not_configured' }, 503);
  if (await rateLimited(request, productId)) return json({ ok: false, code: 'rate_limited' }, 429);
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
  const result = await verifyAndActivateLicense(provider as LicenseProvider, licenseKey, config.providerConfig);
  if (!result.ok) {
    console.warn(JSON.stringify({ event: 'license_activation_error', product: productId, category: result.code, key: maskedLicenseKey(licenseKey), timestamp: new Date().toISOString() }));
    const status = result.code === 'disabled_license' ? 403 : result.code === 'network_error' ? 503 : 401;
    return json({ ok: false, code: result.code }, status);
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const typedProvider = provider as LicenseProvider;
  const session = await createSessionToken(config.sessionSecret, licenseKey, productId, typedProvider, nowSeconds);
  const entitlement: EntitlementPayload = { v: 1, product: productId, provider: typedProvider, providerProductIdentity: result.providerProductIdentity, licenseKey, issuedAt: nowSeconds, lastVerifiedAt: nowSeconds, expiresAt: nowSeconds + ENTITLEMENT_TTL_SECONDS };
  const token = await createEntitlementToken(entitlement, config.encryptionKey);
  if (!token) return json({ ok: false, code: 'not_configured' }, 503);
  const response = json({ ok: true, expiresIn: 24 * 60 * 60 }, 200, { 'set-cookie': sessionCookie(session, config.cookieNames) });
  response.headers.append('set-cookie', entitlementCookie(token, config.cookieNames));
  return response;
}

export function methodNotAllowed(allow: string) {
  return json({ ok: false, code: 'method_not_allowed' }, 405, { allow });
}

export function optionsResponse(allow: string) {
  return new Response(null, { status: 204, headers: { allow, 'cache-control': 'no-store' } });
}
