import assert from 'node:assert/strict';
import test from 'node:test';
import { assessFurniture } from '../src/moving-os/decisionEngine.ts';
import { createSampleProject } from '../src/moving-os/sampleData.ts';
import { validateProject } from '../src/moving-os/storage.ts';
import { sanitizeSpreadsheetCell } from '../src/moving-os/security.ts';
import { fromMm, toMm, validateMeasurement } from '../src/moving-os/units.ts';

test('cm, mm, and inch conversions round-trip through canonical millimetres', () => {
  for (const [value, unit] of [[123.456, 'mm'], [245.7, 'cm'], [37.25, 'in']]) {
    assert.ok(Math.abs(fromMm(toMm(value, unit), unit) - value) < 0.001);
  }
});

test('measurement validation rejects zero, negative, tiny, and implausibly large values', () => {
  assert.match(validateMeasurement(0), /greater than zero/);
  assert.match(validateMeasurement(-1), /greater than zero/);
  assert.match(validateMeasurement(0.5), /under 1 mm/);
  assert.match(validateMeasurement(100_001), /too large/);
  assert.equal(validateMeasurement(1), null);
});

test('spreadsheet exports neutralize formula-like user input', () => {
  for (const value of ['=1+1', '+cmd', '-2+3', '@SUM(A1:A2)', '\tformula']) assert.ok(sanitizeSpreadsheetCell(value).startsWith("'"));
  assert.equal(sanitizeSpreadsheetCell('ordinary text'), 'ordinary text');
});

test('backup validation rejects malformed nested records and unsafe product URLs', () => {
  const malformed = createSampleProject('en');
  malformed.furniture[0].dimensions.width = Number.NaN;
  assert.throws(() => validateProject(malformed), /furniture entry is malformed/);
  const unsafe = createSampleProject('en');
  unsafe.shopping[0].url = 'javascript:alert(1)';
  assert.throws(() => validateProject(unsafe), /unsafe scheme/);
});

test('exact opening width is a likely preliminary pass', () => {
  const project = createSampleProject('en');
  const item = project.furniture[0];
  item.canDisassemble = false;
  item.dimensions = { width: 820, depth: 800, height: 1800 };
  project.entryRoute.elevatorDoorWidthMm = 820;
  project.entryRoute.interiorDoorWidthMm = 820;
  project.entryRoute.elevatorDepthMm = 2200;
  project.entryRoute.landingDepthMm = 2200;
  assert.equal(assessFurniture(project, item).entry, 'likely');
});

test('one millimetre beyond the narrowest opening fails the current measurement', () => {
  const project = createSampleProject('en');
  const item = project.furniture[0];
  item.canDisassemble = false;
  item.dimensions = { width: 821, depth: 900, height: 1800 };
  project.entryRoute.elevatorDoorWidthMm = 820;
  project.entryRoute.interiorDoorWidthMm = 820;
  assert.equal(assessFurniture(project, item).entry, 'fail');
});

test('old-home exit is included in the end-to-end route bottleneck', () => {
  const project = createSampleProject('en');
  const item = project.furniture[0];
  item.canDisassemble = false;
  item.dimensions = { width: 881, depth: 900, height: 1800 };
  project.entryRoute.oldHomeExitWidthMm = 880;
  assert.equal(assessFurniture(project, item).entry, 'fail');
});

test('room fit evaluates both 90-degree orientations', () => {
  const project = createSampleProject('en');
  const item = project.furniture[0];
  const room = project.rooms.find((candidate) => candidate.id === item.destinationRoomId);
  room.lengthMm = 2100; room.widthMm = 1600; room.ceilingMm = 2500;
  item.dimensions = { width: 2000, depth: 1500, height: 500 };
  assert.equal(assessFurniture(project, item).room, 'pass');
  item.dimensions = { width: 2101, depth: 1601, height: 500 };
  assert.equal(assessFurniture(project, item).room, 'fail');
});

test('recorded fixed objects force a conservative layout review', () => {
  const project = createSampleProject('en');
  const item = project.furniture.find((candidate) => candidate.destinationRoomId === 'room-living');
  const assessment = assessFurniture(project, item);
  assert.equal(assessment.room, 'tight');
  assert.match(assessment.reasons.join(' '), /Fixed objects/);
});

test('incomplete route never claims a likely fit', () => {
  const project = createSampleProject('en');
  Object.assign(project.entryRoute, { elevatorDoorWidthMm: 0, corridorWidthMm: 0, stairWidthMm: 0, entranceWidthMm: 0, interiorDoorWidthMm: 0 });
  assert.equal(assessFurniture(project, project.furniture[0]).entry, 'review');
});

test('backup validation rejects unsupported schemas and oversized arrays', () => {
  const project = createSampleProject('en');
  assert.equal(validateProject(project).schemaVersion, 1);
  assert.throws(() => validateProject({ ...project, schemaVersion: 99 }), /unsupported/);
  assert.throws(() => validateProject({ ...project, boxes: Array(5001).fill({}) }), /too large/);
});

test('backup validation migrates older v1 backups and validates layout snapshots', () => {
  const legacy = createSampleProject('en');
  delete legacy.layouts;
  delete legacy.entryRoute.oldHomeExitWidthMm;
  delete legacy.entryRoute.oldHomeExitHeightMm;
  const migrated = validateProject(legacy);
  assert.deepEqual(migrated.layouts, []);
  assert.equal(migrated.entryRoute.oldHomeExitWidthMm, 0);
  assert.equal(migrated.entryRoute.oldHomeExitHeightMm, 0);
  const valid = createSampleProject('en');
  valid.layouts = [{ slot: 'A', savedAt: new Date().toISOString(), roomId: 'room-living', roomName: 'Living room', plannerData: { room: { w: 480, h: 360 }, items: [] } }];
  assert.equal(validateProject(valid).layouts[0].slot, 'A');
  assert.throws(() => validateProject({ ...valid, layouts: Array(4).fill(valid.layouts[0]) }), /at most three/);
  assert.throws(() => validateProject({ ...valid, layouts: [{ slot: 'D', savedAt: '', plannerData: {} }] }), /malformed/);
});
