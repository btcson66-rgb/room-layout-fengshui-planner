import test from 'node:test';
import assert from 'node:assert/strict';
import { QUEUE, REQUIRED_CHECKS, checksPassed, dateIn, decideNext, deployHealthy, runsAwaitingApproval } from '../scheduled-content-merge.mjs';

const pick = ({ ok, pending }) => ({ ok, pending });

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
  assert.deepEqual(pick(checksPassed([], [])), { ok: false, pending: true });
  assert.deepEqual(pick(checksPassed([{ name: 'preflight', status: 'in_progress', conclusion: null }], ['preflight'])), { ok: false, pending: true });
  assert.deepEqual(pick(checksPassed([{ name: 'preflight', status: 'completed', conclusion: 'failure' }], ['preflight'])), { ok: false, pending: false });
  assert.equal(checksPassed([
    { name: 'preflight', status: 'completed', conclusion: 'success' },
    { name: 'optional', status: 'completed', conclusion: 'skipped' },
  ], ['preflight']).ok, true);
});

test('required checks that have not appeared yet are waited for, not passed', () => {
  // After update-branch the new head starts with no check runs until the dispatched Preflight registers them.
  const onlyPreflight = [{ name: 'preflight', status: 'completed', conclusion: 'success' }];
  const result = checksPassed(onlyPreflight, REQUIRED_CHECKS);
  assert.equal(result.ok, false);
  assert.equal(result.pending, true);
  const all = REQUIRED_CHECKS.map((name) => ({ name, status: 'completed', conclusion: 'success' }));
  assert.equal(checksPassed(all).ok, true);
});

test('a re-run check is judged by its newest attempt', () => {
  const runs = [
    { name: 'preflight', status: 'completed', conclusion: 'failure', started_at: '2026-10-15T01:00:00Z' },
    { name: 'preflight', status: 'completed', conclusion: 'success', started_at: '2026-10-15T02:00:00Z' },
  ];
  assert.equal(checksPassed(runs, ['preflight']).ok, true);
});

test('latest completed deploy must be a success', () => {
  const ok = { status: 'completed', conclusion: 'success', html_url: 'u1' };
  const bad = { status: 'completed', conclusion: 'failure', html_url: 'u2' };
  assert.equal(deployHealthy([bad, ok]).ok, false, 'newest completed run decides');
  assert.equal(deployHealthy([{ status: 'in_progress' }, ok]).ok, true);
  assert.equal(deployHealthy([]).ok, false);
});

test('a failure only in the post-deploy Lighthouse gate does not stall the calendar', () => {
  const failed = { status: 'completed', conclusion: 'failure', html_url: 'u3' };
  assert.equal(deployHealthy([failed], ['Run production Lighthouse gate (desktop and mobile)']).ok, true);
  assert.equal(deployHealthy([failed], ['Run production Lighthouse gate (desktop and mobile)', 'Deploy to Cloudflare Pages']).ok, false);
  assert.equal(deployHealthy([failed], ['Run npm run build']).ok, false);
  assert.equal(deployHealthy([failed], ['Install Chromium for post-deploy browser and Lighthouse gates']).ok, false, 'pre-deploy step stays blocking');
  assert.equal(deployHealthy([failed], []).ok, false, 'unknown failure stays blocking');
  assert.equal(deployHealthy([{ status: 'completed', conclusion: 'cancelled', html_url: 'u4' }], []).ok, false);
});

test('Taipei date conversion', () => {
  assert.equal(dateIn('Asia/Taipei', '2026-10-15T15:59:59Z'), '2026-10-15');
  assert.equal(dateIn('Asia/Taipei', '2026-10-15T16:00:00Z'), '2026-10-16');
});

test('finds pull_request runs held at action_required on the current head only', () => {
  // 2026-10-22 #136: update-branch by github-actions[bot] left run 39734932882 at action_required,
  // while the workflow_dispatch run on the same head succeeded but did not satisfy branch protection.
  const head = '57fd18725268a1f4497e75bd2e18c9360a3b6e45';
  const runs = [
    { id: 39734936546, event: 'workflow_dispatch', head_sha: head, status: 'completed', conclusion: 'success' },
    { id: 39734932882, event: 'pull_request', head_sha: head, status: 'completed', conclusion: 'action_required' },
    { id: 38647266943, event: 'pull_request', head_sha: 'f8b0aa0', status: 'completed', conclusion: 'action_required' },
    { id: 1, event: 'pull_request', head_sha: head, status: 'completed', conclusion: 'success' },
  ];
  assert.deepEqual(runsAwaitingApproval(runs, head).map((run) => run.id), [39734932882]);
  assert.deepEqual(runsAwaitingApproval([], head), []);
});
