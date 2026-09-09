import type { LicenseProvider } from './moving-os-license.ts';

export interface GumroadLicenseData {
  productId: string;
  uses: number;
  refunded: boolean;
  disputed: boolean;
  chargebacked: boolean;
}

export type GumroadResult = { ok: true; provider: LicenseProvider; data: GumroadLicenseData } | { ok: false; code: 'invalid_license' | 'disabled_license' | 'network_error' };

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === 'object'); }

export async function verifyGumroadLicense(licenseKey: string, productId: string, fetcher: typeof fetch = fetch): Promise<GumroadResult> {
  if (!productId) return { ok: false, code: 'invalid_license' };
  const body = new URLSearchParams({ product_id: productId, license_key: licenseKey, increment_uses_count: 'false' });
  let response: Response;
  try {
    response = await fetcher('https://api.gumroad.com/v2/licenses/verify', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  } catch { return { ok: false, code: 'network_error' }; }
  if (!response.ok) return { ok: false, code: response.status >= 500 ? 'network_error' : 'invalid_license' };
  let raw: unknown;
  try { raw = await response.json(); } catch { return { ok: false, code: 'network_error' }; }
  if (!isRecord(raw) || raw.success !== true || !isRecord(raw.purchase)) return { ok: false, code: 'invalid_license' };
  const purchase = raw.purchase;
  const returnedProductId = String(purchase.product_id ?? '');
  const uses = Number(raw.uses);
  if (returnedProductId !== productId || !Number.isInteger(uses) || uses < 0) return { ok: false, code: 'invalid_license' };
  const refunded = purchase.refunded === true;
  const disputed = purchase.disputed === true;
  const chargebacked = purchase.chargebacked === true;
  if (refunded || disputed || chargebacked) return { ok: false, code: 'disabled_license' };
  return { ok: true, provider: 'gumroad', data: { productId: returnedProductId, uses, refunded, disputed, chargebacked } };
}

export const verifyAndActivateGumroadLicense = verifyGumroadLicense;
