export type Unit = 'cm' | 'm' | 'ft';

export type FurnitureType =
  | 'bed'
  | 'desk'
  | 'wardrobe'
  | 'sofa'
  | 'diningTable'
  | 'door'
  | 'window'
  | 'mirror'
  | 'custom';

export interface Room {
  w: number;
  h: number;
  unit: Unit;
}

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  label?: string;
}

export interface Design {
  room: Room;
  items: FurnitureItem[];
}

export type Severity = 'info' | 'warn';

export interface PlannerWarning {
  id: string;
  severity: Severity;
  message: string;
}

export interface PlannerStrings {
  roomLength: string;
  roomWidth: string;
  unit: string;
  palette: string;
  templatesLabel: string;
  selectedItem: string;
  noSelection: string;
  width: string;
  height: string;
  rotation: string;
  area: string;
  checksTitle: string;
  noWarnings: string;
  saveStatus: string;
  confirmClear: string;
  itemList: string;
  disclaimerLink: string;
  emptyHint?: string;
  furniture: Record<FurnitureType, string>;
  customItem: {
    label: string;
    namePlaceholder: string;
    addButton: string;
    editNameLabel: string;
  };
  units: Record<Unit, string>;
  actions: {
    add: string;
    rotate90: string;
    delete: string;
    exportPng: string;
    exportPdf: string;
    save: string;
    clear: string;
  };
  templates: {
    studio: string;
    student: string;
    double: string;
    living: string;
  };
  warnings: {
    bounds: string;
    door: string;
    aisle: string;
  };
  fengShui: {
    sectionTitle: string;
    bedFacingDoor: string;
    mirrorFacingBed: string;
    deskNoSupport: string;
    doorwayBlocked: string;
    headboardNoWall: string;
    noWarnings: string;
  };
}

export interface PlannerOptions {
  strings: PlannerStrings;
  fengShui: boolean;
  storageKey?: string;
}
