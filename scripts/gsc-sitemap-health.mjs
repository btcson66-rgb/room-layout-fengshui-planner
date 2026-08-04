// Read-only sitemap health check. Apart from OAuth token exchange, this command
// makes exactly one Search Console API request: sitemaps.list. It never mutates
// sitemap state with PUT or DELETE.
import {
  GSC_DOMAIN_PROPERTY,
  apiFailure,
  fetchJson,
  findStuckSitemaps,
  googleAccessToken,
  sitemapListEndpoint,
  sitemapStatus,
} from './gsc-client.mjs';

try {
  const token = await googleAccessToken();
  const { response, json } = await fetchJson(sitemapListEndpoint(GSC_DOMAIN_PROPERTY), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(apiFailure('Google Search Console sitemaps.list', response, json));

  const entries = (json?.sitemap ?? []).map((entry) => sitemapStatus(entry));
  console.table(entries);

  const stuckEntries = findStuckSitemaps(entries);
  if (stuckEntries.length > 0) {
    for (const entry of stuckEntries) {
      console.error(
        `STUCK: ${entry.path} is pending with no lastDownloaded and was last submitted more than 14 days ago (${entry.lastSubmitted}).`,
      );
    }
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
