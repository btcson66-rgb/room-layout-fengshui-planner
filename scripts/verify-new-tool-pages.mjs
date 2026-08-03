import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const distRoot = path.resolve(process.cwd(), 'dist');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.webp', 'image/webp'],
]);

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function cleanupTestProfiles() {
  const tempRoot = path.resolve(tmpdir());
  const entries = await readdir(tempRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('roomfeng-browser-')) continue;
    const target = path.resolve(tempRoot, entry.name);
    if (!target.startsWith(`${tempRoot}${path.sep}roomfeng-browser-`)) {
      throw new Error(`Refusing to remove unexpected test path: ${target}`);
    }
    await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

function harness(page) {
  const isStorage = page === 'storage';
  const source = isStorage ? '/zh/storage-bed-selector/' : '/en/room-size-layout-templates/';
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>html,body{margin:0}iframe{display:block;width:390px;height:844px;border:0}</style></head>
<body><iframe id="page" src="${source}"></iframe>
<script>
const frame = document.getElementById('page');
const finish = (report) => document.documentElement.dataset.report = encodeURIComponent(JSON.stringify(report));
frame.addEventListener('load', async () => {
  try {
    const doc = frame.contentDocument;
    const wait = () => new Promise((resolve) => setTimeout(resolve, 100));
    ${isStorage ? `
    const form = doc.querySelector('[data-selector-form]');
    const run = async (values) => {
      for (const [name, value] of Object.entries(values)) {
        const input = form.elements.namedItem(name);
        if (input.type === 'checkbox') input.checked = value;
        else input.value = String(value);
      }
      form.requestSubmit();
      await wait();
      return {
        input: values,
        top: doc.querySelector('.bed-result h3')?.textContent?.trim(),
        passed: [...doc.querySelectorAll('.bed-result.is-feasible')].map((card) => card.querySelector('h3')?.textContent?.trim()),
      };
    };
    const cases = [
      await run({ roomLength: 360, roomWidth: 280, ceilingHeight: 250, userHeight: 170, needsDesk: false, shared: false }),
      await run({ roomLength: 300, roomWidth: 240, ceilingHeight: 230, userHeight: 178, needsDesk: true, shared: true }),
    ];` : `
    const form = doc.querySelector('[data-en-template-form]');
    const run = async (values) => {
      for (const [name, value] of Object.entries(values)) form.elements.namedItem(name).value = value;
      form.requestSubmit();
      await wait();
      return {
        input: values,
        heading: doc.querySelector('[data-en-template-result] > h3')?.textContent?.trim(),
        clearWidths: [...doc.querySelectorAll('.layout-variant p')]
          .map((item) => item.textContent?.trim())
          .filter((text) => text?.startsWith('Calculated clear width:')),
      };
    };
    const cases = [
      await run({ size: '200', priority: 'sleep' }),
      await run({ size: '150', priority: 'work' }),
    ];`}
    const viewport = {
      requestedWidth: 390,
      clientWidth: doc.documentElement.clientWidth,
      scrollWidth: doc.documentElement.scrollWidth,
      overflow: doc.documentElement.scrollWidth > doc.documentElement.clientWidth,
      offenders: [...doc.querySelectorAll('body *')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -0.5 || rect.right > doc.documentElement.clientWidth + 0.5;
      }).slice(0, 10).map((element) => element.tagName + (element.className ? '.' + String(element.className).replaceAll(' ', '.') : '')),
    };
    finish({ page: '${page}', viewport, cases });
  } catch (error) {
    finish({ page: '${page}', error: String(error?.stack || error) });
  }
});
setTimeout(() => {
  if (!document.documentElement.dataset.report) finish({ page: '${page}', error: 'Harness timed out' });
}, 4000);
</script></body></html>`;
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, 'http://localhost');
    if (requestUrl.pathname === '/__verify') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      response.end(harness(requestUrl.searchParams.get('page')));
      return;
    }

    const pathname = decodeURIComponent(requestUrl.pathname);
    let filePath = path.resolve(distRoot, `.${pathname}`);
    if (!filePath.startsWith(`${distRoot}${path.sep}`) && filePath !== distRoot) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) filePath = path.join(filePath, 'index.html');
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': contentTypes.get(path.extname(filePath)) ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

async function runChrome(url, slug) {
  const profile = await mkdtemp(path.join(tmpdir(), `roomfeng-browser-${slug}-`));
  let child;
  try {
    child = spawn(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--disable-gpu-sandbox',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--use-angle=swiftshader',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--dump-dom',
      '--virtual-time-budget=5000',
      `--user-data-dir=${profile}`,
      url,
    ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const exitCode = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Chrome timed out for ${slug}`));
      }, 20000);
      child.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once('exit', (code) => {
        clearTimeout(timer);
        resolve(code);
      });
    });
    if (exitCode !== 0) throw new Error(`Chrome exited ${exitCode}: ${stderr.slice(-500)}`);
    const encoded = stdout.match(/data-report="([^"]+)"/)?.[1];
    if (!encoded) throw new Error(`No browser report for ${slug}: ${stdout.slice(-500)}`);
    return { chromePid: child.pid, ...JSON.parse(decodeURIComponent(encoded.replaceAll('&amp;', '&'))) };
  } finally {
    if (child && child.exitCode === null) child.kill();
    const resolvedProfile = path.resolve(profile);
    const resolvedTemp = path.resolve(tmpdir());
    if (resolvedProfile.startsWith(`${resolvedTemp}${path.sep}roomfeng-browser-${slug}-`)) {
      await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }
}

try {
  await cleanupTestProfiles();
  const port = await listen(server);
  const storage = await runChrome(`http://127.0.0.1:${port}/__verify?page=storage`, 'storage');
  const english = await runChrome(`http://127.0.0.1:${port}/__verify?page=english`, 'english');
  const report = {
    status: storage.error || english.error || storage.viewport.overflow || english.viewport.overflow ? 'FAIL' : 'PASS',
    storageBedSelector: storage,
    englishRoomTemplates: english,
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'PASS') process.exitCode = 1;
} finally {
  server.closeAllConnections?.();
  await close(server).catch(() => {});
  await cleanupTestProfiles();
}
