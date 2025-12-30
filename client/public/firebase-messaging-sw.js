importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let firebaseApp = null;
let messaging = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (config && config.apiKey) {
      firebaseApp = firebase.initializeApp(config);
      messaging = firebase.messaging();
      
      messaging.onBackgroundMessage((payload) => {
        console.log('Background message received:', payload);
        
        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: '/logo.png',
          badge: '/logo.png',
          data: { url: payload.fcm_options?.link || '/' }
        };
        
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});

self.addEventListener('notificationclick', (event) => {
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
  // Don't skip waiting - let the user control when the new SW takes over
});

self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Activated');
  // Don't claim clients aggressively - prevents potential reload issues
});
