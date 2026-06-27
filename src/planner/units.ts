import type { Unit } from './types';

const FT_TO_CM = 30.48;

export function toCm(value: number, unit: Unit): number {
  if (unit === 'm') return value * 100;
  if (unit === 'ft') return value * FT_TO_CM;
  return value;
}

export function fromCm(value: number, unit: Unit): number {
  if (unit === 'm') return value / 100;
  if (unit === 'ft') return value / FT_TO_CM;
  return value;
}

export function formatLength(value: number, unit: Unit): string {
  const converted = fromCm(value, unit);
  const digits = unit === 'cm' ? 0 : 2;
  return `${converted.toFixed(digits)} ${unit}`;
}

export function formatArea(widthCm: number, heightCm: number, unit: Unit): string {
  const cm2 = widthCm * heightCm;
  if (unit === 'cm') return `${Math.round(cm2).toLocaleString()} cm²`;
  if (unit === 'ft') return `${(cm2 / (30.48 * 30.48)).toFixed(2)} ft²`;
  return `${(cm2 / 10000).toFixed(2)} m²`;
}
