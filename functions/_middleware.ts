import { type LicenseEnv } from './_lib/moving-os-license.ts';
import { clearEntitlementCookies, revalidateEntitlement } from './_lib/entitlement.ts';
interface Context { request: Request; env: LicenseEnv; next: () => Promise<Response> }
const protectedPath = /^\/(en|zh)\/moving-new-home-os\/app\/?(?:index\.html)?$/;

export async function onRequest({ request, env, next }: Context): Promise<Response> {
  const url = new URL(request.url); const match = url.pathname.match(protectedPath);
  if (!match) return next();
  const status = await revalidateEntitlement(request, env);
  if (status.active) {
    const response = await next();
    status.setCookies?.forEach((cookie) => response.headers.append('set-cookie', cookie));
    return response;
  }
  const locale = match[1];
  const location = `/${locale}/moving-new-home-os/activate/?next=${encodeURIComponent(url.pathname)}`;
  const headers = new Headers({ location, 'cache-control': 'no-store', 'vary': 'Cookie' });
  clearEntitlementCookies().forEach((cookie) => headers.append('set-cookie', cookie));
  return new Response(null, { status: 302, headers });
}
