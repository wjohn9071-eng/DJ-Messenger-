const CACHE_NAME = 'dj-messenger-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/sw.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Skip cross-origin requests and non-GET requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(e.request).then((response) => {
        // Cache new static assets
        if (response.ok && (e.request.url.endsWith('.js') || e.request.url.endsWith('.css') || e.request.url.endsWith('.svg'))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Hors ligne');
      });
    })
  );
});
