import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOMFENG_RELEASE_AUTHORITY } from './release-authority.mjs';

const distDir = path.resolve(process.env.ROOMFENG_DIST_DIR ?? 'dist');
const outputPath = path.resolve(process.env.ROOMFENG_BUILD_AUTHORITY_PATH ?? 'release-evidence/build-authority.json');

let htmlFiles = 0;
let sitemapUrls = 0;
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (entry.name.endsWith('.html')) htmlFiles += 1;
  }
}

await walk(distDir);
for (const entry of await fs.readdir(distDir)) {
  if (!/^sitemap-\d+\.xml$/.test(entry)) continue;
  const xml = await fs.readFile(path.join(distDir, entry), 'utf8');
  sitemapUrls += (xml.match(/<loc>/g) ?? []).length;
}

const report = {
  generatedAt: new Date().toISOString(),
  distDir,
  htmlFiles,
  sitemapUrls,
  expectedBuildPages: ROOMFENG_RELEASE_AUTHORITY.buildPages,
  expectedSitemapUrls: ROOMFENG_RELEASE_AUTHORITY.sitemapUrls,
  authorityTransition: ROOMFENG_RELEASE_AUTHORITY.transition,
  pass: htmlFiles === ROOMFENG_RELEASE_AUTHORITY.buildPages
    && sitemapUrls === ROOMFENG_RELEASE_AUTHORITY.sitemapUrls,
};
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
