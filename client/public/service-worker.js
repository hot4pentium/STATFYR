const CACHE_VERSION = 'statfyr-v1.0.9';
const SHELL_CACHE = 'statfyr-shell';
const FORCE_REFRESH_VERSIONS = ['statfyr-v1.0.9'];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      
      if (FORCE_REFRESH_VERSIONS.includes(CACHE_VERSION)) {
        console.log('[SW] Force refresh version - clearing and recaching');
        await caches.delete(SHELL_CACHE);
        const newCache = await caches.open(SHELL_CACHE);
        await newCache.addAll(['/', '/index.html']);
      } else {
        const existingResponse = await cache.match('/index.html');
        if (!existingResponse) {
          console.log('[SW] First install - caching index.html');
          await cache.addAll(['/', '/index.html']);
        } else {
          console.log('[SW] Existing cache found - preserving old index.html');
        }
      }
    })()
  );
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
      caches.open(SHELL_CACHE).then(cache => {
        return cache.match('/index.html').then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put('/index.html', networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|png|jpg|jpeg|svg|ico|webp)$/)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(shellCache => {
        return shellCache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            fetch(event.request).then(networkResponse => {
              if (networkResponse.ok) {
                shellCache.put(event.request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }
          
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              shellCache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return caches.match(event.request);
          });
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

async function extractAndCacheAssets(htmlText, cache) {
  const assetUrls = [];
  
  const scriptMatches = htmlText.matchAll(/<script[^>]+src="([^"]+)"/g);
  for (const match of scriptMatches) {
    if (match[1] && !match[1].startsWith('http')) {
      assetUrls.push(match[1]);
    }
  }
  
  const linkMatches = htmlText.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g);
  for (const match of linkMatches) {
    if (match[1] && !match[1].startsWith('http')) {
      assetUrls.push(match[1]);
    }
  }
  
  const modulePreloadMatches = htmlText.matchAll(/<link[^>]+href="([^"]+\.js[^"]*)"/g);
  for (const match of modulePreloadMatches) {
    if (match[1] && !match[1].startsWith('http')) {
      assetUrls.push(match[1]);
    }
  }
  
  console.log('[SW] Precaching', assetUrls.length, 'assets');
  
  const fetchPromises = assetUrls.map(async url => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Cached:', url);
      }
    } catch (err) {
      console.log('[SW] Failed to cache:', url);
    }
  });
  
  await Promise.all(fetchPromises);
}

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  if (event.data === 'CHECK_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  }
  if (event.data === 'REFRESH_CACHE') {
    console.log('[SW] Refreshing cache with new assets');
    (async () => {
      try {
        const response = await fetch('/index.html');
        if (response.ok) {
          const htmlText = await response.clone().text();
          const cache = await caches.open(SHELL_CACHE);
          
          await extractAndCacheAssets(htmlText, cache);
          
          await cache.put('/index.html', response);
          console.log('[SW] Cache refresh complete');
          
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'CACHE_REFRESHED' });
            });
          });
        }
      } catch (err) {
        console.error('[SW] Cache refresh failed:', err);
      }
    })();
  }
});
