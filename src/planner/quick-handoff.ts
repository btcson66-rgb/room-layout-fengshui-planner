import type { Design, FurnitureItem, FurnitureType, PlannerStrings } from './types';

export const QUICK_HANDOFF_STORAGE_KEY = 'roomfeng:planner-quick-handoff:v1';
export const QUICK_HANDOFF_QUERY = 'rf_quick_handoff';
export const QUICK_HANDOFF_SCHEMA = 'roomfeng.planner.quick-handoff/v1';

const VALID_FURNITURE_TYPES = new Set<FurnitureType>([
  'bed', 'desk', 'wardrobe', 'sofa', 'diningTable', 'door', 'window', 'mirror', 'custom',
]);

export interface QuickHandoffItem {
  id: string;
  type: FurnitureType;
  label: string;
  widthCm: number;
  depthCm: number;
  xCm?: number;
  yCm?: number;
  rotationDeg?: number;
}

export interface QuickHandoffPayload {
  schema: typeof QUICK_HANDOFF_SCHEMA;
  source: string;
  createdAt: string;
  room: { widthCm: number; lengthCm: number };
  items: QuickHandoffItem[];
}

export interface QuickHandoffInput {
  source: string;
  roomWidthCm: number;
  roomLengthCm: number;
  items: QuickHandoffItem[];
}

function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validItem(value: unknown): value is QuickHandoffItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<QuickHandoffItem>;
  return typeof item.id === 'string'
    && typeof item.label === 'string'
    && typeof item.type === 'string'
    && VALID_FURNITURE_TYPES.has(item.type as FurnitureType)
    && finitePositive(item.widthCm)
    && finitePositive(item.depthCm)
    && (item.xCm === undefined || Number.isFinite(item.xCm))
    && (item.yCm === undefined || Number.isFinite(item.yCm))
    && (item.rotationDeg === undefined || Number.isFinite(item.rotationDeg));
}

export function createQuickHandoff(input: QuickHandoffInput): QuickHandoffPayload {
  if (!finitePositive(input.roomWidthCm) || !finitePositive(input.roomLengthCm) || input.items.length === 0 || !input.items.every(validItem)) {
    throw new Error('Quick handoff dimensions must be positive and use supported furniture types.');
  }
  return {
    schema: QUICK_HANDOFF_SCHEMA,
    source: input.source,
    createdAt: new Date().toISOString(),
    room: { widthCm: input.roomWidthCm, lengthCm: input.roomLengthCm },
    items: input.items.map((item) => ({ ...item })),
  };
}

export function isQuickHandoffPayload(value: unknown): value is QuickHandoffPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QuickHandoffPayload>;
  return candidate.schema === QUICK_HANDOFF_SCHEMA
    && typeof candidate.source === 'string'
    && typeof candidate.createdAt === 'string'
    && Boolean(candidate.room && finitePositive(candidate.room.widthCm) && finitePositive(candidate.room.lengthCm))
    && Array.isArray(candidate.items)
    && candidate.items.length > 0
    && candidate.items.every(validItem);
}

function plannerItem(item: QuickHandoffItem, roomWidthCm: number, roomLengthCm: number): FurnitureItem {
  const width = item.widthCm;
  const depth = item.depthCm;
  const x = item.xCm ?? Math.max(0, (roomWidthCm - width) / 2);
  const y = item.yCm ?? Math.max(0, (roomLengthCm - depth) / 2);
  return {
    id: `handoff-${item.id}`,
    type: item.type,
    label: item.label,
    x,
    y,
    w: width,
    h: depth,
    rotation: item.rotationDeg ?? 0,
  };
}

export function handoffToPlannerDesign(payload: QuickHandoffPayload): Design {
  return {
    room: { w: payload.room.widthCm, h: payload.room.lengthCm, unit: 'cm' },
    items: payload.items.map((item) => plannerItem(item, payload.room.widthCm, payload.room.lengthCm)),
  };
}

export function writeQuickHandoff(payload: QuickHandoffPayload, storage: Storage = window.sessionStorage): void {
  storage.setItem(QUICK_HANDOFF_STORAGE_KEY, JSON.stringify(payload));
}

export function readQuickPlannerHandoff(strings?: PlannerStrings): Design | null {
  if (typeof window === 'undefined' || new URLSearchParams(window.location.search).get(QUICK_HANDOFF_QUERY) !== '1') return null;
  const stored = window.sessionStorage.getItem(QUICK_HANDOFF_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isQuickHandoffPayload(parsed)) return null;
    void strings;
    return handoffToPlannerDesign(parsed);
  } catch {
    return null;
  }
}

export function installPlannerHandoffLinks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-planner-handoff]').forEach((element) => {
    if (element.dataset.handoffInstalled === 'true') return;
    element.dataset.handoffInstalled = 'true';
    element.addEventListener('click', () => {
      const raw = element.dataset.plannerHandoff;
      if (!raw) return;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isQuickHandoffPayload(parsed)) writeQuickHandoff(parsed);
      } catch {
        // Invalid handoff data leaves the normal crawlable link untouched.
      }
    });
  });
}
