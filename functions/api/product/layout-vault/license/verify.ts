import { activateProductLicense, methodNotAllowed, optionsResponse } from '../../../../_lib/activation.ts';
import { LAYOUT_VAULT_PRODUCT_ID, type LicenseEnv } from '../../../../_lib/moving-os-license.ts';

interface Context { request: Request; env: LicenseEnv }

export function onRequestPost({ request, env }: Context) {
  return activateProductLicense({ request, env }, LAYOUT_VAULT_PRODUCT_ID);
}

export function onRequestOptions() { return optionsResponse('POST, OPTIONS'); }
export function onRequestGet() { return methodNotAllowed('POST, OPTIONS'); }
