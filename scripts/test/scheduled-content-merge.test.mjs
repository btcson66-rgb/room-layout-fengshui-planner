import test from 'node:test';
import assert from 'node:assert/strict';
import { QUEUE, checksPassed, dateIn, decideNext, deployHealthy } from '../scheduled-content-merge.mjs';

const open = (number) => ({ number, state: 'open', merged: false, merged_at: null });
const merged = (number, at) => ({ number, state: 'closed', merged: true, merged_at: at });

test('queue is the 14-day calendar in order', () => {
  assert.equal(QUEUE.length, 14);
  assert.deepEqual(QUEUE, [...QUEUE].sort((a, b) => a - b));
});

test('merges the first open PR after earlier days merged on previous days', () => {
  const prs = [merged(132, '2026-10-15T02:00:00Z'), open(133), open(134)];
  assert.deepEqual(decideNext(prs, '2026-10-16'), { action: 'merge', pr: 133, reason: '下一個待發布：#133' });
});

test('only one merge per Taipei calendar day', () => {
  // 2026-10-15T17:00Z is 2026-10-16 01:00 in Taipei.
  const prs = [merged(132, '2026-10-15T17:00:00Z'), open(133)];
  assert.equal(decideNext(prs, '2026-10-16').action, 'skip');
  assert.equal(decideNext(prs, '2026-10-17').action, 'merge');
});

test('stops when a queued PR was closed without merging', () => {
  const prs = [merged(132, '2026-10-15T02:00:00Z'), { number: 133, state: 'closed', merged: false, merged_at: null }, open(134)];
  const decision = decideNext(prs, '2026-10-16');
  assert.equal(decision.action, 'blocked');
  assert.equal(decision.pr, 133);
});

test('reports done when everything is merged', () => {
  const prs = [merged(132, '2026-10-01T02:00:00Z'), merged(133, '2026-10-02T02:00:00Z')];
  assert.equal(decideNext(prs, '2026-10-20').action, 'done');
});

test('checks must all be completed and passing', () => {
  assert.equal(checksPassed([]).ok, false);
  assert.equal(checksPassed([{ name: 'preflight', status: 'in_progress', conclusion: null }]).ok, false);
  assert.equal(checksPassed([{ name: 'preflight', status: 'completed', conclusion: 'failure' }]).ok, false);
  assert.equal(checksPassed([
    { name: 'preflight', status: 'completed', conclusion: 'success' },
    { name: 'optional', status: 'completed', conclusion: 'skipped' },
  ]).ok, true);
});

test('latest completed deploy must be a success', () => {
  const ok = { status: 'completed', conclusion: 'success', html_url: 'u1' };
  const bad = { status: 'completed', conclusion: 'failure', html_url: 'u2' };
  assert.equal(deployHealthy([bad, ok]).ok, false, 'newest completed run decides');
  assert.equal(deployHealthy([{ status: 'in_progress' }, ok]).ok, true);
  assert.equal(deployHealthy([]).ok, false);
});

test('Taipei date conversion', () => {
  assert.equal(dateIn('Asia/Taipei', '2026-10-15T15:59:59Z'), '2026-10-15');
  assert.equal(dateIn('Asia/Taipei', '2026-10-15T16:00:00Z'), '2026-10-16');
});
