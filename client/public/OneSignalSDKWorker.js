// Service Worker Version: 2.0 - Force update on iOS
// Custom notification click handler for iOS Safari PWA deep linking
// This runs BEFORE the OneSignal SDK handler to ensure proper navigation
self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  const rawData = notification.data || {};
  
  console.log('[SW] Notification clicked');
  console.log('[SW] Raw data keys:', Object.keys(rawData));
  console.log('[SW] Raw data:', JSON.stringify(rawData));
  
  // OneSignal wraps custom data in additionalData
  // Also check the url field which contains the deep link
  const additionalData = rawData.additionalData || {};
  const notificationUrl = rawData.url || rawData.launchURL || '';
  
  console.log('[SW] additionalData:', JSON.stringify(additionalData));
  console.log('[SW] Notification URL:', notificationUrl);
  
  // Method 1: Use additionalData if available
  if (additionalData.athleteId && additionalData.hypePostId) {
    const deepLinkPath = `/share/athlete/${additionalData.athleteId}/post/${additionalData.hypePostId}`;
    console.log('[SW] Using additionalData for deep link:', deepLinkPath);
    
    notification.close();
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.registration.scope)) {
            console.log('[SW] Navigating existing client to:', deepLinkPath);
            return client.navigate(deepLinkPath).then(function(navigatedClient) {
              if (navigatedClient) return navigatedClient.focus();
            });
          }
        }
        
        console.log('[SW] Opening new window with:', deepLinkPath);
        const fullUrl = new URL(deepLinkPath, self.registration.scope).href;
        return clients.openWindow(fullUrl);
      })
    );
    
    event.stopImmediatePropagation();
    return;
  }
  
  // Method 2: Fallback to URL if it contains a post ID
  if (notificationUrl && notificationUrl.includes('/post/')) {
    console.log('[SW] Using notification URL for deep link:', notificationUrl);
    
    notification.close();
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.registration.scope)) {
            console.log('[SW] Navigating existing client to URL');
            return client.navigate(notificationUrl).then(function(navigatedClient) {
              if (navigatedClient) return navigatedClient.focus();
            });
          }
        }
        
        console.log('[SW] Opening new window with URL');
        return clients.openWindow(notificationUrl);
      })
    );
    
    event.stopImmediatePropagation();
    return;
  }
  
  // Let OneSignal handle it if we don't have specific deep link data
  console.log('[SW] No deep link data found, letting OneSignal handle');
});

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
