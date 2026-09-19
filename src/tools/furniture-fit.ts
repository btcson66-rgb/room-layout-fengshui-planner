export type FurnitureFitUnit = 'cm' | 'm' | 'ft';

export interface FurnitureFitInput {
  roomWidthCm: number;
  roomLengthCm: number;
  furnitureWidthCm: number;
  furnitureDepthCm: number;
  clearance: { leftCm: number; rightCm: number; frontCm: number; backCm: number };
}

export interface FurnitureOrientationResult {
  rotation: 0 | 90;
  widthCm: number;
  depthCm: number;
  physicalFit: boolean;
  requestedClearanceFit: boolean;
}

export interface FurnitureFitResult {
  orientations: FurnitureOrientationResult[];
  physicalFit: boolean;
  requestedClearanceFit: boolean;
  recommendedRotation: 0 | 90 | null;
}

export function toFurnitureFitCm(value: number, unit: FurnitureFitUnit): number {
  if (unit === 'm') return value * 100;
  if (unit === 'ft') return value * 30.48;
  return value;
}

export function fromFurnitureFitCm(value: number, unit: FurnitureFitUnit): number {
  if (unit === 'm') return value / 100;
  if (unit === 'ft') return value / 30.48;
  return value;
}

export function calculateFurnitureFit(input: FurnitureFitInput): FurnitureFitResult {
  const { roomWidthCm, roomLengthCm, furnitureWidthCm, furnitureDepthCm, clearance } = input;
  const orientations: FurnitureOrientationResult[] = ([0, 90] as const).map((rotation) => {
    const widthCm = rotation === 0 ? furnitureWidthCm : furnitureDepthCm;
    const depthCm = rotation === 0 ? furnitureDepthCm : furnitureWidthCm;
    return {
      rotation,
      widthCm,
      depthCm,
      physicalFit: widthCm <= roomWidthCm && depthCm <= roomLengthCm,
      requestedClearanceFit: widthCm + clearance.leftCm + clearance.rightCm <= roomWidthCm
        && depthCm + clearance.frontCm + clearance.backCm <= roomLengthCm,
    };
  });
  const recommended = orientations.find((orientation) => orientation.requestedClearanceFit)
    ?? orientations.find((orientation) => orientation.physicalFit);
  return {
    orientations,
    physicalFit: orientations.some((orientation) => orientation.physicalFit),
    requestedClearanceFit: orientations.some((orientation) => orientation.requestedClearanceFit),
    recommendedRotation: recommended?.rotation ?? null,
  };
}
