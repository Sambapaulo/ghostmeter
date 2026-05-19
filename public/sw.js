self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name));
  });
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});