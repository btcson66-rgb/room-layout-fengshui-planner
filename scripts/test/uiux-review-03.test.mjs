import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildExportMetadata, EXPORT_DISCLAIMER } from '../../src/planner/export.ts';
import { createQuickHandoff, handoffToPlannerDesign } from '../../src/planner/quick-handoff.ts';
import { calculateFurnitureFit } from '../../src/tools/furniture-fit.ts';

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
  actions: { add: '加入', rotate90: '旋轉', delete: '刪除', exportPng: 'PNG', exportPdf: 'PDF', save: '儲存', clear: '清空' },
  templates: { studio: '套房', student: '學生房', double: '雙人房', living: '客廳' },
  warnings: { bounds: '超出', door: '門被擋', aisle: '走道窄' },
  fengShui: { sectionTitle: '文化參考', bedFacingDoor: '床門', mirrorFacingBed: '鏡床', deskNoSupport: '桌', doorwayBlocked: '門', headboardNoWall: '床頭', noWarnings: '無' },
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
  assert.equal(metadata.title, 'RoomFeng 尺寸規劃報告');
  assert.match(metadata.room, /248/);
  assert.match(metadata.room, /400/);
  assert.match(metadata.items[0], /105/);
  assert.equal(metadata.disclaimer, EXPORT_DISCLAIMER);
  const source = fs.readFileSync(new URL('../../src/planner/export.ts', import.meta.url), 'utf8');
  assert.match(source, /export async function exportPng\(svg: SVGSVGElement, anchor\?: HTMLElement \| null, design\?:/);
  assert.match(source, /EXPORT_DISCLAIMER/);
  assert.match(source, /RoomFeng 尺寸規劃/);
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
