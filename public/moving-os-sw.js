const CACHE_NAME = 'roomfeng-moving-os-offline-v1.0.0';
const OFFLINE_GRACE_MS = 24 * 60 * 60 * 1000;
const APP_PATH = /^\/(?:en|zh)\/moving-new-home-os\/app\/?$/;
const QA_HOSTS = new Set(['127.0.0.1', 'localhost']);
let qaSimulateOffline = false;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

async function cacheWithExpiry(cache, request, response) {
  if (!response.ok || response.redirected) return;
  const headers = new Headers(response.headers);
  headers.set('x-roomfeng-offline-until', String(Date.now() + OFFLINE_GRACE_MS));
  const wrapped = new Response(await response.clone().arrayBuffer(), { status: response.status, statusText: response.statusText, headers });
  await cache.put(request, wrapped);
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'QA_SIMULATE_OFFLINE' && QA_HOSTS.has(self.location.hostname)) {
    qaSimulateOffline = event.data.enabled === true;
    return;
  }
  if (event.data?.type !== 'CACHE_MOVING_OS' || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((value) => typeof value === 'string' && (APP_PATH.test(value) || value.startsWith('/_astro/'))).slice(0, 80);
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(urls.map(async (url) => {
      try { const request = new Request(url, { credentials: 'same-origin' }); const response = await fetch(request); await cacheWithExpiry(cache, request, response); } catch { /* an authenticated online visit will retry */ }
    }));
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || (!APP_PATH.test(url.pathname) && !url.pathname.startsWith('/_astro/'))) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      if (qaSimulateOffline) throw new Error('qa-simulated-offline');
      const response = await fetch(event.request);
      await cacheWithExpiry(cache, event.request, response);
      return response;
    } catch {
      const cached = await cache.match(event.request);
      if (!cached) throw new Error('offline-cache-miss');
      const until = Number(cached.headers.get('x-roomfeng-offline-until') || 0);
      if (until <= Date.now()) { await cache.delete(event.request); throw new Error('offline-grace-expired'); }
      return cached;
    }
  })());
});
