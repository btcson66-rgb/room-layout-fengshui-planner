import { clearEntitlementCookies, revalidateEntitlement } from '../../../_lib/entitlement.ts';
import type { LicenseEnv } from '../../../_lib/moving-os-license.ts';
interface Context { request: Request; env: LicenseEnv }
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'vary': 'Cookie' };
export async function onRequestGet({ request, env }: Context) {
  const status = await revalidateEntitlement(request, env);
  const response = new Response(JSON.stringify({ active: status.active, reason: status.reason, nextCheckAt: status.nextCheckAt }), { status: status.active ? 200 : 401, headers });
  status.setCookies?.forEach((cookie) => response.headers.append('set-cookie', cookie));
  if (!status.active) clearEntitlementCookies().forEach((cookie) => response.headers.append('set-cookie', cookie));
  return response;
}
export function onRequestPost() { return new Response(JSON.stringify({ active: false, code: 'method_not_allowed' }), { status: 405, headers: { ...headers, allow: 'GET' } }); }
