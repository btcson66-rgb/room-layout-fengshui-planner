import { approvedLayouts } from './approved-layouts.ts';
import { validateLayoutGeometry } from './geometry.ts';
import type { LayoutRecord } from './types.ts';

// Guide-only adaptations of the reviewed 3 m square strategies. The original
// 3000 mm records remain the source for the separate 3 × 3 m guide and matcher.
const sourceIds = ['BR-SQ-001', 'BR-SQ-002', 'BR-SQ-003'];
export const tenFootGuideLayouts: LayoutRecord[] = sourceIds.map((id) => {
  const source = approvedLayouts.find((layout) => layout.id === id);
  if (!source) throw new Error(`Missing source layout ${id}`);
  const layout: LayoutRecord = {
    ...source,
    id: `${id}-10FT`,
    version: '10ft-guide-1',
    roomWidthMm: 3048,
    roomLengthMm: 3048,
    areaMm2: 3048 * 3048,
    qualityStatus: 'geometry-validated',
    // Openings retain their source scenarios but move with the expanded walls.
    furniture: source.furniture.map((item) => item.type === 'door'
      ? { ...item, yMm: item.yMm + 48 }
      : item.type === 'window' ? { ...item, xMm: item.xMm + 24 } : { ...item }),
  };
  const validation = validateLayoutGeometry(layout);
  if (!validation.valid) throw new Error(`Invalid 10 ft guide layout ${layout.id}: ${validation.issues.map((issue) => issue.code).join(', ')}`);
  return layout;
});
