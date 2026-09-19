export interface PayhipLicenseData { enabled: boolean; product_link: string; license_key?: string; buyer_email?: string; uses: number; product_name?: string }
export type ProviderResult = { ok: true; data: PayhipLicenseData } | { ok: false; code: 'invalid_license' | 'disabled_license' | 'network_error' };

function validLicenseData(value: unknown): value is PayhipLicenseData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.enabled === 'boolean' && typeof data.product_link === 'string' && typeof data.uses === 'number' && Number.isInteger(data.uses) && data.uses >= 0;
}

export async function verifyPayhipLicense(licenseKey: string, productSecret: string, expectedProductLink: string, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  const verifyUrl = new URL('https://payhip.com/api/v2/license/verify');
  verifyUrl.searchParams.set('license_key', licenseKey);
  let response: Response;
  try { response = await fetcher(verifyUrl, { method: 'GET', headers: { accept: 'application/json', 'product-secret-key': productSecret } }); }
  catch { return { ok: false, code: 'network_error' }; }
  if (!response.ok) return { ok: false, code: response.status >= 500 ? 'network_error' : 'invalid_license' };
  let body: unknown;
  try { body = await response.json(); } catch { return { ok: false, code: 'network_error' }; }
  const data = (body as { data?: unknown })?.data;
  if (!validLicenseData(data) || data.product_link !== expectedProductLink) return { ok: false, code: 'invalid_license' };
  if (!data.enabled) return { ok: false, code: 'disabled_license' };
  return { ok: true, data };
}

/** v1 activation verifies entitlement only; provider usage is diagnostic metadata. */
export async function verifyAndActivatePayhipLicense(licenseKey: string, productSecret: string, expectedProductLink: string, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  return verifyPayhipLicense(licenseKey, productSecret, expectedProductLink, fetcher);
}
