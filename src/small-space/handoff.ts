import type { Design, FurnitureItem, FurnitureType } from '../planner/types.ts';
import type { LayoutRecord } from './types.ts';
import { PRODUCT_IDS } from '../config/product-registry.ts';

export const HANDOFF_STORAGE_KEY = 'roomfeng:product-002:planner-handoff:v1';
export const HANDOFF_SCHEMA = 'roomfeng.layout-vault.handoff/v1';

export interface LayoutVaultHandoff {
  schema: typeof HANDOFF_SCHEMA;
  productId: typeof PRODUCT_IDS.layoutVault;
  mode: 'create-new';
  layoutId: string;
  createdAt: string;
  source: 'layout-vault';
  room: { widthMm: number; lengthMm: number; unit: 'mm' };
  items: Array<{ id: string; type: string; label: string; xMm: number; yMm: number; widthMm: number; depthMm: number; rotationDeg: number }>;
}

export function createPlannerHandoff(layout: LayoutRecord): LayoutVaultHandoff {
  return {
    schema: HANDOFF_SCHEMA,
    productId: PRODUCT_IDS.layoutVault,
    mode: 'create-new',
    layoutId: layout.id,
    createdAt: new Date().toISOString(),
    source: 'layout-vault',
    room: { widthMm: layout.roomWidthMm, lengthMm: layout.roomLengthMm, unit: 'mm' },
    items: layout.furniture.map((item) => ({
      id: item.id,
      type: item.type,
      label: item.label ?? item.type,
      xMm: item.xMm,
      yMm: item.yMm,
      widthMm: item.widthMm,
      depthMm: item.depthMm,
      rotationDeg: item.rotationDeg,
    })),
  };
}

function plannerType(type: string): FurnitureType {
  if (type === 'bed' || type === 'desk' || type === 'wardrobe' || type === 'sofa' || type === 'dining-table') return type === 'dining-table' ? 'diningTable' : type;
  if (type === 'door' || type === 'window' || type === 'mirror') return type;
  return 'custom';
}

export function handoffToPlannerDesign(handoff: LayoutVaultHandoff): Design {
  const cm = (valueMm: number): number => Math.round((valueMm / 10) * 10) / 10;
  const items: FurnitureItem[] = handoff.items.map((item) => ({
    id: `vault-${item.id}`,
    type: plannerType(item.type),
    x: cm(item.xMm),
    y: cm(item.yMm),
    w: Math.max(1, cm(item.widthMm)),
    h: Math.max(1, cm(item.depthMm)),
    rotation: item.rotationDeg,
    label: item.label,
  }));
  return {
    room: { w: cm(handoff.room.widthMm), h: cm(handoff.room.lengthMm), unit: 'cm' },
    items,
  };
}

export function isLayoutVaultHandoff(value: unknown): value is LayoutVaultHandoff {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LayoutVaultHandoff>;
  return candidate.schema === HANDOFF_SCHEMA && candidate.productId === PRODUCT_IDS.layoutVault && candidate.mode === 'create-new' && Boolean(candidate.room && Array.isArray(candidate.items));
}

export function readPlannerHandoff(): Design | null {
  if (typeof window === 'undefined') return null;
  const isHandoffNavigation = new URLSearchParams(window.location.search).get('rf_handoff') === '1';
  if (!isHandoffNavigation) return null;
  const stored = sessionStorage.getItem(HANDOFF_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isLayoutVaultHandoff(parsed)) return null;
    return handoffToPlannerDesign(parsed);
  } catch {
    return null;
  }
}
