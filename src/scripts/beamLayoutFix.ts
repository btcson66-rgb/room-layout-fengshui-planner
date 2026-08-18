export type Wall = 'north' | 'south' | 'west' | 'east';
export type SwingDirection = 'negative' | 'positive';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BeamLayoutInput {
  roomWidth: number;
  roomLength: number;
  beamWall: Wall;
  beamDistance: number;
  beamWidth: number;
  beamDrop: number;
  ceilingHeight: number;
  bed: Rect & { headSide: Wall };
  desk: Rect & { seatSide: Wall; seatDepth: number };
  door: {
    wall: Wall;
    hingeOffset: number;
    width: number;
    swingDirection: SwingDirection;
  };
  walkwayWidth: number;
}

export interface ZoneCheck {
  underBeam: boolean;
  overlap: number;
  clearanceNeeded: number;
}

export interface MovementOption {
  direction: Wall;
  requiredShift: number;
  recommendedShift: number | null;
  feasible: boolean;
  shortfall: number;
  reasons: Array<'room' | 'door' | 'walkway' | 'furniture'>;
}

export interface BeamLayoutAnalysis {
  errors: string[];
  beam: Rect | null;
  beamUndersideHeight: number;
  bedHead: ZoneCheck;
  bedBody: ZoneCheck;
  deskSeat: ZoneCheck;
  bedMoves: MovementOption[];
  deskMoves: MovementOption[];
  currentDoorConflict: boolean;
}

const CLEARANCE = 1;
const BED_HEAD_ZONE = 35;

const right = (rect: Rect) => rect.x + rect.width;
const bottom = (rect: Rect) => rect.y + rect.height;
const overlapsRange = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  Math.min(aEnd, bEnd) > Math.max(aStart, bStart);

function intersects(a: Rect, b: Rect) {
  return overlapsRange(a.x, right(a), b.x, right(b))
    && overlapsRange(a.y, bottom(a), b.y, bottom(b));
}

function translate(rect: Rect, direction: Wall, amount: number): Rect {
  const x = direction === 'west' ? rect.x - amount : direction === 'east' ? rect.x + amount : rect.x;
  const y = direction === 'north' ? rect.y - amount : direction === 'south' ? rect.y + amount : rect.y;
  return { ...rect, x, y };
}

function envelope(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(right(a), right(b)) - x,
    height: Math.max(bottom(a), bottom(b)) - y,
  };
}

function isInside(rect: Rect, roomWidth: number, roomLength: number) {
  return rect.x >= 0 && rect.y >= 0 && right(rect) <= roomWidth && bottom(rect) <= roomLength;
}

function beamRect(input: BeamLayoutInput): Rect {
  if (input.beamWall === 'north') {
    return { x: 0, y: input.beamDistance, width: input.roomWidth, height: input.beamWidth };
  }
  if (input.beamWall === 'south') {
    return {
      x: 0,
      y: input.roomLength - input.beamDistance - input.beamWidth,
      width: input.roomWidth,
      height: input.beamWidth,
    };
  }
  if (input.beamWall === 'west') {
    return { x: input.beamDistance, y: 0, width: input.beamWidth, height: input.roomLength };
  }
  return {
    x: input.roomWidth - input.beamDistance - input.beamWidth,
    y: 0,
    width: input.beamWidth,
    height: input.roomLength,
  };
}

function headZone(bed: BeamLayoutInput['bed']): Rect {
  const depth = Math.min(BED_HEAD_ZONE, bed.headSide === 'north' || bed.headSide === 'south' ? bed.height : bed.width);
  if (bed.headSide === 'north') return { x: bed.x, y: bed.y, width: bed.width, height: depth };
  if (bed.headSide === 'south') return { x: bed.x, y: bottom(bed) - depth, width: bed.width, height: depth };
  if (bed.headSide === 'west') return { x: bed.x, y: bed.y, width: depth, height: bed.height };
  return { x: right(bed) - depth, y: bed.y, width: depth, height: bed.height };
}

function seatZone(desk: BeamLayoutInput['desk']): Rect {
  if (desk.seatSide === 'north') {
    return { x: desk.x, y: desk.y - desk.seatDepth, width: desk.width, height: desk.seatDepth };
  }
  if (desk.seatSide === 'south') {
    return { x: desk.x, y: bottom(desk), width: desk.width, height: desk.seatDepth };
  }
  if (desk.seatSide === 'west') {
    return { x: desk.x - desk.seatDepth, y: desk.y, width: desk.seatDepth, height: desk.height };
  }
  return { x: right(desk), y: desk.y, width: desk.seatDepth, height: desk.height };
}

function zoneCheck(zone: Rect, beam: Rect, horizontalBeam: boolean): ZoneCheck {
  if (!intersects(zone, beam)) return { underBeam: false, overlap: 0, clearanceNeeded: 0 };
  const overlap = horizontalBeam
    ? Math.min(bottom(zone), bottom(beam)) - Math.max(zone.y, beam.y)
    : Math.min(right(zone), right(beam)) - Math.max(zone.x, beam.x);
  const directions = horizontalBeam
    ? [bottom(zone) - beam.y, bottom(beam) - zone.y]
    : [right(zone) - beam.x, right(beam) - zone.x];
  return {
    underBeam: true,
    overlap: Math.max(0, Math.ceil(overlap)),
    clearanceNeeded: Math.max(0, Math.ceil(Math.min(...directions) + CLEARANCE)),
  };
}

function doorGeometry(input: BeamLayoutInput) {
  const { wall, hingeOffset, width, swingDirection } = input.door;
  if (wall === 'north' || wall === 'south') {
    return {
      hingeX: hingeOffset,
      hingeY: wall === 'north' ? 0 : input.roomLength,
      xSign: swingDirection === 'positive' ? 1 : -1,
      ySign: wall === 'north' ? 1 : -1,
      radius: width,
    };
  }
  return {
    hingeX: wall === 'west' ? 0 : input.roomWidth,
    hingeY: hingeOffset,
    xSign: wall === 'west' ? 1 : -1,
    ySign: swingDirection === 'positive' ? 1 : -1,
    radius: width,
  };
}

function intersectsDoorSwing(rect: Rect, input: BeamLayoutInput) {
  const door = doorGeometry(input);
  const quadrantXMin = door.xSign > 0 ? door.hingeX : door.hingeX - door.radius;
  const quadrantXMax = door.xSign > 0 ? door.hingeX + door.radius : door.hingeX;
  const quadrantYMin = door.ySign > 0 ? door.hingeY : door.hingeY - door.radius;
  const quadrantYMax = door.ySign > 0 ? door.hingeY + door.radius : door.hingeY;
  const clippedXMin = Math.max(rect.x, quadrantXMin);
  const clippedXMax = Math.min(right(rect), quadrantXMax);
  const clippedYMin = Math.max(rect.y, quadrantYMin);
  const clippedYMax = Math.min(bottom(rect), quadrantYMax);
  if (clippedXMax <= clippedXMin || clippedYMax <= clippedYMin) return false;
  const closestX = Math.max(clippedXMin, Math.min(door.hingeX, clippedXMax));
  const closestY = Math.max(clippedYMin, Math.min(door.hingeY, clippedYMax));
  return Math.hypot(closestX - door.hingeX, closestY - door.hingeY) < door.radius;
}

function accessClearance(rect: Rect, blockers: Rect[], roomWidth: number, roomLength: number) {
  let leftGap = rect.x;
  let rightGap = roomWidth - right(rect);
  let northGap = rect.y;
  let southGap = roomLength - bottom(rect);

  for (const blocker of blockers) {
    if (overlapsRange(rect.y, bottom(rect), blocker.y, bottom(blocker))) {
      if (right(blocker) <= rect.x) leftGap = Math.min(leftGap, rect.x - right(blocker));
      if (blocker.x >= right(rect)) rightGap = Math.min(rightGap, blocker.x - right(rect));
    }
    if (overlapsRange(rect.x, right(rect), blocker.x, right(blocker))) {
      if (bottom(blocker) <= rect.y) northGap = Math.min(northGap, rect.y - bottom(blocker));
      if (blocker.y >= bottom(rect)) southGap = Math.min(southGap, blocker.y - bottom(rect));
    }
  }
  return Math.max(leftGap, rightGap, northGap, southGap);
}

function maximumShift(rects: Rect[], direction: Wall, input: BeamLayoutInput) {
  if (direction === 'north') return Math.min(...rects.map((rect) => rect.y));
  if (direction === 'south') return Math.min(...rects.map((rect) => input.roomLength - bottom(rect)));
  if (direction === 'west') return Math.min(...rects.map((rect) => rect.x));
  return Math.min(...rects.map((rect) => input.roomWidth - right(rect)));
}

function placementReasons(
  furniture: Rect,
  activityZone: Rect,
  otherFurniture: Rect,
  input: BeamLayoutInput,
) {
  const reasons = new Set<MovementOption['reasons'][number]>();
  const activityEnvelope = envelope(furniture, activityZone);
  let walkwayShortfall = 0;
  if (!isInside(furniture, input.roomWidth, input.roomLength) || !isInside(activityZone, input.roomWidth, input.roomLength)) {
    reasons.add('room');
  }
  if (intersects(furniture, otherFurniture) || intersects(activityZone, otherFurniture)) reasons.add('furniture');
  if (intersectsDoorSwing(furniture, input) || intersectsDoorSwing(activityZone, input)) reasons.add('door');
  const availableWalkway = accessClearance(activityEnvelope, [otherFurniture], input.roomWidth, input.roomLength);
  if (availableWalkway < input.walkwayWidth) {
    reasons.add('walkway');
    walkwayShortfall = Math.ceil(input.walkwayWidth - availableWalkway);
  }
  return { reasons: [...reasons], walkwayShortfall };
}

function buildMoves(
  furniture: Rect,
  activityZone: Rect,
  otherFurniture: Rect,
  beam: Rect,
  input: BeamLayoutInput,
): MovementOption[] {
  if (!intersects(activityZone, beam)) return [];
  const horizontalBeam = input.beamWall === 'north' || input.beamWall === 'south';
  const requiredByDirection: Array<[Wall, number]> = horizontalBeam
    ? [
        ['north', bottom(activityZone) - beam.y + CLEARANCE],
        ['south', bottom(beam) - activityZone.y + CLEARANCE],
      ]
    : [
        ['west', right(activityZone) - beam.x + CLEARANCE],
        ['east', right(beam) - activityZone.x + CLEARANCE],
      ];

  return requiredByDirection.map(([direction, rawRequired]) => {
    const requiredShift = Math.max(0, Math.ceil(rawRequired));
    const maxShift = Math.max(0, Math.floor(maximumShift([furniture, activityZone], direction, input)));
    let bestWalkwayShortfall = Number.POSITIVE_INFINITY;
    const failedReasons = new Set<MovementOption['reasons'][number]>();

    for (let shift = requiredShift; shift <= maxShift; shift += 1) {
      const movedFurniture = translate(furniture, direction, shift);
      const movedActivity = translate(activityZone, direction, shift);
      const check = placementReasons(movedFurniture, movedActivity, otherFurniture, input);
      if (check.reasons.length === 0) {
        return {
          direction,
          requiredShift,
          recommendedShift: shift,
          feasible: true,
          shortfall: 0,
          reasons: [],
        };
      }
      check.reasons.forEach((reason) => failedReasons.add(reason));
      bestWalkwayShortfall = Math.min(bestWalkwayShortfall, check.walkwayShortfall || Number.POSITIVE_INFINITY);
    }

    if (requiredShift > maxShift) failedReasons.add('room');
    const roomShortfall = Math.max(0, requiredShift - maxShift);
    const walkwayShortfall = Number.isFinite(bestWalkwayShortfall) ? bestWalkwayShortfall : 0;
    return {
      direction,
      requiredShift,
      recommendedShift: null,
      feasible: false,
      shortfall: Math.max(roomShortfall, walkwayShortfall),
      reasons: [...failedReasons],
    };
  }).sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return (a.recommendedShift ?? a.requiredShift) - (b.recommendedShift ?? b.requiredShift);
  });
}

function validate(input: BeamLayoutInput) {
  const errors: string[] = [];
  const positiveValues: Array<[string, number]> = [
    ['roomWidth', input.roomWidth],
    ['roomLength', input.roomLength],
    ['beamWidth', input.beamWidth],
    ['ceilingHeight', input.ceilingHeight],
    ['bedWidth', input.bed.width],
    ['bedLength', input.bed.height],
    ['deskWidth', input.desk.width],
    ['deskDepth', input.desk.height],
    ['seatDepth', input.desk.seatDepth],
    ['doorWidth', input.door.width],
    ['walkwayWidth', input.walkwayWidth],
  ];
  for (const [name, value] of positiveValues) {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${name}:positive`);
  }
  const nonNegativeValues: Array<[string, number]> = [
    ['beamDistance', input.beamDistance],
    ['beamDrop', input.beamDrop],
    ['bedX', input.bed.x],
    ['bedY', input.bed.y],
    ['deskX', input.desk.x],
    ['deskY', input.desk.y],
    ['hingeOffset', input.door.hingeOffset],
  ];
  for (const [name, value] of nonNegativeValues) {
    if (!Number.isFinite(value) || value < 0) errors.push(`${name}:nonnegative`);
  }
  if (input.beamDrop >= input.ceilingHeight) errors.push('beamDrop:ceiling');
  const beamSpan = input.beamWall === 'north' || input.beamWall === 'south' ? input.roomLength : input.roomWidth;
  if (input.beamDistance + input.beamWidth > beamSpan) errors.push('beam:outside');
  if (!isInside(input.bed, input.roomWidth, input.roomLength)) errors.push('bed:outside');
  if (!isInside(input.desk, input.roomWidth, input.roomLength)) errors.push('desk:outside');
  const seat = seatZone(input.desk);
  if (!isInside(seat, input.roomWidth, input.roomLength)) errors.push('seat:outside');
  const wallSpan = input.door.wall === 'north' || input.door.wall === 'south' ? input.roomWidth : input.roomLength;
  if (input.door.hingeOffset > wallSpan) errors.push('door:hinge');
  if (input.door.swingDirection === 'positive' && input.door.hingeOffset + input.door.width > wallSpan) errors.push('door:span');
  if (input.door.swingDirection === 'negative' && input.door.hingeOffset - input.door.width < 0) errors.push('door:span');
  return errors;
}

export function analyzeBeamLayout(input: BeamLayoutInput): BeamLayoutAnalysis {
  const errors = validate(input);
  const emptyCheck = { underBeam: false, overlap: 0, clearanceNeeded: 0 };
  if (errors.length > 0) {
    return {
      errors,
      beam: null,
      beamUndersideHeight: Math.max(0, input.ceilingHeight - input.beamDrop),
      bedHead: emptyCheck,
      bedBody: emptyCheck,
      deskSeat: emptyCheck,
      bedMoves: [],
      deskMoves: [],
      currentDoorConflict: false,
    };
  }

  const beam = beamRect(input);
  const head = headZone(input.bed);
  const seat = seatZone(input.desk);
  const horizontalBeam = input.beamWall === 'north' || input.beamWall === 'south';
  const bedHead = zoneCheck(head, beam, horizontalBeam);
  const bedBody = zoneCheck(input.bed, beam, horizontalBeam);
  const deskSeat = zoneCheck(seat, beam, horizontalBeam);
  return {
    errors: [],
    beam,
    beamUndersideHeight: input.ceilingHeight - input.beamDrop,
    bedHead,
    bedBody,
    deskSeat,
    bedMoves: buildMoves(input.bed, input.bed, input.desk, beam, input),
    deskMoves: buildMoves(input.desk, seat, input.bed, beam, input),
    currentDoorConflict: intersectsDoorSwing(input.bed, input)
      || intersectsDoorSwing(input.desk, input)
      || intersectsDoorSwing(seat, input),
  };
}

export const beamLayoutAssumptions = {
  bedHeadZoneDepth: BED_HEAD_ZONE,
  edgeClearance: CLEARANCE,
};
