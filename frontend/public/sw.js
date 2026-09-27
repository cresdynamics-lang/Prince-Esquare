/* Prince Esquire — device cache service worker
 * Isolates image/static caching from API traffic so catalogue search,
 * contact, and checkout always hit the network (or their own axios cache).
 */
const STATIC_CACHE = 'pe-static-v2';
const IMAGE_CACHE = 'pe-images-v2';
const STATIC_ASSETS = ['/', '/index.html', '/LOGO.jpeg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== IMAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isImageRequest(url, request) {
  if (request.destination === 'image') return true;
  if (url.hostname.includes('res.cloudinary.com')) return true;
  return /\.(webp|jpe?g|png|gif|svg|avif)(\?|$)/i.test(url.pathname);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    try {
      cache.put(request, res.clone());
    } catch {
      /* opaque / quota */
    }
  }
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) {
        try {
          cache.put(request, res.clone());
        } catch {
          /* ignore */
        }
      }
      return res;
    })
    .catch(() => hit);
  return hit || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never intercept API — search / contact / DB traffic stay independent
  if (isApiRequest(url)) return;

  if (isImageRequest(url, request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});
