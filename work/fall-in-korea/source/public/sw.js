const CACHE_PREFIX = 'morning-merge-';
const CACHE_NAME = `${CACHE_PREFIX}v8`;
importScripts('/fonts/offline.js');
const APP_SHELL = [
  "/",
  "/src/app-v4.js",
  "/src/progress-store.js",
  "/src/game.js",
  "/src/content.js",
  "/src/travel-content.js",
  "/src/i18n.js",
  "/src/art-v4.js",
  "/src/views-v4.js",
  "/src/panels-v4.js",
  "/src/sprite-data.js",
  "/src/travel-sprite-data.js",
  "/src/game-v4.css",
  "/src/game-v3.css",
  "/src/home-v4.css",
  "/assets/hanok-scene.png",
  "/assets/korean-items-a.png",
  "/assets/korean-items-b.png",
  "/assets/korean-characters.png",
  "/assets/ui-atlas.png",
  "/assets/korea-travel-map.png",
  "/assets/korea-travel-map-wide.png",
  "/assets/korea-map-mist.png",
  "/assets/korea-buildings.png",
  "/assets/modern-items.png",
  "/assets/travel-events.png",
  "/manifest.webmanifest",
  "/app-icon.png",
  "/fonts/offline.js",
  ...self.FONT_FILES
];

async function openCache() {
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    // Storage restrictions should only disable offline support, never online play.
    return null;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(openCache()
    .then((cache) => cache?.addAll(APP_SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .catch(() => [])
    .then((names) => Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name).catch(() => false))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const isNavigation = request.mode === 'navigate';
  const isStatic = APP_SHELL.includes(url.pathname)
    || ['script', 'style', 'image', 'font'].includes(request.destination);
  if (!isNavigation && !isStatic) return;

  // Large sprite sheets should paint from the installed cache immediately.
  // Refresh the copy in the background so local art edits still reach the next load.
  if (request.destination === 'image' || url.pathname.startsWith('/assets/')) {
    const cachePromise = openCache();
    const networkPromise = fetch(request).then(async (response) => {
      if (response.ok && response.type === 'basic') {
        try { await (await cachePromise)?.put(request, response.clone()); } catch {}
      }
      return response;
    });
    event.waitUntil(networkPromise.catch(() => undefined));
    event.respondWith((async () => {
      try {
        const saved = await (await cachePromise)?.match(request);
        if (saved) return saved;
      } catch {}
      try { return await networkPromise; }
      catch { return new Response('', { status: 503 }); }
    })());
    return;
  }

  event.respondWith((async () => {
    const cachePromise = openCache();
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        try {
          const cache = await cachePromise;
          await cache?.put(request, response.clone());
          if (isNavigation && (url.pathname === '/' || url.pathname === '/index.html')) {
            await cache?.put('/', response.clone());
          }
        } catch {
          // A full or unavailable cache must not hide a successful network response.
        }
      }
      return response;
    } catch {
      try {
        const cache = await cachePromise;
        const savedResponse = await cache?.match(request);
        if (savedResponse) return savedResponse;
        if (isNavigation) {
          const shell = await cache?.match('/');
          if (shell) return shell;
        }
      } catch {
        // A blocked cache is equivalent to having no offline copy.
      }
      return new Response('오프라인 상태입니다. 연결 후 다시 시도해 주세요.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
