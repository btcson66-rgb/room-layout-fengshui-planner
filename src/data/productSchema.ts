import { siteUrl } from './site';

/**
 * Shared builder for every `Product` node RoomFeng publishes.
 *
 * Search Console opened a Merchant listings defect on 2026-09-18: the paid
 * product pages emitted `Product` + `offers` without `image`, so Google
 * classified the listing as invalid and dropped it from the merchant
 * experience entirely. `image` is a *required* property for that experience,
 * which is why the type below makes it impossible to build a Product node
 * without one — `astro check` fails before the page can ship.
 *
 * Deliberately absent: `category`. The pages used to carry free-text values
 * ("Room layout planning software", "房間格局規劃工具") and Search Console
 * reported them as invalid, because Google validates `category` against its
 * own product taxonomy rather than accepting prose. The property is optional
 * and is not a ranking signal, so it is omitted instead of guessed. If a
 * taxonomy value is ever wanted, pass the verified path from
 * https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 * through `category` below — never a hand-written description.
 */

/** Site-relative path (`/assets/...`) or an absolute URL. */
export type ProductImage = string;

/**
 * Only fill this in from terms RoomFeng actually publishes. Google surfaces
 * the values to shoppers, so an invented return window is a false commercial
 * claim, not a way to silence a Search Console warning.
 */
export type ProductReturnPolicy = {
  /** A https://schema.org/MerchantReturnEnumeration value. */
  returnPolicyCategory: string;
  /** ISO 3166-1 alpha-2 country code(s) the policy applies to. */
  applicableCountry: string | string[];
  merchantReturnDays?: number;
  returnMethod?: string;
  returnFees?: string;
  merchantReturnLink?: string;
};

export type ProductOffer = {
  price: string;
  priceCurrency: string;
  /** A https://schema.org/ItemAvailability value. */
  availability: string;
  /** Site-relative path or absolute checkout URL. */
  url: string;
  sellerName?: string;
  priceValidUntil?: string;
  returnPolicy?: ProductReturnPolicy;
};

export type ProductJsonLdInput = {
  name: string;
  description: string;
  sku: string;
  /**
   * At least one image is required. Google recommends shipping the same
   * product in 16:9, 4:3 and 1:1 so it can pick a crop per surface.
   */
  images: readonly [ProductImage, ...ProductImage[]];
  brandName?: string;
  offer: ProductOffer;
  /** Verified Google product taxonomy path only. See the note above. */
  category?: string;
};

const absolute = (value: string): string =>
  /^https?:\/\//i.test(value) ? value : `${siteUrl}${value}`;

const buildReturnPolicy = (policy: ProductReturnPolicy): Record<string, unknown> => ({
  '@type': 'MerchantReturnPolicy',
  returnPolicyCategory: policy.returnPolicyCategory,
  applicableCountry: policy.applicableCountry,
  ...(policy.merchantReturnDays === undefined ? {} : { merchantReturnDays: policy.merchantReturnDays }),
  ...(policy.returnMethod ? { returnMethod: policy.returnMethod } : {}),
  ...(policy.returnFees ? { returnFees: policy.returnFees } : {}),
  ...(policy.merchantReturnLink ? { merchantReturnLink: absolute(policy.merchantReturnLink) } : {}),
});

export function buildProductJsonLd(input: ProductJsonLdInput): Record<string, unknown> {
  const images = input.images.map(absolute);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    sku: input.sku,
    brand: { '@type': 'Brand', name: input.brandName ?? 'RoomFeng' },
    image: images.length === 1 ? images[0] : images,
    ...(input.category ? { category: input.category } : {}),
    offers: {
      '@type': 'Offer',
      price: input.offer.price,
      priceCurrency: input.offer.priceCurrency,
      availability: input.offer.availability,
      url: absolute(input.offer.url),
      ...(input.offer.priceValidUntil ? { priceValidUntil: input.offer.priceValidUntil } : {}),
      ...(input.offer.sellerName ? { seller: { '@type': 'Organization', name: input.offer.sellerName } } : {}),
      ...(input.offer.returnPolicy ? { hasMerchantReturnPolicy: buildReturnPolicy(input.offer.returnPolicy) } : {}),
    },
  };
}
