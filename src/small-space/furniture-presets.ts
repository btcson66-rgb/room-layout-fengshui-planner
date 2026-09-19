import type { FurnitureType, SizeMm } from './types.ts';

export interface FurniturePreset extends SizeMm {
  id: string;
  type: FurnitureType;
  label: string;
  rationale: string;
  provenance: 'planning-default' | 'functional-default';
}

/** Restrained v1 library; custom dimensions remain supported by the schema. */
export const FURNITURE_PRESETS: readonly FurniturePreset[] = [
  { id: 'desk-compact', type: 'desk', label: 'Compact desk', widthMm: 800, depthMm: 500, rationale: 'Fits a laptop-first work nook in compact rooms.', provenance: 'planning-default' },
  { id: 'desk-standard', type: 'desk', label: 'Standard desk', widthMm: 1000, depthMm: 600, rationale: 'A balanced single-user desk for bedroom planning.', provenance: 'planning-default' },
  { id: 'desk-wfh', type: 'desk', label: 'WFH desk', widthMm: 1400, depthMm: 700, rationale: 'Leaves room for monitor, keyboard and notebook zones.', provenance: 'functional-default' },
  { id: 'wardrobe-compact-hinged', type: 'wardrobe', label: 'Compact hinged wardrobe', widthMm: 750, depthMm: 550, rationale: 'Closed storage for a narrow wall with a practical opening allowance.', provenance: 'functional-default' },
  { id: 'wardrobe-standard-hinged', type: 'wardrobe', label: 'Standard hinged wardrobe', widthMm: 900, depthMm: 600, rationale: 'Representative two-door footprint; verify the chosen product.', provenance: 'planning-default' },
  { id: 'wardrobe-sliding', type: 'wardrobe', label: 'Sliding wardrobe', widthMm: 1200, depthMm: 650, rationale: 'Uses a wider wall while avoiding a hinged door sweep.', provenance: 'functional-default' },
  { id: 'dresser-compact', type: 'dresser', label: 'Compact dresser', widthMm: 700, depthMm: 420, rationale: 'Small drawer unit for a storage-first compact plan.', provenance: 'planning-default' },
  { id: 'dresser-standard', type: 'dresser', label: 'Standard dresser', widthMm: 900, depthMm: 500, rationale: 'Representative drawer footprint with a front operating zone.', provenance: 'planning-default' },
  { id: 'nightstand-compact', type: 'nightstand', label: 'Compact nightstand', widthMm: 450, depthMm: 400, rationale: 'A small bedside landing zone without assuming a specific brand.', provenance: 'planning-default' },
  { id: 'shelving-narrow', type: 'shelving', label: 'Narrow shelving', widthMm: 700, depthMm: 300, rationale: 'Vertical display/storage without consuming a full furniture bay.', provenance: 'planning-default' },
  { id: 'sofa-loveseat', type: 'loveseat', label: 'Loveseat', widthMm: 1500, depthMm: 800, rationale: 'A compact two-seat living anchor for studios.', provenance: 'planning-default' },
  { id: 'sofa-standard', type: 'sofa', label: 'Compact sofa', widthMm: 1900, depthMm: 850, rationale: 'A representative small-space sofa footprint.', provenance: 'planning-default' },
  { id: 'dining-compact', type: 'dining-table', label: 'Compact dining table', widthMm: 900, depthMm: 650, rationale: 'Supports two-person dining without treating furniture count as quality.', provenance: 'functional-default' },
  { id: 'storage-entry', type: 'storage-cabinet', label: 'Entry storage cabinet', widthMm: 700, depthMm: 550, rationale: 'Keeps a studio arrival zone explicit in the dataset.', provenance: 'functional-default' },
];
