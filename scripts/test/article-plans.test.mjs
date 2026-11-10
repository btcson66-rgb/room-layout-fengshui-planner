import assert from 'node:assert/strict';
import test from 'node:test';
import { anchorProblems, geometryProblems, renderProblems, sizeMentioned, textProblems } from '../lib/article-plans.mjs';

const plan = {
  id: 'p', after: '範例', roomWidthCm: 300, roomLengthCm: 360, caption: 'c', ariaLabel: 'a',
  furniture: [{ x: 10, y: 10, width: 152, depth: 188, label: 'bed' }],
  openings: [{ kind: 'door', wall: 'top', offset: 20, width: 80 }],
};

test('sizeMentioned accepts either order and separators', () => {
  assert.ok(sizeMentioned('房間 300 × 360 公分', 300, 360));
  assert.ok(sizeMentioned('360x300', 300, 360));
  assert.ok(!sizeMentioned('3000 × 360', 300, 360));
});

test('geometry catches furniture outside the room, overlaps and openings past the wall', () => {
  assert.deepEqual(geometryProblems(plan), []);
  assert.equal(geometryProblems({ ...plan, furniture: [{ x: 200, y: 10, width: 152, depth: 188, label: 'bed' }] }).length, 1);
  assert.equal(geometryProblems({ ...plan, furniture: [...plan.furniture, { x: 100, y: 100, width: 50, depth: 50, label: 'x' }] }).length, 1);
  assert.equal(geometryProblems({ ...plan, openings: [{ kind: 'door', wall: 'top', offset: 250, width: 80 }] }).length, 1);
});

test('text must state room and furniture sizes', () => {
  assert.deepEqual(textProblems(plan, '300 × 360 公分的房間，152 × 188 的床'), []);
  assert.equal(textProblems(plan, '300 × 360 公分的房間').length, 1);
});

test('anchor must match exactly one H2 and the figure must follow it', () => {
  assert.equal(anchorProblems(plan, '## 其他\n').length, 1);
  assert.equal(anchorProblems(plan, '## 範例\n文\n').length, 0);
  const html = '<h2 id="a">範例</h2><p>x</p><figure data-plan-id="p"><figcaption>c</figcaption></figure><h2>下一段</h2>';
  assert.deepEqual(renderProblems(plan, '', html), []);
  assert.equal(renderProblems(plan, '', '<h2>下一段</h2><figure data-plan-id="p"></figure>').length > 0, true);
  assert.equal(renderProblems(plan, '', '<h2>範例</h2>').length, 1);
});
