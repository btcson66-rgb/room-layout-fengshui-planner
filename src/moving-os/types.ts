export type Locale = 'en' | 'zh-TW';
export type Unit = 'mm' | 'cm' | 'in';
export type Currency = 'TWD' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KRW' | 'HKD' | 'SGD';
export type MoveType = 'renting' | 'buying' | 'dorm' | 'couple' | 'family' | 'office';
export type FurnitureDecision = 'keep' | 'sell' | 'donate' | 'dispose' | 'undecided';

export interface DimensionsMm { width: number; depth: number; height: number }
export interface Opening { id: string; name: string; widthMm: number; heightMm: number; swing?: 'left' | 'right' | 'sliding' | 'none' }
export interface FixedObject { id: string; type: 'column' | 'cabinet' | 'ac' | 'outlet' | 'radiator' | 'other'; note: string }
export interface RoomMeasurement {
  id: string; name: string; lengthMm: number; widthMm: number; ceilingMm: number;
  doors: Opening[]; windows: Array<Opening & { sillHeightMm: number }>; fixedObjects: FixedObject[];
}
export interface EntryRoute {
  oldHomeExitWidthMm: number; oldHomeExitHeightMm: number;
  elevatorWidthMm: number; elevatorDepthMm: number; elevatorHeightMm: number; elevatorDoorWidthMm: number;
  corridorWidthMm: number; stairWidthMm: number; landingWidthMm: number; landingDepthMm: number;
  entranceWidthMm: number; entranceHeightMm: number; interiorDoorWidthMm: number; interiorDoorHeightMm: number;
}
export type FurnitureCategory = 'bed' | 'mattress' | 'wardrobe' | 'desk' | 'chair' | 'sofa' | 'dining-table' | 'cabinet' | 'shelving' | 'tv' | 'appliance' | 'other';
export interface FurnitureItem {
  id: string; name: string; category: FurnitureCategory; currentRoom: string; destinationRoomId: string;
  dimensions: DimensionsMm; weightKg?: number; canDisassemble: boolean; disassembledDimensions?: DimensionsMm;
  fragile: boolean; expensive: boolean; requiresMovers: boolean; decision: FurnitureDecision;
  photoDataUrl?: string; purchaseValue?: number; notes: string;
}
export interface TimelineTask { id: string; title: string; dueDate: string; phase: string; completed: boolean }
export interface MoveBox {
  id: string; roomId: string; contents: string; fragile: boolean; priority: 'low' | 'normal' | 'high';
  firstNight: boolean; openFirst: boolean; packed: boolean; loaded: boolean; delivered: boolean; unpacked: boolean;
}
export type BudgetCategory = 'movers' | 'packing' | 'cleaning' | 'transport' | 'deposit' | 'utilities' | 'internet' | 'furniture' | 'appliances' | 'repairs' | 'storage' | 'fees' | 'other';
export interface BudgetItem { id: string; category: BudgetCategory; label: string; estimated: number; actual: number; paid: boolean; dueDate: string; notes: string }
export interface ShoppingItem {
  id: string; group: string; candidate: 'A' | 'B' | 'C'; product: string; category: FurnitureCategory; store: string;
  url: string; price: number; dimensions: DimensionsMm; roomId: string; priority: 'low' | 'normal' | 'high';
  status: 'research' | 'shortlisted' | 'buy' | 'bought' | 'reject'; delivery: string; rating?: number; notes: string;
}
export interface MoveDayPlan { moverContact: string; buildingContact: string; parking: string; elevatorReservation: string; notes: string }
export interface FirstNightItem { id: string; label: string; packed: boolean }
export interface LayoutSnapshot {
  slot: 'A' | 'B' | 'C'; savedAt: string; roomId?: string; roomName?: string;
  plannerData: Record<string, unknown>;
}
export interface ProjectInfo {
  name: string; currentHome: string; newHome: string; moveDate: string; currency: Currency; unit: Unit;
  householdSize: number; bedrooms: number; moveType: MoveType;
}
export interface MovingProject {
  schemaVersion: 1; locale: Locale; project: ProjectInfo; rooms: RoomMeasurement[]; entryRoute: EntryRoute;
  furniture: FurnitureItem[]; timeline: TimelineTask[]; boxes: MoveBox[]; budget: BudgetItem[];
  shopping: ShoppingItem[]; layouts: LayoutSnapshot[]; moveDay: MoveDayPlan; firstNight: FirstNightItem[]; updatedAt: string; exampleData?: boolean;
}
export type EntryStatus = 'likely' | 'review' | 'fail';
export type RoomStatus = 'pass' | 'tight' | 'fail';
export type UsabilityStatus = 'comfortable' | 'tight' | 'conflict';
export interface FurnitureAssessment {
  entry: EntryStatus; room: RoomStatus; usability: UsabilityStatus;
  recommendation: 'keep' | 'keep-disassemble' | 'review-mover' | 'sell' | 'replace'; reasons: string[];
}
