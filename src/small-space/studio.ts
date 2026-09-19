import type { FurnitureType, LayoutRecord, LayoutValidationIssue } from './types.ts';

export interface StudioValidationResult {
  valid: boolean;
  issues: LayoutValidationIssue[];
  zonesComplete: boolean;
  multifunctional: boolean;
}

export function validateStudioLayout(layout: Pick<LayoutRecord, 'occupancy' | 'zones' | 'furniture' | 'clearances'>): StudioValidationResult {
  const issues: LayoutValidationIssue[] = [];
  if (layout.occupancy !== 'studio') return { valid: true, issues, zonesComplete: true, multifunctional: true };
  const types = new Set(layout.furniture.map((item) => item.type));
  const requiredZones = ['sleep', 'work', 'living', 'dining', 'storage-entry'];
  for (const zone of requiredZones) if (!layout.zones.includes(zone)) issues.push({ code: 'studio-zone-missing', message: `Studio is missing the ${zone} zone.` });
  const requiredTypes: FurnitureType[] = ['bed', 'desk', 'chair', 'dining-table'];
  for (const type of requiredTypes) if (!types.has(type)) issues.push({ code: 'studio-function-missing', itemId: type, message: `Studio is missing a usable ${type} function.` });
  if (!types.has('sofa') && !types.has('loveseat')) issues.push({ code: 'studio-living-missing', message: 'Studio needs a sofa or loveseat for a living zone.' });
  if (!types.has('storage-cabinet') && !types.has('wardrobe')) issues.push({ code: 'studio-storage-missing', message: 'Studio needs explicit entry/storage furniture.' });
  if ((layout.clearances['studio-entry-mm'] ?? 0) < 760) issues.push({ code: 'studio-entry-route', message: 'Studio entry route is below the practical planning target.' });
  return { valid: issues.length === 0, issues, zonesComplete: requiredZones.every((zone) => layout.zones.includes(zone)), multifunctional: types.has('desk') && types.has('dining-table') && (types.has('sofa') || types.has('loveseat')) };
}
