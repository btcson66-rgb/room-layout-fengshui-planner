import { clearanceClass, type ClearanceSeverity } from './clearance-policy.ts';
import type { LayoutRecord } from './types.ts';

/**
 * Plain-language dimension facts for the /layout-guides/ pages.
 *
 * Everything here is derived from the layout records themselves (room envelope,
 * furniture footprints, authored clearances) plus fixed unit constants. Nothing
 * is estimated or invented: the guides previously showed only the SVG and a
 * caption, which left each page with very little text that was not boilerplate.
 */

export const SQM_PER_PING = 3.3058;
export const SQFT_PER_SQM = 10.7639;

export type GuideLocale = 'zh' | 'en';

export interface GuideClearanceFact {
  label: string;
  mm: number;
  severity: ClearanceSeverity;
  severityLabel: string;
}

export interface GuideLayoutFacts {
  id: string;
  archetype: string;
  roomMm: string;
  area: string;
  items: string;
  clearances: GuideClearanceFact[];
}

const itemLabels: Record<GuideLocale, Record<string, string>> = {
  zh: {
    bed: '床',
    nightstand: '床頭櫃',
    wardrobe: '衣櫃',
    desk: '書桌',
    chair: '椅子',
    dresser: '抽屜櫃',
    shelving: '層架',
    loveseat: '雙人沙發',
    sofa: '沙發',
    'dining-table': '餐桌',
    'storage-cabinet': '收納櫃',
  },
  en: {
    bed: 'Bed',
    nightstand: 'Nightstand',
    wardrobe: 'Wardrobe',
    desk: 'Desk',
    chair: 'Chair',
    dresser: 'Dresser',
    shelving: 'Shelving',
    loveseat: 'Loveseat',
    sofa: 'Sofa',
    'dining-table': 'Dining table',
    'storage-cabinet': 'Storage cabinet',
  },
};

const bedPresetLabels: Record<GuideLocale, Record<string, string>> = {
  zh: { 'us-queen': 'Queen', 'us-full': 'Full', 'us-twin': 'Twin', 'tw-5-ft': '台灣 5 尺', 'eu-single': '歐規單人' },
  en: { 'us-queen': 'Queen', 'us-full': 'Full', 'us-twin': 'Twin', 'tw-5-ft': 'Taiwan 5 ft', 'eu-single': 'EU single' },
};

const clearanceLabels: Record<GuideLocale, Record<string, string>> = {
  zh: {
    'bed-side-mm': '床邊通道',
    'wardrobe-opening-mm': '衣櫃前方',
    'dresser-opening-mm': '抽屜櫃前方',
    'chair-pullback-mm': '椅子後退',
    'primary-route-mm': '主要動線',
    'studio-entry-mm': '套房入口',
  },
  en: {
    'bed-side-mm': 'Bed side',
    'wardrobe-opening-mm': 'In front of wardrobe',
    'dresser-opening-mm': 'In front of dresser',
    'chair-pullback-mm': 'Chair pull-back',
    'primary-route-mm': 'Main route',
    'studio-entry-mm': 'Studio entry',
  },
};

const severityLabels: Record<GuideLocale, Record<ClearanceSeverity, string>> = {
  zh: { comfortable: '寬鬆', practical: '堪用', tight: '偏緊', conflict: '衝突' },
  en: { comfortable: 'comfortable', practical: 'practical', tight: 'tight', conflict: 'conflict' },
};

export function describeArea(widthMm: number, lengthMm: number, locale: GuideLocale): string {
  const sqm = (widthMm * lengthMm) / 1_000_000;
  const sqft = sqm * SQFT_PER_SQM;
  if (locale === 'zh') return `${sqm.toFixed(2)} m²，約 ${(sqm / SQM_PER_PING).toFixed(2)} 坪，約 ${Math.round(sqft)} 平方呎`;
  return `${sqm.toFixed(2)} m², about ${Math.round(sqft)} sq ft (${(sqm / SQM_PER_PING).toFixed(2)} ping)`;
}

export function describeGuideLayouts(layouts: LayoutRecord[], locale: GuideLocale): GuideLayoutFacts[] {
  return layouts.map((layout) => {
    const furniture = layout.furniture.filter((item) => item.type !== 'door' && item.type !== 'window');
    const items = furniture
      .map((item) => {
        const name = itemLabels[locale][item.type] ?? item.type;
        const preset = item.type === 'bed' && item.presetId ? bedPresetLabels[locale][item.presetId] : undefined;
        const label = preset ? `${name}（${preset}）` : name;
        return `${label} ${item.widthMm} × ${item.depthMm}`;
      })
      .join(locale === 'zh' ? '；' : '; ');
    const clearances = Object.entries(layout.clearances).map(([key, mm]) => {
      const severity = clearanceClass(mm);
      return { label: clearanceLabels[locale][key] ?? key, mm, severity, severityLabel: severityLabels[locale][severity] };
    });
    return {
      id: layout.id,
      archetype: layout.archetype ?? layout.id,
      roomMm: `${layout.roomWidthMm} × ${layout.roomLengthMm} mm`,
      area: describeArea(layout.roomWidthMm, layout.roomLengthMm, locale),
      items,
      clearances,
    };
  });
}
