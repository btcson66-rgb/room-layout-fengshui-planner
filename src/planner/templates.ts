import type { Design, FurnitureItem, FurnitureType } from './types';

export const DEFAULT_ROOM = {
  w: 360,
  h: 300,
  unit: 'cm' as const,
};

export const DEFAULT_SIZES: Record<FurnitureType, { w: number; h: number }> = {
  bed: { w: 150, h: 200 },
  desk: { w: 120, h: 60 },
  wardrobe: { w: 120, h: 60 },
  sofa: { w: 180, h: 85 },
  diningTable: { w: 140, h: 85 },
  door: { w: 80, h: 12 },
  window: { w: 120, h: 10 },
  mirror: { w: 50, h: 8 },
};

export function makeItem(type: FurnitureType, label: string, x = 40, y = 40): FurnitureItem {
  const size = DEFAULT_SIZES[type];
  return {
    id: `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    x,
    y,
    w: size.w,
    h: size.h,
    rotation: type === 'door' || type === 'window' ? 0 : 0,
    label,
  };
}

export function defaultDesign(labels: Record<FurnitureType, string>): Design {
  return {
    room: { ...DEFAULT_ROOM },
    items: [
      { ...makeItem('door', labels.door, 0, 35), id: 'door-default', rotation: 0 },
      { ...makeItem('window', labels.window, 120, 0), id: 'window-default' },
      { ...makeItem('bed', labels.bed, 185, 70), id: 'bed-default' },
      { ...makeItem('desk', labels.desk, 35, 200), id: 'desk-default' },
    ],
  };
}

export function templateDesigns(labels: Record<FurnitureType, string>): Record<string, Design> {
  return {
    studio: {
      room: { w: 420, h: 320, unit: 'cm' },
      items: [
        { id: 'studio-door', type: 'door', label: labels.door, x: 0, y: 48, w: 80, h: 12, rotation: 0 },
        { id: 'studio-window', type: 'window', label: labels.window, x: 230, y: 0, w: 140, h: 10, rotation: 0 },
        { id: 'studio-bed', type: 'bed', label: labels.bed, x: 235, y: 70, w: 150, h: 200, rotation: 0 },
        { id: 'studio-desk', type: 'desk', label: labels.desk, x: 30, y: 210, w: 110, h: 55, rotation: 0 },
        { id: 'studio-wardrobe', type: 'wardrobe', label: labels.wardrobe, x: 30, y: 90, w: 100, h: 55, rotation: 0 },
      ],
    },
    student: {
      room: { w: 330, h: 280, unit: 'cm' },
      items: [
        { id: 'student-door', type: 'door', label: labels.door, x: 0, y: 40, w: 75, h: 12, rotation: 0 },
        { id: 'student-bed', type: 'bed', label: labels.bed, x: 155, y: 55, w: 120, h: 195, rotation: 0 },
        { id: 'student-desk', type: 'desk', label: labels.desk, x: 25, y: 205, w: 105, h: 55, rotation: 0 },
        { id: 'student-window', type: 'window', label: labels.window, x: 150, y: 0, w: 120, h: 10, rotation: 0 },
      ],
    },
    double: {
      room: { w: 420, h: 360, unit: 'cm' },
      items: [
        { id: 'double-door', type: 'door', label: labels.door, x: 0, y: 70, w: 80, h: 12, rotation: 0 },
        { id: 'double-bed', type: 'bed', label: labels.bed, x: 190, y: 90, w: 180, h: 200, rotation: 0 },
        { id: 'double-wardrobe', type: 'wardrobe', label: labels.wardrobe, x: 30, y: 235, w: 140, h: 60, rotation: 0 },
        { id: 'double-mirror', type: 'mirror', label: labels.mirror, x: 30, y: 160, w: 55, h: 8, rotation: 90 },
      ],
    },
    living: {
      room: { w: 520, h: 380, unit: 'cm' },
      items: [
        { id: 'living-door', type: 'door', label: labels.door, x: 0, y: 55, w: 85, h: 12, rotation: 0 },
        { id: 'living-window', type: 'window', label: labels.window, x: 240, y: 0, w: 180, h: 10, rotation: 0 },
        { id: 'living-sofa', type: 'sofa', label: labels.sofa, x: 285, y: 235, w: 190, h: 90, rotation: 0 },
        { id: 'living-table', type: 'diningTable', label: labels.diningTable, x: 115, y: 130, w: 150, h: 90, rotation: 0 },
      ],
    },
  };
}
