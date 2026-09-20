import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const distAssets = path.resolve(process.env.ROOMFENG_DIST_ASSETS ?? 'dist/_astro');
const output = path.resolve(process.env.ROOMFENG_BUNDLE_EVIDENCE ?? 'docs/uiux/evidence/hardening-003/bundle-comparison.json');
const baselinePath = path.resolve(process.env.ROOMFENG_BUNDLE_BASELINE ?? 'docs/uiux/evidence/review-04/bundle-comparison.json');

const assetSummary = async (extension) => {
  const files = (await fs.readdir(distAssets)).filter((file) => file.endsWith(extension));
  const rows = await Promise.all(files.map(async (file) => ({ file, bytes: (await fs.stat(path.join(distAssets, file))).size })));
  rows.sort((left, right) => right.bytes - left.bytes);
  return {
    files: rows.length,
    bytes: rows.reduce((total, row) => total + row.bytes, 0),
    largestBytes: rows[0]?.bytes ?? 0,
    largestFile: rows[0]?.file ?? null,
  };
};

const current = { javascript: await assetSummary('.js'), css: await assetSummary('.css') };
let baseline = null;
try {
  baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8')).current ?? JSON.parse(await fs.readFile(baselinePath, 'utf8'));
} catch {
  baseline = null;
}
const delta = baseline ? Object.fromEntries(Object.entries(current).map(([kind, value]) => [kind, {
  files: value.files - (baseline[kind]?.files ?? 0),
  bytes: value.bytes - (baseline[kind]?.bytes ?? 0),
  largestBytes: value.largestBytes - (baseline[kind]?.largestBytes ?? 0),
}])) : null;
const report = { generatedAt: new Date().toISOString(), baselinePath, baseline, current, delta };
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
