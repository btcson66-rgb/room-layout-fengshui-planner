import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyConsoleMessage,
  classifyPageError,
  isThirdPartyUrl,
} from '../production-signal-classifier.mjs';

test('RoomFeng source URLs are always first-party even when the message looks external', () => {
  assert.equal(isThirdPartyUrl('https://roomfeng.win/_astro/planner.js', 'https://roomfeng.win'), false);
  assert.equal(isThirdPartyUrl('https://roomfeng.win/_astro/planner.js?TagError=Wl', 'https://roomfeng.win'), false);
  assert.equal(isThirdPartyUrl('https://cdn.roomfeng.win/chunk.js', 'https://roomfeng.win'), false);
});

test('only explicit third-party source domains are external', () => {
  assert.equal(isThirdPartyUrl('https://www.googletagmanager.com/gtm.js', 'https://roomfeng.win'), true);
  assert.equal(isThirdPartyUrl('https://www.google-analytics.com/g/collect', 'https://roomfeng.win'), true);
  assert.equal(isThirdPartyUrl('https://example.invalid/TagError/Wl.js', 'https://roomfeng.win'), false);
});

test('console classification uses the message source URL, not error text', () => {
  const firstParty = classifyConsoleMessage({
    text: () => 'TagError Wl',
    location: () => ({ url: 'https://roomfeng.win/_astro/app.js' }),
  });
  const thirdParty = classifyConsoleMessage({
    text: () => 'opaque minified error',
    location: () => ({ url: 'https://static.cloudflareinsights.com/beacon.min.js' }),
  });
  assert.equal(firstParty.external, false);
  assert.equal(thirdParty.external, true);
});

test('console diagnostics with no location can use an explicit third-party target URL', () => {
  const reportOnlyCsp = classifyConsoleMessage({
    text: () => 'Framing https://www.google.com/ violates frame-ancestors',
    location: () => ({ url: '' }),
  });
  assert.equal(reportOnlyCsp.external, true);
  assert.equal(reportOnlyCsp.sourceUrl, 'https://www.google.com/');
});

test('page errors without an explicit third-party stack source remain first-party', () => {
  assert.equal(classifyPageError({ message: 'Wl', stack: '' }).external, false);
  assert.equal(classifyPageError({ message: 'Wl', stack: '', sourceUrl: 'https://www.googletagmanager.com/gtm.js' }).external, true);
  assert.equal(classifyPageError({ message: 'third party', stack: 'at x (https://www.googletagmanager.com/gtm.js:1:1)' }).external, true);
  assert.equal(classifyPageError({ message: 'RoomFeng', stack: 'at x (https://roomfeng.win/_astro/app.js:1:1)' }).external, false);
});
