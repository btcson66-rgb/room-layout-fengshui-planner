// Submit the built sitemap index and every child sitemap, then read each entry
// back from Google Search Console so the workflow records the state it created.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITEMAP_INDEX_URL,
  apiFailure,
  discoverSitemapUrls,
  fetchJson,
  findStuckSitemaps,
  googleAccessToken,
  resolveGscSiteUrl,
  sitemapEndpoint,
  sitemapStatus,
} from './gsc-client.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(projectRoot, 'dist', 'sitemap-index.xml');
const report = {
  generatedAt: new Date().toISOString(),
  sitemapIndex: SITEMAP_INDEX_URL,
  gscSiteUrl: null,
  status: 'failed',
  message: '',
  entries: [],
  alerts: [],
};

try {
  const sitemapUrls = await discoverSitemapUrls(indexPath);
  const token = await googleAccessToken();
  const gscSiteUrl = await resolveGscSiteUrl(token);
  report.gscSiteUrl = gscSiteUrl;

  for (const sitemapUrl of sitemapUrls) {
    const endpoint = sitemapEndpoint(gscSiteUrl, sitemapUrl);
    const put = await fetchJson(endpoint, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });

    // Keep this GET immediately after its PUT. Do not insert another API call
    // between them: the report must describe the just-submitted entry.
    const get = await fetchJson(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const status = sitemapStatus(get.json, sitemapUrl);
    report.entries.push({
      ...status,
      putStatus: put.response.status,
      getStatus: get.response.status,
    });

    if (!put.response.ok) report.alerts.push(apiFailure(`PUT ${sitemapUrl}`, put.response, put.json));
    if (!get.response.ok) report.alerts.push(apiFailure(`GET ${sitemapUrl}`, get.response, get.json));
  }

  for (const entry of findStuckSitemaps(report.entries)) {
    report.alerts.push(
      `STUCK: ${entry.path} is pending with no lastDownloaded and was last submitted more than 14 days ago (${entry.lastSubmitted}).`,
    );
  }

  report.status = report.alerts.length === 0 ? 'submitted-and-verified' : 'failed';
  report.message = report.alerts.length === 0
    ? `Submitted and read back ${report.entries.length} sitemap entries.`
    : report.alerts.join(' ');
  if (report.alerts.length > 0) process.exitCode = 1;
} catch (error) {
  report.message = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
}

console.log(JSON.stringify(report, null, 2));
