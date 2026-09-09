import type { MovingProject } from './types';

export const MOVING_OS_SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'roomfeng:moving-os:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function validateProject(value: unknown): MovingProject {
  if (!isRecord(value)) throw new Error('Backup must contain a project object.');
  if (value.schemaVersion !== MOVING_OS_SCHEMA_VERSION) throw new Error('This backup uses an unsupported schema version.');
  if (!isRecord(value.project) || typeof value.project.name !== 'string') throw new Error('Project details are missing.');
  for (const key of ['rooms', 'furniture', 'timeline', 'boxes', 'budget', 'shopping', 'firstNight']) {
    if (!Array.isArray(value[key])) throw new Error(`Backup field “${key}” must be a list.`);
    if (value[key].length > 5000) throw new Error(`Backup field “${key}” is too large.`);
  }
  if (value.layouts === undefined) value.layouts = [];
  if (!Array.isArray(value.layouts) || value.layouts.length > 3) throw new Error('Backup field “layouts” must contain at most three saved plans.');
  const lists = value as Record<'rooms'|'furniture'|'timeline'|'boxes'|'budget'|'shopping'|'firstNight', unknown[]> & Record<string, unknown>;
  if (!isRecord(value.entryRoute) || !isRecord(value.moveDay)) throw new Error('Route or move-day details are missing.');
  if (value.entryRoute.oldHomeExitWidthMm === undefined) value.entryRoute.oldHomeExitWidthMm = 0;
  if (value.entryRoute.oldHomeExitHeightMm === undefined) value.entryRoute.oldHomeExitHeightMm = 0;
  for (const key of ['oldHomeExitWidthMm','oldHomeExitHeightMm','elevatorWidthMm','elevatorDepthMm','elevatorHeightMm','elevatorDoorWidthMm','corridorWidthMm','stairWidthMm','landingWidthMm','landingDepthMm','entranceWidthMm','entranceHeightMm','interiorDoorWidthMm','interiorDoorHeightMm']) {
    const measurement = value.entryRoute[key];
    if (typeof measurement !== 'number' || !Number.isFinite(measurement) || measurement < 0 || measurement > 100_000_000) throw new Error(`Entry route field “${key}” has an unsafe measurement.`);
  }
  const dimensionsAreSafe = (candidate: unknown): candidate is Record<string, unknown> => isRecord(candidate)
    && ['width', 'depth', 'height'].every((key) => typeof candidate[key] === 'number' && Number.isFinite(candidate[key]) && Number(candidate[key]) > 0 && Number(candidate[key]) <= 100_000_000);
  for (const room of lists.rooms) {
    if (!isRecord(room) || typeof room.id !== 'string' || typeof room.name !== 'string' || !Array.isArray(room.doors) || !Array.isArray(room.windows) || !Array.isArray(room.fixedObjects)) throw new Error('A room entry is malformed.');
    for (const key of ['lengthMm', 'widthMm', 'ceilingMm']) if (typeof room[key] !== 'number' || !Number.isFinite(room[key]) || Number(room[key]) <= 0 || Number(room[key]) > 100_000_000) throw new Error(`Room ${room.name || ''} has an unsafe measurement.`);
  }
  for (const item of lists.furniture) if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string' || !dimensionsAreSafe(item.dimensions)) throw new Error('A furniture entry is malformed.');
  for (const item of lists.shopping) {
    if (!isRecord(item) || typeof item.product !== 'string' || !dimensionsAreSafe(item.dimensions)) throw new Error('A shopping entry is malformed.');
    if (typeof item.url === 'string' && item.url && !/^https?:\/\//i.test(item.url)) throw new Error('A product URL uses an unsafe scheme.');
  }
  for (const item of [...lists.budget, ...lists.timeline, ...lists.boxes, ...lists.firstNight]) if (!isRecord(item) || typeof item.id !== 'string') throw new Error('A list entry is malformed.');
  for (const layout of value.layouts) {
    if (!isRecord(layout) || !['A', 'B', 'C'].includes(String(layout.slot)) || typeof layout.savedAt !== 'string' || (layout.roomId !== undefined && typeof layout.roomId !== 'string') || (layout.roomName !== undefined && typeof layout.roomName !== 'string') || !isRecord(layout.plannerData)) throw new Error('A saved layout is malformed.');
    if (JSON.stringify(layout.plannerData).length > 500_000) throw new Error('A saved layout exceeds the 500 KB safety limit.');
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 5_000_000) throw new Error('Backup exceeds the 5 MB safety limit.');
  return value as unknown as MovingProject;
}

export function loadProject(fallback: MovingProject): MovingProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? validateProject(JSON.parse(raw) as unknown) : fallback;
  } catch {
    return fallback;
  }
}

export function saveProject(project: MovingProject): void {
  const next = { ...project, schemaVersion: MOVING_OS_SCHEMA_VERSION as 1, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
