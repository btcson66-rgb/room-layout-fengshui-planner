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
  needsResubmission,
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
const INSPECTION_URLS = [
  'https://roomfeng.win/',
  'https://roomfeng.win/zh/blog/bed-facing-door-feng-shui/',
  'https://roomfeng.win/zh/blog/desk-facing-door-layout/',
];

async function inspectSitemapKnowledge(token, siteUrl) {
  const results = [];
  for (const inspectionUrl of INSPECTION_URLS) {
    try {
      const { response, json } = await fetchJson('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ siteUrl, inspectionUrl }),
      });
      if (!response.ok) {
        results.push({ url: inspectionUrl, httpStatus: response.status, error: json?.error?.message ?? 'inspection failed' });
        continue;
      }
      const state = json?.inspectionResult?.indexStatusResult ?? {};
      results.push({
        url: inspectionUrl,
        coverageState: state.coverageState ?? null,
        lastCrawlTime: state.lastCrawlTime ?? null,
        googleKnownSitemaps: Array.isArray(state.sitemap) ? state.sitemap : [],
        referringUrlCount: Array.isArray(state.referringUrls) ? state.referringUrls.length : 0,
      });
    } catch (error) {
      results.push({ url: inspectionUrl, error: error instanceof Error ? error.message : String(error) });
    }
  }
  const knownBySitemap = results.some((item) => item.googleKnownSitemaps?.length);
  console.error(knownBySitemap
    ? 'SITEMAP EVIDENCE: URL Inspection lists our sitemap for at least one URL — Google has read it even if the Sitemaps report still says 無法擷取.'
    : 'SITEMAP EVIDENCE: URL Inspection lists no sitemap for the probed URLs.');
  return { knownBySitemap, results };
}

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

    // A registered entry Google has already downloaded needs nothing further.
    // One Search Console has never fetched does: leaving it alone is how both
    // roomfeng and funnytools sat at "無法擷取" for weeks without the pipeline
    // ever asking Google to try again. See RESUBMIT_AFTER_DAYS in gsc-client.mjs.
    const beforeStatus = before.response.ok ? sitemapStatus(before.json, sitemapUrl) : null;
    const resubmitting = Boolean(beforeStatus && needsResubmission(beforeStatus));
    if (before.response.ok && !forceSubmit && !resubmitting) {
      registeredCount += 1;
      report.entries.push({
        ...beforeStatus,
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
      action: forceSubmit
        ? 'force_submitted'
        : resubmitting ? 'resubmitted_never_fetched' : 'submitted_unregistered',
      putStatus: put.response.status,
      getStatus: get.response.status,
      ...(resubmitting ? { previousSubmission: beforeStatus.lastSubmitted } : {}),
    });

    if (!get.response.ok) {
      failureCount += 1;
      report.alerts.push(apiFailure(`GET ${sitemapUrl}`, get.response, get.json));
    } else {
      submittedCount += 1;
    }
  }

  // Sitemaps 報表說「無法擷取」不等於 Google 沒讀過 sitemap（見 gsc-sitemap-outcome.mjs 檔頭的
  // Cloudflare 反證）。URL Inspection 的 indexStatusResult.sitemap 是 Google 自己對
  // 「這個網址列在哪些 sitemap」的回答：只要出現我們的 sitemap，就代表 Google 讀過它。
  // 純觀測，失敗只記錄、不影響退出碼（提交成敗的邊界不變）。
  report.inspection = await inspectSitemapKnowledge(token, gscSiteUrl);

  const stuckEntries = findStuckSitemaps(report.entries);
  for (const entry of stuckEntries) {
    report.alerts.push(
      `NEVER FETCHED: Search Console has never reported a download for ${entry.path} (submitted ${entry.lastSubmitted}). Its web UI shows this entry as 無法擷取 / Couldn't fetch. That is Google's fetcher failing or not having run, not a defect in the file itself — the post-deploy readback gate fetches the same URL over the public internet on every deploy.`,
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
