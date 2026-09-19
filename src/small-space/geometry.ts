import type { LayoutItem, LayoutRecord, LayoutValidationIssue, LayoutValidationResult } from './types.ts';

const EPSILON_MM = 0.001;
const FIXTURE_TYPES = new Set(['door', 'window']);

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function normalizedRotation(rotation: number): 0 | 90 | 180 | 270 | null {
  const value = Number(rotation);
  if (value === 0) return 0;
  if (value === 90) return 90;
  if (value === 180) return 180;
  if (value === 270) return 270;
  return null;
}

export function itemRect(item: Pick<LayoutItem, 'xMm' | 'yMm' | 'widthMm' | 'depthMm' | 'rotationDeg'>, clearanceMm = 0): Rect {
  const rotated = item.rotationDeg === 90 || item.rotationDeg === 270;
  const width = rotated ? item.depthMm : item.widthMm;
  const depth = rotated ? item.widthMm : item.depthMm;
  return {
    left: item.xMm - clearanceMm,
    top: item.yMm - clearanceMm,
    right: item.xMm + width + clearanceMm,
    bottom: item.yMm + depth + clearanceMm,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.left < b.right - EPSILON_MM && a.right > b.left + EPSILON_MM && a.top < b.bottom - EPSILON_MM && a.bottom > b.top + EPSILON_MM;
}

function contains(room: Rect, item: Rect): boolean {
  return item.left >= room.left - EPSILON_MM && item.top >= room.top - EPSILON_MM && item.right <= room.right + EPSILON_MM && item.bottom <= room.bottom + EPSILON_MM;
}

function addIssue(issues: LayoutValidationIssue[], code: string, message: string, itemId?: string, relatedItemId?: string): void {
  issues.push({ code, message, ...(itemId ? { itemId } : {}), ...(relatedItemId ? { relatedItemId } : {}) });
}

function doorSwingRect(item: LayoutItem): Rect | null {
  if (item.type !== 'door' || !item.swingMm || item.swingMm <= 0) return null;
  const base = itemRect(item);
  if (item.rotationDeg === 0) return { left: base.left, top: base.top, right: base.right + item.swingMm, bottom: base.bottom + item.swingMm };
  if (item.rotationDeg === 90) return { left: base.left - item.swingMm, top: base.top, right: base.right, bottom: base.bottom + item.swingMm };
  if (item.rotationDeg === 180) return { left: base.left - item.swingMm, top: base.top - item.swingMm, right: base.right, bottom: base.bottom };
  return { left: base.left, top: base.top - item.swingMm, right: base.right + item.swingMm, bottom: base.bottom };
}

export function validateLayoutGeometry(layout: Pick<LayoutRecord, 'roomWidthMm' | 'roomLengthMm' | 'furniture'>): LayoutValidationResult {
  const issues: LayoutValidationIssue[] = [];
  const room: Rect = { left: 0, top: 0, right: layout.roomWidthMm, bottom: layout.roomLengthMm };
  let occupiedArea = 0;
  let minClearance: number | null = null;

  if (!Number.isFinite(layout.roomWidthMm) || !Number.isFinite(layout.roomLengthMm) || layout.roomWidthMm <= 0 || layout.roomLengthMm <= 0) {
    addIssue(issues, 'room-invalid', 'Room dimensions must be positive finite millimetres.');
  }
  for (const item of layout.furniture) {
    const rotation = normalizedRotation(item.rotationDeg);
    if (rotation === null) addIssue(issues, 'rotation-unsupported', 'Rotation must be 0, 90, 180, or 270 degrees.', item.id);
    if (!Number.isFinite(item.widthMm) || !Number.isFinite(item.depthMm) || item.widthMm <= 0 || item.depthMm <= 0) addIssue(issues, 'item-size-invalid', 'Item dimensions must be positive finite millimetres.', item.id);
    if (!Number.isFinite(item.clearanceMm) || item.clearanceMm < 0) addIssue(issues, 'clearance-invalid', 'Clearance must be a non-negative finite millimetre value.', item.id);
    const rect = itemRect(item);
    if (!contains(room, rect)) addIssue(issues, 'outside-room', 'Item or its rotated footprint falls outside the room.', item.id);
    if (!FIXTURE_TYPES.has(item.type)) {
      const base = itemRect(item);
      occupiedArea += Math.max(0, base.right - base.left) * Math.max(0, base.bottom - base.top);
      minClearance = minClearance === null ? item.clearanceMm : Math.min(minClearance, item.clearanceMm);
    }
  }

  for (let i = 0; i < layout.furniture.length; i += 1) {
    const item = layout.furniture[i];
    const itemBase = itemRect(item);
    const swing = doorSwingRect(item);
    for (let j = i + 1; j < layout.furniture.length; j += 1) {
      const other = layout.furniture[j];
      const otherBase = itemRect(other);
      const baseOverlap = intersects(itemBase, otherBase);
      if (baseOverlap) addIssue(issues, 'overlap', 'Items overlap; edge contact is allowed but area overlap is not.', item.id, other.id);
      if (!FIXTURE_TYPES.has(item.type) && !FIXTURE_TYPES.has(other.type)) {
        if (intersects(itemRect(item, item.clearanceMm), otherBase) || intersects(itemRect(other, other.clearanceMm), itemBase)) {
          addIssue(issues, 'clearance-blocked', 'A required furniture clearance zone is blocked.', item.id, other.id);
        }
      }
      if (item.type === 'door' && !FIXTURE_TYPES.has(other.type) && swing && intersects(swing, otherBase)) addIssue(issues, 'door-swing-blocked', 'Furniture blocks the required door swing/access zone.', other.id, item.id);
      if (other.type === 'door' && !FIXTURE_TYPES.has(item.type)) {
        const otherSwing = doorSwingRect(other);
        if (otherSwing && intersects(otherSwing, itemBase)) addIssue(issues, 'door-swing-blocked', 'Furniture blocks the required door swing/access zone.', item.id, other.id);
      }
      if (item.type === 'window' && !FIXTURE_TYPES.has(other.type) && intersects(itemBase, otherBase)) addIssue(issues, 'window-blocked', 'Furniture blocks a window opening.', other.id, item.id);
      if (other.type === 'window' && !FIXTURE_TYPES.has(item.type) && intersects(otherBase, itemBase)) addIssue(issues, 'window-blocked', 'Furniture blocks a window opening.', item.id, other.id);
    }
  }

  const roomArea = Math.max(1, layout.roomWidthMm * layout.roomLengthMm);
  // Tight clearance is a review warning, not an automatic geometry failure.
  // Hard gates remain bounds, overlap, invalid dimensions/rotation, door swing,
  // and blocked windows; Approved records must disclose tight trade-offs.
  const hardIssues = issues.filter((issue) => issue.code !== 'clearance-blocked');
  return { valid: hardIssues.length === 0, issues, occupiedAreaRatio: occupiedArea / roomArea, minClearanceMm: minClearance };
}
