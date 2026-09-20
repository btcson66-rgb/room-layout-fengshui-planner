import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { isValidAdSenseSlot, resolveAdSenseSlot } from '../../src/config/adsense.mjs';

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
  assert.match(adSlot, /resolveAdSenseSlot/);
  assert.match(adSlot, /data-ad-placement=\{placement\}/);
  assert.doesNotMatch(adSlot, /adSlot\?: string/);
});

test('AdSense resolver rejects placement keys and publisher IDs but accepts numeric test slots', () => {
  assert.equal(resolveAdSenseSlot('en-home-mid'), null);
  assert.equal(resolveAdSenseSlot('en-home-mid', 'en-home-mid'), null);
  assert.equal(resolveAdSenseSlot('en-home-mid', 'ca-pub-9117672212804270'), null);
  assert.equal(resolveAdSenseSlot('test-placement', '1234567890'), '1234567890');
  assert.equal(isValidAdSenseSlot('1234567890'), true);
  assert.equal(isValidAdSenseSlot('1234abc'), false);
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
