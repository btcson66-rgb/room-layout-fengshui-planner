import assert from 'node:assert/strict';
import test from 'node:test';

import worker, { canonicalLocation } from '../src/index.mjs';

test('canonicalLocation preserves the path and query string', () => {
  assert.equal(
    canonicalLocation('https://www.roomfeng.win/zh/blog/bed-under-window-solutions/?utm_source=gsc&lang=zh'),
    'https://roomfeng.win/zh/blog/bed-under-window-solutions/?utm_source=gsc&lang=zh',
  );
});

test('the www root permanently redirects to the apex root', async () => {
  const response = await worker.fetch(new Request('https://www.roomfeng.win/'));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://roomfeng.win/');
});

test('deep links redirect without losing path or query parameters', async () => {
  const response = await worker.fetch(
    new Request('http://www.roomfeng.win/zh/room-layout-planner/?room=small&unit=cm'),
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://roomfeng.win/zh/room-layout-planner/?room=small&unit=cm');
});

test('unexpected hosts fail closed', async () => {
  const response = await worker.fetch(new Request('https://roomfeng.win/'));

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('location'), null);
});
