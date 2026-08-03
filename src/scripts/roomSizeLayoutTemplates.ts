export type RoomSizeKey = '150' | '200' | '300' | '450';
export type LayoutPriority = 'sleep' | 'work' | 'hosting';

export interface RoomTemplateInput {
  size: RoomSizeKey;
  priority: LayoutPriority;
}

export interface LayoutVariant {
  name: string;
  bed: string;
  furniture: string;
  clearWidth: number;
  status: 'comfortable' | 'tight' | 'does-not-fit';
  note: string;
}

export interface RoomTemplateResult {
  squareFeet: number;
  squareMeters: number;
  assumedRoom: string;
  priorityLabel: string;
  variants: LayoutVariant[];
}

const rooms = {
  '150': { squareFeet: 150, width: 120, length: 180 },
  '200': { squareFeet: 200, width: 120, length: 240 },
  '300': { squareFeet: 300, width: 144, length: 300 },
  '450': { squareFeet: 450, width: 180, length: 360 },
} as const;

const priorities = {
  sleep: { label: 'sleep and closed storage', secondary: '18 in deep wardrobe/storage wall' },
  work: { label: 'sleep and work', secondary: '24 in deep desk; the chair uses part of the remaining clear width' },
  hosting: { label: 'sleep and occasional guests', secondary: '36 in deep loveseat or lounge chair zone' },
} as const;

function classify(clearWidth: number): LayoutVariant['status'] {
  if (clearWidth >= 36) return 'comfortable';
  if (clearWidth >= 24) return 'tight';
  return 'does-not-fit';
}

function bedFor(size: RoomSizeKey, priority: LayoutPriority) {
  if (size === '150') return { name: 'Twin', width: 38, length: 75 };
  if (size === '200' && priority === 'work') return { name: 'Full', width: 54, length: 75 };
  if (size === '200') return { name: 'Queen', width: 60, length: 80 };
  if (priority === 'work' && size === '300') return { name: 'Full', width: 54, length: 75 };
  return { name: 'Queen', width: 60, length: 80 };
}

export function buildRoomTemplates(input: RoomTemplateInput): RoomTemplateResult {
  const room = rooms[input.size];
  const priority = priorities[input.priority];
  const bed = bedFor(input.size, input.priority);
  const secondaryDepth = input.priority === 'sleep' ? 18 : input.priority === 'work' ? 24 : 36;
  const acrossRoomClear = room.width - bed.width - secondaryDepth;
  const endZoneDepth = input.priority === 'sleep' ? 24 : input.priority === 'work' ? 54 : 48;
  const endClear = room.length - bed.length - endZoneDepth;

  const variants: LayoutVariant[] = [
    {
      name: 'Opposite-wall layout',
      bed: `${bed.name} mattress (${bed.width} × ${bed.length} in)`,
      furniture: priority.secondary,
      clearWidth: acrossRoomClear,
      status: classify(acrossRoomClear),
      note: `The bed and ${priority.secondary} sit on opposite long walls. Clear width is room width ${room.width} in minus ${bed.width} in bed width minus ${secondaryDepth} in furniture depth.`,
    },
    {
      name: 'End-zone layout',
      bed: `${bed.name} mattress (${bed.width} × ${bed.length} in)`,
      furniture: `${endZoneDepth} in deep activity zone at the foot of the bed`,
      clearWidth: endClear,
      status: classify(endClear),
      note: `The second function moves to the end of the room. Remaining length is ${room.length} in minus ${bed.length} in bed length minus ${endZoneDepth} in activity depth.`,
    },
  ].sort((a, b) => b.clearWidth - a.clearWidth);

  return {
    squareFeet: room.squareFeet,
    squareMeters: Number((room.squareFeet * 0.092903).toFixed(1)),
    assumedRoom: `${room.width / 12} × ${room.length / 12} ft (${room.width} × ${room.length} in)`,
    priorityLabel: priority.label,
    variants,
  };
}
