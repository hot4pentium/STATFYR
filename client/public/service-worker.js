const CACHE_VERSION = 'teampulse-v1.0.2';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_VERSION)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;
  
  // For navigation requests (HTML pages), always serve index.html for SPA routing
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch('/index.html')
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then(cache => {
              cache.put('/index.html', responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // For other assets, use network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
