/**
 * Saathi Care - Robust Service Worker Engine & Offline Asset Caching
 *
 * Implements native Progressive Web App (PWA) caching strategies:
 *  - CacheFirst: For immutable static assets (fonts, icons, stylesheets, scripts)
 *  - NetworkFirst: For dynamic clinical queries, API payloads, and notifications
 *  - StaleWhileRevalidate: For core application shell, markup, and navigation pages
 *  - BackgroundSync: Triggers automatic queue synchronization when internet reconnects
 *
 * Also manages service worker registration, lifecycle updates, and IndexedDB coordination.
 */

// Re-export IndexedDB database instance & types for seamless access
export * from './db';
export { offlineDB } from './db';

// ============================================================================
// CACHE NAMES & CORE ASSETS MANIFEST
// ============================================================================

export const CACHE_VERSIONS = {
  APP_SHELL: 'saathi-care-shell-v2',
  RUNTIME_ASSETS: 'saathi-care-assets-v2',
  DYNAMIC_API: 'saathi-care-api-v2',
  OFFLINE_FALLBACK: 'saathi-care-fallback-v2'
} as const;

export const CORE_ASSETS: string[] = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// ============================================================================
// CLIENT-SIDE STRATEGY IMPLEMENTATIONS (CacheStorage & Fetch API)
// ============================================================================

export interface CacheStrategyOptions {
  cacheName?: string;
  maxAgeSeconds?: number;
  maxEntries?: number;
  fallbackUrl?: string;
}

/**
 * CacheFirst Strategy
 * Checks local cache first; if missing, fetches from network, stores in cache, and returns.
 * Recommended for fonts, brand assets, and compiled static assets.
 */
export async function cacheFirst(
  request: RequestInfo | URL,
  options: CacheStrategyOptions = {}
): Promise<Response> {
  const cacheName = options.cacheName || CACHE_VERSIONS.RUNTIME_ASSETS;
  const cache = await caches.open(cacheName);
  const matched = await cache.match(request);

  if (matched) {
    return matched;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn(`[ServiceWorker] CacheFirst network fetch failed for ${typeof request === 'string' ? request : (request as Request).url}:`, error);
    if (options.fallbackUrl) {
      const fallback = await cache.match(options.fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
}

/**
 * NetworkFirst Strategy
 * Attempts fresh fetch from network first; if offline or timeout, falls back to cache.
 * Recommended for real-time patient status, OPD queue data, and telemetry.
 */
export async function networkFirst(
  request: RequestInfo | URL,
  options: CacheStrategyOptions = {}
): Promise<Response> {
  const cacheName = options.cacheName || CACHE_VERSIONS.DYNAMIC_API;
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.info('[ServiceWorker] Network unreachable, retrieving from offline cache.');
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (options.fallbackUrl) {
      const fallback = await cache.match(options.fallbackUrl);
      if (fallback) return fallback;
    }

    // Default offline response for API routes
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'Device currently operating offline. Local records stored in IndexedDB.',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * StaleWhileRevalidate Strategy
 * Returns cached asset immediately for high-speed UI render, while fetching fresh version in background.
 * Recommended for app shell, navigation views, and UI templates.
 */
export async function staleWhileRevalidate(
  request: RequestInfo | URL,
  options: CacheStrategyOptions = {}
): Promise<Response> {
  const cacheName = options.cacheName || CACHE_VERSIONS.APP_SHELL;
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((err) => {
      console.debug('[ServiceWorker] StaleWhileRevalidate background revalidation failed:', err);
      return cachedResponse;
    });

  return cachedResponse || (fetchPromise as Promise<Response>);
}

// ============================================================================
// CACHE MANAGEMENT & PREWARMING
// ============================================================================

/**
 * Pre-caches the core application shell assets into the local CacheStorage.
 */
export async function precacheCoreAssets(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(CACHE_VERSIONS.APP_SHELL);
    await Promise.all(
      CORE_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.debug(`[ServiceWorker] Core asset prewarm notice for ${url}:`, err);
        }
      })
    );
    console.log('[ServiceWorker] Core app assets precached successfully for offline use.');
  } catch (err) {
    console.warn('[ServiceWorker] Core asset pre-caching encountered an issue:', err);
  }
}

/**
 * Clears old cache versions to free client storage space.
 */
export async function cleanOldCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  const validCaches = new Set(Object.values(CACHE_VERSIONS));
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames.map((name) => {
      if (!validCaches.has(name as any)) {
        console.log('[ServiceWorker] Deleting obsolete cache storage:', name);
        return caches.delete(name);
      }
      return Promise.resolve(true);
    })
  );
}

/**
 * Purges all Saathi Care caches completely (useful on master data reset).
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[ServiceWorker] All offline caches successfully cleared.');
}

// ============================================================================
// SERVICE WORKER REGISTRATION & LIFECYCLE
// ============================================================================

export interface ServiceWorkerHooks {
  onInstalled?: () => void;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}

/**
 * Registers the Service Worker and sets up lifecycle event listeners.
 */
export async function registerServiceWorker(
  hooks: ServiceWorkerHooks = {}
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.info('[ServiceWorker] ServiceWorker API is not supported in this runtime environment.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            console.log('[ServiceWorker] New content available. Ready for user activation.');
            hooks.onUpdateAvailable?.(registration);
          } else {
            console.log('[ServiceWorker] Saathi Care application is now cached and ready for offline use.');
            hooks.onOfflineReady?.();
          }
          hooks.onInstalled?.();
        }
      });
    });

    // Listen for controller changes (when skipWaiting is called)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[ServiceWorker] Active controller changed.');
      }
    });

    // Precache core assets in the background
    precacheCoreAssets().catch((err) => console.debug('[ServiceWorker] Background precache notice:', err));

    // Register Background Sync if supported
    setupBackgroundSync(registration);

    return registration;
  } catch (error) {
    console.warn('[ServiceWorker] Registration error (common in sandboxed preview iframes):', error);
    return null;
  }
}

/**
 * Tells the waiting Service Worker to activate immediately.
 */
export function promptServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Unregisters the Service Worker.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    return await registration.unregister();
  }
  return false;
}

// ============================================================================
// BACKGROUND SYNC COORDINATOR
// ============================================================================

/**
 * Sets up background synchronization triggers via the SyncManager API
 * or fallback window connectivity events.
 */
export function setupBackgroundSync(registration?: ServiceWorkerRegistration | null): void {
  if (typeof window === 'undefined') return;

  // 1. Native SyncManager (Chrome / Edge / Android Webview)
  if (registration && 'sync' in registration) {
    try {
      // @ts-ignore - sync is in background sync spec
      registration.sync.register('saathi-sync-records').catch((err: any) => {
        console.debug('[ServiceWorker] Background sync registration notice:', err);
      });
    } catch (e) {
      // Fallback gracefully
    }
  }

  // 2. Global online listener fallback
  window.addEventListener('online', () => {
    console.info('[ServiceWorker] Network re-established. Broadcasting sync event...');
    window.dispatchEvent(new CustomEvent('saathi:online-sync', { detail: { timestamp: new Date().toISOString() } }));

    // Also notify active service worker if running
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SYNC_DATA_NOW' });
    }
  });

  window.addEventListener('offline', () => {
    console.warn('[ServiceWorker] Device has entered offline state. IndexedDB persistence active.');
  });
}
