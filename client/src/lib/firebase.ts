import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';

// Platform detection helpers
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

export function getPushNotificationStatus(): { 
  supported: boolean; 
  reason?: string; 
  instructions?: string;
} {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Not in browser environment' };
  }

  // Check if Notification API exists
  if (!('Notification' in window)) {
    if (isIOS()) {
      return { 
        supported: false, 
        reason: 'iOS requires this app to be installed',
        instructions: 'Tap the Share button, then "Add to Home Screen". Open the app from your home screen to enable notifications.'
      };
    }
    return { supported: false, reason: 'Notifications are not supported in this browser' };
  }

  // iOS Safari in browser (not PWA)
  if (isIOS() && !isStandalonePWA()) {
    return { 
      supported: false, 
      reason: 'iOS requires this app to be installed',
      instructions: 'Tap the Share button, then "Add to Home Screen". Open the app from your home screen to enable notifications.'
    };
  }

  // Check service worker support
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'Service workers are not supported in this browser' };
  }

  return { supported: true };
}

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

export async function requestFollowerNotificationPermission(): Promise<{ token: string | null; error?: string; instructions?: string }> {
  // First check platform support
  const platformStatus = getPushNotificationStatus();
  if (!platformStatus.supported) {
    console.log('Platform does not support push:', platformStatus.reason);
    return { 
      token: null, 
      error: platformStatus.reason,
      instructions: platformStatus.instructions
    };
  }

  if (!messaging) {
    console.log('Firebase messaging not available');
    // Check if it's Safari which has limited FCM support
    if (isSafari() && !isIOS()) {
      return { 
        token: null, 
        error: 'Safari has limited notification support',
        instructions: 'For the best experience, try using Chrome, Firefox, or Edge browser.'
      };
    }
    return { token: null, error: 'Push notifications are not available on this device' };
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
      console.log('FCM Token obtained for follower');
      
      return { token };
    } else if (permission === 'denied') {
      console.log('Notification permission denied');
      if (isIOS()) {
        return { 
          token: null, 
          error: 'Notifications are blocked',
          instructions: 'Go to Settings > Notifications > find this app and enable notifications.'
        };
      }
      return { 
        token: null, 
        error: 'Notifications are blocked',
        instructions: 'Click the lock icon in your browser address bar and enable notifications for this site.'
      };
    } else {
      console.log('Notification permission dismissed');
      return { token: null, error: 'Please allow notifications when prompted to follow this athlete' };
    }
  } catch (error: any) {
    console.error('Error getting FCM token:', error);
    return { token: null, error: error.message || 'Failed to set up notifications' };
  }
}

export { messaging, firebaseConfig };
