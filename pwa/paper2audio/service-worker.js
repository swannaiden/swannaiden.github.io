/**
 * PDF to Audio - Service Worker
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'pdf-to-audio-v1';
const STATIC_CACHE = 'pdf-to-audio-static-v1';
const BASE_PATH = '/pwa/paper2audio';

// Static assets to cache
const STATIC_ASSETS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/styles.css`,
    `${BASE_PATH}/js/app.js`,
    `${BASE_PATH}/js/pdf-parser.js`,
    `${BASE_PATH}/js/tts.js`,
    `${BASE_PATH}/js/openrouter-api.js`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/icons/icon.svg`
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            // Cache external assets
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[SW] Caching external assets');
                return Promise.all(
                    EXTERNAL_ASSETS.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn(`[SW] Failed to cache: ${url}`, err);
                        })
                    )
                );
            })
        ]).then(() => {
            console.log('[SW] Installation complete');
            return self.skipWaiting();
        })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
                    .map((name) => {
                        console.log(`[SW] Deleting old cache: ${name}`);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Activation complete');
            return self.clients.claim();
        })
    );
});

/**
 * Fetch event - serve from cache or network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip API requests (Claude API)
    if (url.hostname === 'api.anthropic.com') {
        return;
    }

    // Handle different request types
    event.respondWith(handleFetch(request));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetch(request) {
    const url = new URL(request.url);

    // For static assets, use cache-first strategy
    if (isStaticAsset(url)) {
        return cacheFirst(request);
    }

    // For external CDN resources, use cache-first with network fallback
    if (isExternalCDN(url)) {
        return cacheFirst(request);
    }

    // For other requests, use network-first strategy
    return networkFirst(request);
}

/**
 * Cache-first strategy
 * Try cache first, then network
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);

        // Return offline fallback if available
        return caches.match(`${BASE_PATH}/index.html`);
    }
}

/**
 * Network-first strategy
 * Try network first, then cache
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);

        const cached = await caches.match(request);

        if (cached) {
            return cached;
        }

        // Return offline fallback
        return caches.match(`${BASE_PATH}/index.html`);
    }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
    const staticExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.svg', '.ico'];
    return url.origin === self.location.origin &&
        staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Check if URL is from an external CDN
 */
function isExternalCDN(url) {
    return url.hostname === 'cdnjs.cloudflare.com';
}

/**
 * Handle share target
 */
self.addEventListener('fetch', (event) => {
    if (event.request.method === 'POST' && event.request.url.includes('?')) {
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const file = formData.get('pdf');

                if (file) {
                    // Store the file in IndexedDB or handle it
                    const clients = await self.clients.matchAll();
                    for (const client of clients) {
                        client.postMessage({
                            type: 'SHARE_TARGET_FILE',
                            file: file
                        });
                    }
                }

                // Redirect to the main page
                return Response.redirect(`${BASE_PATH}/`, 303);
            })()
        );
    }
});

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-summaries') {
        event.waitUntil(syncPendingSummaries());
    }
});

/**
 * Sync pending summarization requests
 */
async function syncPendingSummaries() {
    // Implementation for syncing pending API requests when back online
    console.log('[SW] Syncing pending summaries...');
}
