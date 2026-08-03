export interface StorageBedInput {
  roomLength: number;
  roomWidth: number;
  ceilingHeight: number;
  userHeight: number;
  needsDesk: boolean;
  shared: boolean;
}

export interface StorageBedResult {
  id: 'drawer' | 'side-lift' | 'top-lift' | 'loft' | 'bunk';
  name: string;
  feasible: boolean;
  score: number;
  bedSize: string;
  minimumClearance: string;
  openingEnvelope: string;
  reason: string;
  notSuitable: string;
  alternative: string;
}

export interface StorageBedSelection {
  errors: string[];
  results: StorageBedResult[];
  assumptions: string[];
}

interface Rectangle {
  w: number;
  h: number;
}

const LIMITS = {
  room: { min: 160, max: 1200 },
  ceiling: { min: 180, max: 500 },
  height: { min: 120, max: 230 },
};

function fitsRectangle(roomWidth: number, roomLength: number, rectangle: Rectangle) {
  return (
    (rectangle.w <= roomWidth && rectangle.h <= roomLength)
    || (rectangle.h <= roomWidth && rectangle.w <= roomLength)
  );
}

function fitsZones(roomWidth: number, roomLength: number, bedZone: Rectangle, deskZone?: Rectangle) {
  if (!deskZone) return fitsRectangle(roomWidth, roomLength, bedZone);

  const orientations = (rect: Rectangle) => [rect, { w: rect.h, h: rect.w }];
  return orientations(bedZone).some((bed) => orientations(deskZone).some((desk) => (
    (bed.w + desk.w <= roomWidth && Math.max(bed.h, desk.h) <= roomLength)
    || (Math.max(bed.w, desk.w) <= roomWidth && bed.h + desk.h <= roomLength)
  )));
}

function validate(input: StorageBedInput) {
  const errors: string[] = [];
  const fields: Array<[keyof StorageBedInput, string, { min: number; max: number }]> = [
    ['roomLength', '房間淨長', LIMITS.room],
    ['roomWidth', '房間淨寬', LIMITS.room],
    ['ceilingHeight', '天花板高度', LIMITS.ceiling],
    ['userHeight', '使用者身高', LIMITS.height],
  ];

  for (const [key, label, bounds] of fields) {
    const value = input[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`${label}必須是有效數字。`);
    } else if (value < bounds.min || value > bounds.max) {
      errors.push(`${label}請輸入 ${bounds.min}～${bounds.max} 公分。`);
    }
  }

  if (input.roomLength < input.userHeight + 20 && input.roomWidth < input.userHeight + 20) {
    errors.push('房間兩邊都短於「身高＋20 公分」，請確認是否把公尺誤填成公分。');
  }
  return errors;
}

export function rankStorageBeds(input: StorageBedInput): StorageBedSelection {
  const errors = validate(input);
  if (errors.length > 0) return { errors, results: [], assumptions: [] };

  const mattressWidth = input.shared ? 150 : 105;
  const mattressLength = input.shared ? 190 : 188;
  const frameWidth = mattressWidth + 6;
  const frameLength = mattressLength + 6;
  const deskZone = input.needsDesk ? { w: 100, h: 120 } : undefined;
  const seatedHeadTop = Math.round(input.userHeight * 0.52 + 45);
  const loftDeskHeadroom = 145 - seatedHeadTop;

  const makeResult = (
    result: Omit<StorageBedResult, 'feasible' | 'score'>,
    floorFits: boolean,
    verticalFits: boolean,
    preferenceScore: number,
  ): StorageBedResult => ({
    ...result,
    feasible: floorFits && verticalFits,
    score: (floorFits ? 55 : 0) + (verticalFits ? 25 : 0) + preferenceScore,
  });

  const drawerZone = { w: frameWidth + 70, h: frameLength };
  const drawerFits = fitsZones(input.roomWidth, input.roomLength, drawerZone, deskZone);
  const sideZone = { w: frameWidth + 60, h: frameLength };
  const sideFits = fitsZones(input.roomWidth, input.roomLength, sideZone, deskZone);
  const topZone = { w: frameWidth, h: frameLength + 60 };
  const topFits = fitsZones(input.roomWidth, input.roomLength, topZone, deskZone);
  const loftZone = { w: 165, h: 206 };
  const loftFloorFits = fitsRectangle(input.roomWidth, input.roomLength, loftZone);
  const loftVerticalFits = input.ceilingHeight >= 240 && (!input.needsDesk || loftDeskHeadroom >= 10) && !input.shared;
  const bunkZone = { w: 175, h: 206 };
  const bunkFloorFits = fitsRectangle(input.roomWidth, input.roomLength, bunkZone);
  const bunkTopClearance = input.ceilingHeight - 155;
  const bunkVerticalFits = bunkTopClearance >= 75 && input.shared;

  const results: StorageBedResult[] = [
    makeResult({
      id: 'drawer',
      name: '抽屜床',
      bedSize: `${mattressWidth} × ${mattressLength} 公分床墊；試算床架 ${frameWidth} × ${frameLength} 公分`,
      minimumClearance: `床架加單側抽屜操作區約 ${frameWidth + 70} × ${frameLength} 公分${input.needsDesk ? '，另以 100 × 120 公分桌椅操作區一起排入房間' : ''}。`,
      openingEnvelope: '本次以抽屜完全拉出 60 公分，再加 10 公分手部餘量試算；真正需要的不是弧形半徑，而是直線抽拉深度。',
      reason: drawerFits ? '地面尺寸可排入房間，且不受天花板高度影響。' : '抽屜全開操作區與其他需求無法一起排入目前房間。',
      notSuitable: '床側緊貼牆、床邊有固定櫃，或商品抽屜深度超過試算的 60 公分時不適用。',
      alternative: '改選上掀床，或量「抽屜內深＋滑軌全伸長度」，以該數字重畫床側淨空。',
    }, drawerFits, true, input.needsDesk ? 2 : 8),
    makeResult({
      id: 'side-lift',
      name: '側掀床',
      bedSize: `${mattressWidth} × ${mattressLength} 公分床墊；試算床架 ${frameWidth} × ${frameLength} 公分`,
      minimumClearance: `床架加可操作長側約 ${frameWidth + 60} × ${frameLength} 公分${input.needsDesk ? '，並另排 100 × 120 公分桌椅區' : ''}。`,
      openingEnvelope: `承板以長邊為軸掀起，迴旋半徑約等於床寬 ${mattressWidth} 公分；實際最高點依五金限制角度、床墊厚度與床箱高度而變。`,
      reason: sideFits ? '可保留一側 60 公分站立操作區，側掀方向有選擇空間。' : '無法同時容納床架、長側站立區與其他需求。',
      notSuitable: '只有床尾能站立、兩側都被牆或櫃夾住，或使用者難以從長側抬起床板時不適用。',
      alternative: '改看上掀床；購買前確認氣壓棒承重範圍與床墊重量，不以本頁代替五金規格。',
    }, sideFits, input.ceilingHeight >= 190, input.shared ? 5 : 12),
    makeResult({
      id: 'top-lift',
      name: '上掀床',
      bedSize: `${mattressWidth} × ${mattressLength} 公分床墊；試算床架 ${frameWidth} × ${frameLength} 公分`,
      minimumClearance: `床架加床尾站立區約 ${frameWidth} × ${frameLength + 60} 公分${input.needsDesk ? '，並另排 100 × 120 公分桌椅區' : ''}。`,
      openingEnvelope: `承板以床頭短邊為軸，迴旋半徑約等於床長 ${mattressLength} 公分；實際掀起角度通常由五金限制，務必查商品開啟圖的最高點。`,
      reason: topFits ? '床尾可保留 60 公分操作區，床側不必預留抽屜全開深度。' : '床尾操作區與其他家具無法一起排入目前房間。',
      notSuitable: '床尾緊鄰牆、矮櫃或書桌，或天花板有低樑且商品未標最高點時不適用。',
      alternative: '改選側掀床；現場量「床箱頂到最低樑」並與店家提供的掀起最高點比較。',
    }, topFits, input.ceilingHeight >= 195, input.shared ? 10 : 9),
    makeResult({
      id: 'loft',
      name: input.needsDesk ? '高架床（下方書桌）' : '高架床（下方收納）',
      bedSize: '以 105 × 200 公分床架、上層床面高約 165 公分試算',
      minimumClearance: input.needsDesk
        ? `含梯側操作區約 165 × 206 公分；下方假設淨高 145 公分。使用者坐姿頭頂估約 ${seatedHeadTop} 公分，剩餘約 ${loftDeskHeadroom} 公分。`
        : '含梯側操作區約 165 × 206 公分；下方作收納使用，仍須依實品確認床下淨高。',
      openingEnvelope: '沒有掀床弧線，但梯側先保留 60 公分；上層床面到天花板以至少 75 公分作初篩。',
      reason: loftVerticalFits
        ? input.needsDesk ? '樓高與坐姿頭部餘量通過初篩，可把書桌收進床下。' : '樓高通過初篩，可把收納集中到垂直空間。'
        : input.shared ? '高架床試算只供一人睡眠，無法滿足兩人共用。' : '樓高不足 240 公分，或床下坐姿頭部餘量低於 10 公分。',
      notSuitable: '兩人同睡、樓高不足、上舖使用者不適合攀爬，或吊扇與冷氣出風口侵入上層區域時不適用。',
      alternative: '改用抽屜床或掀床；若仍選高架床，要用實品的床面高度重新計算床上與床下淨高。',
    }, loftFloorFits, loftVerticalFits, input.needsDesk ? 22 : 4),
    makeResult({
      id: 'bunk',
      name: '上下舖',
      bedSize: '以兩張 90 × 190 公分床墊、床架約 105 × 200 公分試算',
      minimumClearance: `含梯側操作區約 175 × 206 公分；上舖床面假設高 155 公分，床面到天花板約 ${bunkTopClearance} 公分。`,
      openingEnvelope: '沒有掀床弧線；梯子與上下床動作以床側 70 公分操作區試算。',
      reason: bunkVerticalFits
        ? '兩人共用且上舖床面到天花板達 75 公分初篩值。'
        : input.shared ? '上舖床面到天花板不足 75 公分。' : '單人使用不需要用上下舖換取第二個睡眠位。',
      notSuitable: '只有一人使用、樓高不足、使用者不適合攀爬，或無法固定防傾倒時不適用。',
      alternative: '兩人共用可比較雙人掀床；需要書桌時改看兩張單人床或符合使用者身高的高架床。',
    }, bunkFloorFits, bunkVerticalFits, input.shared ? 24 : -8),
  ];

  return {
    errors: [],
    results: results.sort((a, b) => Number(b.feasible) - Number(a.feasible) || b.score - a.score),
    assumptions: [
      '單人試算採台灣常見 3.5 × 6.2 尺名義床墊約 105 × 188 公分；兩人試算採 5 × 6.2 尺約 150 × 190 公分。',
      '床架外尺寸暫以床墊四周合計增加 6 公分估算；厚床頭、軟包邊與特殊五金可能更大。',
      '書桌需求以桌面 100 × 60 公分加椅後 60 公分，合計 100 × 120 公分操作區試算。',
    ],
  };
}
