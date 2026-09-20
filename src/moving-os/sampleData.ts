import type { Locale, MovingProject } from './types';

const iso = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

export function createSampleProject(locale: Locale): MovingProject {
  const zh = locale === 'zh-TW';
  const living = 'room-living';
  const bedroom = 'room-bedroom';
  return {
    schemaVersion: 1,
    locale,
    exampleData: true,
    updatedAt: new Date().toISOString(),
    project: {
      name: zh ? '範例：兩人從套房搬進兩房公寓' : 'Example: Studio to 2-bedroom move',
      currentHome: zh ? '台北套房' : 'City studio', newHome: zh ? '新北兩房公寓' : '2-bedroom apartment',
      moveDate: iso(42), currency: zh ? 'TWD' : 'USD', unit: 'cm', householdSize: 2, bedrooms: 2, moveType: 'couple',
    },
    rooms: [
      { id: living, name: zh ? '客廳' : 'Living room', lengthMm: 4800, widthMm: 3600, ceilingMm: 2800,
        doors: [{ id: 'door-living', name: zh ? '入口' : 'Entry', widthMm: 900, heightMm: 2100, swing: 'left' }],
        windows: [{ id: 'window-living', name: zh ? '陽台窗' : 'Balcony window', widthMm: 1800, heightMm: 1500, sillHeightMm: 700 }],
        fixedObjects: [{ id: 'fixed-column', type: 'column', note: zh ? '東北角 40 × 40 cm 柱' : '40 × 40 cm column, northeast corner' }] },
      { id: bedroom, name: zh ? '主臥' : 'Main bedroom', lengthMm: 3600, widthMm: 3200, ceilingMm: 2800,
        doors: [{ id: 'door-bedroom', name: zh ? '房門' : 'Bedroom door', widthMm: 820, heightMm: 2050, swing: 'right' }],
        windows: [{ id: 'window-bedroom', name: zh ? '外窗' : 'Window', widthMm: 1500, heightMm: 1300, sillHeightMm: 900 }], fixedObjects: [] },
    ],
    entryRoute: {
      oldHomeExitWidthMm: 880, oldHomeExitHeightMm: 2050,
      elevatorWidthMm: 1600, elevatorDepthMm: 1500, elevatorHeightMm: 2300, elevatorDoorWidthMm: 900,
      corridorWidthMm: 1050, stairWidthMm: 1000, landingWidthMm: 1600, landingDepthMm: 1500,
      entranceWidthMm: 920, entranceHeightMm: 2100, interiorDoorWidthMm: 820, interiorDoorHeightMm: 2050,
    },
    furniture: [
      ['FUR-001', zh ? '雙人床架' : 'Queen bed frame', 'bed', bedroom, 1520, 2000, 1000, true],
      ['FUR-002', zh ? '床墊' : 'Queen mattress', 'mattress', bedroom, 1520, 2000, 280, false],
      ['FUR-003', zh ? '三人沙發' : 'Three-seat sofa', 'sofa', living, 2100, 900, 850, false],
      ['FUR-004', zh ? '雙門衣櫃' : 'Double wardrobe', 'wardrobe', bedroom, 1200, 600, 2200, true],
      ['FUR-005', zh ? '工作桌' : 'Work desk', 'desk', living, 1200, 600, 740, true],
      ['FUR-006', zh ? '餐桌' : 'Dining table', 'dining-table', living, 1400, 800, 750, true],
      ['FUR-007', zh ? '電視櫃' : 'TV console', 'tv', living, 1600, 420, 520, false],
      ['FUR-008', zh ? '書櫃' : 'Bookcase', 'shelving', living, 900, 320, 1800, true],
    ].map(([id, name, category, destinationRoomId, width, depth, height, canDisassemble]) => ({
      id: String(id), name: String(name), category: category as any, currentRoom: zh ? '套房' : 'Studio', destinationRoomId: String(destinationRoomId),
      dimensions: { width: Number(width), depth: Number(depth), height: Number(height) }, canDisassemble: Boolean(canDisassemble),
      disassembledDimensions: canDisassemble ? { width: Math.min(Number(width), 700), depth: 180, height: Math.min(Number(height), 2000) } : undefined,
      fragile: id === 'FUR-007', expensive: id === 'FUR-002', requiresMovers: ['FUR-002', 'FUR-003', 'FUR-004'].includes(String(id)),
      decision: 'keep' as const, notes: '',
    })),
    timeline: [
      ['TASK-01', zh ? '預約搬家公司' : 'Book movers', -35, '6 weeks before'],
      ['TASK-02', zh ? '量電梯與轉角' : 'Measure elevator and turns', -28, '4 weeks before'],
      ['TASK-03', zh ? '確認大樓搬入規定' : 'Confirm building move-in rules', -25, '4 weeks before'],
      ['TASK-04', zh ? '安排網路安裝' : 'Schedule internet installation', -14, '2 weeks before'],
      ['TASK-05', zh ? '出售不搬的家具' : 'Sell furniture not moving', -14, '2 weeks before'],
      ['TASK-06', zh ? '打包貴重物品' : 'Pack valuables separately', -7, '1 week before'],
      ['TASK-07', zh ? '準備第一晚紙箱' : 'Prepare first-night box', -3, '3 days before'],
      ['TASK-08', zh ? '冷凍櫃除霜' : 'Defrost refrigerator', -1, '3 days before'],
      ['TASK-09', zh ? '家具貼上房間代碼' : 'Label furniture destinations', 0, 'Move day'],
      ['TASK-10', zh ? '拍攝租屋交屋狀態' : 'Photograph rental condition', 1, 'First week after'],
    ].map(([id, title, offset, phase]) => ({ id: String(id), title: String(title), dueDate: iso(42 + Number(offset)), phase: String(phase), completed: Number(offset) < -30 })),
    boxes: Array.from({ length: 12 }, (_, i) => ({
      id: `${i < 6 ? 'LIV' : 'BDR'}-${String(i + 1).padStart(3, '0')}`, roomId: i < 6 ? living : bedroom,
      contents: zh ? ['書籍', '廚房用品', '冬季衣物', '床品'][i % 4] : ['Books', 'Kitchenware', 'Winter clothes', 'Bedding'][i % 4],
      fragile: i === 1, priority: i < 2 ? 'high' : 'normal', firstNight: i === 7, openFirst: i === 7,
      packed: i < 7, loaded: false, delivered: false, unpacked: false,
    })),
    budget: [
      { id: 'BUD-01', category: 'movers', label: zh ? '搬家公司' : 'Movers', estimated: zh ? 16000 : 650, actual: zh ? 15800 : 640, paid: false, dueDate: iso(42), notes: '' },
      { id: 'BUD-02', category: 'packing', label: zh ? '紙箱與包材' : 'Packing supplies', estimated: zh ? 2500 : 95, actual: zh ? 2100 : 82, paid: true, dueDate: iso(14), notes: '' },
      { id: 'BUD-03', category: 'cleaning', label: zh ? '退租清潔' : 'Move-out cleaning', estimated: zh ? 4000 : 160, actual: 0, paid: false, dueDate: iso(40), notes: '' },
      { id: 'BUD-04', category: 'internet', label: zh ? '網路安裝' : 'Internet installation', estimated: zh ? 1800 : 70, actual: 0, paid: false, dueDate: iso(35), notes: '' },
    ],
    shopping: [
      { id: 'SHOP-01', group: 'sofa', candidate: 'A', product: zh ? '小型布沙發' : 'Compact fabric sofa', category: 'sofa', store: 'Store A', url: 'https://example.com/sofa-a', price: zh ? 18900 : 699, dimensions: { width: 1850, depth: 820, height: 780 }, roomId: living, priority: 'normal', status: 'shortlisted', delivery: zh ? '7–10 天' : '7–10 days', rating: 4.6, notes: '' },
      { id: 'SHOP-02', group: 'sofa', candidate: 'B', product: zh ? '雙人模組沙發' : 'Two-seat modular sofa', category: 'sofa', store: 'Store B', url: 'https://example.com/sofa-b', price: zh ? 21500 : 790, dimensions: { width: 1720, depth: 880, height: 760 }, roomId: living, priority: 'normal', status: 'research', delivery: zh ? '14 天' : '14 days', rating: 4.4, notes: '' },
      { id: 'SHOP-03', group: 'sofa', candidate: 'C', product: zh ? '窄深沙發' : 'Shallow sofa', category: 'sofa', store: 'Store C', url: 'https://example.com/sofa-c', price: zh ? 16800 : 620, dimensions: { width: 1800, depth: 760, height: 800 }, roomId: living, priority: 'normal', status: 'research', delivery: zh ? '5–7 天' : '5–7 days', rating: 4.2, notes: '' },
    ],
    layouts: [],
    moveDay: { moverContact: 'Example Moving Co. / 0900-000-000', buildingContact: 'Example building desk', parking: zh ? '後門裝卸區 09:00–12:00' : 'Rear loading area 09:00–12:00', elevatorReservation: zh ? '已預約 09:00–11:00' : 'Reserved 09:00–11:00', notes: zh ? '範例資料，請替換成實際聯絡資訊。' : 'Example data. Replace with real contacts.' },
    firstNight: (zh ? ['盥洗用品', '藥品', '手機充電器', '床單與枕套', '毛巾', '換洗衣物', '飲用水', '清潔用品', '衛生紙', '重要文件'] : ['Toiletries', 'Medication', 'Phone charger', 'Bedding', 'Towel', 'Change of clothes', 'Water', 'Cleaning supplies', 'Toilet paper', 'Important documents'])
      .map((label, i) => ({ id: `NIGHT-${i + 1}`, label, packed: i < 4 })),
  };
}

export function createEmptyProject(locale: Locale): MovingProject {
  const project = createSampleProject(locale);
  return {
    ...project, exampleData: false,
    project: { ...project.project, name: '', currentHome: '', newHome: '', moveDate: '', householdSize: 1, bedrooms: 1, moveType: 'renting' },
    entryRoute: { oldHomeExitWidthMm:0, oldHomeExitHeightMm:0, elevatorWidthMm:0, elevatorDepthMm:0, elevatorHeightMm:0, elevatorDoorWidthMm:0, corridorWidthMm:0, stairWidthMm:0, landingWidthMm:0, landingDepthMm:0, entranceWidthMm:0, entranceHeightMm:0, interiorDoorWidthMm:0, interiorDoorHeightMm:0 },
    rooms: [], furniture: [], timeline: [], boxes: [], budget: [], shopping: [], layouts: [],
    moveDay: { moverContact: '', buildingContact: '', parking: '', elevatorReservation: '', notes: '' },
    firstNight: [],
  };
}
