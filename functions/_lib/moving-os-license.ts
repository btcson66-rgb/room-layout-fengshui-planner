export const SESSION_COOKIE = '__Host-rf_moving_os_session';
export const ENTITLEMENT_COOKIE = 'rf_entitlement';
export const SESSION_TTL_SECONDS = 24 * 60 * 60;
export const OFFLINE_GRACE_SECONDS = 24 * 60 * 60;
export const ENTITLEMENT_TTL_SECONDS = SESSION_TTL_SECONDS + OFFLINE_GRACE_SECONDS;
export const REVALIDATION_INTERVAL_SECONDS = 15 * 60;
export const MAX_REQUEST_BYTES = 2048;
export const LICENSE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{6,126}[A-Za-z0-9]$/;
export type LicenseProvider = 'payhip' | 'gumroad';
export const MOVING_OS_PRODUCT_ID = 'roomfeng-moving-new-home-os-v1';

export interface LicenseEnv {
  PAYHIP_PRODUCT_SECRET?: string;
  PAYHIP_PRODUCT_LINK?: string;
  GUMROAD_PRODUCT_ID?: string;
  MOVING_OS_PRODUCT_ID?: string;
  MOVING_OS_SESSION_SECRET?: string;
  ENTITLEMENT_ENCRYPTION_KEY?: string;
}

export interface SessionPayload { v: 2; product: string; provider: LicenseProvider; licenseHash: string; iat: number; exp: number }
export interface EntitlementPayload { v: 1; product: string; provider: LicenseProvider; licenseKey: string; issuedAt: number; lastVerifiedAt: number; expiresAt: number }

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
  // Reject non-canonical encodings. Some runtimes ignore non-zero trailing
  // bits in the final base64 quantum, which would otherwise allow a token to
  // be modified without changing the decoded AES-GCM/HMAC bytes.
  if (!/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) throw new Error('invalid base64url');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (base64Url(bytes) !== value) throw new Error('non-canonical base64url');
  return bytes;
}

function bufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export async function hashLicenseKey(value: string): Promise<string> {
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

export function normalizeLicenseKey(value: unknown): string | undefined {
  const key = String(value ?? '').trim().toUpperCase();
  return LICENSE_PATTERN.test(key) ? key : undefined;
}

export function readCookie(request: Request, name = SESSION_COOKIE): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) return pair.slice(separator + 1).trim();
  }
  return undefined;
}

export async function createSessionToken(secret: string, licenseKey: string, productId: string, providerOrNow: LicenseProvider | number = 'payhip', maybeNowSeconds?: number): Promise<string> {
  const provider: LicenseProvider = typeof providerOrNow === 'number' ? 'payhip' : providerOrNow;
  const nowSeconds = typeof providerOrNow === 'number' ? providerOrNow : (maybeNowSeconds ?? Math.floor(Date.now() / 1000));
  const payload: SessionPayload = { v: 2, product: productId, provider, licenseHash: await hashLicenseKey(licenseKey), iat: nowSeconds, exp: nowSeconds + SESSION_TTL_SECONDS };
  const encoded = base64Url(encoder.encode(JSON.stringify(payload)));
  return `${encoded}.${base64Url(await hmac(secret, encoded))}`;
}

export async function readVerifiedSession(token: string | undefined, secret: string | undefined, productId: string | undefined, providerOrNow?: LicenseProvider | number, maybeNowSeconds?: number): Promise<SessionPayload | undefined> {
  if (!token || !secret || !productId || secret.length < 32) return undefined;
  const expectedProvider = typeof providerOrNow === 'string' ? providerOrNow : undefined;
  const nowSeconds = typeof providerOrNow === 'number' ? providerOrNow : (maybeNowSeconds ?? Math.floor(Date.now() / 1000));
  const [encoded, signature, extra] = token.split('.');
  if (!encoded || !signature || extra) return undefined;
  try {
    const expected = await hmac(secret, encoded);
    if (!equalBytes(expected, decodeBase64Url(signature))) return undefined;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encoded))) as Partial<SessionPayload>;
    if (payload.v !== 2 || payload.product !== productId || (payload.provider !== 'payhip' && payload.provider !== 'gumroad') || (expectedProvider && payload.provider !== expectedProvider) || typeof payload.licenseHash !== 'string' || payload.licenseHash.length <= 20 || typeof payload.iat !== 'number' || typeof payload.exp !== 'number' || payload.iat > nowSeconds + 60 || payload.exp <= nowSeconds) return undefined;
    return payload as SessionPayload;
  } catch { return undefined; }
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined, productId: string | undefined, providerOrNow?: LicenseProvider | number, maybeNowSeconds?: number): Promise<boolean> {
  return Boolean(await readVerifiedSession(token, secret, productId, providerOrNow, maybeNowSeconds));
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function expiredSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function decodeSecret(value: string): Uint8Array | undefined {
  try {
    const decoded = decodeBase64Url(value);
    return decoded.length === 32 ? decoded : undefined;
  } catch {
    return undefined;
  }
}

async function entitlementKey(secret: string | undefined, usage: KeyUsage[]): Promise<CryptoKey | undefined> {
  if (!secret) return undefined;
  const bytes = decodeSecret(secret);
  if (!bytes) return undefined;
  try { return await crypto.subtle.importKey('raw', bufferSource(bytes), { name: 'AES-GCM' }, false, usage); } catch { return undefined; }
}

export async function createEntitlementToken(payload: EntitlementPayload, secret: string | undefined): Promise<string | undefined> {
  const key = await entitlementKey(secret, ['encrypt']);
  if (!key) return undefined;
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bufferSource(nonce), additionalData: bufferSource(encoder.encode('roomfeng-entitlement-v1')) }, key, bufferSource(plaintext)));
  return `${base64Url(nonce)}.${base64Url(ciphertext)}`;
}

export async function readEntitlementToken(token: string | undefined, secret: string | undefined, productId: string, nowSeconds = Math.floor(Date.now() / 1000)): Promise<EntitlementPayload | undefined> {
  const key = await entitlementKey(secret, ['decrypt']);
  if (!key || !token) return undefined;
  const [nonceText, ciphertextText, extra] = token.split('.');
  if (!nonceText || !ciphertextText || extra) return undefined;
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bufferSource(decodeBase64Url(nonceText)), additionalData: bufferSource(encoder.encode('roomfeng-entitlement-v1')) }, key, bufferSource(decodeBase64Url(ciphertextText)));
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<EntitlementPayload>;
    if (payload.v !== 1 || payload.product !== productId || (payload.provider !== 'payhip' && payload.provider !== 'gumroad') || typeof payload.licenseKey !== 'string' || !normalizeLicenseKey(payload.licenseKey) || normalizeLicenseKey(payload.licenseKey) !== payload.licenseKey || typeof payload.issuedAt !== 'number' || typeof payload.lastVerifiedAt !== 'number' || typeof payload.expiresAt !== 'number' || payload.issuedAt > nowSeconds + 60 || payload.lastVerifiedAt > nowSeconds + 60 || payload.lastVerifiedAt < payload.issuedAt || payload.expiresAt <= nowSeconds) return undefined;
    return payload as EntitlementPayload;
  } catch { return undefined; }
}

export function entitlementCookie(token: string): string {
  return `${ENTITLEMENT_COOKIE}=${token}; Path=/; Max-Age=${ENTITLEMENT_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function expiredEntitlementCookie(): string {
  return `${ENTITLEMENT_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function maskedLicenseKey(key: string): string {
  const compact = key.replace(/-/g, '');
  return compact.length < 8 ? '****' : `${compact.slice(0, 4)}-****-${compact.slice(-4)}`;
}

export function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}
