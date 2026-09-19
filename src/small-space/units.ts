import type { LayoutUnit } from './types.ts';

const MM_PER_UNIT: Record<LayoutUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

export function toMm(value: number, unit: LayoutUnit): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('measurement must be a finite non-negative number');
  return value * MM_PER_UNIT[unit];
}

export function fromMm(valueMm: number, unit: LayoutUnit): number {
  if (!Number.isFinite(valueMm)) throw new RangeError('measurement must be finite');
  return valueMm / MM_PER_UNIT[unit];
}

export function convertToMm(value: number, unit: LayoutUnit, precision = 3): number {
  const converted = toMm(value, unit);
  const factor = 10 ** precision;
  return Math.round(converted * factor) / factor;
}

export function areaInSquareMeters(widthMm: number, lengthMm: number): number {
  return (widthMm * lengthMm) / 1_000_000;
}
