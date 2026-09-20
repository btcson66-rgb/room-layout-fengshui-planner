import fs from 'node:fs/promises';
import path from 'node:path';

const origin = 'https://roomfeng.win';
const expectedCount = 1447;
const outputPath = path.resolve(process.env.ROOMFENG_SITEMAP_READBACK_PATH ?? 'release-evidence/production-sitemap-readback.json');

async function fetchText(pathname) {
  const response = await fetch(new URL(pathname, origin), { redirect: 'manual' });
  return { status: response.status, text: await response.text() };
}

const robots = await fetchText('/robots.txt');
const index = await fetchText('/sitemap-index.xml');
const child = await fetchText('/sitemap-0.xml');
const legacy = await fetchText('/sitemap.xml');
const urls = [...child.text.matchAll(/<loc>(https:\/\/roomfeng\.win[^<]*)<\/loc>/gi)].map((match) => match[1]);
const uniqueUrls = [...new Set(urls)];
const report = {
  origin,
  generatedAt: new Date().toISOString(),
  expectedCount,
  count: uniqueUrls.length,
  robotsStatus: robots.status,
  indexStatus: index.status,
  childStatus: child.status,
  legacyStatus: legacy.status,
  pass: robots.status === 200
    && index.status === 200
    && child.status === 200
    && legacy.status === 404
    && uniqueUrls.length === expectedCount
    && urls.length === uniqueUrls.length,
};
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
