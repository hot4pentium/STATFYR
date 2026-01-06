const CACHE_VERSION = 'statfyr-v1.0.10';
const SHELL_CACHE = 'statfyr-shell';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            if (cacheName === SHELL_CACHE) return false;
            return cacheName.startsWith('statfyr-') && cacheName !== CACHE_VERSION;
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api/')) return;
  
  if (url.pathname.startsWith('/vite-hmr') || 
      url.pathname.startsWith('/@') || 
      url.pathname.startsWith('/node_modules/') ||
      url.pathname.startsWith('/src/')) return;
  
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(SHELL_CACHE).then(cache => {
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
  
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|png|jpg|jpeg|svg|ico|webp)$/)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(shellCache => {
        return shellCache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              shellCache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
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
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  if (event.data === 'CHECK_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  }
});
