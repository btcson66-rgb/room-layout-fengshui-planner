import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildExportMetadata, EXPORT_DISCLAIMER } from '../../src/planner/export.ts';
import { createQuickHandoff, handoffToPlannerDesign } from '../../src/planner/quick-handoff.ts';
import { calculateFurnitureFit, fromFurnitureFitCm, isValidFurnitureFitInput, toFurnitureFitCm } from '../../src/tools/furniture-fit.ts';

const strings = {
  roomLength: '房間長度',
  roomWidth: '房間寬度',
  unit: '單位',
  palette: '家具',
  templatesLabel: '範例格局',
  selectedItem: '已選家具',
  noSelection: '尚未選取',
  width: '寬度',
  height: '深度',
  rotation: '旋轉',
  area: '面積',
  checksTitle: '尺寸檢查',
  noWarnings: '沒有警示',
  saveStatus: '已儲存',
  confirmClear: '清空？',
  itemList: '家具清單',
  disclaimerLink: '查看限制',
  furniture: { bed: '床', desk: '書桌', wardrobe: '衣櫃', sofa: '沙發', diningTable: '餐桌', door: '門', window: '窗', mirror: '鏡子', custom: '自訂' },
  customItem: { label: '自訂家具', namePlaceholder: '家具名稱', addButton: '加入', editNameLabel: '名稱' },
  units: { cm: '公分', m: '公尺', ft: '英尺' },
  templates: { studio: '套房', student: '學生房', double: '雙人房', living: '客廳' },
  warnings: { bounds: '超出', door: '門被擋', aisle: '走道窄' },
  actions: { add: '加入', rotate90: '旋轉', delete: '刪除', exportPng: 'PNG', exportPdf: 'PDF', save: '儲存', clear: '清空', saveExport: '儲存與匯出' },
  navigation: { room: '房間', furniture: '家具', templates: '範例', checks: '檢查', report: '報告', toolsLabel: '規劃工具', setupEyebrow: '設定', closeDrawer: '關閉', canvasLabel: '平面圖', canvasHint: '拖曳', mobileActionsLabel: '操作' },
  drawer: { roomTitle: '房間設定', furnitureTitle: '加入家具', templatesTitle: '範例格局', checksTitle: '尺寸檢查', reportTitle: '匯出報告' },
  report: { eyebrow: 'EXPORT REPORT', title: 'RoomFeng 尺寸規劃報告', status: '本機草稿', room: '房間', area: '面積', furniture: '家具', checks: '檢查', checksPass: '可繼續核對', checksNeedsReview: (count) => `${count} 項需複核`, moreItems: (count) => `另有 ${count} 件`, note: '核對。' },
  accessibility: { selectedSuffix: '，已選取' },
  exportReport: { title: 'RoomFeng 尺寸規劃報告', exportedAt: '匯出日期', room: '房間尺寸', area: '面積', furniture: '家具外框', noFurniture: '目前沒有家具', checks: '尺寸檢查', noChecks: '目前沒有警示', culturalReference: '文化參考', disclaimer: EXPORT_DISCLAIMER, pngSubtitle: 'MEASURE · PLAN · CHECK' },
  fengShui: { sectionTitle: '文化參考', bedFacingDoor: '床門', mirrorFacingBed: '鏡床', deskNoSupport: '桌', doorwayBlocked: '門', headboardNoWall: '床頭', noWarnings: '無' },
};

const stringsEn = {
  ...strings,
  exportReport: { ...strings.exportReport, title: 'RoomFeng dimension plan report', exportedAt: 'Exported', room: 'Room dimensions', area: 'Area', furniture: 'Furniture footprints', noFurniture: 'No furniture yet', checks: 'Dimension checks', noChecks: 'No structural warnings', culturalReference: 'Cultural reference', disclaimer: 'Planning reference only.', pngSubtitle: 'MEASURE · PLAN · CHECK' },
};

test('exact-dimension handoff preserves room, item type, width, depth and rotation', () => {
  const payload = createQuickHandoff({
    source: 'review-03',
    roomWidthCm: 248,
    roomLengthCm: 400,
    items: [{ id: 'bed', type: 'bed', label: '單人床', widthCm: 105, depthCm: 188, xCm: 16, yCm: 45, rotationDeg: 0 }],
  });
  const design = handoffToPlannerDesign(payload);
  assert.deepEqual(design.room, { w: 248, h: 400, unit: 'cm' });
  assert.deepEqual(design.items[0], { id: 'handoff-bed', type: 'bed', label: '單人床', x: 16, y: 45, w: 105, h: 188, rotation: 0 });
});

test('furniture fit distinguishes physical fit from requested clearance in both orientations', () => {
  const result = calculateFurnitureFit({
    roomWidthCm: 248,
    roomLengthCm: 400,
    furnitureWidthCm: 105,
    furnitureDepthCm: 188,
    clearance: { leftCm: 0, rightCm: 0, frontCm: 60, backCm: 0 },
  });
  assert.equal(result.physicalFit, true);
  assert.equal(result.requestedClearanceFit, true);
  assert.equal(result.recommendedRotation, 0);
  assert.deepEqual(result.orientations.map(({ rotation, widthCm, depthCm }) => ({ rotation, widthCm, depthCm })), [
    { rotation: 0, widthCm: 105, depthCm: 188 },
    { rotation: 90, widthCm: 188, depthCm: 105 },
  ]);
  const blocked = calculateFurnitureFit({ roomWidthCm: 200, roomLengthCm: 190, furnitureWidthCm: 105, furnitureDepthCm: 188, clearance: { leftCm: 20, rightCm: 20, frontCm: 60, backCm: 0 } });
  assert.equal(blocked.physicalFit, true);
  assert.equal(blocked.requestedClearanceFit, false);
});

test('export metadata is the contract used by PDF and PNG output', () => {
  const metadata = buildExportMetadata({
    room: { w: 248, h: 400, unit: 'cm' },
    items: [{ id: 'bed', type: 'bed', label: '單人床', x: 16, y: 45, w: 105, h: 188, rotation: 0 }],
  }, strings, new Date('2026-09-19T00:00:00Z'));
  assert.equal(metadata.title, strings.exportReport.title);
  assert.match(metadata.room, /248/);
  assert.match(metadata.room, /400/);
  assert.match(metadata.items[0], /105/);
  assert.equal(metadata.disclaimer, strings.exportReport.disclaimer);
  const source = fs.readFileSync(new URL('../../src/planner/export.ts', import.meta.url), 'utf8');
  assert.match(source, /export async function exportPng\(svg: SVGSVGElement, anchor\?: HTMLElement \| null, design\?:/);
  assert.match(source, /EXPORT_DISCLAIMER/);
  assert.match(source, /strings\.exportReport/);
  assert.match(source, /buildPdfBlob/);
});

test('export metadata is localized for both zh and en output contracts', () => {
  const design = { room: { w: 300, h: 300, unit: 'cm' }, items: [] };
  assert.equal(buildExportMetadata(design, strings).title, 'RoomFeng 尺寸規劃報告');
  assert.equal(buildExportMetadata(design, stringsEn).title, 'RoomFeng dimension plan report');
  assert.equal(buildExportMetadata(design, stringsEn).disclaimer, 'Planning reference only.');
});

test('Furniture Fit presets retain exact centimetre geometry in cm, m, and ft', () => {
  for (const unit of ['cm', 'm', 'ft']) {
    for (const value of [300, 105, 188, 60]) {
      assert.ok(Math.abs(toFurnitureFitCm(fromFurnitureFitCm(value, unit), unit) - value) < 0.000001, `${unit} ${value}`);
    }
  }
  assert.equal(isValidFurnitureFitInput({ roomWidthCm: 300, roomLengthCm: 300, furnitureWidthCm: 105, furnitureDepthCm: 188, clearance: { leftCm: 0, rightCm: 0, frontCm: 60, backCm: 0 } }), true);
  assert.equal(isValidFurnitureFitInput({ roomWidthCm: Number.NaN, roomLengthCm: 300, furnitureWidthCm: 105, furnitureDepthCm: 188, clearance: { leftCm: 0, rightCm: 0, frontCm: 60, backCm: 0 } }), false);
});

test('Bedroom measured route and displayed clearance derive from the same geometry', () => {
  const source = fs.readFileSync(new URL('../../src/pages/zh/small-bedroom-layout.astro', import.meta.url), 'utf8');
  const roomWidth = Number(source.match(/const bedroomRoomWidthCm = (\d+)/)?.[1]);
  const bed = { x: Number(source.match(/xCm: (\d+)/)?.[1]), width: Number(source.match(/widthCm: (\d+)/)?.[1]) };
  const deskY = Number(source.match(/yCm: (\d+)/g)?.[1].match(/\d+/)?.[0]);
  const bedY = Number(source.match(/yCm: (\d+)/)?.[1]);
  const bedDepth = Number(source.match(/depthCm: (\d+)/)?.[1]);
  assert.equal(roomWidth - bed.x - bed.width, 127);
  assert.equal(deskY - bedY - bedDepth, 47);
  assert.match(source, /bedroomRightRouteCm/);
  assert.match(source, /bedroomBedToDeskGapCm/);
});

test('rail controls expose distinct room, furniture, templates, checks and report panels', () => {
  const source = fs.readFileSync(new URL('../../src/planner/planner.ts', import.meta.url), 'utf8');
  for (const panel of ['room', 'furniture', 'templates']) assert.match(source, new RegExp(`makePanel\\('${panel}'`));
  for (const panel of ['checks', 'report']) assert.match(source, new RegExp(`data-planner-panel=\\"${panel}\\"`));
  assert.match(source, /drawer\.dataset\.panel = panel/);
  assert.match(source, /section\.dataset\.plannerPanel !== panel/);
});

test('measured SEO landings put H1 before the measured H2 prototype', () => {
  for (const file of ['small-bedroom-layout.astro', 'studio-apartment-layout.astro']) {
    const source = fs.readFileSync(new URL(`../../src/pages/zh/${file}`, import.meta.url), 'utf8');
    assert.ok(source.indexOf('<h1>') < source.indexOf('class="measured-landing"'));
    assert.match(source, /rf_quick_handoff=1/);
  }
});
