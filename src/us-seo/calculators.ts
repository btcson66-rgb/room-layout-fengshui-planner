import { convertToMm, fromMm } from '../small-space/units.ts';
import type { LayoutUnit } from '../small-space/types.ts';

export type CalculationStatus = 'fit' | 'tight' | 'fail';

export interface DimensionInput {
  value: number;
  unit: LayoutUnit;
}

export interface OrientationFit {
  label: 'Orientation A' | 'Orientation B';
  itemWidthMm: number;
  itemLengthMm: number;
  physicalFit: boolean;
  requestedClearanceFit: boolean;
  widthRemainingMm: number;
  lengthRemainingMm: number;
}

export interface FurnitureFitInput {
  roomWidth: DimensionInput;
  roomLength: DimensionInput;
  furnitureWidth: DimensionInput;
  furnitureDepth: DimensionInput;
  left: DimensionInput;
  right: DimensionInput;
  front: DimensionInput;
  back: DimensionInput;
}

export interface FurnitureFitResult {
  orientations: OrientationFit[];
  physicalFit: boolean;
  requestedClearanceFit: boolean;
}

export interface BedFitInput {
  roomWidth: DimensionInput;
  roomLength: DimensionInput;
  bedWidth: DimensionInput;
  bedLength: DimensionInput;
  left: DimensionInput;
  right: DimensionInput;
  foot: DimensionInput;
  head: DimensionInput;
}

export interface BedFitResult {
  orientations: OrientationFit[];
  physicalFit: boolean;
  requestedClearanceFit: boolean;
}

export interface DoorOpeningInput {
  doorWidth: DimensionInput;
  doorHeight: DimensionInput;
  couchDepth: DimensionInput;
  couchHeight: DimensionInput;
  removableLegReduction: DimensionInput;
}

export interface DoorOrientationFit {
  label: 'Orientation A' | 'Orientation B';
  crossSectionWidthMm: number;
  crossSectionHeightMm: number;
  fits: boolean;
  widthRemainingMm: number;
  heightRemainingMm: number;
}

export interface DoorOpeningResult {
  orientations: DoorOrientationFit[];
  status: CalculationStatus;
  passedOrientation: DoorOrientationFit | null;
}

export const MATTRESS_DIMENSIONS_IN = {
  Twin: { width: 38, length: 75 },
  'Twin XL': { width: 38, length: 80 },
  Full: { width: 54, length: 75 },
  Queen: { width: 60, length: 80 },
  King: { width: 76, length: 80 },
  'California King': { width: 72, length: 84 },
} as const;

function finitePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be greater than zero.`);
  return value;
}

function finiteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be zero or greater.`);
  return value;
}

function toPositiveMm(input: DimensionInput, label: string): number {
  return convertToMm(finitePositive(input.value, label), input.unit);
}

function toNonNegativeMm(input: DimensionInput, label: string): number {
  return convertToMm(finiteNonNegative(input.value, label), input.unit);
}

export function toMillimetres(value: number, unit: LayoutUnit, label = 'Measurement'): number {
  return convertToMm(finitePositive(value, label), unit);
}

export function formatInches(valueMm: number, digits = 1): string {
  const inches = fromMm(valueMm, 'in');
  return `${inches.toFixed(digits).replace(/\.0+$/, '')} in`;
}

export function formatFeetAndInches(valueMm: number): string {
  const totalInches = fromMm(valueMm, 'in');
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches - feet * 12) * 10) / 10;
  return `${feet} ft ${inches % 1 === 0 ? inches.toFixed(0) : inches.toFixed(1)} in`;
}

function rectangleOrientations(
  roomWidthMm: number,
  roomLengthMm: number,
  itemWidthMm: number,
  itemLengthMm: number,
  widthAllowanceMm: number,
  lengthAllowanceMm: number,
  includeClearance: boolean,
): OrientationFit[] {
  const candidates = [
    { label: 'Orientation A' as const, itemWidthMm, itemLengthMm },
    { label: 'Orientation B' as const, itemWidthMm: itemLengthMm, itemLengthMm: itemWidthMm },
  ];
  return candidates.map((candidate) => ({
    ...candidate,
    physicalFit: candidate.itemWidthMm <= roomWidthMm && candidate.itemLengthMm <= roomLengthMm,
    requestedClearanceFit: includeClearance
      && candidate.itemWidthMm + widthAllowanceMm <= roomWidthMm
      && candidate.itemLengthMm + lengthAllowanceMm <= roomLengthMm,
    widthRemainingMm: roomWidthMm - candidate.itemWidthMm,
    lengthRemainingMm: roomLengthMm - candidate.itemLengthMm,
  }));
}

export function calculateFurnitureFit(input: FurnitureFitInput): FurnitureFitResult {
  const roomWidthMm = toPositiveMm(input.roomWidth, 'Room width');
  const roomLengthMm = toPositiveMm(input.roomLength, 'Room length');
  const furnitureWidthMm = toPositiveMm(input.furnitureWidth, 'Furniture width');
  const furnitureDepthMm = toPositiveMm(input.furnitureDepth, 'Furniture depth');
  const leftMm = toNonNegativeMm(input.left, 'Left clearance');
  const rightMm = toNonNegativeMm(input.right, 'Right clearance');
  const frontMm = toNonNegativeMm(input.front, 'Front clearance');
  const backMm = toNonNegativeMm(input.back, 'Back clearance');
  const orientations = rectangleOrientations(
    roomWidthMm,
    roomLengthMm,
    furnitureWidthMm,
    furnitureDepthMm,
    leftMm + rightMm,
    frontMm + backMm,
    true,
  );
  return {
    orientations,
    physicalFit: orientations.some((orientation) => orientation.physicalFit),
    requestedClearanceFit: orientations.some((orientation) => orientation.requestedClearanceFit),
  };
}

export function calculateBedRoomFit(input: BedFitInput): BedFitResult {
  const roomWidthMm = toPositiveMm(input.roomWidth, 'Room width');
  const roomLengthMm = toPositiveMm(input.roomLength, 'Room length');
  const bedWidthMm = toPositiveMm(input.bedWidth, 'Bed width');
  const bedLengthMm = toPositiveMm(input.bedLength, 'Bed length');
  const leftMm = toNonNegativeMm(input.left, 'Left clearance');
  const rightMm = toNonNegativeMm(input.right, 'Right clearance');
  const footMm = toNonNegativeMm(input.foot, 'Foot clearance');
  const headMm = toNonNegativeMm(input.head, 'Head clearance');
  const orientations = rectangleOrientations(
    roomWidthMm,
    roomLengthMm,
    bedWidthMm,
    bedLengthMm,
    leftMm + rightMm,
    headMm + footMm,
    true,
  );
  return {
    orientations,
    physicalFit: orientations.some((orientation) => orientation.physicalFit),
    requestedClearanceFit: orientations.some((orientation) => orientation.requestedClearanceFit),
  };
}

export function calculateDoorOpeningFit(input: DoorOpeningInput): DoorOpeningResult {
  const doorWidthMm = toPositiveMm(input.doorWidth, 'Clear door opening width');
  const doorHeightMm = toPositiveMm(input.doorHeight, 'Clear door opening height');
  const couchDepthMm = toPositiveMm(input.couchDepth, 'Couch depth');
  const couchHeightMm = toPositiveMm(input.couchHeight, 'Couch height');
  const removableLegReductionMm = toNonNegativeMm(input.removableLegReduction, 'Removable leg reduction');
  if (removableLegReductionMm >= couchHeightMm) {
    throw new RangeError('Removable leg reduction must be smaller than couch height.');
  }
  const effectiveHeightMm = couchHeightMm - removableLegReductionMm;
  const orientations: DoorOrientationFit[] = [
    {
      label: 'Orientation A',
      crossSectionWidthMm: couchDepthMm,
      crossSectionHeightMm: effectiveHeightMm,
      fits: couchDepthMm <= doorWidthMm && effectiveHeightMm <= doorHeightMm,
      widthRemainingMm: doorWidthMm - couchDepthMm,
      heightRemainingMm: doorHeightMm - effectiveHeightMm,
    },
    {
      label: 'Orientation B',
      crossSectionWidthMm: effectiveHeightMm,
      crossSectionHeightMm: couchDepthMm,
      fits: effectiveHeightMm <= doorWidthMm && couchDepthMm <= doorHeightMm,
      widthRemainingMm: doorWidthMm - effectiveHeightMm,
      heightRemainingMm: doorHeightMm - couchDepthMm,
    },
  ];
  const passing = orientations.filter((orientation) => orientation.fits);
  const passedOrientation = passing.sort((a, b) => Math.min(b.widthRemainingMm, b.heightRemainingMm) - Math.min(a.widthRemainingMm, a.heightRemainingMm))[0] ?? null;
  if (!passedOrientation) return { orientations, status: 'fail', passedOrientation: null };
  const tightThresholdMm = convertToMm(2, 'in');
  const tight = Math.min(passedOrientation.widthRemainingMm, passedOrientation.heightRemainingMm) <= tightThresholdMm;
  return { orientations, status: tight ? 'tight' : 'fit', passedOrientation };
}

export function feetAndInchesToDimension(feet: number, inches: number): DimensionInput {
  return { value: finiteNonNegative(feet, 'Feet') * 12 + finiteNonNegative(inches, 'Inches'), unit: 'in' };
}
