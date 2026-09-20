import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLayoutGeometry } from '../src/small-space/geometry.ts';
import { matchLayouts, scoreLayout, selectDiverseTopMatches } from '../src/small-space/matcher.ts';
import { convertToMm, fromMm } from '../src/small-space/units.ts';
import { findBedPreset, formatPresetSize } from '../src/small-space/presets.ts';
import { advanceLayoutStatus } from '../src/small-space/quality.ts';
import { distinctivenessScore } from '../src/small-space/distinctiveness.ts';
import { validateStudioLayout } from '../src/small-space/studio.ts';
import { createPlannerHandoff, handoffToPlannerDesign, isLayoutVaultHandoff } from '../src/small-space/handoff.ts';
import { sanitiseLayoutAnalytics } from '../src/small-space/analytics.ts';

function layout(overrides = {}) {
  return {
    id: 'bedroom-10x10-a', version: '1.0.0', roomWidthMm: 3048, roomLengthMm: 3048, shape: 'square', areaMm2: 3048 * 3048,
    localeBasis: 'universal', furniture: [], zones: ['sleep'], clearances: {}, targetUses: ['sleep'], priorityTags: ['circulation'], warnings: [], qualityStatus: 'approved', ...overrides,
  };
}

function bed(id, xMm, yMm, widthMm = 1524, depthMm = 2032, extra = {}) {
  return { id, type: 'bed', xMm, yMm, widthMm, depthMm, rotationDeg: 0, clearanceMm: 600, required: true, ...extra };
}

test('unit conversion supports metric and imperial round trips', () => {
  for (const [value, unit] of [[3048, 'mm'], [304.8, 'cm'], [3.048, 'm'], [120, 'in'], [10, 'ft']]) {
    assert.ok(Math.abs(fromMm(convertToMm(value, unit), unit) - value) < 0.01);
  }
});

test('exact edge contact is valid but a one millimetre overlap is invalid', () => {
  const base = layout({ furniture: [bed('a', 0, 0, 1000, 1000, { clearanceMm: 0 }), bed('b', 1000, 0, 1000, 1000, { clearanceMm: 0 })] });
  assert.equal(validateLayoutGeometry(base).valid, true);
  assert.ok(validateLayoutGeometry({ ...base, furniture: [base.furniture[0], { ...base.furniture[1], xMm: 999 }] }).issues.some((issue) => issue.code === 'overlap'));
});

test('required clearance is checked separately from physical overlap', () => {
  const result = validateLayoutGeometry(layout({ furniture: [
    bed('a', 0, 0, 1000, 1000, { clearanceMm: 600 }),
    bed('b', 1500, 0, 1000, 1000, { clearanceMm: 0 }),
  ] }));
  assert.ok(result.issues.some((issue) => issue.code === 'clearance-blocked'));
});

test('rotated footprint is checked against the room boundary', () => {
  const valid = layout({ furniture: [bed('a', 0, 0, 1000, 1800, { rotationDeg: 90 })] });
  assert.equal(validateLayoutGeometry(valid).valid, true);
  const invalid = { ...valid, furniture: [{ ...valid.furniture[0], xMm: 0, yMm: 2500 }] };
  assert.ok(validateLayoutGeometry(invalid).issues.some((issue) => issue.code === 'outside-room'));
});

test('clearance is data-driven and door swing conflicts are reported', () => {
  const result = validateLayoutGeometry(layout({ furniture: [
    { id: 'door', type: 'door', xMm: 0, yMm: 0, widthMm: 900, depthMm: 100, rotationDeg: 0, clearanceMm: 0, swingMm: 1200 },
    bed('bed', 800, 100, 1200, 1800),
  ] }));
  assert.ok(result.issues.some((issue) => issue.code === 'door-swing-blocked'));
});

test('matcher excludes unapproved layouts and ranks deterministic score', () => {
  const good = layout({ id: 'a', furniture: [bed('bed', 0, 0, 1524, 2032, { clearanceMm: 0 }), { id: 'desk', type: 'desk', xMm: 1800, yMm: 0, widthMm: 900, depthMm: 600, rotationDeg: 0, clearanceMm: 0 }] });
  const pending = { ...good, id: 'b', qualityStatus: 'visual-reviewed' };
  const request = { width: 10, length: 10, unit: 'ft', shape: 'square', requiredFurniture: ['bed', 'desk'], occupancy: 'single', priorities: ['circulation'] };
  const matches = matchLayouts([pending, good], request);
  assert.deepEqual(matches.map((match) => match.layout.id), ['a']);
  assert.equal(scoreLayout(good, request).scoreBreakdown.requiredFurniture, 25);
});

test('imperial room rounding keeps a 10 × 12 ft authored edge matchable', () => {
  const authored = layout({ id: '10x12-rounding', roomWidthMm: 3048, roomLengthMm: 3658, shape: 'rectangle', areaMm2: 3048 * 3658, furniture: [bed('bed', 0, 0)] });
  const request = { width: 10, length: 12, unit: 'ft', shape: 'rectangle', requiredFurniture: ['bed'], occupancy: 'single', priorities: [] };
  assert.equal(matchLayouts([authored], request).length, 1);
});

test('custom bed and too-small room fail conservatively', () => {
  const custom = layout({ furniture: [bed('custom-bed', 0, 0, 2100, 2100, { type: 'custom' })] });
  assert.equal(validateLayoutGeometry(custom).valid, true);
  const request = { width: 2, length: 2, unit: 'm', shape: 'square', requiredFurniture: ['custom'], occupancy: 'single', priorities: [] };
  assert.equal(matchLayouts([custom], request).length, 0);
});

test('regional bed presets remain canonical millimetres and format without changing fit math', () => {
  const queen = findBedPreset('us-queen');
  assert.deepEqual({ widthMm: queen.widthMm, depthMm: queen.depthMm }, { widthMm: 1524, depthMm: 2032 });
  assert.equal(formatPresetSize(queen, 'cm'), '152.4 × 203.2 cm');
});

test('regional preset coverage includes US, Taiwan, and metric European-style sets', () => {
  assert.equal(findBedPreset('us-queen').region, 'us');
  assert.equal(findBedPreset('tw-5-ft').region, 'tw');
  assert.equal(findBedPreset('eu-double').region, 'eu');
});

test('approval status requires separate review gates and rejects on any failed gate', () => {
  assert.deepEqual(advanceLayoutStatus('geometry-validated', { geometry: true, functional: true, visual: true, distinctiveness: true }), { status: 'approved' });
  assert.equal(advanceLayoutStatus('geometry-validated', { geometry: true, functional: false, visual: true, distinctiveness: true, reason: 'chair blocked' }).status, 'rejected');
});

test('distinctiveness signature rejects a true duplicate but accepts a strategy change', () => {
  const a = layout({ furniture: [bed('bed', 0, 0)] });
  const duplicate = { ...a, id: 'duplicate' };
  const different = { ...a, id: 'different', furniture: [bed('bed', 100, 0, 1000, 1800, { rotationDeg: 90 })] };
  assert.equal(distinctivenessScore(duplicate, [a]), 0);
  assert.equal(distinctivenessScore(different, [a]), 1);
});

test('studio validation requires complete zones and multifunctional furniture', () => {
  const studio = { occupancy: 'studio', zones: ['sleep', 'work', 'living', 'dining', 'storage-entry'], clearances: { 'studio-entry-mm': 900 }, furniture: [
    { ...bed('bed', 0, 0), type: 'bed' },
    { id: 'desk', type: 'desk', xMm: 1500, yMm: 0, widthMm: 1000, depthMm: 600, rotationDeg: 0, clearanceMm: 0 },
    { id: 'chair', type: 'chair', xMm: 1500, yMm: 700, widthMm: 500, depthMm: 500, rotationDeg: 0, clearanceMm: 0 },
    { id: 'sofa', type: 'sofa', xMm: 0, yMm: 2500, widthMm: 1800, depthMm: 850, rotationDeg: 0, clearanceMm: 0 },
    { id: 'dining', type: 'dining-table', xMm: 2500, yMm: 2500, widthMm: 900, depthMm: 650, rotationDeg: 0, clearanceMm: 0 },
    { id: 'storage', type: 'storage-cabinet', xMm: 4000, yMm: 0, widthMm: 700, depthMm: 550, rotationDeg: 0, clearanceMm: 0 },
  ] };
  assert.equal(validateStudioLayout(studio).valid, true);
  assert.equal(validateStudioLayout({ ...studio, zones: ['sleep'] }).valid, false);
});

test('top three selection favours distinct authored strategies', () => {
  const makeMatch = (id, strategyKey, score) => ({ layout: layout({ id, strategyKey, archetype: strategyKey }), score, scoreBreakdown: { geometry: score, requiredFurniture: 0, circulation: 0, priorities: 0, shape: 0 }, whyItMatches: [], tradeoffs: [] });
  const selected = selectDiverseTopMatches([makeMatch('a', 'work-first', 94), makeMatch('b', 'work-first', 92), makeMatch('c', 'open-space', 89), makeMatch('d', 'storage-first', 87)], 3);
  assert.deepEqual(selected.map((item) => item.layout.id), ['a', 'c', 'd']);
});

test('planner handoff is versioned, create-new, and preserves furniture geometry', () => {
  const source = layout({ id: 'handoff-a', furniture: [bed('bed', 100, 200), { id: 'desk', type: 'desk', xMm: 1200, yMm: 400, widthMm: 1000, depthMm: 600, rotationDeg: 90, clearanceMm: 0 }] });
  const handoff = createPlannerHandoff(source);
  assert.equal(isLayoutVaultHandoff(handoff), true);
  assert.equal(handoff.mode, 'create-new');
  const design = handoffToPlannerDesign(handoff);
  assert.deepEqual(design.room, { w: 304.8, h: 304.8, unit: 'cm' });
  assert.equal(design.items.find((item) => item.type === 'desk').rotation, 90);
  assert.equal(design.items.find((item) => item.type === 'desk').w, 100);
});

test('layout analytics payload excludes exact measurements and personal fields', () => {
  const clean = sanitiseLayoutAnalytics({ locale: 'en', family: '10x12-bedroom', strategy: 'work-first', width: 3000, email: 'buyer@example.com', roomWidthMm: 3000 });
  assert.deepEqual(clean, { product_id: 'roomfeng-layout-vault-v1', locale: 'en', family: '10x12-bedroom', strategy: 'work-first' });
});
