/**
 * Product identities shared by the browser product config and Pages Functions.
 *
 * The `-v1` suffix is intentional: it is the existing RoomFeng entitlement
 * naming convention and keeps PRODUCT-001 provider records backwards
 * compatible. These are product identities, never provider secrets or IDs.
 */
export const PRODUCT_REGISTRY = {
  movingOs: {
    entitlementProductId: 'roomfeng-moving-new-home-os-v1',
    canonicalName: 'roomfeng-moving-new-home-os',
    routePrefix: '/moving-new-home-os/',
  },
  layoutVault: {
    entitlementProductId: 'roomfeng-layout-vault-v1',
    canonicalName: 'roomfeng-small-space-layout-vault',
    routePrefix: '/layout-vault/',
  },
} as const;

export const PRODUCT_IDS = {
  movingOs: PRODUCT_REGISTRY.movingOs.entitlementProductId,
  layoutVault: PRODUCT_REGISTRY.layoutVault.entitlementProductId,
} as const;

export type RoomFengProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];
