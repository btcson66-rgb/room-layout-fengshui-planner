import type { FurnitureAssessment, FurnitureItem, MovingProject, RoomMeasurement } from './types';

const MIN_COMFORT_MM: Record<string, number> = {
  bed: 600, wardrobe: 900, desk: 800, chair: 750, sofa: 700, 'dining-table': 900,
  cabinet: 600, shelving: 600, appliance: 700, mattress: 500, tv: 500, other: 600,
};

function sorted(d: { width: number; depth: number; height: number }): number[] {
  return [d.width, d.depth, d.height].sort((a, b) => a - b);
}

function effectiveDimensions(item: FurnitureItem) {
  return item.canDisassemble && item.disassembledDimensions ? item.disassembledDimensions : item.dimensions;
}

function narrowestPositive(values: number[]): number | null {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0);
  return usable.length ? Math.min(...usable) : null;
}

function roomFor(project: MovingProject, item: FurnitureItem): RoomMeasurement | undefined {
  return project.rooms.find((room) => room.id === item.destinationRoomId);
}

export function assessFurniture(project: MovingProject, item: FurnitureItem): FurnitureAssessment {
  const reasons: string[] = [];
  const dims = effectiveDimensions(item);
  const [small, middle, large] = sorted(dims);
  const route = project.entryRoute;
  const elevatorPathComplete = [route.elevatorWidthMm, route.elevatorDepthMm, route.elevatorHeightMm, route.elevatorDoorWidthMm].every((value) => value > 0);
  const stairPathComplete = [route.stairWidthMm, route.landingWidthMm, route.landingDepthMm].every((value) => value > 0);
  const routeComplete = [route.oldHomeExitWidthMm, route.oldHomeExitHeightMm, route.corridorWidthMm, route.entranceWidthMm, route.entranceHeightMm, route.interiorDoorWidthMm, route.interiorDoorHeightMm].every((value) => value > 0) && (elevatorPathComplete || stairPathComplete);
  const pathWidths = elevatorPathComplete ? [route.elevatorWidthMm, route.elevatorDoorWidthMm] : [route.stairWidthMm, route.landingWidthMm];
  const pathHeights = elevatorPathComplete ? [route.elevatorHeightMm] : [];
  const turnDepth = elevatorPathComplete ? route.elevatorDepthMm : route.landingDepthMm;
  const routeWidth = narrowestPositive([
    route.oldHomeExitWidthMm, ...pathWidths, route.corridorWidthMm, route.entranceWidthMm, route.interiorDoorWidthMm,
  ]);
  const routeHeight = narrowestPositive([route.oldHomeExitHeightMm, ...pathHeights, route.entranceHeightMm, route.interiorDoorHeightMm]);
  let entry: FurnitureAssessment['entry'] = 'review';
  if (!routeComplete || !routeWidth || !routeHeight) {
    reasons.push('Entry route measurements are incomplete, so mover review is required.');
  } else if (small > routeWidth || middle > routeHeight) {
    entry = 'fail';
    reasons.push(`Current measured orientation does not pass the narrowest route (${routeWidth} × ${routeHeight} mm).`);
  } else if (large > turnDepth) {
    entry = 'review';
    reasons.push('The item may clear openings but needs a turning-space review.');
  } else {
    entry = 'likely';
    reasons.push('The item clears the measured route in at least one simple orientation.');
  }
  if (item.canDisassemble && item.disassembledDimensions) reasons.push('Entry check uses the recorded disassembled dimensions.');

  const room = roomFor(project, item);
  let roomStatus: FurnitureAssessment['room'] = 'fail';
  let usability: FurnitureAssessment['usability'] = 'conflict';
  if (!room) {
    reasons.push('Choose a destination room to calculate room fit.');
  } else {
    const orientations = [
      { w: item.dimensions.width, d: item.dimensions.depth },
      { w: item.dimensions.depth, d: item.dimensions.width },
    ];
    const fitting = orientations.filter((o) => o.w <= room.lengthMm && o.d <= room.widthMm);
    if (!fitting.length || item.dimensions.height > room.ceilingMm) {
      reasons.push('Furniture exceeds the destination room boundary or ceiling in both 90° orientations.');
    } else {
      const clearance = Math.max(...fitting.map((o) => Math.min(room.lengthMm - o.w, room.widthMm - o.d)));
      roomStatus = clearance < 100 ? 'tight' : 'pass';
      reasons.push(roomStatus === 'pass' ? 'Furniture fits the room boundary in a 0° or 90° orientation.' : 'Furniture fits with less than 100 mm spare on one axis.');
      const needed = MIN_COMFORT_MM[item.category] ?? 600;
      usability = clearance >= needed ? 'comfortable' : clearance >= Math.max(300, needed / 2) ? 'tight' : 'conflict';
      reasons.push(usability === 'comfortable'
        ? `At least ${needed} mm remains on the limiting axis for basic use.`
        : `Remaining clearance is below the ${needed} mm review target for this category.`);
      if (room.fixedObjects.length) {
        if (roomStatus === 'pass') roomStatus = 'tight';
        if (usability === 'comfortable') usability = 'tight';
        reasons.push('Fixed objects are recorded in this room; confirm their exact footprint and position in the integrated layout planner.');
      }
    }
  }

  let recommendation: FurnitureAssessment['recommendation'] = 'keep';
  if (item.decision === 'sell' || item.decision === 'donate' || item.decision === 'dispose') recommendation = 'sell';
  else if (roomStatus === 'fail') recommendation = 'replace';
  else if (entry === 'fail' || entry === 'review' || usability === 'conflict') recommendation = 'review-mover';
  else if (item.canDisassemble && item.disassembledDimensions) recommendation = 'keep-disassemble';

  reasons.push('Preliminary measurement check only; complex 3D rotation, materials, obstacles, and mover technique are not modelled.');
  return { entry, room: roomStatus, usability, recommendation, reasons };
}
