import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const SITE_ORIGIN = 'https://roomfeng.win';
export const GSC_DOMAIN_PROPERTY = 'sc-domain:roomfeng.win';
export const SITEMAP_INDEX_URL = `${SITE_ORIGIN}/sitemap-index.xml`;
export const STUCK_AFTER_DAYS = 14;

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

export function findStuckSitemaps(entries, now = Date.now()) {
  const cutoff = now - STUCK_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const submittedAt = Date.parse(entry.lastSubmitted ?? '');
    return entry.isPending === true
      && !entry.lastDownloaded
      && Number.isFinite(submittedAt)
      && submittedAt < cutoff;
  });
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
