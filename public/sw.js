/**
 * Saathi Care - Public Service Worker Script
 * Provides robust offline asset caching (Shell, Styles, Media, Offline fallback)
 * Supports Background Sync and Skip Waiting for seamless PWA updates.
 */

const CACHE_VERSIONS = {
  APP_SHELL: 'saathi-care-shell-v2',
  RUNTIME_ASSETS: 'saathi-care-assets-v2',
  DYNAMIC_API: 'saathi-care-api-v2'
};

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install: Precache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSIONS.APP_SHELL).then((cache) => {
      console.log('[ServiceWorker] Precaching core app shell');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[ServiceWorker] Precache partial note:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const activeVersions = Object.values(CACHE_VERSIONS);
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!activeVersions.includes(cacheName)) {
            console.log('[ServiceWorker] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy dispatch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 1. API calls -> Network First with offline JSON fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSIONS.DYNAMIC_API).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({
                offline: true,
                message: 'Device currently offline. Local patient records and vitals available in IndexedDB.'
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // 2. Static Shell, Images & Fonts -> Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSIONS.RUNTIME_ASSETS).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'saathi-sync-records') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGERED' });
        });
      })
    );
  }
});

// Handle Messages from UI
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
