import type { Design, FurnitureItem, PlannerStrings, PlannerWarning } from './types';

const WALKWAY_THRESHOLD_CM = 60;
const WALL_TOLERANCE_CM = 18;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function boxFor(item: FurnitureItem): Box {
  return {
    left: item.x,
    right: item.x + item.w,
    top: item.y,
    bottom: item.y + item.h,
  };
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function doorClearance(door: FurnitureItem): Box {
  const horizontal = Math.abs(door.rotation % 180) < 45 || Math.abs(door.rotation % 180) > 135;
  if (horizontal) {
    return {
      left: Math.max(0, door.x),
      right: door.x + Math.max(door.w, 90),
      top: door.y,
      bottom: door.y + Math.max(door.w, 90),
    };
  }
  return {
    left: door.x - Math.max(door.h, 12),
    right: door.x + Math.max(door.w, 90),
    top: Math.max(0, door.y - Math.max(door.w, 90)),
    bottom: door.y + Math.max(door.h, 12),
  };
}

function sortedGaps(items: FurnitureItem[], roomSize: number, axis: 'x' | 'y'): number[] {
  const segments = items
    .filter((item) => item.type !== 'door' && item.type !== 'window' && item.type !== 'mirror')
    .map((item) => (axis === 'x' ? [item.x, item.x + item.w] : [item.y, item.y + item.h]))
    .sort((a, b) => a[0] - b[0]);
  const gaps: number[] = [];
  let cursor = 0;
  for (const [start, end] of segments) {
    gaps.push(Math.max(0, start - cursor));
    cursor = Math.max(cursor, end);
  }
  gaps.push(Math.max(0, roomSize - cursor));
  return gaps;
}

export function runStructuralChecks(design: Design, strings: PlannerStrings): PlannerWarning[] {
  const warnings: PlannerWarning[] = [];
  const bounds = design.items.filter((item) => {
    const box = boxFor(item);
    return box.left < 0 || box.top < 0 || box.right > design.room.w || box.bottom > design.room.h;
  });
  if (bounds.length > 0) {
    warnings.push({ id: 'bounds', severity: 'warn', message: strings.warnings.bounds });
  }

  const door = design.items.find((item) => item.type === 'door');
  if (door) {
    const zone = doorClearance(door);
    const blocked = design.items.some((item) => item.id !== door.id && item.type !== 'window' && overlaps(zone, boxFor(item)));
    if (blocked) {
      warnings.push({ id: 'door', severity: 'warn', message: strings.warnings.door });
    }
  }

  const xGaps = sortedGaps(design.items, design.room.w, 'x');
  const yGaps = sortedGaps(design.items, design.room.h, 'y');
  const bestGap = Math.max(...xGaps, ...yGaps);
  if (bestGap < WALKWAY_THRESHOLD_CM || (door && warnings.some((warning) => warning.id === 'door'))) {
    warnings.push({ id: 'aisle', severity: 'info', message: strings.warnings.aisle });
  }

  return warnings;
}

export function runFengShuiChecks(design: Design, strings: PlannerStrings): PlannerWarning[] {
  const notes: PlannerWarning[] = [];
  const bed = design.items.find((item) => item.type === 'bed');
  const door = design.items.find((item) => item.type === 'door');
  const mirror = design.items.find((item) => item.type === 'mirror');
  const desk = design.items.find((item) => item.type === 'desk');

  if (bed && door) {
    const alignedX = Math.abs((bed.x + bed.w / 2) - (door.x + door.w / 2)) < Math.max(bed.w, door.w) / 2;
    const alignedY = Math.abs((bed.y + bed.h / 2) - (door.y + door.h / 2)) < Math.max(bed.h, door.h) / 2;
    if (alignedX || alignedY) {
      notes.push({ id: 'fs-bed-door', severity: 'info', message: strings.fengShui.bedFacingDoor });
    }
  }

  if (bed && mirror) {
    const alignedX = Math.abs((bed.x + bed.w / 2) - (mirror.x + mirror.w / 2)) < bed.w / 2;
    const alignedY = Math.abs((bed.y + bed.h / 2) - (mirror.y + mirror.h / 2)) < bed.h / 2;
    if (alignedX || alignedY) {
      notes.push({ id: 'fs-mirror-bed', severity: 'info', message: strings.fengShui.mirrorFacingBed });
    }
  }

  if (desk) {
    const nearWall = desk.x < WALL_TOLERANCE_CM || desk.y < WALL_TOLERANCE_CM || design.room.w - (desk.x + desk.w) < WALL_TOLERANCE_CM || design.room.h - (desk.y + desk.h) < WALL_TOLERANCE_CM;
    if (!nearWall) {
      notes.push({ id: 'fs-desk-support', severity: 'info', message: strings.fengShui.deskNoSupport });
    }
  }

  if (door) {
    const zone = doorClearance(door);
    const blocked = design.items.some((item) => item.id !== door.id && item.type !== 'window' && overlaps(zone, boxFor(item)));
    if (blocked) {
      notes.push({ id: 'fs-doorway-blocked', severity: 'info', message: strings.fengShui.doorwayBlocked });
    }
  }

  if (bed) {
    const headAgainstWall = bed.y < WALL_TOLERANCE_CM || bed.x < WALL_TOLERANCE_CM || design.room.w - (bed.x + bed.w) < WALL_TOLERANCE_CM || design.room.h - (bed.y + bed.h) < WALL_TOLERANCE_CM;
    if (!headAgainstWall) {
      notes.push({ id: 'fs-headboard-wall', severity: 'info', message: strings.fengShui.headboardNoWall });
    }
  }

  return notes;
}
