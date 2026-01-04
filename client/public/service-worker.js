const CACHE_VERSION = 'teampulse-v1.1.2';
const urlsToCache = [
  '/index.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
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
  
  // Skip API routes
  if (url.pathname.startsWith('/api/')) return;
  
  // Skip Vite HMR and dev resources
  if (url.pathname.startsWith('/vite-hmr') || 
      url.pathname.startsWith('/@') || 
      url.pathname.startsWith('/node_modules/') ||
      url.pathname.startsWith('/src/')) return;
  
  // For navigation requests (HTML pages), use network-first
  // In development, just pass through to the network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then(cache => {
              cache.put(event.request, responseClone);
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
        if (response.ok) {
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
