import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MATTRESS_DIMENSIONS_IN,
  calculateBedRoomFit,
  calculateDoorOpeningFit,
  calculateFurnitureFit,
  toMillimetres,
} from '../../src/us-seo/calculators.ts';

const d = (value, unit = 'in') => ({ value, unit });

test('US mattress presets use the specified common dimensions', () => {
  assert.deepEqual(MATTRESS_DIMENSIONS_IN, {
    Twin: { width: 38, length: 75 },
    'Twin XL': { width: 38, length: 80 },
    Full: { width: 54, length: 75 },
    Queen: { width: 60, length: 80 },
    King: { width: 76, length: 80 },
    'California King': { width: 72, length: 84 },
  });
});

test('furniture fit distinguishes exact physical fit from requested clearances', () => {
  const fit = calculateFurnitureFit({ roomWidth: d(120), roomLength: d(120), furnitureWidth: d(60), furnitureDepth: d(80), left: d(24), right: d(24), front: d(24), back: d(24) });
  assert.equal(fit.physicalFit, true);
  assert.equal(fit.requestedClearanceFit, false);
  assert.equal(fit.orientations[0].physicalFit, true);
  assert.equal(fit.orientations[1].physicalFit, true);
});

test('bed fit accepts a Queen in a 10 by 10 foot room with planning clearances', () => {
  const fit = calculateBedRoomFit({ roomWidth: d(10, 'ft'), roomLength: d(10, 'ft'), bedWidth: d(60), bedLength: d(80), left: d(24), right: d(24), foot: d(30), head: d(0) });
  assert.equal(fit.physicalFit, true);
  assert.equal(fit.requestedClearanceFit, true);
});

test('bed fit can pass physical fit while failing large access requests', () => {
  const fit = calculateBedRoomFit({ roomWidth: d(8, 'ft'), roomLength: d(10, 'ft'), bedWidth: d(76), bedLength: d(80), left: d(30), right: d(30), foot: d(30), head: d(0) });
  assert.equal(fit.physicalFit, true);
  assert.equal(fit.requestedClearanceFit, false);
});

test('door opening check tests both orientations and reports tight openings', () => {
  const passed = calculateDoorOpeningFit({ doorWidth: d(40), doorHeight: d(80), couchDepth: d(34), couchHeight: d(38), removableLegReduction: d(0) });
  assert.equal(passed.status, 'fit');
  assert.equal(passed.passedOrientation?.label, 'Orientation A');
  const tight = calculateDoorOpeningFit({ doorWidth: d(35), doorHeight: d(80), couchDepth: d(34), couchHeight: d(38), removableLegReduction: d(0) });
  assert.equal(tight.status, 'tight');
  const edgeTight = calculateDoorOpeningFit({ doorWidth: d(36), doorHeight: d(80), couchDepth: d(34), couchHeight: d(38), removableLegReduction: d(0) });
  assert.equal(edgeTight.status, 'tight');
  const failed = calculateDoorOpeningFit({ doorWidth: d(30), doorHeight: d(70), couchDepth: d(34), couchHeight: d(38), removableLegReduction: d(0) });
  assert.equal(failed.status, 'fail');
  assert.equal(failed.passedOrientation, null);
});

test('boundary equality fits and a slightly larger item fails', () => {
  const exact = calculateFurnitureFit({ roomWidth: d(60), roomLength: d(80), furnitureWidth: d(60), furnitureDepth: d(80), left: d(0), right: d(0), front: d(0), back: d(0) });
  assert.equal(exact.physicalFit, true);
  const tooLarge = calculateFurnitureFit({ roomWidth: d(60), roomLength: d(80), furnitureWidth: d(60.01), furnitureDepth: d(80), left: d(0), right: d(0), front: d(0), back: d(0) });
  assert.equal(tooLarge.physicalFit, false);
});

test('metric dimensions are converted and invalid dimensions are rejected', () => {
  assert.equal(Math.round(toMillimetres(100, 'cm')), 1000);
  const metric = calculateFurnitureFit({ roomWidth: d(300, 'cm'), roomLength: d(400, 'cm'), furnitureWidth: d(100, 'cm'), furnitureDepth: d(200, 'cm'), left: d(0, 'cm'), right: d(0, 'cm'), front: d(0, 'cm'), back: d(0, 'cm') });
  assert.equal(metric.physicalFit, true);
  assert.throws(() => toMillimetres(0, 'in'), /greater than zero/);
  assert.throws(() => calculateBedRoomFit({ roomWidth: d(-1), roomLength: d(100), bedWidth: d(60), bedLength: d(80), left: d(0), right: d(0), foot: d(0), head: d(0) }), /Room width/);
  assert.throws(() => calculateFurnitureFit({ roomWidth: d(100), roomLength: d(100), furnitureWidth: d(50), furnitureDepth: d(50), left: d(-1), right: d(0), front: d(0), back: d(0) }), /Left clearance/);
});
