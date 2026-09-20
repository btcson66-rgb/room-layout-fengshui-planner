import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildExportMetadata } from '../../src/planner/export.ts';
import { calculateFurnitureFit, getFurnitureFitPlacement } from '../../src/tools/furniture-fit.ts';

const baseStrings = {
  locale: 'zh-TW', dateLocale: 'zh-TW',
  furniture: { bed: '床', desk: '書桌', wardrobe: '衣櫃', sofa: '沙發', diningTable: '餐桌', door: '門', window: '窗', mirror: '鏡子', custom: '自訂' },
  exportReport: { title: 'RoomFeng 尺寸規劃報告', exportedAt: '匯出日期', room: '房間尺寸', area: '面積', furniture: '家具外框', noFurniture: '目前沒有家具', checks: '尺寸檢查', noChecks: '目前沒有警示', culturalHeading: '民俗文化參考', culturalReference: '中文風水提示僅作民俗文化與空間舒適度參考。', disclaimer: '規劃僅供參考。', pngSubtitle: 'MEASURE · PLAN · CHECK' },
};
const enStrings = { ...baseStrings, locale: 'en', dateLocale: 'en-US', exportReport: { ...baseStrings.exportReport, title: 'RoomFeng dimension plan report', exportedAt: 'Exported', room: 'Room dimensions', area: 'Area', furniture: 'Furniture footprints', noFurniture: 'No furniture yet', checks: 'Dimension checks', noChecks: 'No structural warnings', culturalHeading: undefined, culturalReference: undefined, disclaimer: 'Planning reference only.', pngSubtitle: 'MEASURE · PLAN · CHECK' } };

test('asymmetric requested clearance placement uses the actual left/right and front/back bands', () => {
  const input = { roomWidthCm: 300, roomLengthCm: 300, furnitureWidthCm: 100, furnitureDepthCm: 100, clearance: { leftCm: 120, rightCm: 0, frontCm: 0, backCm: 20 } };
  const result = calculateFurnitureFit(input);
  assert.equal(result.requestedClearanceFit, true);
  const placement = getFurnitureFitPlacement(input, 0);
  assert.equal(placement.xCm, 160);
  assert.equal(placement.yCm, 110);
  assert.equal(placement.requestedClearanceFit, true);
  const failInput = { ...input, clearance: { leftCm: 210, rightCm: 0, frontCm: 0, backCm: 20 } };
  const failPlacement = getFurnitureFitPlacement(failInput, 0);
  assert.equal(calculateFurnitureFit(failInput).physicalFit, true);
  assert.equal(calculateFurnitureFit(failInput).requestedClearanceFit, false);
  assert.equal(failPlacement.xCm, 100);
});

test('English measured landings hand off the exact same centimetre dimensions as the Chinese prototypes', () => {
  const pairs = [
    ['small-bedroom-layout-planner.astro', /const bedroomRoomWidthCm = 248/, /const bedroomRoomLengthCm = 400/, /href="\/en\/room-layout-planner\/\?rf_quick_handoff=1"/],
    ['studio-apartment-layout.astro', /roomWidthCm=\{560\}/, /roomLengthCm=\{500\}/, /href="\/en\/room-layout-planner\/\?rf_quick_handoff=1"/],
  ];
  for (const [file, width, length, handoff] of pairs) {
    const source = fs.readFileSync(new URL(`../../src/pages/en/${file}`, import.meta.url), 'utf8');
    assert.match(source, width);
    assert.match(source, length);
    assert.match(source, handoff);
    assert.ok(source.indexOf('<h1>') < source.indexOf('class="measured-landing"'));
  }
});

test('Furniture Fit and export report keep locale-specific visible contracts', () => {
  for (const [locale, heading] of [['en', 'Furniture fit checker'], ['zh', '家具尺寸適配檢查']]) {
    const fit = fs.readFileSync(new URL(`../../src/pages/${locale}/furniture-fit-checker.astro`, import.meta.url), 'utf8');
    const h1 = fit.indexOf('<h1>');
    const tool = fit.indexOf('<FurnitureFitTool');
    const firstH2 = fit.indexOf('<h2>');
    assert.ok(h1 >= 0, `${locale} page must provide the document H1`);
    assert.ok(tool > h1, `${locale} tool must follow the document H1`);
    assert.ok(firstH2 < 0 || h1 < firstH2, `${locale} H1 must precede page H2 content`);
    assert.equal((fit.match(/<h1\b/g) ?? []).length, 1, `${locale} page must have exactly one source H1`);
    assert.match(fit, new RegExp(`<h1>${heading}</h1>`));
    assert.match(fit, /FurnitureFitTool(?: locale="[a-z]+")?/);
  }
  assert.match(fs.readFileSync(new URL('../../src/components/FurnitureFitTool.astro', import.meta.url), 'utf8'), /getFurnitureFitPlacement/);
  assert.equal(buildExportMetadata({ room: { w: 300, h: 300, unit: 'cm' }, items: [] }, baseStrings, new Date('2026-09-19T00:00:00Z')).culturalReference, baseStrings.exportReport.culturalReference);
  assert.equal(buildExportMetadata({ room: { w: 300, h: 300, unit: 'cm' }, items: [] }, enStrings, new Date('2026-09-19T00:00:00Z')).culturalReference, undefined);
  const exportSource = fs.readFileSync(new URL('../../src/planner/export.ts', import.meta.url), 'utf8');
  assert.match(exportSource, /strings\.dateLocale \?\? strings\.locale/);
  assert.match(exportSource, /if \(strings\.exportReport\.culturalHeading && metadata\.culturalReference\)/);
});

test('Chinese navigation and Planner follow the localized, text-first Review 04 contract', () => {
  const header = fs.readFileSync(new URL('../../src/components/Header.astro', import.meta.url), 'utf8');
  for (const label of ['房間規劃', '家具適配', '房間尺寸', '指南', '搬家', '關於']) assert.match(header, new RegExp(label));
  const planner = fs.readFileSync(new URL('../../src/pages/zh/room-layout-planner.astro', import.meta.url), 'utf8');
  for (const icon of ['📋', '🪄', '📐']) assert.doesNotMatch(planner, new RegExp(icon));
});
