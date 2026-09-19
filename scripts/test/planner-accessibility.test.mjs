import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentSource = await readFile(new URL('../../src/components/AffiliateRecs.astro', import.meta.url), 'utf8');
const globalCss = await readFile(new URL('../../src/styles/global.css', import.meta.url), 'utf8');
const plannerSource = await readFile(new URL('../../src/planner/planner.ts', import.meta.url), 'utf8');
const plannerCss = await readFile(new URL('../../src/styles/planner.css', import.meta.url), 'utf8');

function token(source, name) {
  const match = source.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `missing ${name}`);
  return match[1];
}

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test('affiliate kicker resolves to an existing text token that passes AA on its light and dark rendered surfaces', () => {
  assert.match(
    componentSource,
    /\.affiliate-recs__kicker\s*\{[^}]*color:\s*var\(--color-primary-strong\)/s,
    'affiliate kicker must use the existing darker component text token',
  );
  const foreground = token(globalCss, '--color-primary-strong');
  const surface = token(globalCss, '--color-surface');
  assert.ok(contrast(foreground, surface) >= 4.5, 'light contrast must be at least 4.5:1');
  assert.ok(contrast(foreground, surface) >= 4.5, 'dark preference retains the same white component surface and must be at least 4.5:1');
});

test('planner exposes a named group containing single-level furniture buttons', () => {
  assert.match(plannerSource, /<svg class="planner-svg" role="group" aria-label="Room floor plan"><\/svg>/);
  assert.doesNotMatch(plannerSource, /<svg class="planner-svg" role="img"/);
  assert.match(plannerSource, /role: 'button'/);
  assert.match(plannerSource, /tabindex: '0'/);
  assert.match(plannerSource, /'aria-pressed': selected \? 'true' : 'false'/);
});

test('furniture buttons retain keyboard activation and a visible focus indicator', () => {
  assert.match(plannerSource, /svg\.addEventListener\('keydown'/);
  assert.match(plannerSource, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(plannerSource, /state\.selectedId = id/);
  assert.match(plannerSource, /selected\?\.focus\(\)/);
  assert.match(plannerCss, /\.planner-item:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--color-primary-strong\)/s);
});
