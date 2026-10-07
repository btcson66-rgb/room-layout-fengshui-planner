import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const ORIGIN = 'https://roomfeng.win';
export function validateManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid IndexNow manifest');
  for (const [url, hash] of Object.entries(value)) {
    const parsed = new URL(url);
    if (parsed.origin !== ORIGIN || parsed.search || parsed.hash || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('Unsafe IndexNow manifest entry');
  }
  return value;
}
export function changedUrls(previous, current) {
  validateManifest(current);
  if (!previous) return [];
  validateManifest(previous);
  return [...new Set([...Object.keys(previous), ...Object.keys(current)])]
    .filter(url => previous[url] !== current[url]).sort();
}
export async function manifest(dist = 'dist') {
  const result = {};
  async function walk(dir) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) await walk(file);
      else if (item.name === 'index.html') {
        const html = await fs.readFile(file, 'utf8');
        const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
        if (!canonical || !canonical.startsWith(ORIGIN + '/') || /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html) || /http-equiv="refresh"/i.test(html)) continue;
        const relative = path.relative(dist, path.dirname(file)).split(path.sep).join('/');
        if (canonical !== ORIGIN + '/' + (relative ? relative + '/' : '')) continue;
        const stableHtml = html.replace(/<meta\b[^>]*name="generator"[^>]*>/gi, '');
        result[canonical] = createHash('sha256').update(stableHtml).digest('hex');
      }
    }
  }
  await walk(dist);
  return result;
}
export async function submit(urls, key, request = fetch, pause = ms => new Promise(r => setTimeout(r, ms))) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key ?? '')) throw new Error('Invalid IndexNow key');
  for (const url of urls) {
    const parsed = new URL(url);
    if (parsed.origin !== ORIGIN || parsed.search || parsed.hash) throw new Error('Unsafe IndexNow submission URL');
  }
  const endpoint = process.env.INDEXNOW_ENDPOINT ?? 'https://api.indexnow.org/indexnow';
  if (!['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow'].includes(endpoint)) throw new Error('Unsupported IndexNow endpoint');
  const logs = [];
  if (urls.length > 1000) throw new Error('IndexNow changed subset exceeds 1000; inspect before submitting');
  const keyLocation = `${ORIGIN}/${key}.txt`;
  const verification = await request(keyLocation, { signal: AbortSignal.timeout(15000) });
  if (verification.status !== 200 || (await verification.text()).trim() !== key) throw new Error('IndexNow production key verification failed');
  for (let offset = 0; offset < urls.length; offset += 100) {
    const batch = urls.slice(offset, offset + 100);
    let accepted = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      let status = 0;
      try {
        const response = await request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host: 'roomfeng.win', key, keyLocation, urlList: batch }), signal: AbortSignal.timeout(30000) });
        status = response.status;
      } catch { /* transport failures are recorded without credential-bearing request data */ }
      logs.push({ offset, count: batch.length, attempt, status });
      accepted = status === 200 || status === 202;
      if (accepted) break;
      if (status && status !== 429 && status < 500) break;
      if (attempt < 4) await pause(1000 * 2 ** attempt);
    }
    if (!accepted) throw Object.assign(new Error('IndexNow batch not accepted'), { logs });
    if (offset + 100 < urls.length) await pause(1000);
  }
  return logs;
}
async function main() {
  const dir = process.env.INDEXNOW_STATE_DIR ?? 'release-evidence/indexnow';
  await fs.mkdir(dir, { recursive: true });
  const current = await manifest();
  const key = process.env.INDEXNOW_KEY;
  if (process.argv.includes('--prepare')) {
    if (key) {
      if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid IndexNow key format');
      await fs.writeFile(`dist/${key}.txt`, key, 'utf8');
    }
    await fs.writeFile(`${dir}/current.json`, JSON.stringify(current, null, 2));
    console.log(`IndexNow manifest: ${Object.keys(current).length} canonical indexable pages; key configured: ${Boolean(key)}`);
    return;
  }
  let previous;
  try { previous = JSON.parse(await fs.readFile(`${dir}/previous.json`, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const urls = changedUrls(previous, current);
  const log = { baseline: previous ? 'PREVIOUS_ACCEPTED' : 'INITIAL_NO_BULK', urls, configured: Boolean(key), submitted: false, attempts: [] };
  try {
    if (process.env.INDEXNOW_SUBMIT === '1' && !key) throw new Error('INDEXNOW_KEY missing; configure repository secret before enabling deployment integration');
    if (process.env.INDEXNOW_SUBMIT === '1') {
      if (!key) throw new Error('INDEXNOW_KEY missing; changed URLs not submitted');
      log.attempts = await submit(urls, key);
      log.keyVerified = true;
      log.submitted = urls.length > 0;
    }
    if (process.env.INDEXNOW_SUBMIT === '1') await fs.writeFile(`${dir}/accepted.json`, JSON.stringify(current, null, 2));
  } catch (error) {
    log.attempts = error.logs ?? [];
    log.error = error.message;
    process.exitCode = 1;
  } finally {
    await fs.writeFile(`${dir}/submission-log.json`, JSON.stringify(log, null, 2));
    console.log(JSON.stringify({ ...log, urls: urls.length }));
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
