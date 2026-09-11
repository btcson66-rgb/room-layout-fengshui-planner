export type LayoutUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

export type RoomShape = 'rectangle' | 'square' | 'l-shape';

export type LayoutStatus = 'generated' | 'geometry-validated' | 'functional-reviewed' | 'visual-reviewed' | 'approved' | 'rejected';

export type FurnitureType = 'bed' | 'desk' | 'wardrobe' | 'dresser' | 'shelving' | 'storage-cabinet' | 'chair' | 'sofa' | 'loveseat' | 'dining-table' | 'nightstand' | 'custom';

export type FixtureType = 'door' | 'window';

export interface SizeMm {
  widthMm: number;
  depthMm: number;
}

export interface LayoutItem extends SizeMm {
  id: string;
  type: FurnitureType | FixtureType;
  xMm: number;
  yMm: number;
  rotationDeg: 0 | 90 | 180 | 270;
  clearanceMm: number;
  required?: boolean;
  label?: string;
  presetId?: string;
  footprintBasis?: 'mattress' | 'bed-frame' | 'custom';
  frameAllowanceMm?: number;
  /** Door opening direction. A door reserves a rectangular swing area in v1. */
  swingMm?: number;
}

export interface LayoutRoom {
  widthMm: number;
  lengthMm: number;
  shape: RoomShape;
  unitBasis: LayoutUnit;
}

export interface LayoutRecord {
  id: string;
  version: string;
  roomWidthMm: number;
  roomLengthMm: number;
  shape: RoomShape;
  areaMm2: number;
  localeBasis: 'en-US' | 'zh-TW' | 'universal';
  furniture: LayoutItem[];
  zones: string[];
  clearances: Record<string, number>;
  targetUses: string[];
  priorityTags: string[];
  warnings: string[];
  qualityStatus: LayoutStatus;
  family?: string;
  archetype?: string;
  doorScenario?: string;
  windowScenario?: string;
  occupancy?: 'single' | 'couple' | 'shared' | 'studio';
  bestFor?: string;
  tradeOff?: string;
  rejectionReason?: string;
  layoutDistinctiveness?: number;
  /** Authored strategy family used for diverse result selection. */
  strategyKey?: string;
}

export interface LayoutValidationIssue {
  code: string;
  itemId?: string;
  relatedItemId?: string;
  message: string;
}

export interface LayoutValidationResult {
  valid: boolean;
  issues: LayoutValidationIssue[];
  occupiedAreaRatio: number;
  minClearanceMm: number | null;
}

export interface MatcherRequest {
  width: number;
  length: number;
  unit: LayoutUnit;
  shape: Exclude<RoomShape, 'l-shape'>;
  requiredFurniture: FurnitureType[];
  occupancy: 'single' | 'couple' | 'shared';
  priorities: string[];
  locale?: 'en-US' | 'zh-TW';
  bedWidthMm?: number;
  bedDepthMm?: number;
  furnitureSizesMm?: Partial<Record<FurnitureType, SizeMm>>;
  /** Presets are planning anchors; custom measurements can opt into exact fit. */
  strictFurnitureSizes?: boolean;
}

export interface LayoutMatch {
  layout: LayoutRecord;
  score: number;
  scoreBreakdown: {
    geometry: number;
    requiredFurniture: number;
    circulation: number;
    priorities: number;
    shape: number;
  };
  whyItMatches: string[];
  tradeoffs: string[];
}
