// Custom notification click handler for iOS Safari PWA deep linking
// This runs BEFORE the OneSignal SDK handler to ensure proper navigation
self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  const rawData = notification.data || {};
  
  console.log('[SW] Notification clicked, raw data:', JSON.stringify(rawData));
  
  // OneSignal wraps custom data in additionalData, but also includes it at root level
  // Check multiple possible locations for our custom data
  const additionalData = rawData.additionalData || rawData.data || rawData || {};
  
  console.log('[SW] Extracted additionalData:', JSON.stringify(additionalData));
  
  if (additionalData.athleteId && additionalData.hypePostId) {
    const deepLinkPath = `/share/athlete/${additionalData.athleteId}/post/${additionalData.hypePostId}`;
    console.log('[SW] Deep link path:', deepLinkPath);
    
    // Close the notification
    notification.close();
    
    // Handle the navigation ourselves to ensure iOS Safari PWA works correctly
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Try to find an existing window/tab with the app
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          // Check if this client is on our domain
          if (client.url.includes('/share/athlete/') || client.url.includes(self.registration.scope)) {
            // Found an existing window - navigate it and focus
            console.log('[SW] Found existing client, navigating and focusing');
            return client.navigate(deepLinkPath).then(function(navigatedClient) {
              if (navigatedClient) {
                return navigatedClient.focus();
              }
            });
          }
        }
        
        // No existing window found - open a new one with the full deep link path
        console.log('[SW] No existing client, opening new window with deep link');
        const fullUrl = new URL(deepLinkPath, self.registration.scope).href;
        return clients.openWindow(fullUrl);
      })
    );
    
    // Prevent OneSignal's default handler from also trying to open a window
    event.stopImmediatePropagation();
  }
});

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
