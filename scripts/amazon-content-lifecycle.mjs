import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const masterPath = resolve(repoRoot, 'src/data/amazon-products.json');
const cachePath = resolve(repoRoot, 'src/data/.generated/amazon-product-content.json');
const maxTtlSeconds = 24 * 60 * 60;
const operation = process.argv.includes('--refresh') ? 'refresh' : 'check';
const text = (value) => typeof value === 'string' ? value.trim() : '';
const normalizeMode = (value) => {
  const mode = text(value).toLowerCase();
  if (['false', 'creators_api', 'creators-api'].includes(mode)) return 'creators_api';
  if (['true', 'bootstrap'].includes(mode)) return 'bootstrap';
  return 'auto';
};
const affiliateMode = normalizeMode(process.env.AMAZON_AFFILIATE_BOOTSTRAP_MODE);
const fail = (message) => { console.error(`amazon-content-lifecycle: ${message}`); process.exitCode = 2; };
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const loadMaster = async () => {
  const master = await readJson(masterPath);
  if (!Array.isArray(master) || !master.length) throw new Error('Amazon master catalog is empty');
  const forbidden = ['product_title', 'title', 'image_url', 'imageUrl', 'alt_text', 'price', 'availability', 'rating', 'review_count', 'review_content', 'amazon_category', 'brand'];
  const violations = master.flatMap((record, index) => forbidden.filter((field) => field in record).map((field) => `${index}:${field}`));
  if (violations.length) throw new Error(`Amazon master contains Product Advertising Content fields: ${violations.join(', ')}`);
  const active = master.filter((record) => record.enabled === true && record.status === 'active' && text(record.asin));
  if (new Set(active.map((record) => record.asin)).size !== active.length) throw new Error('Amazon master contains duplicate ASINs');
  if (active.some((record) => !text(record.internal_display_name) || !text(record.internal_description) || !text(record.internal_alt_text))) throw new Error('Bootstrap master requires internal_display_name, internal_description, and internal_alt_text');
  const partnerTags = [...new Set(active.map((record) => text(record.tracking_id)).filter(Boolean))];
  if (partnerTags.length !== 1) throw new Error(`Expected one Amazon partner tag, found ${partnerTags.length}`);
  if (active.some((record) => !/^https:\/\/www\.amazon\.com\/.*tag=[^&]+(?:&|$)/.test(text(record.affiliate_url_full)))) throw new Error('Amazon Special Link is missing a tracking ID');
  return { master: active, partnerTag: partnerTags[0] };
};

const parseCache = async () => {
  if (!existsSync(cachePath)) return null;
  try { return await readJson(cachePath); } catch (error) { throw new Error(`cache is not valid JSON: ${error.message}`); }
};
const validateCache = (cache, master, { requireFresh = true } = {}) => {
  if (!cache || cache.schema_version !== 1 || cache.source !== 'amazon-creators-api') return 'cache schema/source is missing';
  if (!Number.isInteger(cache.ttl_seconds) || cache.ttl_seconds < 1 || cache.ttl_seconds > maxTtlSeconds) return 'cache TTL exceeds 24 hours';
  const fetchedAt = Date.parse(text(cache.fetched_at));
  const expiresAt = Date.parse(text(cache.expires_at));
  if (!Number.isFinite(fetchedAt) || !Number.isFinite(expiresAt) || expiresAt <= fetchedAt) return 'cache fetched_at/expires_at is invalid';
  if (expiresAt - fetchedAt > maxTtlSeconds * 1000) return 'cache expiry is beyond 24 hours';
  if (requireFresh && Date.now() >= expiresAt) return 'cache is expired';
  if (!Array.isArray(cache.records)) return 'cache records are missing';
  const expected = new Set(master.map((record) => record.asin));
  const actual = new Set(cache.records.map((record) => text(record.asin)));
  if (actual.size !== expected.size || [...expected].some((asin) => !actual.has(asin))) return 'cache does not cover every active ASIN';
  for (const record of cache.records) {
    if (!text(record.title)) return `cache title missing for ${record.asin}`;
    try {
      const image = new URL(record.image_url);
      if (image.protocol !== 'https:' || image.hostname !== 'm.media-amazon.com') return `cache image source is not Amazon HTTPS for ${record.asin}`;
    } catch { return `cache image URL is invalid for ${record.asin}`; }
  }
  return null;
};
const requiredCredentials = () => {
  const values = { clientId: process.env.AMAZON_CREATORS_API_CLIENT_ID, clientSecret: process.env.AMAZON_CREATORS_API_CLIENT_SECRET, version: process.env.AMAZON_CREATORS_API_VERSION };
  const missing = Object.entries(values).filter(([, value]) => !text(value)).map(([key]) => key);
  if (missing.length) throw new Error(`Creators API credentials unavailable (${missing.join(', ')}); blocked_by_amazon_product_content_source`);
  if (!['3.1', '3.2', '3.3'].includes(text(values.version))) throw new Error('AMAZON_CREATORS_API_VERSION must be 3.1, 3.2, or 3.3');
  return values;
};
const tokenEndpointFor = (version) => ({ '3.1': 'https://api.amazon.com/auth/o2/token', '3.2': 'https://api.amazon.co.uk/auth/o2/token', '3.3': 'https://api.amazon.co.jp/auth/o2/token' })[version];
const getAccessToken = async ({ clientId, clientSecret, version }) => {
  const response = await fetch(tokenEndpointFor(version), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: 'creatorsapi::default' }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !text(body.access_token)) throw new Error(`Creators API token request failed with HTTP ${response.status}; eligibility/credential status is not verified`);
  return body.access_token;
};
const getItems = async ({ token, partnerTag, marketplace, asins }) => {
  const response = await fetch('https://creatorsapi.amazon/catalog/v1/getItems', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-marketplace': marketplace }, body: JSON.stringify({ itemIds: asins, itemIdType: 'ASIN', marketplace, partnerTag, languagesOfPreference: ['en_US'], resources: ['images.primary.large', 'itemInfo.title'] }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Creators API GetItems failed with HTTP ${response.status}; eligibility/credential status is not verified`);
  return body?.itemsResult?.items || [];
};
const refresh = async (master, partnerTag) => {
  const credentials = requiredCredentials();
  const marketplace = text(process.env.AMAZON_CREATORS_API_MARKETPLACE) || 'www.amazon.com';
  const token = await getAccessToken(credentials);
  const records = [];
  for (let index = 0; index < master.length; index += 10) {
    const items = await getItems({ token, partnerTag, marketplace, asins: master.slice(index, index + 10).map((record) => record.asin) });
    for (const item of items) {
      const title = text(item?.itemInfo?.title?.displayValue);
      const imageUrl = text(item?.images?.primary?.large?.url || item?.images?.primary?.medium?.url);
      if (!title || !imageUrl) throw new Error(`Creators API returned incomplete Product Advertising Content for ${item?.asin || 'unknown ASIN'}`);
      records.push({ asin: text(item.asin), title, image_url: imageUrl });
    }
  }
  const fetchedAt = new Date();
  const cache = { schema_version: 1, source: 'amazon-creators-api', marketplace, partner_tag: partnerTag, fetched_at: fetchedAt.toISOString(), expires_at: new Date(fetchedAt.getTime() + maxTtlSeconds * 1000).toISOString(), ttl_seconds: maxTtlSeconds, records };
  const error = validateCache(cache, master);
  if (error) throw new Error(`refreshed cache failed validation: ${error}`);
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  console.log(`amazon-content-lifecycle: refreshed ${records.length} records; expires_at=${cache.expires_at}`);
};

try {
  const { master, partnerTag } = await loadMaster();
  const existingCache = await parseCache();
  const cacheError = validateCache(existingCache, master);
  if (operation === 'refresh') {
    if (affiliateMode === 'bootstrap' && !process.env.AMAZON_CREATORS_API_CLIENT_ID) console.log('amazon-content-lifecycle: bootstrap mode; Creators API refresh skipped');
    else {
      try { await refresh(master, partnerTag); }
      catch (error) {
        if (affiliateMode === 'creators_api') throw error;
        console.warn(`amazon-content-lifecycle: ${error.message}; continuing with bootstrap fallback`);
      }
    }
  } else if (affiliateMode === 'creators_api') {
    if (cacheError) fail(`blocked_by_amazon_product_content_source: ${cacheError}`);
    else console.log(`amazon-content-lifecycle: PASS (creators_api, ${master.length} ASINs, TTL <= 24h)`);
  } else if (!cacheError && affiliateMode === 'auto') console.log(`amazon-content-lifecycle: PASS (auto selected creators_api, ${master.length} ASINs, TTL <= 24h)`);
  else console.log(`amazon-content-lifecycle: PASS (bootstrap, ${master.length} ASINs, text-only fallback available)`);
} catch (error) { fail(error.message || String(error)); }
