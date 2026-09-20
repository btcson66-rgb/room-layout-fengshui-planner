import fs from 'node:fs/promises';
import path from 'node:path';

const origin = 'https://roomfeng.win';
const evidenceDir = path.resolve(process.env.ROOMFENG_RELEASE_READBACK_DIR ?? 'release-evidence/production-readback');
const routeChecks = [
  { path: '/', status: 200, document: true },
  { path: '/en/', status: 200, document: true },
  { path: '/zh/room-layout-planner/', status: 200, document: true },
  { path: '/en/room-layout-planner/', status: 200, document: true },
  { path: '/zh/furniture-fit-checker/', status: 200, document: true },
  { path: '/en/furniture-fit-checker/', status: 200, document: true },
  { path: '/en/small-bedroom-layout-planner/', status: 200, document: true },
  { path: '/en/studio-apartment-layout/', status: 200, document: true },
  { path: '/en/layout-guides/10x10-bedroom-layout/', status: 200, document: true },
  { path: '/robots.txt', status: 200, document: false },
  { path: '/sitemap-index.xml', status: 200, document: false },
  { path: '/sitemap-0.xml', status: 200, document: false },
  { path: '/sitemap.xml', status: 404, document: false },
];

const waitMs = Number(process.env.ROOMFENG_RELEASE_READBACK_WAIT_MS ?? 10000);
const attempts = Number(process.env.ROOMFENG_RELEASE_READBACK_ATTEMPTS ?? 18);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchRoute(pathname) {
  const started = Date.now();
  const response = await fetch(new URL(pathname, origin), { redirect: 'manual' });
  const text = await response.text();
  return {
    path: pathname,
    status: response.status,
    location: response.headers.get('location') ?? '',
    titlePresent: /<title>[^<]+<\/title>/i.test(text),
    h1Count: (text.match(/<h1\b/gi) ?? []).length,
    bytes: Buffer.byteLength(text),
    durationMs: Date.now() - started,
  };
}

let homeReadback = null;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const candidate = await fetchRoute('/');
    if (candidate.status === 200 && candidate.titlePresent && candidate.h1Count === 1) {
      homeReadback = { ...candidate, attempt };
      break;
    }
  } catch {
    // The next attempt is the propagation wait; the final report records the failed gate.
  }
  if (attempt < attempts) await sleep(waitMs);
}

const routes = [];
for (const check of routeChecks) {
  try {
    const result = check.path === '/' && homeReadback ? homeReadback : await fetchRoute(check.path);
    const pass = result.status === check.status
      && (!check.document || (result.titlePresent && result.h1Count === 1));
    routes.push({ ...result, expectedStatus: check.status, pass });
  } catch (error) {
    routes.push({ path: check.path, expectedStatus: check.status, pass: false, error: error.message });
  }
}

const report = {
  origin,
  generatedAt: new Date().toISOString(),
  expectedProductionSha: process.env.GITHUB_SHA ?? null,
  routes,
  pass: routes.length === routeChecks.length && routes.every((route) => route.pass),
};
await fs.mkdir(evidenceDir, { recursive: true });
await fs.writeFile(path.join(evidenceDir, 'production-readback.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
