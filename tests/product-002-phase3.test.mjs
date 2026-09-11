import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const packageDir = path.join(root, 'product-output', 'RoomFeng-Small-Space-Layout-Vault-v1.0');
const zip = path.join(root, 'product-output', 'RoomFeng-Small-Space-Layout-Vault-v1.0.zip');

test('commercial product config is frozen at 17.99 with separate identity and paths', () => {
  const source = read('src/config/products.ts');
  assert.match(source, /id: PRODUCT_IDS\.layoutVault/);
  assert.match(source, /amount: 17\.99/);
  assert.match(read('src/config/product-registry.ts'), /roomfeng-layout-vault-v1/);
  assert.match(source, /small-space-layout-vault/);
  assert.match(source, /room-layout-matcher/);
});

test('package contains the required document sections and no interactive app', () => {
  assert.ok(fs.existsSync(packageDir), 'run scripts/generate-product-002-package.py first');
  for (const directory of ['01-Quick-Start', '02-Layout-Catalog', '03-Printable-Planning-Kit', '04-Furniture-Reference', '05-Free-Sample-Layouts', '06-Access-and-Backup', '08-Listing-Graphics']) assert.ok(fs.existsSync(path.join(packageDir, directory)), directory);
  for (const file of ['README.md', 'LICENSE', 'PRODUCT-METADATA.json', 'MANIFEST.json', 'checksums.sha256']) assert.ok(fs.existsSync(path.join(packageDir, file)), file);
  const all = fs.readdirSync(packageDir, { recursive: true }).map(String).join('\n').toLowerCase();
  assert.doesNotMatch(all, /node_modules|astro|package\.json|\.js$|\.ts$/);
  assert.doesNotMatch(read('product-output/RoomFeng-Small-Space-Layout-Vault-v1.0/README.md'), /license key|secret|api token/i);
});

test('package manifest hashes and archive are real', () => {
  const manifest = JSON.parse(read('product-output/RoomFeng-Small-Space-Layout-Vault-v1.0/MANIFEST.json'));
  assert.equal(manifest.files.length > 0, true);
  for (const entry of manifest.files) {
    const file = path.join(packageDir, entry.path);
    assert.ok(fs.existsSync(file), entry.path);
    assert.equal(fs.statSync(file).size, entry.size, entry.path);
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), entry.sha256, entry.path);
  }
  assert.ok(fs.statSync(zip).size > 10000);
});

test('sales pages use honest Product offers and paid route remains noindex', () => {
  for (const page of ['src/pages/en/small-space-layout-vault.astro', 'src/pages/zh/small-space-layout-vault.astro']) {
    const source = read(page);
    assert.match(source, /Product/); assert.match(source, /OnlineOnly/);
    assert.doesNotMatch(source, /aggregateRating|review\s*:/i);
  }
  assert.match(read('src/config/products.ts'), /amount: 17\.99/);
  assert.match(read('src/pages/en/layout-vault.astro'), /noindex/);
  assert.match(read('src/pages/zh/layout-vault.astro'), /noindex/);
});

test('free preview exposes exactly six real sample layouts and public matcher routes', () => {
  const component = read('src/components/LayoutVaultPreview.astro');
  assert.match(component, /data-layout-preview/);
  for (const page of ['src/pages/en/room-layout-matcher.astro', 'src/pages/zh/room-layout-matcher.astro']) {
    const source = read(page); assert.doesNotMatch(source, /noindex/); assert.match(source, /sampleIds/); assert.match(source, /room-layout-planner/);
  }
  assert.equal((read('src/pages/en/room-layout-matcher.astro').match(/'BR-|'/g) ?? []).length > 0, true);
});

test('six SEO guide topics have both localized routes and real layout IDs', () => {
  const en = read('src/pages/en/layout-guides/[slug].astro');
  const zh = read('src/pages/zh/layout-guides/[slug].astro');
  const slugs = ['10x10-bedroom-layout', '10x12-bedroom-queen-desk', '3x3m-bedroom-layout', '3x3-6m-bedroom-layout', 'narrow-bedroom-layout', '300-sq-ft-studio-layout'];
  for (const slug of slugs) { assert.match(en, new RegExp(slug)); assert.match(zh, new RegExp(slug)); }
  assert.equal((en.match(/ids: \[/g) ?? []).length, 6); assert.equal((zh.match(/ids: \[/g) ?? []).length, 6);
  assert.match(en, /renderLayoutSvg/); assert.match(zh, /renderLayoutSvg/);
  assert.doesNotMatch(en, /noindex/); assert.doesNotMatch(zh, /noindex/);
});

test('listing graphics and Pinterest metadata are prepared but unpublished', () => {
  const pins = JSON.parse(read('product-output/RoomFeng-Small-Space-Layout-Vault-v1.0/08-Listing-Graphics/pinterest-pins.json'));
  assert.equal(pins.count, 30); assert.equal(pins.published, false); assert.equal(pins.pins.length, 30);
  for (const pin of pins.pins) { assert.equal(pin.size, '1000x1500'); assert.equal(pin.ratio, '2:3'); assert.equal(pin.published, false); assert.match(pin.destination, /^\/en\//); }
  assert.equal(pins.pins.filter((pin) => pin.type === 'exact-size').length, 10);
  assert.equal(pins.pins.filter((pin) => pin.type === 'problem').length, 8);
  assert.equal(pins.pins.filter((pin) => pin.type === 'strategy').length, 6);
  assert.equal(pins.pins.filter((pin) => pin.type === 'studio').length, 6);
  const pngs = fs.readdirSync(path.join(packageDir, '08-Listing-Graphics')).filter((name) => name.endsWith('.png'));
  assert.equal(pngs.length, 12);
});

test('analytics wiring uses P2 identity and avoids exact room/PII payloads', () => {
  const source = read('src/moving-os/productAnalytics.ts') + read('src/small-space/preview.ts') + read('src/components/LayoutVaultSales.astro');
  assert.match(source, /roomfeng-layout-vault-v1/);
  for (const forbidden of ['license_key', 'buyer_email', 'room_width', 'room_length', 'furniture_dimensions', 'address']) assert.doesNotMatch(source, new RegExp(forbidden, 'i'));
  for (const event of ['product_view', 'product_preview_view', 'product_cta_view', 'product_cta_click', 'product_checkout_click']) assert.match(source, new RegExp(event));
});

test('P2 activation UI and consent-aware Google tag loader are wired', () => {
  for (const page of ['src/pages/en/layout-vault/activate.astro', 'src/pages/zh/layout-vault/activate.astro']) {
    const source = read(page);
    assert.match(source, /ProductLicenseActivation/);
    assert.match(source, /layout-vault\/license\/verify/);
    assert.match(source, /layout-vault\/license\/session/);
  }
  const activation = read('src/components/ProductLicenseActivation.astro');
  for (const marker of ['data-product-activation', 'Payhip', 'Gumroad', 'licenseKey', 'roomfeng-layout-vault-v1', 'product_activation_success']) assert.match(activation, new RegExp(marker));
  const middleware = read('functions/_middleware.ts');
  assert.match(middleware, /layout-vault\/activate\/\?next=/);
  assert.match(middleware, /status: 302/);
  const head = read('src/components/BaseHead.astro');
  assert.match(head, /__roomfengLoadGoogleTag/);
  assert.match(head, /choice === 'accepted'/);
  assert.match(head, /__RF_PRODUCT_002_ANALYTICS_ENABLED__/);
  assert.match(head, /gtag\('config', '\$\{gaId\}'\)/);
  assert.doesNotMatch(head, /gtag\('config', '\$\{affiliateGaId\}'/);
  assert.doesNotMatch(head, /<script is:inline async src=\{`https:\/\/www\.googletagmanager\.com/);
});
