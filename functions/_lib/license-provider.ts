import { verifyGumroadLicense, type GumroadResult } from './gumroad.ts';
import type { LicenseProvider } from './moving-os-license.ts';
import { verifyAndActivatePayhipLicense, verifyPayhipLicense, type ProviderResult as PayhipResult } from './payhip.ts';

export type NormalizedLicenseResult =
  | { ok: true; provider: LicenseProvider; providerProductIdentity: string; purchaseActive: true; refunded: false; disputed: false; uses: number }
  | { ok: false; provider: LicenseProvider; code: 'invalid_license' | 'disabled_license' | 'network_error' };

export interface ProviderConfig {
  productId: string;
  payhip?: { productSecret: string; productLink: string };
  gumroad?: { productId: string };
}

function normalize(provider: LicenseProvider, result: PayhipResult | GumroadResult): NormalizedLicenseResult {
  if (!result.ok) return { ok: false, provider, code: result.code };
  const providerProductIdentity = provider === 'payhip'
    ? (result as Extract<PayhipResult, { ok: true }>).data.product_link
    : (result as Extract<GumroadResult, { ok: true }>).data.productId;
  return { ok: true, provider, providerProductIdentity, purchaseActive: true, refunded: false, disputed: false, uses: result.data.uses };
}

export async function verifyAndActivateLicense(provider: LicenseProvider, licenseKey: string, config: ProviderConfig, fetcher: typeof fetch = fetch): Promise<NormalizedLicenseResult> {
  if (provider === 'payhip') {
    if (!config.payhip) return { ok: false, provider, code: 'network_error' };
    return normalize(provider, await verifyAndActivatePayhipLicense(licenseKey, config.payhip.productSecret, config.payhip.productLink, fetcher));
  }
  if (!config.gumroad) return { ok: false, provider, code: 'network_error' };
  return normalize(provider, await verifyGumroadLicense(licenseKey, config.gumroad.productId, fetcher));
}

export async function revalidateLicense(provider: LicenseProvider, licenseKey: string, config: ProviderConfig, fetcher: typeof fetch = fetch): Promise<NormalizedLicenseResult> {
  if (provider === 'payhip') {
    if (!config.payhip) return { ok: false, provider, code: 'network_error' };
    return normalize(provider, await verifyPayhipLicense(licenseKey, config.payhip.productSecret, config.payhip.productLink, fetcher));
  }
  if (!config.gumroad) return { ok: false, provider, code: 'network_error' };
  return normalize(provider, await verifyGumroadLicense(licenseKey, config.gumroad.productId, fetcher));
}
