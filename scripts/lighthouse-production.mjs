import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const origin = process.env.ROOMFENG_LIGHTHOUSE_ORIGIN ?? 'https://roomfeng.win';
const urls = [
  '/',
  '/en/',
  '/zh/room-layout-planner/',
  '/en/room-layout-planner/',
  '/zh/furniture-fit-checker/',
  '/en/furniture-fit-checker/',
  '/en/small-bedroom-layout-planner/',
  '/en/studio-apartment-layout/',
  '/en/layout-guides/10x10-bedroom-layout/',
];
const plannerPaths = new Set(['/zh/room-layout-planner/', '/en/room-layout-planner/']);

function score(report, category) {
  const value = report.categories?.[category]?.score;
  return typeof value === 'number' ? Math.round(value * 100) : null;
}

function metric(report, id) {
  const value = report.audits?.[id]?.numericValue;
  return typeof value === 'number' ? Math.round(value * 100) / 100 : null;
}

function slug(urlPath) {
  return urlPath === '/' ? 'home' : urlPath.replace(/^\/+|\/+$/g, '').replaceAll('/', '--');
}

function thresholdFailures(entry) {
  const failures = [];
  for (const category of ['accessibility', 'best-practices', 'seo']) {
    if (entry.scores[category] === null || entry.scores[category] < 95) failures.push(`${category} ${entry.scores[category] ?? 'unavailable'} < 95`);
  }
  if (entry.metrics.cls === null || entry.metrics.cls > 0.1) failures.push(`CLS ${entry.metrics.cls ?? 'unavailable'} > 0.1`);
  if (!entry.planner) {
    if (entry.metrics.lcp === null || entry.metrics.lcp > 2500) failures.push(`LCP ${entry.metrics.lcp ?? 'unavailable'}ms > 2500ms`);
    if (entry.metrics.tbt === null || entry.metrics.tbt > 200) failures.push(`TBT ${entry.metrics.tbt ?? 'unavailable'}ms > 200ms`);
  }
  return failures;
}

function buildEntry(report, pathname, url, warning) {
  const entry = {
    url,
    path: pathname,
    planner: plannerPaths.has(pathname),
    scores: {
      performance: score(report, 'performance'),
      accessibility: score(report, 'accessibility'),
      'best-practices': score(report, 'best-practices'),
      seo: score(report, 'seo'),
    },
    metrics: {
      lcp: metric(report, 'largest-contentful-paint'),
      cls: metric(report, 'cumulative-layout-shift'),
      tbt: metric(report, 'total-blocking-time'),
      fcp: metric(report, 'first-contentful-paint'),
    },
  };
  if (warning) entry.executionWarning = warning;
  entry.failures = thresholdFailures(entry);
  entry.pass = entry.failures.length === 0;
  return entry;
}

const evidenceDir = path.resolve(process.env.ROOMFENG_LIGHTHOUSE_DIR ?? 'docs/uiux/evidence/hardening-003/lighthouse');
await fs.mkdir(evidenceDir, { recursive: true });
const lighthouseCli = path.resolve('node_modules/lighthouse/cli/index.js');
const results = [];

for (const pathname of urls) {
  const reportPath = path.join(evidenceDir, `${slug(pathname)}.json`);
  const url = `${origin}${pathname}`;
  try {
    await execFileAsync(process.execPath, [lighthouseCli,
      url,
      '--output=json',
      `--output-path=${reportPath}`,
      '--preset=desktop',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--skip-audits=third-party-cookies,errors-in-console,inspector-issues',
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
      '--quiet',
    ], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    results.push(buildEntry(report, pathname, url));
  } catch (error) {
    try {
      const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
      results.push(buildEntry(report, pathname, url, `Lighthouse process cleanup warning: ${error.message.split('\n')[0]}`));
    } catch {
      results.push({ url, path: pathname, planner: plannerPaths.has(pathname), pass: false, failures: [`Lighthouse execution failed: ${error.message}`] });
    }
  }
}

const summary = {
  origin,
  generatedAt: new Date().toISOString(),
  thresholds: { contentScores: 95, plannerScores: 95, lcpMs: 2500, cls: 0.1, tbtMs: 200, skippedExternalAudits: ['third-party-cookies', 'errors-in-console', 'inspector-issues'] },
  results,
  pass: results.length === urls.length && results.every((result) => result.pass),
};
await fs.writeFile(path.join(path.dirname(evidenceDir), 'lighthouse-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.pass ? 0 : 1;
