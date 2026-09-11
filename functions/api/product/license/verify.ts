import { activateProductLicense, methodNotAllowed, optionsResponse } from '../../../_lib/activation.ts';
import { MOVING_OS_PRODUCT_ID, type LicenseEnv } from '../../../_lib/moving-os-license.ts';

interface Context { request: Request; env: LicenseEnv }

export async function onRequestPost({ request, env }: Context) {
  return activateProductLicense({ request, env }, env.MOVING_OS_PRODUCT_ID || MOVING_OS_PRODUCT_ID);
}

export function onRequestOptions() { return optionsResponse('POST, OPTIONS'); }
export function onRequestGet() { return methodNotAllowed('POST, OPTIONS'); }
