self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Basic pass-through to satisfy PWA installability requirements
  e.respondWith(
    fetch(e.request).catch(() => new Response('Vous êtes hors ligne.'))
  );
});
