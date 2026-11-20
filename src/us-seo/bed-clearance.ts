import { SIZES, WALK_TARGET_IN } from './answer-pages';

/**
 * "How much space around a bed" numbers for /en/bed-room-fit-calculator/.
 * Everything is mattress size plus the planning target (WALK_TARGET_IN), so the
 * prose, the table and the room examples cannot drift. The target is a planning
 * number used across the size pages, not a building code.
 * scripts/us-seo-arithmetic-check.mjs recomputes all of it from the built HTML.
 */
export const CLEARANCE_BEDS = ['Queen', 'King'] as const;
export type ClearanceBed = (typeof CLEARANCE_BEDS)[number];

export function ftIn(inches: number): string {
  const feet = Math.floor(inches / 12);
  const rest = inches % 12;
  return rest === 0 ? `${feet} ft` : `${feet} ft ${rest} in`;
}

export function clearanceFor(bed: ClearanceBed) {
  const { width, length } = SIZES[bed];
  const oneSide = width + WALK_TARGET_IN;
  const bothSides = width + 2 * WALK_TARGET_IN;
  const lengthNeeded = length + WALK_TARGET_IN;
  return { bed, width, length, oneSide, bothSides, lengthNeeded };
}

export const clearanceRows = CLEARANCE_BEDS.map(clearanceFor);

/** Rooms from the size pages, tested against the both-sides rule (width side only). */
export const roomExamples = {
  queen10x10: { spare: 120 - SIZES.Queen.width },
  king12x12: { spare: 144 - SIZES.King.width },
  king11x12: { spare: 132 - SIZES.King.width },
  king10x12Turned: { spare: 144 - SIZES.King.width },
};
export { WALK_TARGET_IN };
