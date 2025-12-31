import webpush from 'web-push';

let webPushInitialized = false;
let webPushVapidPublicKey: string | undefined;

export function getWebPushVapidPublicKey(): string | undefined {
  return webPushVapidPublicKey;
}

export function initWebPush(): boolean {
  if (webPushInitialized) {
    return true;
  }

  // Use dedicated WEBPUSH_VAPID_PUBLIC_KEY for iOS Web Push (separate from Firebase VAPID)
  const vapidPublicKey = process.env.WEBPUSH_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@statfyr.com';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('[WebPush] VAPID keys not configured - iOS push notifications disabled');
    return false;
  }

  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    webPushVapidPublicKey = vapidPublicKey;
    webPushInitialized = true;
    console.log('[WebPush] Initialized successfully with VAPID keys');
    return true;
  } catch (error) {
    console.error('[WebPush] Failed to initialize:', error);
    return false;
  }
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendWebPushNotification(
  subscription: WebPushSubscription,
  title: string,
  body: string,
  data?: Record<string, string>,
  link?: string
): Promise<{ success: boolean; invalidSubscription: boolean }> {
  if (!webPushInitialized) {
    if (!initWebPush()) {
      console.log('[WebPush] Not initialized, cannot send');
      return { success: false, invalidSubscription: false };
    }
  }

  // Format payload to match what the service worker expects
  const payload = JSON.stringify({
    notification: {
      title,
      body,
      icon: '/logo.png',
      badge: '/logo.png',
    },
    data: {
      ...data,
      url: link || '/',
    },
  });

  try {
    console.log('[WebPush] Sending to endpoint:', subscription.endpoint.substring(0, 50) + '...');
    await webpush.sendNotification(subscription, payload);
    console.log('[WebPush] Notification sent successfully');
    return { success: true, invalidSubscription: false };
  } catch (error: any) {
    console.error('[WebPush] Error sending notification:', error.statusCode, error.body);
    
    const isInvalid = error.statusCode === 404 || error.statusCode === 410;
    return { success: false, invalidSubscription: isInvalid };
  }
}

export async function sendWebPushToMany(
  subscriptions: WebPushSubscription[],
  title: string,
  body: string,
  data?: Record<string, string>,
  link?: string
): Promise<{ successCount: number; failureCount: number; invalidSubscriptions: WebPushSubscription[] }> {
  const results = await Promise.all(
    subscriptions.map(sub => sendWebPushNotification(sub, title, body, data, link))
  );

  const invalidSubscriptions: WebPushSubscription[] = [];
  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, idx) => {
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      if (result.invalidSubscription) {
        invalidSubscriptions.push(subscriptions[idx]);
      }
    }
  });

  console.log('[WebPush] Batch result - Success:', successCount, 'Failure:', failureCount, 'Invalid:', invalidSubscriptions.length);
  return { successCount, failureCount, invalidSubscriptions };
}
