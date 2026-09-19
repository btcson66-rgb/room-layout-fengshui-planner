import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest as accessMiddleware } from '../functions/_middleware.ts';
import { onRequestPost as layoutVaultActivate } from '../functions/api/product/layout-vault/license/verify.ts';
import { productEntitlementConfig, revalidateProductEntitlement } from '../functions/_lib/entitlement.ts';
import {
  createEntitlementToken,
  createSessionToken,
  entitlementCookie,
  ENTITLEMENT_COOKIE,
  LAYOUT_VAULT_COOKIE_NAMES,
  LAYOUT_VAULT_PRODUCT_ID,
  MOVING_OS_COOKIE_NAMES,
  MOVING_OS_PRODUCT_ID,
  readEntitlementToken,
  SESSION_COOKIE,
  sessionCookie,
  verifySessionToken,
} from '../functions/_lib/moving-os-license.ts';

const secret = 'phase-2-5-session-secret-that-is-at-least-32-characters';
const encryptionKey = Buffer.from('01234567890123456789012345678901').toString('base64url');
const p1Key = 'PONE-1234-EFGH-5678';
const p2Key = 'PTWO-1234-EFGH-5678';
const p1Link = 'https://payhip.com/b/moving-fixture';
const p2Link = 'https://payhip.com/b/layout-fixture';

function req(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://roomfeng.win');
  return new Request(`https://roomfeng.win${path}`, { ...init, headers });
}

async function cookiesFor(product, provider, key, now = Math.floor(Date.now() / 1000)) {
  const names = product === MOVING_OS_PRODUCT_ID ? MOVING_OS_COOKIE_NAMES : LAYOUT_VAULT_COOKIE_NAMES;
  const session = await createSessionToken(secret, key, product, provider, now);
  const entitlement = await createEntitlementToken({ v: 1, product, provider, licenseKey: key, issuedAt: now, lastVerifiedAt: now, expiresAt: now + 86400 }, encryptionKey);
  assert.ok(entitlement);
  return { names, header: `${sessionCookie(session, names)}; ${entitlementCookie(entitlement, names)}`, session, entitlement };
}

const p1Env = { MOVING_OS_PRODUCT_ID: MOVING_OS_PRODUCT_ID, PAYHIP_PRODUCT_SECRET: 'p1-secret', PAYHIP_PRODUCT_LINK: p1Link, GUMROAD_PRODUCT_ID: 'p1-gumroad', MOVING_OS_SESSION_SECRET: secret, ENTITLEMENT_ENCRYPTION_KEY: encryptionKey };
const p2Env = { LAYOUT_VAULT_PAYHIP_PRODUCT_SECRET: 'p2-secret', LAYOUT_VAULT_PAYHIP_PRODUCT_LINK: p2Link, LAYOUT_VAULT_GUMROAD_PRODUCT_ID: 'p2-gumroad', LAYOUT_VAULT_SESSION_SECRET: secret, LAYOUT_VAULT_ENTITLEMENT_ENCRYPTION_KEY: encryptionKey };

test('central product identities and cookie names are distinct', () => {
  assert.equal(MOVING_OS_PRODUCT_ID, 'roomfeng-moving-new-home-os-v1');
  assert.equal(LAYOUT_VAULT_PRODUCT_ID, 'roomfeng-layout-vault-v1');
  assert.notEqual(MOVING_OS_PRODUCT_ID, LAYOUT_VAULT_PRODUCT_ID);
  assert.notEqual(MOVING_OS_COOKIE_NAMES.session, LAYOUT_VAULT_COOKIE_NAMES.session);
  assert.notEqual(MOVING_OS_COOKIE_NAMES.entitlement, LAYOUT_VAULT_COOKIE_NAMES.entitlement);
  assert.equal(SESSION_COOKIE, MOVING_OS_COOKIE_NAMES.session);
  assert.equal(ENTITLEMENT_COOKIE, MOVING_OS_COOKIE_NAMES.entitlement);
});

test('P1 and P2 signed/encrypted credentials are product-bound', async () => {
  const now = 10000;
  const p1 = await cookiesFor(MOVING_OS_PRODUCT_ID, 'payhip', p1Key, now);
  const p2 = await cookiesFor(LAYOUT_VAULT_PRODUCT_ID, 'payhip', p2Key, now);
  assert.equal(await verifySessionToken(p1.session, secret, MOVING_OS_PRODUCT_ID, now + 1), true);
  assert.equal(await verifySessionToken(p1.session, secret, LAYOUT_VAULT_PRODUCT_ID, now + 1), false);
  assert.equal((await readEntitlementToken(p2.entitlement, encryptionKey, LAYOUT_VAULT_PRODUCT_ID, now + 1))?.product, LAYOUT_VAULT_PRODUCT_ID);
  assert.equal(await readEntitlementToken(p2.entitlement, encryptionKey, MOVING_OS_PRODUCT_ID, now + 1), undefined);
  assert.match(p1.header, /__Host-rf_moving_os_session/);
  assert.match(p2.header, /__Host-rf_layout_vault_session/);
});

test('P1 route accepts only P1 and P2 route accepts only P2', async () => {
  const p1 = await cookiesFor(MOVING_OS_PRODUCT_ID, 'payhip', p1Key);
  const p2 = await cookiesFor(LAYOUT_VAULT_PRODUCT_ID, 'payhip', p2Key);
  let nextCalls = 0;
  const next = async () => { nextCalls += 1; return new Response('OK'); };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ data: { enabled: true, product_link: p1Link, uses: 2 } });
  try {
    const p1Allowed = await accessMiddleware({ request: req('/en/moving-new-home-os/app/', { headers: { cookie: p1.header } }), env: p1Env, next });
    assert.equal(p1Allowed.status, 200);
    assert.equal(nextCalls, 1);
  } finally { globalThis.fetch = previousFetch; }

  globalThis.fetch = async () => Response.json({ data: { enabled: true, product_link: p2Link, uses: 1 } });
  try {
    const p2Allowed = await accessMiddleware({ request: req('/en/layout-vault/', { headers: { cookie: p2.header } }), env: p2Env, next });
    assert.equal(p2Allowed.status, 200);
    assert.equal(nextCalls, 2);
  } finally { globalThis.fetch = previousFetch; }

  const p1OnP2 = await accessMiddleware({ request: req('/en/layout-vault/', { headers: { cookie: p1.header } }), env: { ...p2Env, ENVIRONMENT: 'production' }, next });
  assert.equal(p1OnP2.status, 302);
  assert.equal(p1OnP2.headers.get('location'), '/en/layout-vault/activate/?next=%2Fen%2Flayout-vault%2F');
  assert.doesNotMatch(p1OnP2.headers.get('set-cookie') || '', /rf_moving_os_session/);
  const p2OnP1 = await accessMiddleware({ request: req('/en/moving-new-home-os/app/', { headers: { cookie: p2.header } }), env: p1Env, next });
  assert.equal(p2OnP1.status, 302);
});

test('provider product identity mismatch is denied for P2', async () => {
  const config = productEntitlementConfig(p2Env, LAYOUT_VAULT_PRODUCT_ID);
  assert.ok(config);
  const cookies = await cookiesFor(LAYOUT_VAULT_PRODUCT_ID, 'gumroad', p2Key);
  const status = await revalidateProductEntitlement(req('/api/product/layout-vault/license/status', { headers: { cookie: cookies.header } }), config, Math.floor(Date.now() / 1000), async () => Response.json({ success: true, uses: 1, purchase: { product_id: 'roomfeng-moving-new-home-os-v1', refunded: false, disputed: false } }));
  assert.equal(status.active, false);
  assert.equal(status.reason, 'invalid');
});

test('Payhip and Gumroad fixtures reject the other product identity', async () => {
  const p2Config = productEntitlementConfig(p2Env, LAYOUT_VAULT_PRODUCT_ID);
  assert.ok(p2Config);
  const payhip = await revalidateProductEntitlement(req('/api/product/layout-vault/license/status', { headers: { cookie: (await cookiesFor(LAYOUT_VAULT_PRODUCT_ID, 'payhip', p2Key)).header } }), p2Config, undefined, async () => Response.json({ data: { enabled: true, product_link: p1Link, uses: 1 } }));
  assert.equal(payhip.active, false);
  const gumroad = await revalidateProductEntitlement(req('/api/product/layout-vault/license/status', { headers: { cookie: (await cookiesFor(LAYOUT_VAULT_PRODUCT_ID, 'gumroad', p2Key)).header } }), p2Config, undefined, async () => Response.json({ success: true, uses: 1, purchase: { product_id: 'roomfeng-moving-new-home-os-v1' } }));
  assert.equal(gumroad.active, false);
});

test('P2 activation ignores a frontend product override and sets only P2 cookies', async () => {
  const wrong = await layoutVaultActivate({ request: req('/api/product/layout-vault/license/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'payhip', product: MOVING_OS_PRODUCT_ID, licenseKey: p2Key }) }), env: p2Env });
  assert.equal(wrong.status, 400);
  assert.deepEqual(await wrong.json(), { ok: false, code: 'invalid_product' });

  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ data: { enabled: true, product_link: p2Link, uses: 1 } });
  try {
    const valid = await layoutVaultActivate({ request: req('/api/product/layout-vault/license/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'payhip', product: LAYOUT_VAULT_PRODUCT_ID, licenseKey: p2Key }) }), env: p2Env });
    assert.equal(valid.status, 200);
    const setCookie = valid.headers.get('set-cookie') || '';
    assert.match(setCookie, /__Host-rf_layout_vault_session/);
    assert.match(setCookie, /rf_entitlement_layout_vault/);
    assert.doesNotMatch(setCookie, /rf_moving_os_session|rf_entitlement=/);
    const entitlementToken = setCookie.match(/rf_entitlement_layout_vault=([^;]+)/)?.[1];
    assert.equal((await readEntitlementToken(entitlementToken, encryptionKey, LAYOUT_VAULT_PRODUCT_ID))?.providerProductIdentity, p2Link);
  } finally { globalThis.fetch = previousFetch; }
});

test('revoking or clearing P2 does not revoke or clear P1 cookies', async () => {
  const p1 = await cookiesFor(MOVING_OS_PRODUCT_ID, 'payhip', p1Key);
  const p2 = await cookiesFor(LAYOUT_VAULT_PRODUCT_ID, 'payhip', p2Key);
  const p1Config = productEntitlementConfig(p1Env, MOVING_OS_PRODUCT_ID);
  const p2Config = productEntitlementConfig(p2Env, LAYOUT_VAULT_PRODUCT_ID);
  assert.ok(p1Config); assert.ok(p2Config);
  const p1Status = await revalidateProductEntitlement(req('/api/product/license/status', { headers: { cookie: p1.header } }), p1Config, undefined, async () => Response.json({ data: { enabled: true, product_link: p1Link, uses: 2 } }));
  const p2Status = await revalidateProductEntitlement(req('/api/product/layout-vault/license/status', { headers: { cookie: p2.header } }), p2Config, undefined, async () => Response.json({ data: { enabled: false, product_link: p2Link, uses: 2 } }));
  assert.equal(p1Status.active, true);
  assert.equal(p2Status.active, false);
  assert.deepEqual(p2Status.setCookies, undefined);
  assert.equal(p2Config.cookieNames.entitlement, LAYOUT_VAULT_COOKIE_NAMES.entitlement);
  assert.equal(p1Config.cookieNames.entitlement, MOVING_OS_COOKIE_NAMES.entitlement);
});

test('Layout Vault development bypass is non-production only', async () => {
  const next = async () => new Response('DEV-UI');
  const dev = await accessMiddleware({ request: req('/en/layout-vault/'), env: { ROOMFENG_LAYOUT_VAULT_DEV_BYPASS: 'true', ENVIRONMENT: 'preview' }, next });
  assert.equal(dev.status, 200);
  const production = await accessMiddleware({ request: req('/en/layout-vault/'), env: { ROOMFENG_LAYOUT_VAULT_DEV_BYPASS: 'true', ENVIRONMENT: 'production' }, next });
  assert.equal(production.status, 302);
  assert.equal(production.headers.get('location'), '/en/layout-vault/activate/?next=%2Fen%2Flayout-vault%2F');
  assert.match(production.headers.get('set-cookie') || '', /rf_entitlement_layout_vault/);
  assert.doesNotMatch(production.headers.get('set-cookie') || '', /rf_entitlement=/);
});
