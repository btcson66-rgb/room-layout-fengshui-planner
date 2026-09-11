import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest as accessMiddleware } from '../functions/_middleware.ts';
import { createEntitlementToken, createSessionToken, entitlementCookie, ENTITLEMENT_COOKIE, normalizeLicenseKey, readCookie, readEntitlementToken, SESSION_COOKIE, sessionCookie, verifySessionToken } from '../functions/_lib/moving-os-license.ts';
import { verifyAndActivatePayhipLicense } from '../functions/_lib/payhip.ts';
import { verifyGumroadLicense } from '../functions/_lib/gumroad.ts';
import { verifyAndActivateLicense } from '../functions/_lib/license-provider.ts';
import { onRequestPost as activate } from '../functions/api/product/license/verify.ts';
import { onRequestGet as licenseStatus } from '../functions/api/product/license/status.ts';

const secret = 'test-session-secret-that-is-at-least-32-characters';
const product = 'roomfeng-moving-new-home-os-v1';
const productLink = 'REAL-PAYHIP-LINK-IN-TEST';
const key = 'ABCD-1234-EFGH-5678';
const encryptionKey = Buffer.from('01234567890123456789012345678901').toString('base64url');

async function entitlementCookieFor(provider = 'payhip', now = Math.floor(Date.now() / 1000)) {
  const token = await createEntitlementToken({ v: 1, product, provider, licenseKey: key, issuedAt: now, lastVerifiedAt: now, expiresAt: now + 86400 }, encryptionKey);
  assert.ok(token);
  return entitlementCookie(token);
}

function request(path, init = {}) {
  const headers = new Headers(init.headers); headers.set('origin', 'https://roomfeng.win');
  return new Request(`https://roomfeng.win${path}`, { ...init, headers });
}

test('license normalization accepts Payhip-like keys and rejects malformed input', () => {
  assert.equal(normalizeLicenseKey(` ${key.toLowerCase()} `), key);
  for (const value of ['', 'short', 'has spaces inside', '<script>alert(1)</script>', 'A'.repeat(129)]) assert.equal(normalizeLicenseKey(value), undefined);
});

test('signed session is time-bound, product-bound, tamper-resistant, and never contains the license key', async () => {
  const token = await createSessionToken(secret, key, product, 1_000);
  assert.equal(await verifySessionToken(token, secret, product, 1_001), true);
  assert.equal(await verifySessionToken(token, secret, product, 'gumroad', 1_001), false);
  assert.equal(await verifySessionToken(token, secret, 'another-product', 1_001), false);
  assert.equal(await verifySessionToken(`${token.slice(0, -1)}x`, secret, product, 1_001), false);
  assert.equal(await verifySessionToken(token, secret, product, 1_000 + 86_401), false);
  const cookie = sessionCookie(token);
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/); assert.doesNotMatch(cookie, new RegExp(key));
  assert.equal(readCookie(new Request('https://roomfeng.win/', { headers: { cookie } })), token);
});

test('entitlement credential is encrypted, versioned, bound, and tamper-resistant', async () => {
  const now = 10_000;
  const token = await createEntitlementToken({ v: 1, product, provider: 'payhip', licenseKey: key, issuedAt: now, lastVerifiedAt: now, expiresAt: now + 86_400 }, encryptionKey);
  assert.ok(token); assert.doesNotMatch(token, new RegExp(key));
  assert.equal((await readEntitlementToken(token, encryptionKey, product, now + 1))?.provider, 'payhip');
  assert.equal(await readEntitlementToken(`${token.slice(0, -1)}x`, encryptionKey, product, now + 1), undefined);
  assert.equal(await readEntitlementToken(token.slice(0, Math.floor(token.length / 2)), encryptionKey, product, now + 1), undefined);
  assert.equal(await readEntitlementToken(token, encryptionKey, 'wrong-product', now + 1), undefined);
  assert.equal(await readEntitlementToken(token, 'not-a-32-byte-base64url-key', product, now + 1), undefined);
});

test('Payhip activation verifies entitlement without incrementing provider usage', async () => {
  const calls = [];
  const fetcher = async (url, init) => { calls.push([String(url), init]); return Response.json({ data: { enabled: true, product_link: productLink, uses: 3 } }); };
  const result = await verifyAndActivatePayhipLicense(key, 'provider-secret', productLink, fetcher);
  assert.equal(result.ok, true); assert.equal(calls.length, 1); assert.match(calls[0][0], /\/api\/v2\/license\/verify/); assert.doesNotMatch(calls[0][0], /\/usage/);
  assert.equal(calls[0][1].headers['product-secret-key'], 'provider-secret');
});

test('Payhip usage count does not enforce a device limit in v1', async () => {
  const response = (data, status = 200) => async () => Response.json({ data }, { status });
  assert.deepEqual(await verifyAndActivatePayhipLicense(key, 's', productLink, response({}, 404)), { ok: false, code: 'invalid_license' });
  assert.deepEqual(await verifyAndActivatePayhipLicense(key, 's', productLink, response({ enabled: true, product_link: 'wrong', uses: 0 })), { ok: false, code: 'invalid_license' });
  assert.deepEqual(await verifyAndActivatePayhipLicense(key, 's', productLink, response({ enabled: false, product_link: productLink, uses: 0 })), { ok: false, code: 'disabled_license' });
  for (const uses of [0, 3, 100]) assert.equal((await verifyAndActivatePayhipLicense(key, 's', productLink, response({ enabled: true, product_link: productLink, uses }))).ok, true);
  assert.deepEqual(await verifyAndActivatePayhipLicense(key, 's', productLink, async () => { throw new Error('offline'); }), { ok: false, code: 'network_error' });
});

test('Gumroad usage count does not enforce a device limit in v1', async () => {
  const calls = [];
  const fetcher = async (url, init) => { calls.push([String(url), init]); return Response.json({ success: true, uses: 1, purchase: { product_id: product, refunded: false, disputed: false, chargebacked: false } }); };
  const result = await verifyGumroadLicense(key, product, fetcher);
  assert.equal(result.ok, true); assert.equal(result.provider, 'gumroad'); assert.equal(calls[0][0], 'https://api.gumroad.com/v2/licenses/verify');
  assert.match(String(calls[0][1].body), /product_id=roomfeng-moving-new-home-os-v1/); assert.match(String(calls[0][1].body), /increment_uses_count=false/);
  for (const uses of [0, 3, 100]) assert.equal((await verifyGumroadLicense(key, product, async () => Response.json({ success: true, uses, purchase: { product_id: product } }))).ok, true);
  const badProduct = await verifyGumroadLicense(key, product, async () => Response.json({ success: true, uses: 0, purchase: { product_id: 'other' } }));
  assert.deepEqual(badProduct, { ok: false, code: 'invalid_license' });
  assert.deepEqual(await verifyGumroadLicense(key, product, async () => Response.json({ success: true, uses: 0, purchase: { product_id: product, refunded: true } })), { ok: false, code: 'disabled_license' });
  assert.deepEqual(await verifyGumroadLicense(key, product, async () => Response.json({ success: true, uses: 0, purchase: { product_id: product, disputed: true } })), { ok: false, code: 'disabled_license' });
  assert.deepEqual(await verifyGumroadLicense(key, product, async () => Response.json({ success: true, uses: 0, purchase: { product_id: product, chargebacked: true } })), { ok: false, code: 'disabled_license' });
  assert.deepEqual(await verifyGumroadLicense(key, product, async () => Response.json({}, { status: 404 })), { ok: false, code: 'invalid_license' });
  assert.deepEqual(await verifyGumroadLicense(key, product, async () => { throw new Error('offline'); }), { ok: false, code: 'network_error' });
});

test('unified provider adapter keeps Payhip and Gumroad credentials isolated', async () => {
  const payhip = await verifyAndActivateLicense('payhip', key, { productId: product, payhip: { productSecret: 's', productLink } }, async (url) => String(url).includes('payhip') ? Response.json({ data: { enabled: true, product_link: productLink, uses: 0 } }) : Response.json({ data: {} }));
  assert.equal(payhip.ok, true); assert.equal(payhip.provider, 'payhip');
  const gumroad = await verifyAndActivateLicense('gumroad', key, { productId: product, gumroad: { productId: product } }, async () => Response.json({ success: true, uses: 1, purchase: { product_id: product } }));
  assert.equal(gumroad.ok, true); assert.equal(gumroad.provider, 'gumroad');
});

test('activation endpoint fails closed when secrets are absent', async () => {
  const response = await activate({ request: request('/api/product/license/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'payhip', product, licenseKey: key }) }), env: {} });
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { ok: false, code: 'not_configured' });
});

test('activation endpoint sets a secure session without returning provider PII or secrets', { concurrency: false }, async () => {
  const previousFetch = globalThis.fetch; let call = 0;
  globalThis.fetch = async () => (++call === 1 ? Response.json({ data: { enabled: true, product_link: productLink, uses: 0, buyer_email: 'buyer@example.test', license_key: key } }) : Response.json({ data: { enabled: true, product_link: productLink, uses: 1 } }));
  try {
    const response = await activate({ request: request('/api/product/license/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'payhip', product, licenseKey: key }) }), env: { PAYHIP_PRODUCT_SECRET: 'provider-secret', PAYHIP_PRODUCT_LINK: productLink, MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey } });
    const text = await response.text(); assert.equal(response.status, 200); assert.match(response.headers.get('set-cookie') || '', new RegExp(SESSION_COOKIE)); assert.match(response.headers.get('set-cookie') || '', new RegExp(ENTITLEMENT_COOKIE)); assert.doesNotMatch(text, /buyer@example|provider-secret|ABCD-1234/); assert.deepEqual(JSON.parse(text), { ok: true, expiresIn: 86400 });
  } finally { globalThis.fetch = previousFetch; }
});

test('status revalidation does not increment Gumroad uses and refreshes the encrypted cookie', { concurrency: false }, async () => {
  const now = Math.floor(Date.now() / 1000);
  const session = await createSessionToken(secret, key, product, 'gumroad', now);
  const entitlement = await createEntitlementToken({ v: 1, product, provider: 'gumroad', licenseKey: key, issuedAt: now, lastVerifiedAt: now, expiresAt: now + 86400 }, encryptionKey);
  let call;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { call = [String(url), init]; return Response.json({ success: true, uses: 2, purchase: { product_id: 'gumroad-product', refunded: false, disputed: false } }); };
  try {
    const response = await licenseStatus({ request: request('/api/product/license/status', { headers: { cookie: `${SESSION_COOKIE}=${session}; ${ENTITLEMENT_COOKIE}=${entitlement}` } }), env: { MOVING_OS_PRODUCT_ID: product, GUMROAD_PRODUCT_ID: 'gumroad-product', MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey } });
    assert.equal(response.status, 200);
    const status = await response.json();
    assert.equal(status.active, true);
    assert.equal(status.reason, 'verified');
    // The route samples the current second independently from the fixture's `now`.
    // Accept the one-second boundary without weakening the 15-minute recheck contract.
    assert.ok(status.nextCheckAt >= now + 900 && status.nextCheckAt <= now + 901);
    assert.match(String(call[1].body), /increment_uses_count=false/); assert.match(response.headers.get('set-cookie') || '', new RegExp(ENTITLEMENT_COOKIE));
  } finally { globalThis.fetch = previousFetch; }
});

test('valid encrypted entitlement can re-establish an expired signed session without re-entering the key', { concurrency: false }, async () => {
  const now = Math.floor(Date.now() / 1000);
  const expiredSession = await createSessionToken(secret, key, product, 'gumroad', now - 86_401);
  const entitlement = await createEntitlementToken({ v: 1, product, provider: 'gumroad', licenseKey: key, issuedAt: now - 86_401, lastVerifiedAt: now - 60, expiresAt: now + 86_400 }, encryptionKey);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true, uses: 2, purchase: { product_id: 'gumroad-product', refunded: false, disputed: false } });
  try {
    const response = await licenseStatus({ request: request('/api/product/license/status', { headers: { cookie: `${SESSION_COOKIE}=${expiredSession}; ${ENTITLEMENT_COOKIE}=${entitlement}` } }), env: { MOVING_OS_PRODUCT_ID: product, GUMROAD_PRODUCT_ID: 'gumroad-product', MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey } });
    assert.equal(response.status, 200); assert.match(response.headers.get('set-cookie') || '', new RegExp(SESSION_COOKIE));
  } finally { globalThis.fetch = previousFetch; }
});

test('status distinguishes revoked from provider outage grace and grace expiry', { concurrency: false }, async () => {
  const now = Math.floor(Date.now() / 1000);
  const previousFetch = globalThis.fetch;
  try {
    const makeRequest = async (lastVerifiedAt) => {
      const session = await createSessionToken(secret, key, product, 'payhip', now);
      const entitlement = await createEntitlementToken({ v: 1, product, provider: 'payhip', licenseKey: key, issuedAt: lastVerifiedAt, lastVerifiedAt, expiresAt: now + 86400 }, encryptionKey);
      return request('/api/product/license/status', { headers: { cookie: `${SESSION_COOKIE}=${session}; ${ENTITLEMENT_COOKIE}=${entitlement}` } });
    };
    globalThis.fetch = async () => { throw new Error('provider offline'); };
    const within = await licenseStatus({ request: await makeRequest(now - 60), env: { MOVING_OS_PRODUCT_ID: product, PAYHIP_PRODUCT_SECRET: 'secret', PAYHIP_PRODUCT_LINK: productLink, MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey } });
    assert.equal(within.status, 200); assert.equal((await within.json()).reason, 'provider_unavailable_grace');
    const expired = await licenseStatus({ request: await makeRequest(now - 86_401), env: { MOVING_OS_PRODUCT_ID: product, PAYHIP_PRODUCT_SECRET: 'secret', PAYHIP_PRODUCT_LINK: productLink, MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey } });
    assert.equal(expired.status, 401); assert.equal((await expired.json()).reason, 'verification_unavailable');
    globalThis.fetch = async () => Response.json({ data: { enabled: false, product_link: productLink, uses: 2 } });
    const revoked = await licenseStatus({ request: await makeRequest(now - 60), env: { MOVING_OS_PRODUCT_ID: product, PAYHIP_PRODUCT_SECRET: 'secret', PAYHIP_PRODUCT_LINK: productLink, MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey } });
    assert.equal(revoked.status, 401); assert.equal((await revoked.json()).reason, 'revoked');
  } finally { globalThis.fetch = previousFetch; }
});

test('direct app deep links and fake paid localStorage flags cannot bypass middleware', async () => {
  let nextCalls = 0; const next = async () => { nextCalls += 1; return new Response('APP'); };
  const denied = await accessMiddleware({ request: new Request('https://roomfeng.win/en/moving-new-home-os/app/', { headers: { cookie: 'paid=true' } }), env: { MOVING_OS_PRODUCT_ID: product, MOVING_OS_SESSION_SECRET: secret }, next });
  assert.equal(denied.status, 302); assert.match(denied.headers.get('location') || '', /\/en\/moving-new-home-os\/activate/); assert.equal(nextCalls, 0);
  const token = await createSessionToken(secret, key, product);
  const entitlement = await entitlementCookieFor();
  const allowed = await accessMiddleware({ request: new Request('https://roomfeng.win/zh/moving-new-home-os/app/', { headers: { cookie: `${SESSION_COOKIE}=${token}; ${ENTITLEMENT_COOKIE}=${readCookie(new Request('https://roomfeng.win/', { headers: { cookie: entitlement } }), ENTITLEMENT_COOKIE)}` } }), env: { MOVING_OS_PRODUCT_ID: product, MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey }, next });
  assert.equal(await allowed.text(), 'APP'); assert.equal(nextCalls, 1);
});

test('activation rejects cross-origin and oversized requests before provider access', async () => {
  const env = { PAYHIP_PRODUCT_SECRET: 'provider-secret', PAYHIP_PRODUCT_LINK: productLink, MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey };
  const crossOrigin = new Request('https://roomfeng.win/api/product/license/verify', { method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'payhip', product, licenseKey: key }) });
  assert.equal((await activate({ request: crossOrigin, env })).status, 403);
  const oversized = request('/api/product/license/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'payhip', product, licenseKey: 'A'.repeat(3000) }) });
  assert.equal((await activate({ request: oversized, env })).status, 413);
});
