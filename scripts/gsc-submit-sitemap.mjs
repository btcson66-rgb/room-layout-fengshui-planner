// Submit the sitemap index to Google Search Console after each deploy.
//
// 2026-08-01（CEO 派工，稽核 funnytools 同類問題後補上）：這支 repo 原本完全沒有
// 任何 GSC/IndexNow/Bing 的自動提交步驟——deploy-cloudflare-pages.yml 只有
// build + wrangler deploy，Google 端只在 2026-07-22 被人手動提交過一次
// sitemap-index.xml / sitemap-0.xml，之後從未再送出。這支腳本補齊自動提交，
// 樣式抄自 D:\funnytools\scripts\gsc-submit-sitemaps.mjs 修好後的版本
// （resolveGscSiteUrl 先呼叫 sites.list，優先用 domain property
// `sc-domain:roomfeng.win`，避免重蹈 funnytools 把 URL-prefix 當成
// property id 而 403 的覆轍）。
//
// 缺憑證或送出失敗一律 exitCode=1，不得靜默跳過（CLAUDE.md 紅線第 6 條）。
import { createSign } from 'node:crypto';

const SITE_ORIGIN = 'https://roomfeng.win';
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap-index.xml`;

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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { response, json };
}

async function googleAccessToken() {
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
  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${response.status} ${json?.error_description || json?.error || ''}`.trim());
  }
  return json.access_token;
}

// Domain properties (sc-domain:<host>) are what this service account
// actually holds — not URL-prefix (https://host/). Confirmed via sites.list
// on 2026-08-01. Tries sc-domain first, falls back to URL-prefix, and fails
// loudly with the real property list if neither matches (see funnytools
// resolveGscSiteUrl for the incident this mirrors).
async function resolveGscSiteUrl(token) {
  const hostname = new URL(SITE_ORIGIN).hostname;
  const candidates = [`sc-domain:${hostname}`, `${SITE_ORIGIN}/`];
  const { response, json } = await fetchJson('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Google Search Console sites.list failed: ${response.status} ${JSON.stringify(json).slice(0, 500)}`);
  }
  const available = (json?.siteEntry ?? []).map((entry) => entry.siteUrl);
  const matched = candidates.find((candidate) => available.includes(candidate));
  if (!matched) {
    throw new Error(
      `No Search Console property matches ${hostname}. Tried: ${candidates.join(', ')}. `
      + `Properties this service account can actually access: ${available.length ? available.join(', ') : '(none)'}. `
      + 'Grant the service account access to the right property in Search Console, or fix the expected property id.',
    );
  }
  return matched;
}

const report = { generatedAt: new Date().toISOString(), sitemap: SITEMAP_URL, gscSiteUrl: null, status: 'failed', message: '' };

try {
  const token = await googleAccessToken();
  const gscSiteUrl = await resolveGscSiteUrl(token);
  report.gscSiteUrl = gscSiteUrl;
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  const response = await fetch(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  const body = await response.text();
  report.status = response.ok ? 'submitted' : 'failed';
  report.message = response.ok
    ? 'Sitemap submitted to Google Search Console.'
    : `${response.status} ${body.slice(0, 500)}`;
  if (!response.ok) process.exitCode = 1;
} catch (error) {
  report.message = error.message;
  process.exitCode = 1;
}

console.log(JSON.stringify(report, null, 2));
