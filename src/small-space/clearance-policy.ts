export type ClearanceSeverity = 'comfortable' | 'practical' | 'tight' | 'conflict';

export interface ClearanceRule {
  id: string;
  purpose: string;
  value: number;
  unit: 'mm';
  severity: ClearanceSeverity;
  sourceType: 'planning-guideline' | 'practical-guideline' | 'furniture-function-requirement' | 'geometry-requirement';
  notes: string;
}

/** Planning guidance, not building code. Product copy must preserve this distinction. */
export const CLEARANCE_POLICY: readonly ClearanceRule[] = [
  { id: 'bed-side-comfortable', purpose: 'Bed side circulation', value: 900, unit: 'mm', severity: 'comfortable', sourceType: 'planning-guideline', notes: 'A spacious target around the accessible long sides of a bed.' },
  { id: 'bed-side-practical', purpose: 'Bed side circulation', value: 760, unit: 'mm', severity: 'practical', sourceType: 'planning-guideline', notes: 'Approximate 30 inch planning guideline; not a code requirement.' },
  { id: 'bed-side-tight', purpose: 'Bed side circulation', value: 600, unit: 'mm', severity: 'tight', sourceType: 'practical-guideline', notes: 'Usable but noticeably constrained; disclose as a trade-off.' },
  { id: 'chair-pullback-practical', purpose: 'Desk chair pull-back', value: 750, unit: 'mm', severity: 'practical', sourceType: 'practical-guideline', notes: 'Allows a person to pull a compact chair away from a desk.' },
  { id: 'wardrobe-opening-practical', purpose: 'Hinged wardrobe opening', value: 700, unit: 'mm', severity: 'practical', sourceType: 'furniture-function-requirement', notes: 'Planning allowance in front of hinged doors; verify the selected product.' },
  { id: 'dresser-drawer-practical', purpose: 'Dresser drawer operation', value: 700, unit: 'mm', severity: 'practical', sourceType: 'furniture-function-requirement', notes: 'Planning allowance for opening drawers and standing in front.' },
  { id: 'door-swing-required', purpose: 'Door swing', value: 850, unit: 'mm', severity: 'conflict', sourceType: 'geometry-requirement', notes: 'The swing zone is a geometry exclusion, not a comfort claim.' },
  { id: 'studio-entry-practical', purpose: 'Studio entry route', value: 900, unit: 'mm', severity: 'practical', sourceType: 'practical-guideline', notes: 'Keeps the entrance legible in open-plan prototypes.' },
];

export function clearanceClass(valueMm: number, practicalMm = 760, comfortableMm = 900): ClearanceSeverity {
  if (valueMm >= comfortableMm) return 'comfortable';
  if (valueMm >= practicalMm) return 'practical';
  if (valueMm >= 600) return 'tight';
  return 'conflict';
}
