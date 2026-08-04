import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = join(projectRoot, 'dist');
const indexPath = join(distDirectory, 'sitemap-index.xml');
const robotsPath = join(distDirectory, 'robots.txt');
const siteOrigin = 'https://roomfeng.win';

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function childUrlsFromIndex(xml) {
  return [...xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>[^<]+<\/lastmod>)?\s*<\/sitemap>/g)]
    .map((match) => decodeXml(match[1]));
}

function lastmodsFromUrlset(xml, childUrl) {
  const urlCount = (xml.match(/<url>/g) ?? []).length;
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
  if (urlCount === 0 || lastmods.length !== urlCount) {
    throw new Error(`[postbuild-sitemaps] ${childUrl} has ${urlCount} URL entries but ${lastmods.length} lastmod values.`);
  }
  for (const lastmod of lastmods) {
    if (!Number.isFinite(Date.parse(lastmod))) {
      throw new Error(`[postbuild-sitemaps] ${childUrl} contains an invalid lastmod value: ${lastmod}`);
    }
  }
  return lastmods;
}

function newestLastmod(lastmods) {
  return lastmods.reduce((newest, candidate) => (
    Date.parse(candidate) > Date.parse(newest) ? candidate : newest
  ));
}

async function writeIfChanged(path, content) {
  const current = await readFile(path, 'utf8');
  if (current === content) return false;
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, content, 'utf8');
  await rename(temporaryPath, path);
  return true;
}

const indexXml = await readFile(indexPath, 'utf8');
if (!/<sitemapindex(?:\s|>)/.test(indexXml)) {
  throw new Error('[postbuild-sitemaps] dist/sitemap-index.xml is not a sitemap index; refusing to rewrite it.');
}

const childUrls = childUrlsFromIndex(indexXml);
if (childUrls.length === 0) {
  throw new Error('[postbuild-sitemaps] No child sitemap entries were found in dist/sitemap-index.xml.');
}

const lastmodByChild = new Map();
for (const childUrl of childUrls) {
  const parsed = new URL(childUrl);
  if (parsed.origin !== siteOrigin || !/^\/sitemap-\d+\.xml$/.test(parsed.pathname)) {
    throw new Error(`[postbuild-sitemaps] Unexpected child sitemap URL: ${childUrl}`);
  }
  const childPath = join(distDirectory, basename(parsed.pathname));
  const childXml = await readFile(childPath, 'utf8');
  const lastmods = lastmodsFromUrlset(childXml, childUrl);
  lastmodByChild.set(childUrl, newestLastmod(lastmods));
}

let rewrittenIndex = indexXml;
for (const childUrl of childUrls) {
  const escapedUrl = childUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entryPattern = new RegExp(`(<sitemap>\\s*<loc>${escapedUrl}<\\/loc>)(?:\\s*<lastmod>[^<]+<\\/lastmod>)?(\\s*<\\/sitemap>)`);
  const matches = rewrittenIndex.match(new RegExp(entryPattern.source, 'g')) ?? [];
  if (matches.length !== 1) {
    throw new Error(`[postbuild-sitemaps] Expected exactly one index entry for ${childUrl}; found ${matches.length}.`);
  }
  rewrittenIndex = rewrittenIndex.replace(entryPattern, `$1<lastmod>${lastmodByChild.get(childUrl)}</lastmod>$2`);
}

const indexChanged = await writeIfChanged(indexPath, rewrittenIndex);

const robotsSource = await readFile(robotsPath, 'utf8');
const preservedLines = robotsSource
  .split(/\r?\n/)
  .filter((line) => !/^\s*Sitemap:\s+/i.test(line))
  .join('\n')
  .trimEnd();
const sitemapLines = [`Sitemap: ${siteOrigin}/sitemap-index.xml`, ...childUrls.map((url) => `Sitemap: ${url}`)];
const rewrittenRobots = `${preservedLines}\n\n${sitemapLines.join('\n')}\n`;
const robotsChanged = await writeIfChanged(robotsPath, rewrittenRobots);

console.info(`[postbuild-sitemaps] index ${indexChanged ? 'updated' : 'unchanged'}; robots ${robotsChanged ? 'updated' : 'unchanged'}; children: ${childUrls.length}`);
