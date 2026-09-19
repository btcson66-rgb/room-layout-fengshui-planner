import { clearEntitlementCookies, revalidateEntitlement, revalidationRateLimited } from '../../../_lib/entitlement.ts';
import type { LicenseEnv } from '../../../_lib/moving-os-license.ts';

interface Context { request: Request; env: LicenseEnv }
const baseHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'vary': 'Cookie' };

export async function onRequestGet({ request, env }: Context) {
  if (await revalidationRateLimited(request)) {
    return new Response(JSON.stringify({ active: false, reason: 'rate_limited', nextCheckAt: Math.floor(Date.now() / 1000) + 60 }), { status: 429, headers: baseHeaders });
  }
  const status = await revalidateEntitlement(request, env);
  const response = new Response(JSON.stringify({ active: status.active, reason: status.reason, nextCheckAt: status.nextCheckAt }), { status: status.active ? 200 : 401, headers: baseHeaders });
  status.setCookies?.forEach((cookie) => response.headers.append('set-cookie', cookie));
  if (!status.active) clearEntitlementCookies().forEach((cookie) => response.headers.append('set-cookie', cookie));
  return response;
}

export function onRequestPost() { return new Response(JSON.stringify({ active: false, reason: 'method_not_allowed' }), { status: 405, headers: { ...baseHeaders, allow: 'GET' } }); }
export function onRequestOptions() { return new Response(null, { status: 204, headers: { allow: 'GET, OPTIONS', 'cache-control': 'no-store' } }); }
