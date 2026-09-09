# RoomFeng Moving OS commercial launch configuration

Status: staging candidate only. Production launch remains blocked until both marketplace products are configured and a real buyer E2E passes on each provider.

## Architecture

`RoomFeng sales page → Payhip or Gumroad checkout → provider receipt/download/license → unified activation page → Cloudflare Pages Function → provider adapter → signed HttpOnly session → protected app route`

Payhip is the primary CTA and Gumroad is the secondary CTA. Both listings use the same master ZIP, name, version, USD 12.99 price, support URL, and refund policy. The activation form requires an explicit provider selection; the server never guesses from key format. `product_checkout_click` includes only provider, shared product id, locale, and placement. MovingProject data stays in browser storage. The license endpoint accepts only `{ provider, product, licenseKey }` and never accepts or logs addresses, dates, room measurements, furniture, budgets, shopping lists, notes, buyer email, or a full key.

## Public build variables

- `PUBLIC_MOVING_OS_PAYHIP_CHECKOUT_URL`: exact Payhip direct checkout URL.
- `PUBLIC_MOVING_OS_GUMROAD_CHECKOUT_URL`: exact Gumroad direct checkout URL.
- `PUBLIC_MOVING_OS_PAYHIP_PRODUCT_LINK`: real Payhip product key used only as public metadata; never invent it.
- `PUBLIC_MOVING_OS_GUMROAD_PRODUCT_ID`: real Gumroad product ID used only as public metadata; never invent it.
- `PUBLIC_MOVING_OS_SUPPORT_EMAIL`: owner-approved support email.
- `PUBLIC_MOVING_OS_REFUND_POLICY_URL`: owner-approved policy URL.
- `PUBLIC_MOVING_OS_RELEASE_DATE`: set to the actual production release date only when approved.

## Runtime encrypted secrets

Configure these separately for Cloudflare Preview and Production under Pages → Settings → Variables and Secrets. Mark each as encrypted:

- `PAYHIP_PRODUCT_SECRET`: per-product secret from the Payhip product edit page.
- `PAYHIP_PRODUCT_LINK`: real product key expected in the Payhip verification response.
- `GUMROAD_PRODUCT_ID`: real Gumroad product ID used by the official `POST https://api.gumroad.com/v2/licenses/verify` adapter.
- `MOVING_OS_PRODUCT_ID`: optional shared product id; defaults to `roomfeng-moving-new-home-os-v1`.
- `MOVING_OS_SESSION_SECRET`: independently generated random value of at least 32 characters.
- `ENTITLEMENT_ENCRYPTION_KEY`: independently generated 256-bit random key encoded as base64url; used only by the server to encrypt the HttpOnly entitlement credential.

Never give these variables a `PUBLIC_` prefix. Never add them to `.env.example` with values, build logs, screenshots, tickets, analytics, or repository files. Local development values belong only in ignored `.dev.vars` files.

## Dual marketplace owner checklist

- Digital Product named “RoomFeng Moving & New Home OS”.
- Price USD 12.99 for v1 launch.
- Upload `RoomFeng-Moving-New-Home-OS-v1.0.zip`.
- Enable unique license keys and copy the real product link/secret into the appropriate Cloudflare environment.
- Add the product image, description, category, support email, buyer receipt text, and owner-approved refund-policy link.
- Use the default five-download limit unless the owner explicitly changes it. Record how support resets download credits.
- Keep PDF stamping off for v1 unless a printed proof confirms it does not cover writing areas. Payhip stamping adds buyer email and purchase date to portrait PDFs.
- Create one private/test product or 100% coupon on each provider. Do not publish either listing until the buyer E2E below passes.
- Upload the same master ZIP and previews to both providers; record the SHA-256 from the artifact verifier.
- After every v1.x product update, replace the provider file so new buyers receive it and existing buyers can re-download it. Do not promise lifetime updates.

## Provider listing runbook

Use these exact values after the Payhip account and policy owner are available. Do not publish the product until the buyer E2E below passes.

- Product type: Digital Product
- Product name: `RoomFeng Moving & New Home OS`
- Price: `USD 12.99`
- Product file: `product-output/RoomFeng-Moving-New-Home-OS-v1.0.zip`
- Cover image: `07-Preview-Images/preview-01-hero.png`
- Gallery order: previews 02 through 10 in numeric order
- Visibility during QA: private/unlisted or draft on each provider
- License keys: enabled, automatically generated
- Download limit: 5
- PDF stamping: off for v1

Short description:

> Avoid expensive moving mistakes before moving day. Plan the route, check furniture fit, compare what to buy, control the budget, track boxes, and know what happens next—without sending your moving project to the cloud.

Product description:

> Know what fits. Know what to move. Know what to buy. Know what happens next.
>
> RoomFeng Moving & New Home OS combines a private browser-based planning app, a nine-sheet Excel workbook, printable A4 and US Letter planners, example data, backup tools, and bilingual quick-start guides. Measure the complete route from the old-home exit to the destination room, review furniture decisions with reasons, organize the timeline, budget, shopping comparisons, boxes, move day, and first night.
>
> Your addresses, rooms, furniture, budget, boxes, and notes stay in your browser. Internet access is required for license activation. This is a preliminary planning and measurement tool; verify critical dimensions on site and with your mover.

Receipt / post-purchase message:

> Thank you for purchasing RoomFeng Moving & New Home OS. Download the ZIP and keep your license key from this purchase information. Start with the Quick Start folder, choose Payhip or Gumroad on the RoomFeng activation page, then activate the online app from the stable URL shown in the ZIP. If activation fails, check the key and your connection, retry once, then contact the support address shown on the RoomFeng sales page. Do not share the ZIP or license key.

Category and refund policy are intentionally not prescribed here; select the closest current Payhip category and use only the owner-approved refund-policy URL and text.

## Mandatory buyer E2E worksheet

Record provider order identifiers only in the private Vault evidence, never in the repository. Never record the full license key or buyer email.

| Step | Required evidence | Result |
|---|---|---|
| Fresh profile opens RoomFeng sales page | Screenshot and URL | PENDING |
| Checkout CTA opens exact provider checkout | URL readback | PENDING |
| 100% coupon/test purchase completes | Payhip order readback | PENDING |
| Receipt/purchase information arrives | Receipt readback | PENDING |
| Product ZIP downloads and hash matches | SHA-256 comparison | PENDING |
| License key is present | Masked key only | PENDING |
| First activation opens app | Session/app readback | PENDING |
| Project survives reload | UI readback | PENDING |
| Second clean profile activates | Provider verify/session readback; usage is diagnostic only | PENDING |
| Product downloads a second time | Download readback | PENDING |
| Invalid key is rejected | User-facing error | PENDING |
| Disabled/refunded/disputed key is rejected after refresh | Provider status and activation error | PENDING |
| Existing local project remains after refund denial | Local UI readback | PENDING |
| Download-credit reset procedure works | Support/admin readback | PENDING |

## Session and device policy

- Payhip activation and entitlement revalidation call only the official verify endpoint; the Payhip usage endpoint is not used by v1.0.
- All Gumroad verification calls use `increment_uses_count=false`, including activation and revalidation. Provider `uses` is retained as server-side diagnostic metadata only; v1.0 does not enforce a device or usage limit.
- The short-lived session is HMAC-signed, HttpOnly, Secure, SameSite=Lax, and valid for 24 hours. The provider credential is a separate AES-GCM authenticated-encrypted HttpOnly cookie; it contains only the minimum revalidation fields and is never readable by frontend JavaScript.
- Protected app entry and the status endpoint revalidate the provider state. The app performs a silent status check every 15 minutes. Online requests always use the network first.
- Refunded, disputed, chargebacked, or disabled provider licenses fail immediately; a provider outage may use at most 24 hours of grace from the last successful verification. Local project data is never deleted.
- Without a database, a cleared cookie/new browser creates a new local session on the same physical device. v1.0 does not convert that event into a provider usage or device-limit decision; a future device policy requires a separate device registry and recovery workflow.

## Provider evidence

- Payhip v2 license API: https://payhip.com/api-reference/license-keys
- Payhip digital product setup and 100% coupon test: https://help.payhip.com/article/59-adding-a-digital-product
- Payhip download limits and PDF stamping: https://help.payhip.com/article/79-protecting-your-products
- Gumroad license keys: https://gumroad.com/help/article/76-license-keys
- Gumroad purchase access: https://gumroad.com/help/article/199/how-do-i-access-my-purchase
- Cloudflare Pages Functions secrets: https://developers.cloudflare.com/pages/functions/bindings/#secrets
- Cloudflare Pages middleware: https://developers.cloudflare.com/pages/functions/middleware/

## Webhook decision

No webhook is included in v1. Payhip's current public API documentation covers coupons and license keys, while the dashboard remains the provider-confirmed source for actual sales/refunds. Checkout clicks and provider-confirmed purchases must remain separate metrics. Add a webhook only after its signing/validation contract is verified from current official documentation.
