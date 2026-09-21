/**
 * Generates the product cover art referenced by the `Product` JSON-LD on the
 * paid landing pages.
 *
 * Google Merchant listings treat `image` as a required property, so every
 * product page must point at real, crawlable artwork. Each product gets the
 * three aspect ratios Google asks for (16:9, 4:3, 1:1) so it can crop per
 * surface without letterboxing.
 *
 * Text is intentionally Latin-only: the artwork is shared by the English and
 * Chinese pages, and it keeps the output reproducible on machines that have no
 * CJK font installed. Run with `npm run assets:products`.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetsDir = join(root, 'public', 'assets');

const primary = '#2f6f62';
const primaryStrong = '#24564c';
const accent = '#b86b3d';
const paper = '#f7f5f0';
const surface = '#ffffff';
const text = '#24231f';
const muted = '#646158';
const fontStack = 'DejaVu Sans, Liberation Sans, Arial, Helvetica, sans-serif';

const escapeText = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Tick-ended measurement line, the visual shorthand both products share. */
const dimension = (x1, x2, y, color) => `
    <g stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M${x1} ${y}h${x2 - x1}"/>
      <path d="M${x1} ${y - 9}v18"/>
      <path d="M${x2} ${y - 9}v18"/>
    </g>`;

/** Floor plan with a measured bed, desk and wardrobe. Design space 400x300. */
const layoutVaultDiagram = `
    <rect x="20" y="16" width="360" height="232" rx="8" fill="${surface}" stroke="${primaryStrong}" stroke-width="5"/>
    <rect x="46" y="122" width="120" height="104" rx="7" fill="${primary}"/>
    <rect x="46" y="122" width="120" height="28" rx="6" fill="${primaryStrong}"/>
    <rect x="300" y="44" width="56" height="128" rx="6" fill="${accent}"/>
    <path d="M300 88h56M300 128h56" stroke="${paper}" stroke-width="4" stroke-linecap="round"/>
    <rect x="196" y="44" width="86" height="42" rx="6" fill="${muted}" opacity="0.5"/>
    <circle cx="239" cy="110" r="15" fill="${muted}" opacity="0.4"/>
    <path d="M250 248a70 70 0 0 0 70-70" fill="none" stroke="${primary}" stroke-width="4" stroke-dasharray="9 8"/>
    <path d="M250 248v-70" stroke="${primary}" stroke-width="5" stroke-linecap="round"/>
    ${dimension(20, 380, 274, primaryStrong)}
    ${dimension(46, 166, 100, accent)}`;

/** Doorway clearance compared against sofa width. Design space 400x300. */
const movingOsDiagram = `
    ${dimension(120, 300, 30, primaryStrong)}
    <rect x="16" y="54" width="104" height="18" rx="5" fill="${primaryStrong}"/>
    <rect x="300" y="54" width="84" height="18" rx="5" fill="${primaryStrong}"/>
    <path d="M120 72v26M300 72v26" stroke="${primaryStrong}" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
    <rect x="130" y="142" width="160" height="84" rx="12" fill="${primary}"/>
    <rect x="130" y="142" width="160" height="28" rx="10" fill="${primaryStrong}"/>
    <rect x="130" y="142" width="22" height="84" rx="9" fill="${primaryStrong}" opacity="0.75"/>
    <rect x="268" y="142" width="22" height="84" rx="9" fill="${primaryStrong}" opacity="0.75"/>
    ${dimension(130, 290, 250, accent)}
    <circle cx="344" cy="126" r="26" fill="${accent}"/>
    <path d="M332 126l8 9 16-19" fill="none" stroke="${surface}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;

const coverSvg = ({ width, height, titleLines, meta, diagram }) => {
  const base = Math.min(width, height);
  const round = (value) => Math.round(value);
  const pad = round(base * 0.05);
  const card = { x: pad, y: pad, w: width - pad * 2, h: height - pad * 2 };
  const cp = round(base * 0.062);
  const wordSize = round(base * 0.04);
  const titleSize = round(base * 0.082);
  const metaSize = round(base * 0.036);
  const lineStep = round(titleSize * 1.16);
  const sideBySide = width / height >= 1.4;

  const textColumnWidth = sideBySide ? round(card.w * 0.5) - cp : card.w - cp * 2;
  const textX = card.x + cp;
  const ruleHeight = round(base * 0.012);
  const blockHeight = wordSize + round(base * 0.05) + titleSize + (titleLines.length - 1) * lineStep + round(base * 0.042) + ruleHeight + round(base * 0.048) + metaSize;
  const blockTop = sideBySide ? card.y + round((card.h - blockHeight) / 2) : card.y + cp;

  const wordBaseline = blockTop + wordSize;
  const firstTitleBaseline = wordBaseline + round(base * 0.05) + titleSize;
  const lastTitleBaseline = firstTitleBaseline + (titleLines.length - 1) * lineStep;
  const ruleY = lastTitleBaseline + round(base * 0.042);
  const metaBaseline = ruleY + ruleHeight + round(base * 0.048) + metaSize;

  const box = sideBySide
    ? { x: textX + textColumnWidth + cp, y: card.y + cp, w: card.x + card.w - cp - (textX + textColumnWidth + cp), h: card.h - cp * 2 }
    : { x: textX, y: metaBaseline + round(base * 0.05), w: textColumnWidth, h: card.y + card.h - cp - (metaBaseline + round(base * 0.05)) };
  const scale = Math.min(box.w / 400, box.h / 300);
  const dx = box.x + (box.w - 400 * scale) / 2;
  const dy = box.y + (box.h - 300 * scale) / 2;

  const titles = titleLines
    .map((line, index) => `<text x="${textX}" y="${firstTitleBaseline + index * lineStep}" fill="${text}" font-family="${fontStack}" font-size="${titleSize}" font-weight="800">${escapeText(line)}</text>`)
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${primary}"/>
  <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="${round(base * 0.028)}" fill="${paper}"/>
  <text x="${textX}" y="${wordBaseline}" fill="${primaryStrong}" font-family="${fontStack}" font-size="${wordSize}" font-weight="700" letter-spacing="${round(wordSize * 0.16)}">ROOMFENG</text>
  ${titles}
  <rect x="${textX}" y="${ruleY}" width="${round(base * 0.13)}" height="${ruleHeight}" rx="${round(ruleHeight / 2)}" fill="${accent}"/>
  <text x="${textX}" y="${metaBaseline}" fill="${muted}" font-family="${fontStack}" font-size="${metaSize}">${escapeText(meta)}</text>
  <g transform="translate(${dx} ${dy}) scale(${scale})">${diagram}
  </g>
</svg>
`;
};

const ratios = [
  { name: 'cover-16x9', width: 1200, height: 675 },
  { name: 'cover-4x3', width: 1200, height: 900 },
  { name: 'cover-1x1', width: 1200, height: 1200 },
];

const products = [
  {
    slug: 'small-space-layout-vault',
    titleLines: ['Small Space', 'Layout Vault'],
    meta: 'Validated bedroom and studio layouts',
    diagram: layoutVaultDiagram,
  },
  {
    slug: 'moving-new-home-os',
    titleLines: ['Moving and', 'New Home OS'],
    meta: 'Furniture fit, boxes, timeline, budget',
    diagram: movingOsDiagram,
  },
];

for (const product of products) {
  const directory = join(assetsDir, product.slug);
  await mkdir(directory, { recursive: true });
  for (const ratio of ratios) {
    const svg = coverSvg({ ...ratio, titleLines: product.titleLines, meta: product.meta, diagram: product.diagram });
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(directory, `${ratio.name}.png`));
    console.log(`[product-assets] ${product.slug}/${ratio.name}.png ${ratio.width}x${ratio.height}`);
  }
}
