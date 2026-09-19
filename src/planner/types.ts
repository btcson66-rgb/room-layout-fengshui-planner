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
  locale?: string;
  dateLocale?: string;
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
  rotationSliderLabel?: string;
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
    saveExport: string;
  };
  navigation: {
    room: string;
    furniture: string;
    templates: string;
    checks: string;
    report: string;
    toolsLabel: string;
    setupEyebrow: string;
    closeDrawer: string;
    canvasLabel: string;
    canvasHint: string;
    mobileActionsLabel: string;
  };
  drawer: {
    roomTitle: string;
    furnitureTitle: string;
    templatesTitle: string;
    checksTitle: string;
    reportTitle: string;
  };
  report: {
    eyebrow: string;
    title: string;
    status: string;
    room: string;
    area: string;
    furniture: string;
    checks: string;
    checksPass: string;
    checksNeedsReview: (count: number) => string;
    moreItems: (count: number) => string;
    note: string;
  };
  accessibility: {
    selectedSuffix: string;
  };
  exportReport: {
    title: string;
    exportedAt: string;
    room: string;
    area: string;
    furniture: string;
    noFurniture: string;
    checks: string;
    noChecks: string;
    culturalHeading?: string;
    culturalReference?: string;
    disclaimer: string;
    pngSubtitle: string;
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
