import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const component = fs.readFileSync(new URL('../../src/components/PlannerCta.astro', import.meta.url), 'utf8');
const globalCss = fs.readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => channel(Number.parseInt(value, 16)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

test('planner CTA kicker uses a WCAG AA text color on its white surface', () => {
  assert.match(component, /\.planner-cta__kicker\s*{[^}]*color:\s*var\(--color-primary-strong\)/s);
  const color = globalCss.match(/--color-primary-strong:\s*(#[a-f\d]{6})/i)?.[1];
  const surface = globalCss.match(/--color-surface:\s*(#[a-f\d]{6})/i)?.[1];
  assert.ok(color && surface, 'expected both color variables in global.css');
  assert.ok(contrast(color, surface) >= 4.5, `expected at least 4.5:1 contrast, got ${contrast(color, surface).toFixed(2)}:1`);
});

test('hidden consent and status controls cannot be redisplayed by inline layout styles', () => {
  assert.match(globalCss, /\[hidden\]\s*{[^}]*display:\s*none\s*!important/s);
});
