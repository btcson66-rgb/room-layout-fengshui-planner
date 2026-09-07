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
import { resolveSitemapOutcome } from './gsc-sitemap-outcome.mjs';

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
      `STUCK: GSC reports no download for ${entry.path}; it is still pending and was last submitted more than 14 days ago (${entry.lastSubmitted}). This means GSC has not reported a download, not that Google never fetched the file.`,
    );
  }

  const outcome = resolveSitemapOutcome({
    failureCount,
    submittedCount,
    registeredCount,
    stuckCount: stuckEntries.length,
    alerts: report.alerts,
  });
  report.status = outcome.status;
  report.message = outcome.message;
  // STUCK 不再讓這一步變紅（理由見 gsc-sitemap-outcome.mjs 的檔頭），但也不能就這樣
  // 消失在一大片 JSON 裡。印到 stderr，GitHub Actions 會把它獨立標出來，
  // 而真正的告警由 fable-company 每日健檢負責。
  for (const alert of report.alerts) console.error(alert);
  if (outcome.stuck) {
    console.error(
      'NOTE: stuck sitemaps do not fail this step. The daily health check owns this signal '
      + '(fable-company scripts/lib/gsc-sitemap-discovery.mjs → issue code sitemap-never-downloaded).',
    );
  }
  if (outcome.exitCode !== 0) process.exitCode = outcome.exitCode;
} catch (error) {
  report.message = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
}

console.log(JSON.stringify(report, null, 2));
