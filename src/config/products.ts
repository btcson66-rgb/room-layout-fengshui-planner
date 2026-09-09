export const movingOsProduct = {
  id: 'roomfeng-moving-new-home-os-v1',
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
