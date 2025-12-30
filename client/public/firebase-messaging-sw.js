importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let firebaseApp = null;
let messaging = null;
let configLoaded = false;

async function initializeFirebase() {
  if (configLoaded) return;
  
  try {
    console.log('[FCM SW] Fetching Firebase config...');
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      console.error('[FCM SW] Failed to fetch config:', response.status);
      return;
    }
    
    const config = await response.json();
    console.log('[FCM SW] Config received, projectId:', config.projectId);
    
    if (config && config.apiKey) {
      firebaseApp = firebase.initializeApp(config);
      messaging = firebase.messaging();
      configLoaded = true;
      console.log('[FCM SW] Firebase initialized successfully');
      
      messaging.onBackgroundMessage((payload) => {
        console.log('[FCM SW] Background message received:', payload);
        
        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'fyr-notification',
          renotify: true,
          requireInteraction: true,
          data: { url: payload.fcmOptions?.link || payload.data?.url || '/' }
        };
        
        console.log('[FCM SW] Showing notification:', notificationTitle);
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    } else {
      console.error('[FCM SW] Invalid config received');
    }
  } catch (error) {
    console.error('[FCM SW] Error initializing Firebase:', error);
  }
}

// Also support postMessage for backward compatibility
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (config && config.apiKey && !configLoaded) {
      console.log('[FCM SW] Received config via postMessage');
      firebaseApp = firebase.initializeApp(config);
      messaging = firebase.messaging();
      configLoaded = true;
      
      messaging.onBackgroundMessage((payload) => {
        console.log('[FCM SW] Background message received:', payload);
        
        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'fyr-notification',
          renotify: true,
          requireInteraction: true,
          data: { url: payload.fcmOptions?.link || payload.data?.url || '/' }
        };
        
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});

self.addEventListener('push', (event) => {
  console.log('[FCM SW] Push event received:', event);
  
  if (!event.data) {
    console.log('[FCM SW] No data in push event');
    return;
  }
  
  try {
    const payload = event.data.json();
    console.log('[FCM SW] Push payload:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'fyr-notification',
      renotify: true,
      requireInteraction: true,
      data: { url: payload.fcmOptions?.link || payload.data?.url || '/' }
    };
    
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('[FCM SW] Error processing push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('[FCM SW] Installing...');
  event.waitUntil(initializeFirebase());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Activated');
  event.waitUntil(
    Promise.all([
      initializeFirebase(),
      clients.claim()
    ])
  );
});
