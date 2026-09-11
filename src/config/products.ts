import { PRODUCT_IDS } from './product-registry.ts';

export const movingOsProduct = {
  id: PRODUCT_IDS.movingOs,
  name: 'RoomFeng Moving & New Home OS',
  version: '1.0.0',
  schemaVersion: 1,
  releaseDate: import.meta.env.PUBLIC_MOVING_OS_RELEASE_DATE?.trim() ?? '',
  displayPrice: { amount: 12.99, currency: 'USD' },
  providers: {
    payhip: {
      enabled: true,
      checkoutUrl: (import.meta.env.PUBLIC_MOVING_OS_PAYHIP_CHECKOUT_URL || import.meta.env.PUBLIC_MOVING_OS_CHECKOUT_URL)?.trim() ?? '',
      productLink: import.meta.env.PUBLIC_MOVING_OS_PAYHIP_PRODUCT_LINK?.trim() ?? '',
    },
    gumroad: {
      enabled: true,
      checkoutUrl: import.meta.env.PUBLIC_MOVING_OS_GUMROAD_CHECKOUT_URL?.trim() ?? '',
      productId: import.meta.env.PUBLIC_MOVING_OS_GUMROAD_PRODUCT_ID?.trim() ?? '',
    },
  },
  checkoutUrl: (import.meta.env.PUBLIC_MOVING_OS_PAYHIP_CHECKOUT_URL || import.meta.env.PUBLIC_MOVING_OS_CHECKOUT_URL)?.trim() ?? '',
  supportEmail: import.meta.env.PUBLIC_MOVING_OS_SUPPORT_EMAIL?.trim() ?? '',
  refundPolicyUrl: import.meta.env.PUBLIC_MOVING_OS_REFUND_POLICY_URL?.trim() ?? '',
  licenseEnabled: true,
  sessionHours: 24,
  offlineGraceHours: 24,
  previewPackUrl: '/downloads/roomfeng-moving-os-free-preview-v1.0.zip',
} as const;

/** PRODUCT-002 identity only. Entitlement verification remains shared with
 * the existing PRODUCT-001 infrastructure; no second license architecture is
 * introduced in Phase 2. */
export const layoutVaultProduct = {
  id: PRODUCT_IDS.layoutVault,
  name: 'RoomFeng Small Space Layout Vault',
  shortName: 'RoomFeng 小空間格局庫',
  subtitle: 'Validated Bedroom & Studio Layout Matcher',
  subtitleZh: '臥室與套房尺寸配對規劃工具',
  version: '1.0.0',
  schemaVersion: 1,
  price: { amount: 17.99, currency: 'USD' },
  entitlementProduct: PRODUCT_IDS.layoutVault,
  salesPaths: { en: '/en/small-space-layout-vault/', zh: '/zh/small-space-layout-vault/' },
  previewPaths: { en: '/en/room-layout-matcher/', zh: '/zh/room-layout-matcher/' },
  packageDownload: '/downloads/RoomFeng-Small-Space-Layout-Sample-Pack-v1.0.zip',
  providers: {
    payhip: {
      enabled: Boolean(import.meta.env.PUBLIC_LAYOUT_VAULT_PAYHIP_CHECKOUT_URL?.trim()),
      checkoutUrl: import.meta.env.PUBLIC_LAYOUT_VAULT_PAYHIP_CHECKOUT_URL?.trim() ?? '',
      productLink: import.meta.env.PUBLIC_LAYOUT_VAULT_PAYHIP_PRODUCT_LINK?.trim() ?? '',
    },
    gumroad: {
      enabled: Boolean(import.meta.env.PUBLIC_LAYOUT_VAULT_GUMROAD_CHECKOUT_URL?.trim()),
      checkoutUrl: import.meta.env.PUBLIC_LAYOUT_VAULT_GUMROAD_CHECKOUT_URL?.trim() ?? '',
      productId: import.meta.env.PUBLIC_LAYOUT_VAULT_GUMROAD_PRODUCT_ID?.trim() ?? '',
    },
  },
  supportEmail: import.meta.env.PUBLIC_LAYOUT_VAULT_SUPPORT_EMAIL?.trim() ?? '',
  refundPolicyUrl: import.meta.env.PUBLIC_LAYOUT_VAULT_REFUND_POLICY_URL?.trim() ?? '',
  preview: { topMatches: 1, fullMatches: 3 },
} as const;
