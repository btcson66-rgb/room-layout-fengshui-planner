import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const SITE_ORIGIN = 'https://roomfeng.win';
export const GSC_DOMAIN_PROPERTY = 'sc-domain:roomfeng.win';
export const SITEMAP_INDEX_URL = `${SITE_ORIGIN}/sitemap-index.xml`;
// Search Console 的 sitemap 資源沒有「擷取失敗」這個獨立旗標。GSC 網頁介面顯示
// 「無法擷取／類型：未知」的那一筆，API 讀回來長這樣：
//   isPending: true, lastDownloaded: null, errors: "0", warnings: "0"
// 也就是說 `lastDownloaded == null` 同時涵蓋「還沒輪到」與「Google 抓了但失敗」，
// 兩者只能靠「距離上次提交多久」來區分。2026-09-21 roomfeng.win 的 GSC 兩筆
// sitemap 都是這個狀態，已送出日期停在 2026-09-06。
export const NEVER_FETCHED_AFTER_DAYS = 2;
// 一筆已註冊但從未被成功下載的 sitemap，每隔這麼多天重送一次 PUT。
//
// 為什麼要重送：Google 對「無法擷取」的官方處理方式就是修好之後重新提交。在此之前
// 這支腳本只要看到 GSC 已註冊就直接跳過 PUT，於是 roomfeng 從 2026-09-06、
// funnytools 從 2026-09-03 之後再也沒有送出過任何一次提交——狀態就這樣凍在
// 「無法擷取」，自動化永遠不會請 Google 再試一次。
//
// 為什麼要有間隔：每次部署都 PUT 一樣是錯的（roomfeng 一天可以部署十幾次），
// 那會讓 lastSubmitted 永遠是「剛剛」，抹掉「已註冊」與「剛提交」的區別，也讓
// 下面的 never-fetched 判定永遠不會成立。7 天讓兩個訊號都活著：重送後 2 天
// 警告會再次出現，7 天後再重送一次。
export const RESUBMIT_AFTER_DAYS = 7;

function base64Url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function getServiceAccountCredentials() {
  if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  }
  if (process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY) {
    return {
      client_email: process.env.GSC_CLIENT_EMAIL,
      private_key: process.env.GSC_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  return null;
}

function getUserOAuthCredentials() {
  const rawClient = process.env.FABLE_OPS_OAUTH_CLIENT_JSON;
  const refreshToken = process.env.FABLE_OPS_REFRESH_TOKEN;
  if (!rawClient && !refreshToken) return null;
  if (!rawClient || !refreshToken) {
    throw new Error('FABLE_OPS_OAUTH_CLIENT_JSON and FABLE_OPS_REFRESH_TOKEN must be configured together.');
  }
  let parsed;
  try {
    parsed = JSON.parse(rawClient);
  } catch {
    throw new Error('FABLE_OPS_OAUTH_CLIENT_JSON is not valid JSON.');
  }
  const client = parsed.installed || parsed.web || parsed;
  if (!client?.client_id || !client?.client_secret) {
    throw new Error('FABLE_OPS_OAUTH_CLIENT_JSON is missing client_id or client_secret.');
  }
  return { clientId: client.client_id, clientSecret: client.client_secret, refreshToken };
}

function missingGscCredentialVars() {
  if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
      const missingFields = [
        !parsed?.client_email && 'client_email',
        !parsed?.private_key && 'private_key',
      ].filter(Boolean);
      return missingFields.length
        ? [`GSC_SERVICE_ACCOUNT_JSON is set but missing JSON field(s): ${missingFields.join(', ')}`]
        : [];
    } catch {
      return ['GSC_SERVICE_ACCOUNT_JSON is set but is not valid JSON'];
    }
  }
  const missing = [
    !process.env.GSC_CLIENT_EMAIL && 'GSC_CLIENT_EMAIL',
    !process.env.GSC_PRIVATE_KEY && 'GSC_PRIVATE_KEY',
  ].filter(Boolean);
  if (missing.length === 2) return ['GSC_SERVICE_ACCOUNT_JSON (or GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY)'];
  return missing;
}

function googleError(json) {
  return json?.error_description ?? json?.error?.message ?? json?.error ?? 'Unknown Google API error';
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, json };
}

export async function googleAccessToken() {
  const oauth = getUserOAuthCredentials();
  if (oauth) {
    const { response, json } = await fetchJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: oauth.refreshToken,
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
      }),
    });
    if (!response.ok || !json?.access_token) {
      throw new Error(`Configured user OAuth refresh failed: ${response.status} ${googleError(json)}`);
    }
    return json.access_token;
  }

  const credentials = getServiceAccountCredentials();
  if (!credentials?.client_email || !credentials?.private_key) {
    const missing = missingGscCredentialVars();
    throw new Error(`Missing GSC service account credentials. Set the following environment variable(s)/secret(s): ${missing.join(', ')}.`);
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const signature = createSign('RSA-SHA256').update(`${header}.${claim}`).sign(credentials.private_key, 'base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const assertion = `${header}.${claim}.${signature}`;
  const { response, json } = await fetchJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${response.status} ${googleError(json)}`);
  return json.access_token;
}

export async function resolveGscSiteUrl(token) {
  const candidates = [GSC_DOMAIN_PROPERTY, `${SITE_ORIGIN}/`];
  const { response, json } = await fetchJson('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Google Search Console sites.list failed: ${response.status} ${googleError(json)}`);
  }
  const available = (json?.siteEntry ?? []).map((entry) => entry.siteUrl);
  const matched = candidates.find((candidate) => available.includes(candidate));
  if (!matched) {
    throw new Error(
      `No Search Console property matches roomfeng.win. Tried: ${candidates.join(', ')}. `
      + `Accessible properties: ${available.length ? available.join(', ') : '(none)'}.`,
    );
  }
  return matched;
}

export function sitemapEndpoint(siteUrl, sitemapUrl) {
  return `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
}

export function sitemapListEndpoint(siteUrl) {
  return `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`;
}

export function sitemapStatus(entry, requestedPath = null) {
  return {
    path: entry?.path ?? requestedPath,
    lastSubmitted: entry?.lastSubmitted ?? null,
    isPending: entry?.isPending ?? null,
    lastDownloaded: entry?.lastDownloaded ?? null,
    isSitemapsIndex: entry?.isSitemapsIndex ?? null,
    warnings: entry?.warnings ?? null,
    errors: entry?.errors ?? null,
  };
}

function olderThanDays(entry, days, now) {
  const submittedAt = Date.parse(entry.lastSubmitted ?? '');
  return Number.isFinite(submittedAt) && submittedAt < now - days * 24 * 60 * 60 * 1000;
}

/** Registered with Search Console, but Google has never reported a download. */
export function findStuckSitemaps(entries, now = Date.now()) {
  return entries.filter((entry) => entry.isPending === true
    && !entry.lastDownloaded
    && olderThanDays(entry, NEVER_FETCHED_AFTER_DAYS, now));
}

/**
 * True when a registered entry should get a fresh PUT so Google retries it.
 * Registered-and-downloaded entries never qualify: this only re-sends the ones
 * Search Console has never managed to fetch.
 */
export function needsResubmission(entry, now = Date.now()) {
  return !entry.lastDownloaded && olderThanDays(entry, RESUBMIT_AFTER_DAYS, now);
}

export async function discoverSitemapUrls(indexPath) {
  const indexXml = await readFile(indexPath, 'utf8');
  if (!/<sitemapindex(?:\s|>)/.test(indexXml)) {
    throw new Error(`${indexPath} is not a sitemap index.`);
  }
  const childUrls = [...indexXml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>[^<]+<\/lastmod>)?\s*<\/sitemap>/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'));
  if (childUrls.length === 0) throw new Error(`${indexPath} contains no child sitemap URLs.`);
  for (const childUrl of childUrls) {
    const parsed = new URL(childUrl);
    if (parsed.origin !== SITE_ORIGIN || !/^\/sitemap-\d+\.xml$/.test(parsed.pathname)) {
      throw new Error(`Unexpected child sitemap URL in ${indexPath}: ${childUrl}`);
    }
  }
  return [SITEMAP_INDEX_URL, ...new Set(childUrls)];
}

export function apiFailure(label, response, json) {
  return `${label} failed: ${response.status} ${googleError(json)}`;
}
