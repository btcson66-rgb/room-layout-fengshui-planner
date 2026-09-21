import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const walk = (directory, extension) => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, extension));
    else if (entry.name.endsWith(extension)) files.push(full);
  }
  return files;
};

const SCHEMA_MODULE = 'src/data/productSchema.ts';

// Search Console opened a Merchant listings defect on 2026-09-18: four paid
// landing pages each hand-wrote their own `Product` JSON-LD and every one of
// them shipped without `image`, which makes the listing invalid. The fix routes
// every Product node through one builder, so the rule worth enforcing is that
// nobody hand-writes one again.
test('沒有任何頁面自己手寫 Product JSON-LD，一律走 buildProductJsonLd', () => {
  const sources = [
    ...walk(path.join(root, 'src', 'pages'), '.astro'),
    ...walk(path.join(root, 'src', 'components'), '.astro'),
  ];
  const offenders = sources.filter((file) => /['"]@type['"]\s*:\s*['"]Product['"]/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(
    offenders.map((file) => path.relative(root, file)),
    [],
    `Product JSON-LD must come from ${SCHEMA_MODULE}, which cannot omit \`image\``,
  );
});

test('每個 buildProductJsonLd 呼叫點都帶 images 與 sku', () => {
  const sources = [
    ...walk(path.join(root, 'src', 'pages'), '.astro'),
    ...walk(path.join(root, 'src', 'components'), '.astro'),
  ];
  const callsites = sources.flatMap((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return (source.match(/buildProductJsonLd\(\{[\s\S]*?\n  \}\)/g) ?? []).map((callsite) => ({
      file: path.relative(root, file),
      callsite,
    }));
  });
  assert.ok(callsites.length >= 5, `expected every paid landing page to build a Product node, found ${callsites.length}`);
  for (const { file, callsite } of callsites) {
    assert.match(callsite, /\bimages:/, `${file}: Product JSON-LD must name its images`);
    assert.match(callsite, /\bsku:/, `${file}: Product JSON-LD must name its sku`);
    assert.doesNotMatch(callsite, /\bcategory:\s*['"`]/, `${file}: category must be a verified Google taxonomy path, never an inline string`);
  }
});

test('產品封面圖在 public 下真的存在，且三種比例齊全', () => {
  const config = read('src/config/products.ts');
  const covers = [...config.matchAll(/'(\/assets\/[^']+\/cover-[^']+\.png)'/g)].map((match) => match[1]);
  assert.ok(covers.length >= 6, `expected 16:9, 4:3 and 1:1 covers per product, found ${covers.length}`);
  for (const cover of covers) {
    assert.ok(fs.existsSync(path.join(root, 'public', cover.replace(/^\//, ''))), `missing product cover: ${cover}`);
  }
  for (const slug of ['moving-new-home-os', 'small-space-layout-vault']) {
    for (const ratio of ['cover-16x9.png', 'cover-4x3.png', 'cover-1x1.png']) {
      assert.ok(covers.includes(`/assets/${slug}/${ratio}`), `product ${slug} is missing ${ratio}`);
    }
  }
});

// `image` is the required property, so the builder must never be able to drop
// it: the input type is a non-empty tuple and the emitter has no fallback.
test('productSchema 在型別層面就強制至少一張圖片', () => {
  const source = read(SCHEMA_MODULE);
  assert.match(source, /images: readonly \[ProductImage, \.\.\.ProductImage\[\]\]/);
  assert.match(source, /image: images\.length === 1 \? images\[0\] : images,/);
  assert.doesNotMatch(source, /image\?\:/);
});
