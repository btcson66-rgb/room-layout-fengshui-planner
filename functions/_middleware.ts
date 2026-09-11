import { type LicenseEnv } from './_lib/moving-os-license.ts';
import { clearEntitlementCookies, productEntitlementConfig, revalidateEntitlement, revalidateProductEntitlement } from './_lib/entitlement.ts';
import { LAYOUT_VAULT_COOKIE_NAMES, LAYOUT_VAULT_PRODUCT_ID } from './_lib/moving-os-license.ts';
interface Context { request: Request; env: LicenseEnv; next: () => Promise<Response> }
const protectedPath = /^\/(en|zh)\/moving-new-home-os\/app\/?(?:index\.html)?$/;
const layoutVaultPath = /^\/(en|zh)\/layout-vault\/?$/;

export async function onRequest({ request, env, next }: Context): Promise<Response> {
  const url = new URL(request.url); const match = url.pathname.match(protectedPath);
  if (match) {
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
  const layoutMatch = url.pathname.match(layoutVaultPath);
  if (!layoutMatch) return next();
  // The local Astro dev server is the only supported development bypass. A
  // Pages environment must opt in explicitly and can never use it in prod.
  if (env.ROOMFENG_LAYOUT_VAULT_DEV_BYPASS === 'true' && env.ENVIRONMENT !== 'production') return next();
  const config = productEntitlementConfig(env, LAYOUT_VAULT_PRODUCT_ID);
  const status = config ? await revalidateProductEntitlement(request, config) : { active: false, reason: 'not_configured' as const, nextCheckAt: Math.floor(Date.now() / 1000), clearCookies: true };
  if (status.active) {
    const response = await next();
    status.setCookies?.forEach((cookie) => response.headers.append('set-cookie', cookie));
    return response;
  }
  const locale = layoutMatch[1];
  const location = `/${locale}/layout-vault/activate/?next=${encodeURIComponent(url.pathname)}`;
  const headers = new Headers({ location, 'cache-control': 'no-store', 'vary': 'Cookie' });
  clearEntitlementCookies(config?.cookieNames ?? LAYOUT_VAULT_COOKIE_NAMES).forEach((cookie) => headers.append('set-cookie', cookie));
  return new Response(null, { status: 302, headers });
}
