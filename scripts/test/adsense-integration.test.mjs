import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const adSlot = await fs.readFile(new URL('../../src/components/AdSlot.astro', import.meta.url), 'utf8');
const baseHead = await fs.readFile(new URL('../../src/components/BaseHead.astro', import.meta.url), 'utf8');
const lighthouse = await fs.readFile(new URL('../lighthouse-production.mjs', import.meta.url), 'utf8');

test('AdSlot waits for measurable viewport proximity and initializes exactly once', () => {
  assert.match(adSlot, /IntersectionObserver/);
  assert.match(adSlot, /ResizeObserver/);
  assert.match(adSlot, /requestIdleCallback/);
  assert.match(adSlot, /getBoundingClientRect\(\)\.width > 0/);
  assert.match(adSlot, /dataset\.adInitialized = 'true'/);
  assert.match(adSlot, /window\.adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\)/);
  assert.match(adSlot, /duplicateInitializations/);
});

test('Planner pages defer the AdSense loader while preserving ownership meta', () => {
  assert.match(baseHead, /adsenseDeferred\?: boolean/);
  assert.match(baseHead, /google-adsense-account/);
  assert.match(baseHead, /window\.__roomfengLoadAdSense/);
  assert.match(baseHead, /adsenseDeferred \? '' : 'window\.__roomfengLoadAdSense\(\);'/);
});

test('Lighthouse applies LCP and TBT thresholds to Planner entries', () => {
  assert.match(lighthouse, /entry\.metrics\.lcp === null \|\| entry\.metrics\.lcp > 2500/);
  assert.match(lighthouse, /entry\.metrics\.tbt === null \|\| entry\.metrics\.tbt > 200/);
  assert.doesNotMatch(lighthouse, /if \(!entry\.planner\)/);
});
