import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      messaging = getMessaging(app);
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

async function registerFirebaseServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
    }
    
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            newWorker.postMessage({
              type: 'FIREBASE_CONFIG',
              config: firebaseConfig,
            });
          }
        });
      }
    });
    
    return registration;
  } catch (error) {
    console.error('Firebase SW registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (!messaging) {
    console.log('Firebase messaging not available');
    return null;
  }

  try {
    await registerFirebaseServiceWorker();
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      const swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      
      const token = await getToken(messaging, { 
        vapidKey,
        serviceWorkerRegistration: swRegistration 
      });
      console.log('FCM Token obtained');
      
      await fetch('/api/fcm-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token,
          deviceInfo: navigator.userAgent,
        }),
      });
      
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

export { messaging, firebaseConfig };
