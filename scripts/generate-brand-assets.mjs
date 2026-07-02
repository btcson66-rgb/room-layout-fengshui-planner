import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, 'public');

const primary = '#2f6f62';
const primaryStrong = '#24564c';
const accent = '#b86b3d';
const paper = '#f7f5f0';
const surface = '#ffffff';
const text = '#24231f';
const muted = '#646158';
const fontStack = 'Microsoft JhengHei, Segoe UI, Arial, sans-serif';

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${primary}"/>
  <rect x="10" y="10" width="44" height="44" rx="6" fill="${paper}"/>
  <path d="M18 18h28v28H18z" fill="none" stroke="${primaryStrong}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="22" y="34" width="15" height="9" rx="2" fill="${primary}"/>
  <rect x="39" y="20" width="7" height="17" rx="2" fill="${accent}"/>
  <path d="M19 29h14M39 43h7" stroke="${primaryStrong}" stroke-width="3" stroke-linecap="round"/>
</svg>
`;

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${primary}"/>
  <rect x="70" y="70" width="1060" height="490" rx="28" fill="${paper}"/>
  <g transform="translate(742 122)">
    <rect x="0" y="0" width="292" height="292" rx="16" fill="${surface}" stroke="${primaryStrong}" stroke-width="8"/>
    <path d="M44 44h204v204H44z" fill="none" stroke="${primaryStrong}" stroke-width="8" stroke-linejoin="round"/>
    <rect x="70" y="165" width="92" height="54" rx="8" fill="${primary}"/>
    <rect x="180" y="70" width="44" height="108" rx="8" fill="${accent}"/>
    <path d="M68 114h82M182 220h48M44 146h204" stroke="${primaryStrong}" stroke-width="8" stroke-linecap="round"/>
    <path d="M248 104a60 60 0 0 1-60-60" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
  </g>
  <text x="120" y="198" fill="${text}" font-family="${fontStack}" font-size="82" font-weight="800">RoomFeng</text>
  <text x="124" y="286" fill="${primaryStrong}" font-family="${fontStack}" font-size="42" font-weight="700">房間規劃與風水格局參考</text>
  <text x="124" y="358" fill="${muted}" font-family="${fontStack}" font-size="30">拖拉家具、檢查尺寸動線、匯出平面圖</text>
  <text x="124" y="408" fill="${muted}" font-family="${fontStack}" font-size="30">民俗說法僅作空間舒適度參考</text>
  <rect x="124" y="462" width="250" height="58" rx="8" fill="${primary}"/>
  <text x="154" y="501" fill="${surface}" font-family="${fontStack}" font-size="26" font-weight="700">免費線上工具</text>
</svg>
`;

await mkdir(publicDir, { recursive: true });
await writeFile(join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');
await sharp(Buffer.from(faviconSvg)).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'));
await sharp(Buffer.from(ogSvg)).png().toFile(join(publicDir, 'og-image.png'));
