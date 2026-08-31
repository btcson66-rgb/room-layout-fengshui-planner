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
const forceSubmit = process.argv.includes('--force');

try {
  const sitemapUrls = await discoverSitemapUrls(indexPath);
  const token = await googleAccessToken();
  const gscSiteUrl = await resolveGscSiteUrl(token);
  report.gscSiteUrl = gscSiteUrl;
  let failureCount = 0;
  let submittedCount = 0;
  let registeredCount = 0;

  for (const sitemapUrl of sitemapUrls) {
    const endpoint = sitemapEndpoint(gscSiteUrl, sitemapUrl);
    const before = await fetchJson(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (before.response.ok && !forceSubmit) {
      registeredCount += 1;
      report.entries.push({
        ...sitemapStatus(before.json, sitemapUrl),
        action: 'already_registered',
        getStatus: before.response.status,
      });
      continue;
    }
    if (!before.response.ok && before.response.status !== 404) {
      failureCount += 1;
      report.alerts.push(apiFailure(`GET ${sitemapUrl}`, before.response, before.json));
      continue;
    }

    const put = await fetchJson(endpoint, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!put.response.ok) {
      failureCount += 1;
      report.alerts.push(apiFailure(`PUT ${sitemapUrl}`, put.response, put.json));
      continue;
    }

    // Keep this GET immediately after its PUT. Do not insert another API call
    // between them: the report must describe the just-submitted entry.
    const get = await fetchJson(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const status = sitemapStatus(get.json, sitemapUrl);
    report.entries.push({
      ...status,
      action: forceSubmit ? 'force_submitted' : 'submitted_unregistered',
      putStatus: put.response.status,
      getStatus: get.response.status,
    });

    if (!get.response.ok) {
      failureCount += 1;
      report.alerts.push(apiFailure(`GET ${sitemapUrl}`, get.response, get.json));
    } else {
      submittedCount += 1;
    }
  }

  const stuckEntries = findStuckSitemaps(report.entries);
  for (const entry of stuckEntries) {
    report.alerts.push(
      `STUCK: ${entry.path} is pending with no lastDownloaded and was last submitted more than 14 days ago (${entry.lastSubmitted}).`,
    );
  }

  if (failureCount > 0) {
    report.status = 'failed';
    report.message = report.alerts.join(' ');
    process.exitCode = 1;
  } else if (submittedCount > 0) {
    report.status = 'submitted-and-verified';
    report.message = `Submitted ${submittedCount} unregistered sitemap entries and read back ${registeredCount} existing entries.`;
  } else if (stuckEntries.length > 0) {
    report.status = 'registered-pending';
    report.message = `Read back ${registeredCount} registered sitemap entries. Google download remains pending; no repeat PUT was sent.`;
  } else {
    report.status = 'already-registered';
    report.message = `Read back ${registeredCount} registered sitemap entries; no repeat PUT was needed.`;
  }
} catch (error) {
  report.message = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
}

console.log(JSON.stringify(report, null, 2));
