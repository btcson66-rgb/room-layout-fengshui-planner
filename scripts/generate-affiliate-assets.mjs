import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const outputDir = path.resolve('public/assets/support-products');
await fs.mkdir(outputDir, { recursive: true });

const source = await fs.readFile(path.resolve('src/data/affiliateProducts.ts'), 'utf8');
const affiliateProducts = [...source.matchAll(/p\('[^']+',\s*'([^']+)',\s*'([^']+)'/g)].map((match) => ({ sourceProductId: match[1], name: match[2], category: 'storage' }));

const palette = { storage: ['#e7f0ed', '#2f6f62'], furniture: ['#f4e9df', '#b86b3d'], mats: ['#e9eef4', '#315d7a'], bedding: ['#eeeaf5', '#6a568b'], decor: ['#f4eee2', '#8b6b33'], moving: ['#e8efdf', '#4f6c3a'] };
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const render = (product) => {
  const [background, foreground] = palette[product.category];
  const label = escapeXml(product.name.slice(0, 12));
  const id = escapeXml(product.sourceProductId);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="${background}"/><rect x="36" y="36" width="568" height="408" rx="24" fill="none" stroke="${foreground}" stroke-width="6"/><path d="M112 330h416M160 330V190h320v140M214 190v-46h212v46" fill="none" stroke="${foreground}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><text x="320" y=" ninety" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${foreground}">RoomFeng 居家示意圖</text><text x="320" y="394" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="${foreground}">${label}</text><text x="320" y="425" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="${foreground}">非商品原圖 · 商品資訊以蝦皮頁為準 · ${id}</text></svg>`;
};

await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#efeee8"/><rect x="36" y="36" width="568" height="408" rx="24" fill="none" stroke="#646158" stroke-width="6"/><text x="320" y="245" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" fill="#646158">RoomFeng 居家參考</text></svg>`)).webp({ quality: 82 }).toFile(path.join(outputDir, 'fallback.webp'));

for (const product of affiliateProducts) {
  await sharp(Buffer.from(render(product).replace('y=" ninety"', 'y="90"'))).webp({ quality: 82 }).toFile(path.join(outputDir, `${product.sourceProductId}.webp`));
}
console.log(`Generated ${affiliateProducts.length} local support images in ${outputDir}`);
