import type { Unit } from './types';

const MM_PER_UNIT: Record<Unit, number> = { mm: 1, cm: 10, in: 25.4 };

export function toMm(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) throw new RangeError('Measurement must be a finite number.');
  return Math.round(value * MM_PER_UNIT[unit] * 1000) / 1000;
}

export function fromMm(valueMm: number, unit: Unit): number {
  if (!Number.isFinite(valueMm)) throw new RangeError('Measurement must be a finite number.');
  return Math.round((valueMm / MM_PER_UNIT[unit]) * 1000) / 1000;
}

export function validateMeasurement(valueMm: number, field = 'Measurement'): string | null {
  if (!Number.isFinite(valueMm)) return `${field} must be a number.`;
  if (valueMm <= 0) return `${field} must be greater than zero.`;
  if (valueMm > 100_000) return `${field} looks too large. Check the unit.`;
  if (valueMm < 1) return `${field} is under 1 mm. Check the unit.`;
  return null;
}
