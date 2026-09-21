import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('Final Header Closeout 007 locks the measured desktop breakpoint and row gates', () => {
  const css = read('src/styles/global.css');
  const browser = read('scripts/test/live-crawl-006.browser.mjs');
  assert.match(css, /@media \(min-width: 1200px\)/);
  assert.match(css, /\.site-nav-desktop \.nav-list \{[^}]*flex-wrap: nowrap;/s);
  assert.match(browser, /const DESKTOP_HEADER_BREAKPOINT = 1200/);
  assert.match(browser, /\[390, 768, 1024, 1080, 1120, 1180, 1200, 1280, 1440\]/);
  assert.match(browser, /navItemRowDelta/);
  assert.match(browser, /controlRowDelta/);
  assert.match(browser, /safetyMargin/);
  assert.match(browser, /header height exceeds 82px/);
  assert.match(browser, /desktop nav flex-wrap/);
});
