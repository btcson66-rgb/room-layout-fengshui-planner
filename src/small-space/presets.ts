import type { LayoutUnit, SizeMm } from './types.ts';

export type BedRegion = 'us' | 'uk' | 'eu' | 'jp' | 'tw';

export interface BedPreset extends SizeMm {
  id: string;
  region: BedRegion;
  label: string;
  sourceStatus: 'draft-preset';
}

/**
 * Draft v1 presets. Dimensions are canonical millimetres; product copy must not
 * call these universal standards until the regional evidence pass is complete.
 */
export const BED_PRESETS: readonly BedPreset[] = [
  { id: 'us-twin', region: 'us', label: 'US Twin', widthMm: 990, depthMm: 1905, sourceStatus: 'draft-preset' },
  { id: 'us-full', region: 'us', label: 'US Full', widthMm: 1372, depthMm: 1905, sourceStatus: 'draft-preset' },
  { id: 'us-queen', region: 'us', label: 'US Queen', widthMm: 1524, depthMm: 2032, sourceStatus: 'draft-preset' },
  { id: 'us-king', region: 'us', label: 'US King', widthMm: 1930, depthMm: 2032, sourceStatus: 'draft-preset' },
  { id: 'us-cal-king', region: 'us', label: 'US California King', widthMm: 1829, depthMm: 2134, sourceStatus: 'draft-preset' },
  { id: 'uk-single', region: 'uk', label: 'UK Single', widthMm: 900, depthMm: 1900, sourceStatus: 'draft-preset' },
  { id: 'uk-double', region: 'uk', label: 'UK Double', widthMm: 1350, depthMm: 1900, sourceStatus: 'draft-preset' },
  { id: 'uk-king', region: 'uk', label: 'UK King', widthMm: 1500, depthMm: 2000, sourceStatus: 'draft-preset' },
  { id: 'eu-single', region: 'eu', label: 'EU Single', widthMm: 900, depthMm: 2000, sourceStatus: 'draft-preset' },
  { id: 'eu-double', region: 'eu', label: 'EU Double', widthMm: 1400, depthMm: 2000, sourceStatus: 'draft-preset' },
  { id: 'eu-king', region: 'eu', label: 'EU King', widthMm: 1600, depthMm: 2000, sourceStatus: 'draft-preset' },
  { id: 'jp-single', region: 'jp', label: 'Japan Single', widthMm: 970, depthMm: 1950, sourceStatus: 'draft-preset' },
  { id: 'jp-semi-double', region: 'jp', label: 'Japan Semi-double', widthMm: 1200, depthMm: 1950, sourceStatus: 'draft-preset' },
  { id: 'jp-double', region: 'jp', label: 'Japan Double', widthMm: 1400, depthMm: 1950, sourceStatus: 'draft-preset' },
  { id: 'tw-3-ft', region: 'tw', label: 'Taiwan 3 chi', widthMm: 910, depthMm: 1880, sourceStatus: 'draft-preset' },
  { id: 'tw-3-5-ft', region: 'tw', label: 'Taiwan 3.5 chi', widthMm: 1060, depthMm: 1880, sourceStatus: 'draft-preset' },
  { id: 'tw-5-ft', region: 'tw', label: 'Taiwan 5 chi', widthMm: 1520, depthMm: 1880, sourceStatus: 'draft-preset' },
  { id: 'tw-6-ft', region: 'tw', label: 'Taiwan 6 chi', widthMm: 1820, depthMm: 1880, sourceStatus: 'draft-preset' },
  { id: 'tw-7-ft', region: 'tw', label: 'Taiwan 7 chi', widthMm: 1820, depthMm: 2120, sourceStatus: 'draft-preset' },
];

export function findBedPreset(id: string): BedPreset | undefined {
  return BED_PRESETS.find((preset) => preset.id === id);
}

export function formatPresetSize(preset: SizeMm, unit: LayoutUnit): string {
  const factor = unit === 'mm' ? 1 : unit === 'cm' ? 10 : unit === 'm' ? 1000 : unit === 'in' ? 25.4 : 304.8;
  const precision = unit === 'mm' ? 0 : unit === 'cm' ? 1 : unit === 'm' ? 2 : 2;
  return `${(preset.widthMm / factor).toFixed(precision)} × ${(preset.depthMm / factor).toFixed(precision)} ${unit}`;
}
