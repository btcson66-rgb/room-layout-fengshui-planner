import { areaInSquareMeters, convertToMm } from './units.ts';
import { validateLayoutGeometry } from './geometry.ts';
import { layoutStrategySignature } from './distinctiveness.ts';
import type { FurnitureType, LayoutMatch, LayoutRecord, MatcherRequest, SizeMm } from './types.ts';

const SCORE_WEIGHTS = { geometry: 40, requiredFurniture: 25, circulation: 20, priorities: 10, shape: 5 } as const;
// Imperial inputs such as 12 ft produce fractional millimetres. A tiny
// rounding allowance prevents a 3,658 mm authored room edge being rejected
// against a nominal 12 ft (3,657.6 mm) input; furniture tolerances remain
// separate and data-driven.
const ROOM_ROUNDING_TOLERANCE_MM = 2;

function countRequired(layout: LayoutRecord, requested: FurnitureType[]): number {
  if (requested.length === 0) return 1;
  const available = new Set(layout.furniture.filter((item) => item.type !== 'door' && item.type !== 'window').map((item) => item.type));
  return requested.filter((type) => available.has(type)).length / requested.length;
}

function fitsEitherOrientation(actual: SizeMm, requested: SizeMm, toleranceMm = 100): boolean {
  return (actual.widthMm + toleranceMm >= requested.widthMm && actual.depthMm + toleranceMm >= requested.depthMm)
    || (actual.widthMm + toleranceMm >= requested.depthMm && actual.depthMm + toleranceMm >= requested.widthMm);
}

function dimensionsSatisfied(layout: LayoutRecord, request: MatcherRequest): boolean {
  const bed = layout.furniture.find((item) => item.type === 'bed');
  const tolerance = request.strictFurnitureSizes ? 0 : 100;
  if (bed && request.bedWidthMm && request.bedDepthMm && !fitsEitherOrientation(bed, { widthMm: request.bedWidthMm, depthMm: request.bedDepthMm }, tolerance)) return false;
  const requirements = request.furnitureSizesMm ?? {};
  return Object.entries(requirements).every(([type, required]) => {
    if (!required) return true;
    return layout.furniture.some((item) => item.type === type && fitsEitherOrientation(item, required, tolerance));
  });
}

function priorityScore(layout: LayoutRecord, priorities: string[]): number {
  if (priorities.length === 0) return 1;
  const tags = new Set([...layout.priorityTags, ...layout.targetUses]);
  return priorities.filter((priority) => tags.has(priority)).length / priorities.length;
}

function circulationScore(layout: LayoutRecord, validation: ReturnType<typeof validateLayoutGeometry>): number {
  if (!validation.valid) return 0;
  const target = layout.furniture.filter((item) => item.type !== 'door' && item.type !== 'window');
  if (target.length === 0) return 0;
  const clearances = target.filter((item) => item.clearanceMm >= 600).length;
  return clearances / target.length;
}

function explain(layout: LayoutRecord, request: MatcherRequest, breakdown: LayoutMatch['scoreBreakdown']): Pick<LayoutMatch, 'whyItMatches' | 'tradeoffs'> {
  const whyItMatches: string[] = [];
  const tradeoffs: string[] = [];
  if (breakdown.requiredFurniture === SCORE_WEIGHTS.requiredFurniture) whyItMatches.push('Includes all requested furniture types.');
  else if (breakdown.requiredFurniture > 0) tradeoffs.push('One or more requested furniture types are not in this layout.');
  if (breakdown.shape === SCORE_WEIGHTS.shape) whyItMatches.push(`Matches the requested ${request.shape} room shape.`);
  if (breakdown.circulation === SCORE_WEIGHTS.circulation) whyItMatches.push('All placed furniture meets the v1 circulation threshold.');
  else tradeoffs.push('Circulation is tighter than the preferred 600 mm threshold.');
  if (layout.warnings.length > 0) tradeoffs.push(...layout.warnings);
  if (whyItMatches.length === 0) whyItMatches.push('Fits the requested room dimensions after deterministic geometry checks.');
  return { whyItMatches, tradeoffs };
}

export function scoreLayout(layout: LayoutRecord, request: MatcherRequest): LayoutMatch {
  const roomWidthMm = convertToMm(request.width, request.unit);
  const roomLengthMm = convertToMm(request.length, request.unit);
  const validation = validateLayoutGeometry(layout);
  const fits = validation.valid && dimensionsSatisfied(layout, request) && layout.roomWidthMm <= roomWidthMm + ROOM_ROUNDING_TOLERANCE_MM && layout.roomLengthMm <= roomLengthMm + ROOM_ROUNDING_TOLERANCE_MM;
  const widthSlack = fits ? (roomWidthMm - layout.roomWidthMm) / roomWidthMm : 1;
  const lengthSlack = fits ? (roomLengthMm - layout.roomLengthMm) / roomLengthMm : 1;
  const dimensionFit = Math.max(0, 1 - (widthSlack + lengthSlack) / 2);
  const geometry = fits ? SCORE_WEIGHTS.geometry * dimensionFit : 0;
  const requiredFurniture = SCORE_WEIGHTS.requiredFurniture * countRequired(layout, request.requiredFurniture);
  const circulation = SCORE_WEIGHTS.circulation * circulationScore(layout, validation);
  const priorities = SCORE_WEIGHTS.priorities * priorityScore(layout, request.priorities.slice(0, 2));
  const shape = layout.shape === request.shape ? SCORE_WEIGHTS.shape : 0;
  const score = Math.round((geometry + requiredFurniture + circulation + priorities + shape) * 100) / 100;
  const scoreBreakdown = { geometry, requiredFurniture, circulation, priorities, shape };
  return { layout, score, scoreBreakdown, ...explain(layout, request, scoreBreakdown) };
}

export function matchLayouts(layouts: LayoutRecord[], request: MatcherRequest): LayoutMatch[] {
  const roomWidthMm = convertToMm(request.width, request.unit);
  const roomLengthMm = convertToMm(request.length, request.unit);
  return layouts
    .filter((layout) => layout.qualityStatus === 'approved')
    .filter((layout) => layout.roomWidthMm <= roomWidthMm + ROOM_ROUNDING_TOLERANCE_MM && layout.roomLengthMm <= roomLengthMm + ROOM_ROUNDING_TOLERANCE_MM)
    .map((layout) => scoreLayout(layout, request))
    .filter((match) => match.scoreBreakdown.geometry > 0 && dimensionsSatisfied(match.layout, request))
    .sort((a, b) => b.score - a.score || a.layout.id.localeCompare(b.layout.id));
}

/**
 * Select a small set of genuinely different choices after deterministic scoring.
 * Strategy identity is authored in the Phase 1 registry; the signature fallback
 * catches near-duplicate furniture placement even when labels differ.
 */
export function selectDiverseTopMatches(matches: LayoutMatch[], limit = 3): LayoutMatch[] {
  const selected: LayoutMatch[] = [];
  const seenStrategies = new Set<string>();
  for (const match of matches) {
    const strategy = match.layout.strategyKey ?? match.layout.archetype ?? layoutStrategySignature(match.layout);
    if (seenStrategies.has(strategy)) continue;
    selected.push(match);
    seenStrategies.add(strategy);
    if (selected.length >= limit) return selected;
  }
  // A small dataset can legitimately contain fewer strategy families than the
  // requested limit. Fill remaining slots by score without duplicating entries.
  for (const match of matches) {
    if (selected.includes(match)) continue;
    selected.push(match);
    if (selected.length >= limit) break;
  }
  return selected;
}

export { areaInSquareMeters, SCORE_WEIGHTS };
