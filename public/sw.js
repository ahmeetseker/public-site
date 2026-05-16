// arsam.net Service Worker (Faz 9.18 — Wave 12 / Agent-A56)
//
// Strategy:
//   - HTML navigations  → network-first (fall back to cache when offline)
//   - Static assets     → stale-while-revalidate (cache + background refresh)
//   - Cross-origin      → bypass (we don't proxy third-party scripts)
//
// CACHE bumps with every shipped change to the SW itself.
// Old caches are deleted on `activate`.

const CACHE = 'arsam-v1';

// Minimum offline shell — kept tiny on purpose.
const PRECACHE_URLS = [
  '/',
  '/ara',
  '/yardim/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => {
        // Precache failure is non-fatal — runtime fetch handler still works.
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function isHTMLRequest(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached || caches.match('/')));
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET — POST/PUT/etc. always go to network untouched.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only. Third-party fetches bypass the SW.
  if (url.origin !== self.location.origin) return;

  if (isHTMLRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
