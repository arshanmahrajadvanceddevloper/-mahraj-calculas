self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[Service Worker] Activate');
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Simple fetch handler to satisfy PWA installability requirements
  e.respondWith(
    fetch(e.request).catch(() => {
      return new Response('You are offline. Please reconnect to use the app.');
    })
  );
});
