import { clearEntitlementCookies, productEntitlementConfig, revalidateProductEntitlement } from '../../../../_lib/entitlement.ts';
import { LAYOUT_VAULT_COOKIE_NAMES, LAYOUT_VAULT_PRODUCT_ID, type LicenseEnv } from '../../../../_lib/moving-os-license.ts';

interface Context { request: Request; env: LicenseEnv }
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'vary': 'Cookie' };

export async function onRequestGet({ request, env }: Context) {
  const config = productEntitlementConfig(env, LAYOUT_VAULT_PRODUCT_ID);
  const status = config ? await revalidateProductEntitlement(request, config) : { active: false, reason: 'not_configured' as const, nextCheckAt: Math.floor(Date.now() / 1000), clearCookies: true };
  const response = new Response(JSON.stringify({ active: status.active, reason: status.reason, nextCheckAt: status.nextCheckAt }), { status: status.active ? 200 : 401, headers });
  status.setCookies?.forEach((cookie) => response.headers.append('set-cookie', cookie));
  if (!status.active) clearEntitlementCookies(config?.cookieNames ?? LAYOUT_VAULT_COOKIE_NAMES).forEach((cookie) => response.headers.append('set-cookie', cookie));
  return response;
}

export function onRequestPost() { return new Response(JSON.stringify({ active: false, code: 'method_not_allowed' }), { status: 405, headers: { ...headers, allow: 'GET' } }); }
