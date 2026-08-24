export type Wall = 'north' | 'south' | 'west' | 'east';
export type DoorSwing = 'inward-left' | 'inward-right' | 'sliding';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DeskDoorInput {
  roomWidth: number;
  roomLength: number;
  door: {
    wall: Wall;
    offset: number;
    width: number;
    swing: DoorSwing;
  };
  circulationWidth: number;
  window?: {
    wall: Wall;
    offset: number;
    width: number;
  };
  desk: {
    x: number;
    y: number;
    width: number;
    depth: number;
    facing: Wall;
  };
  chairClearance: number;
}

export interface MovementOption {
  direction: Wall;
  requiredShift: number | null;
  feasibleShift: number | null;
  roomShortfall: number;
}

export interface MovementResult {
  options: MovementOption[];
  best: MovementOption | null;
}

export interface DeskDoorAnalysis {
  errors: string[];
  deskRect: Rect;
  activityRect: Rect;
  door: {
    bandRect: Rect;
    pathIntersects: boolean;
    swingIntersects: boolean;
    bandOverlapDepth: number;
    bandOverlapSpan: number;
    minimumClearance: number;
  };
  back: {
    toDoorOrWalkway: boolean;
    pathDistance: number | null;
    wallDistance: number;
  };
  window: {
    relation: 'none' | 'front' | 'back' | 'side' | 'offset';
    projectedOverlap: number;
  };
  movements: {
    door: MovementResult | null;
    back: MovementResult | null;
    window: MovementResult | null;
  };
  alternatives: {
    rotate: {
      requiredWidth: number;
      requiredLength: number;
      feasible: boolean;
      facing: Wall | null;
    };
    shelf: {
      requiredBehind: number;
      availableBehind: number;
      shortfall: number;
      feasible: boolean;
    };
    swap: {
      requiredWidth: number;
      requiredLength: number;
    };
  };
}

interface DoorGeometry {
  bandRect: Rect;
  hingeX: number;
  hingeY: number;
  alongAxis: 'x' | 'y';
  alongSign: 1 | -1;
  inwardAxis: 'x' | 'y';
  inwardSign: 1 | -1;
  radius: number;
  sliding: boolean;
}

const DIRECTIONS: Wall[] = ['north', 'south', 'west', 'east'];
const SHELF_DEPTH = 25;

const right = (rect: Rect) => rect.x + rect.width;
const bottom = (rect: Rect) => rect.y + rect.height;
const overlapsRange = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  Math.min(aEnd, bEnd) > Math.max(aStart, bStart);

function intersects(a: Rect, b: Rect) {
  return overlapsRange(a.x, right(a), b.x, right(b))
    && overlapsRange(a.y, bottom(a), b.y, bottom(b));
}

function isInside(rect: Rect, roomWidth: number, roomLength: number) {
  return rect.x >= 0 && rect.y >= 0 && right(rect) <= roomWidth && bottom(rect) <= roomLength;
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

function opposite(wall: Wall): Wall {
  if (wall === 'north') return 'south';
  if (wall === 'south') return 'north';
  if (wall === 'west') return 'east';
  return 'west';
}

function deskRect(input: DeskDoorInput): Rect {
  const horizontalFacing = input.desk.facing === 'north' || input.desk.facing === 'south';
  return {
    x: input.desk.x,
    y: input.desk.y,
    width: horizontalFacing ? input.desk.width : input.desk.depth,
    height: horizontalFacing ? input.desk.depth : input.desk.width,
  };
}

function chairRect(input: DeskDoorInput, desk: Rect): Rect {
  if (input.desk.facing === 'north') {
    return { x: desk.x, y: bottom(desk), width: desk.width, height: input.chairClearance };
  }
  if (input.desk.facing === 'south') {
    return { x: desk.x, y: desk.y - input.chairClearance, width: desk.width, height: input.chairClearance };
  }
  if (input.desk.facing === 'west') {
    return { x: right(desk), y: desk.y, width: input.chairClearance, height: desk.height };
  }
  return { x: desk.x - input.chairClearance, y: desk.y, width: input.chairClearance, height: desk.height };
}

function activityRect(input: DeskDoorInput) {
  const desk = deskRect(input);
  return envelope(desk, chairRect(input, desk));
}

function wallSpan(input: DeskDoorInput, wall: Wall) {
  return wall === 'north' || wall === 'south' ? input.roomWidth : input.roomLength;
}

function doorGeometry(input: DeskDoorInput): DoorGeometry {
  const { wall, offset, width, swing } = input.door;
  const horizontal = wall === 'north' || wall === 'south';
  const leftIsStart = wall === 'north' || wall === 'east';
  const hingeAtStart = swing === 'inward-left' ? leftIsStart : !leftIsStart;
  const hingeOffset = hingeAtStart ? offset : offset + width;
  const bandRect = wall === 'north'
    ? { x: offset, y: 0, width, height: input.circulationWidth }
    : wall === 'south'
      ? { x: offset, y: input.roomLength - input.circulationWidth, width, height: input.circulationWidth }
      : wall === 'west'
        ? { x: 0, y: offset, width: input.circulationWidth, height: width }
        : { x: input.roomWidth - input.circulationWidth, y: offset, width: input.circulationWidth, height: width };

  return {
    bandRect,
    hingeX: horizontal ? hingeOffset : wall === 'west' ? 0 : input.roomWidth,
    hingeY: horizontal ? wall === 'north' ? 0 : input.roomLength : hingeOffset,
    alongAxis: horizontal ? 'x' : 'y',
    alongSign: hingeAtStart ? 1 : -1,
    inwardAxis: horizontal ? 'y' : 'x',
    inwardSign: wall === 'north' || wall === 'west' ? 1 : -1,
    radius: width,
    sliding: swing === 'sliding',
  };
}

function signedRange(rect: Rect, axis: 'x' | 'y', origin: number, sign: 1 | -1): [number, number] {
  const start = axis === 'x' ? rect.x : rect.y;
  const end = axis === 'x' ? right(rect) : bottom(rect);
  const a = (start - origin) * sign;
  const b = (end - origin) * sign;
  return [Math.min(a, b), Math.max(a, b)];
}

function intersectsDoorSector(rect: Rect, geometry: DoorGeometry) {
  if (geometry.sliding) return false;
  const alongOrigin = geometry.alongAxis === 'x' ? geometry.hingeX : geometry.hingeY;
  const inwardOrigin = geometry.inwardAxis === 'x' ? geometry.hingeX : geometry.hingeY;
  const [alongMin, alongMax] = signedRange(rect, geometry.alongAxis, alongOrigin, geometry.alongSign);
  const [inwardMin, inwardMax] = signedRange(rect, geometry.inwardAxis, inwardOrigin, geometry.inwardSign);
  if (alongMax <= 0 || inwardMax <= 0) return false;
  const nearestAlong = Math.max(0, alongMin);
  const nearestInward = Math.max(0, inwardMin);
  return Math.hypot(nearestAlong, nearestInward) < geometry.radius;
}

function doorPathStatus(rect: Rect, input: DeskDoorInput) {
  const geometry = doorGeometry(input);
  const bandIntersects = intersects(rect, geometry.bandRect);
  const swingIntersects = intersectsDoorSector(rect, geometry);
  const overlapWidth = bandIntersects
    ? Math.min(right(rect), right(geometry.bandRect)) - Math.max(rect.x, geometry.bandRect.x)
    : 0;
  const overlapHeight = bandIntersects
    ? Math.min(bottom(rect), bottom(geometry.bandRect)) - Math.max(rect.y, geometry.bandRect.y)
    : 0;
  const horizontalDoor = input.door.wall === 'north' || input.door.wall === 'south';
  return {
    geometry,
    pathIntersects: bandIntersects || swingIntersects,
    swingIntersects,
    bandOverlapDepth: Math.max(0, Math.ceil(horizontalDoor ? overlapHeight : overlapWidth)),
    bandOverlapSpan: Math.max(0, Math.ceil(horizontalDoor ? overlapWidth : overlapHeight)),
  };
}

function wallDistanceBehind(rect: Rect, input: DeskDoorInput) {
  const back = opposite(input.desk.facing);
  if (back === 'north') return rect.y;
  if (back === 'south') return input.roomLength - bottom(rect);
  if (back === 'west') return rect.x;
  return input.roomWidth - right(rect);
}

function stripBehind(rect: Rect, back: Wall, gap: number): Rect {
  if (back === 'north') return { x: rect.x, y: rect.y - gap - 1, width: rect.width, height: 1 };
  if (back === 'south') return { x: rect.x, y: bottom(rect) + gap, width: rect.width, height: 1 };
  if (back === 'west') return { x: rect.x - gap - 1, y: rect.y, width: 1, height: rect.height };
  return { x: right(rect) + gap, y: rect.y, width: 1, height: rect.height };
}

function backStatus(rect: Rect, input: DeskDoorInput) {
  const wallDistance = Math.max(0, wallDistanceBehind(rect, input));
  if (doorPathStatus(rect, input).pathIntersects) {
    return { toDoorOrWalkway: true, pathDistance: 0, wallDistance: Math.ceil(wallDistance) };
  }
  const back = opposite(input.desk.facing);
  for (let gap = 0; gap <= Math.ceil(wallDistance); gap += 1) {
    if (doorPathStatus(stripBehind(rect, back, gap), input).pathIntersects) {
      return { toDoorOrWalkway: true, pathDistance: gap, wallDistance: Math.ceil(wallDistance) };
    }
  }
  return { toDoorOrWalkway: false, pathDistance: null, wallDistance: Math.ceil(wallDistance) };
}

function windowStatus(input: DeskDoorInput) {
  if (!input.window) return { relation: 'none' as const, projectedOverlap: 0 };
  const desk = deskRect(input);
  const horizontalWindow = input.window.wall === 'north' || input.window.wall === 'south';
  const projectedOverlap = horizontalWindow
    ? Math.min(right(desk), input.window.offset + input.window.width) - Math.max(desk.x, input.window.offset)
    : Math.min(bottom(desk), input.window.offset + input.window.width) - Math.max(desk.y, input.window.offset);
  if (projectedOverlap <= 0) return { relation: 'offset' as const, projectedOverlap: 0 };
  if (input.window.wall === input.desk.facing) {
    return { relation: 'front' as const, projectedOverlap: Math.ceil(projectedOverlap) };
  }
  if (input.window.wall === opposite(input.desk.facing)) {
    return { relation: 'back' as const, projectedOverlap: Math.ceil(projectedOverlap) };
  }
  return { relation: 'side' as const, projectedOverlap: Math.ceil(projectedOverlap) };
}

function translatedInput(input: DeskDoorInput, direction: Wall, amount: number): DeskDoorInput {
  return {
    ...input,
    desk: {
      ...input.desk,
      x: input.desk.x + (direction === 'east' ? amount : direction === 'west' ? -amount : 0),
      y: input.desk.y + (direction === 'south' ? amount : direction === 'north' ? -amount : 0),
    },
  };
}

function roomShortfall(rect: Rect, input: DeskDoorInput) {
  return Math.max(
    0,
    Math.ceil(-rect.x),
    Math.ceil(-rect.y),
    Math.ceil(right(rect) - input.roomWidth),
    Math.ceil(bottom(rect) - input.roomLength),
  );
}

function buildMovement(input: DeskDoorInput, isClear: (candidate: DeskDoorInput) => boolean): MovementResult {
  const maxSearch = Math.ceil(Math.max(input.roomWidth, input.roomLength) * 2 + input.chairClearance + input.desk.width + 500);
  const options = DIRECTIONS.map((direction): MovementOption => {
    let requiredShift: number | null = null;
    let feasibleShift: number | null = null;
    let rawShortfall = 0;
    for (let shift = 1; shift <= maxSearch; shift += 1) {
      const candidate = translatedInput(input, direction, shift);
      if (!isClear(candidate)) continue;
      if (requiredShift === null) {
        requiredShift = shift;
        rawShortfall = roomShortfall(activityRect(candidate), candidate);
      }
      if (isInside(activityRect(candidate), candidate.roomWidth, candidate.roomLength)) {
        feasibleShift = shift;
        break;
      }
    }
    return { direction, requiredShift, feasibleShift, roomShortfall: feasibleShift === null ? rawShortfall : 0 };
  }).sort((a, b) => {
    const aFeasible = a.feasibleShift !== null;
    const bFeasible = b.feasibleShift !== null;
    if (aFeasible !== bFeasible) return aFeasible ? -1 : 1;
    return (a.feasibleShift ?? a.requiredShift ?? Number.POSITIVE_INFINITY)
      - (b.feasibleShift ?? b.requiredShift ?? Number.POSITIVE_INFINITY);
  });
  return { options, best: options.find((option) => option.feasibleShift !== null) ?? null };
}

function rotatedCandidates(input: DeskDoorInput) {
  const facingOptions: Record<Wall, [Wall, Wall]> = {
    north: ['west', 'east'],
    south: ['east', 'west'],
    west: ['south', 'north'],
    east: ['north', 'south'],
  };
  const currentDesk = deskRect(input);
  const centerX = currentDesk.x + currentDesk.width / 2;
  const centerY = currentDesk.y + currentDesk.height / 2;
  return facingOptions[input.desk.facing].map((facing) => {
    const horizontalFacing = facing === 'north' || facing === 'south';
    const width = horizontalFacing ? input.desk.width : input.desk.depth;
    const height = horizontalFacing ? input.desk.depth : input.desk.width;
    return {
      ...input,
      desk: {
        ...input.desk,
        facing,
        x: centerX - width / 2,
        y: centerY - height / 2,
      },
    };
  });
}

function validate(input: DeskDoorInput) {
  const errors: string[] = [];
  const positiveValues: Array<[string, number]> = [
    ['roomWidth', input.roomWidth],
    ['roomLength', input.roomLength],
    ['doorWidth', input.door.width],
    ['circulationWidth', input.circulationWidth],
    ['deskWidth', input.desk.width],
    ['deskDepth', input.desk.depth],
    ['chairClearance', input.chairClearance],
  ];
  for (const [name, value] of positiveValues) {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${name}:positive`);
  }
  const nonNegativeValues: Array<[string, number]> = [
    ['doorOffset', input.door.offset],
    ['deskX', input.desk.x],
    ['deskY', input.desk.y],
  ];
  for (const [name, value] of nonNegativeValues) {
    if (!Number.isFinite(value) || value < 0) errors.push(`${name}:nonnegative`);
  }
  if (input.circulationWidth < 60 || input.circulationWidth > 75) errors.push('circulationWidth:range');
  if (input.door.offset + input.door.width > wallSpan(input, input.door.wall)) errors.push('door:outside');
  if (input.window) {
    if (!Number.isFinite(input.window.offset) || input.window.offset < 0) errors.push('windowOffset:nonnegative');
    if (!Number.isFinite(input.window.width) || input.window.width <= 0) errors.push('windowWidth:positive');
    if (input.window.offset + input.window.width > wallSpan(input, input.window.wall)) errors.push('window:outside');
  }
  if (!isInside(deskRect(input), input.roomWidth, input.roomLength)) errors.push('desk:outside');
  return errors;
}

export function analyzeDeskDoor(input: DeskDoorInput): DeskDoorAnalysis {
  const errors = validate(input);
  const currentDesk = deskRect(input);
  const activity = activityRect(input);
  const currentDoor = doorPathStatus(activity, input);
  const currentBack = backStatus(activity, input);
  const currentWindow = windowStatus(input);

  const doorMovement = currentDoor.pathIntersects
    ? buildMovement(input, (candidate) => !doorPathStatus(activityRect(candidate), candidate).pathIntersects)
    : null;
  const backMovement = currentBack.toDoorOrWalkway
    ? buildMovement(input, (candidate) => {
        const candidateActivity = activityRect(candidate);
        return !doorPathStatus(candidateActivity, candidate).pathIntersects
          && !backStatus(candidateActivity, candidate).toDoorOrWalkway;
      })
    : null;
  const windowMovement = currentWindow.relation === 'front' || currentWindow.relation === 'back'
    ? buildMovement(input, (candidate) => {
        const relation = windowStatus(candidate).relation;
        return relation !== 'front' && relation !== 'back';
      })
    : null;

  const rotated = rotatedCandidates(input);
  const rotatedActivity = activityRect(rotated[0]);
  const workableRotation = rotated.find((candidate) => {
    const candidateActivity = activityRect(candidate);
    const candidateWindow = windowStatus(candidate);
    return isInside(candidateActivity, candidate.roomWidth, candidate.roomLength)
      && !doorPathStatus(candidateActivity, candidate).pathIntersects
      && candidateWindow.relation !== 'front'
      && candidateWindow.relation !== 'back';
  });
  const requiredBehind = SHELF_DEPTH + (currentBack.toDoorOrWalkway ? input.circulationWidth : 0);
  const availableBehind = currentBack.wallDistance;
  const doorMovementOptions = doorMovement?.options.filter((option) => option.requiredShift !== null) ?? [];
  const minimumClearance = doorMovementOptions.length > 0
    ? Math.min(...doorMovementOptions.map((option) => option.requiredShift ?? Number.POSITIVE_INFINITY))
    : 0;

  return {
    errors,
    deskRect: currentDesk,
    activityRect: activity,
    door: {
      bandRect: currentDoor.geometry.bandRect,
      pathIntersects: currentDoor.pathIntersects,
      swingIntersects: currentDoor.swingIntersects,
      bandOverlapDepth: currentDoor.bandOverlapDepth,
      bandOverlapSpan: currentDoor.bandOverlapSpan,
      minimumClearance: Number.isFinite(minimumClearance) ? minimumClearance : 0,
    },
    back: currentBack,
    window: currentWindow,
    movements: { door: doorMovement, back: backMovement, window: windowMovement },
    alternatives: {
      rotate: {
        requiredWidth: Math.ceil(rotatedActivity.width),
        requiredLength: Math.ceil(rotatedActivity.height),
        feasible: Boolean(workableRotation),
        facing: workableRotation?.desk.facing ?? null,
      },
      shelf: {
        requiredBehind,
        availableBehind,
        shortfall: Math.max(0, requiredBehind - availableBehind),
        feasible: availableBehind >= requiredBehind,
      },
      swap: {
        requiredWidth: Math.ceil(activity.width),
        requiredLength: Math.ceil(activity.height),
      },
    },
  };
}

export const deskDoorAssumptions = {
  shelfDepth: SHELF_DEPTH,
  circulationMinimum: 60,
  circulationMaximum: 75,
};
