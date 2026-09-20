import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('Final Live Crawl 006 has a single AdSense placement/slot boundary', () => {
  const source = read('src/components/AdSlot.astro');
  assert.match(source, /placement: string/);
  assert.match(source, /resolveAdSenseSlot\(placement, slotId\)/);
  assert.match(source, /data-ad-placement=\{placement\}/);
  assert.doesNotMatch(source, /adSlot\?: string/);
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.astro')) files.push(full);
    }
  };
  walk(path.join(root, 'src'));
  const callsites = files.flatMap((file) => fs.readFileSync(file, 'utf8').match(/<AdSlot[\s\S]*?>/g) ?? []);
  assert.ok(callsites.length > 0);
  assert.ok(callsites.every((callsite) => /placement=/.test(callsite)), 'all AdSlot callsites must name their RoomFeng placement');
  assert.ok(callsites.every((callsite) => !/adSlot=/.test(callsite)), 'placement names must not be passed as adSlot');
});

test('Localization is explicit at every English and Chinese FAQ/RelatedLinks callsite', () => {
  const pagesDir = path.join(root, 'src/pages');
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.astro')) files.push(full);
    }
  };
  walk(pagesDir);
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const calls = source.match(/<(?:Faq|RelatedLinks)\b[^>]*>/g) ?? [];
    if (!calls.length) continue;
    const expected = relative.startsWith('src/pages/en/') ? 'en' : 'zh';
    assert.ok(calls.every((call) => call.includes(`lang="${expected}"`)), `${relative} must pass lang="${expected}"`);
  }
  assert.match(read('src/components/Faq.astro'), /Frequently asked questions/);
  assert.match(read('src/components/RelatedLinks.astro'), /Related pages/);
});

test('Chinese Furniture Fit has no known English operation sentences', () => {
  const source = read('src/components/FurnitureFitTool.astro');
  for (const phrase of ['Physical fit', 'Requested clearance', 'Open this exact configuration in Room Planner', 'Try this size in Planner']) {
    const zhBlock = source.slice(source.indexOf('} : {'), source.indexOf('};', source.indexOf('} : {')));
    assert.doesNotMatch(zhBlock, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(source, /本體適配/);
  assert.match(source, /要求淨空/);
  assert.match(source, /把這組尺寸帶入 Room Planner/);
  assert.match(source, /在 Planner 試這個尺寸/);
});

test('Header keeps compact navigation until 1080px and preserves touch sizing', () => {
  const css = read('src/styles/global.css');
  assert.match(css, /@media \(min-width: 1080px\)/);
  assert.match(css, /\.site-nav-toggle[^\n]*min-height: 44px/);
  assert.match(css, /\.nav-list a, \.language-switcher a[^\n]*min-height: 44px/);
  assert.match(css, /\.language-switcher a[^\n]*white-space: nowrap/);
});

test('Live crawl gate covers production routes and emits required evidence', () => {
  const source = read('scripts/test/live-crawl-006.browser.mjs');
  for (const route of ['/en/', '/en/room-layout-planner/', '/en/furniture-fit-checker/', '/en/small-bedroom-layout-planner/', '/en/studio-apartment-layout/', '/en/layout-guides/10x10-bedroom-layout/', '/en/contractor-margin-guard/', '/zh/moving-furniture-size-check/', '/en/moving-furniture-size-check/']) {
    assert.match(source, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const artifact of ['adsense-network-summary.json', 'localization-summary.json', 'responsive-header-summary.json']) assert.match(source, new RegExp(artifact));
});
