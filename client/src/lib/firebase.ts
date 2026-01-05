import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  type User as FirebaseUser
} from 'firebase/auth';

// Platform detection helpers
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return /android/i.test(userAgent);
}

export function isChrome(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return /chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent);
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

export function getFirebaseConfigStatus(): { configured: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];
  if (!firebaseConfig.apiKey) missingKeys.push('API_KEY');
  if (!firebaseConfig.projectId) missingKeys.push('PROJECT_ID');
  if (!firebaseConfig.messagingSenderId) missingKeys.push('MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missingKeys.push('APP_ID');
  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) missingKeys.push('VAPID_KEY');
  return { configured: missingKeys.length === 0, missingKeys };
}

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Explicitly set local persistence to keep users logged in across sessions
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('Failed to set auth persistence:', error);
    });
    if (typeof window !== 'undefined' && 'Notification' in window) {
      messaging = getMessaging(app);
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Auth providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Firebase Auth functions
export async function signInWithGoogle(): Promise<{ user: FirebaseUser | null; error?: string }> {
  if (!auth) {
    return { user: null, error: 'Firebase not configured' };
  }
  
  try {
    // Use redirect on mobile for better UX
    if (isIOS() || isAndroid()) {
      await signInWithRedirect(auth, googleProvider);
      return { user: null }; // Will redirect, result handled on return
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Sign in was cancelled' };
    }
    return { user: null, error: error.message || 'Failed to sign in with Google' };
  }
}

export async function signInWithApple(): Promise<{ user: FirebaseUser | null; error?: string }> {
  if (!auth) {
    return { user: null, error: 'Firebase not configured' };
  }
  
  try {
    // Use redirect on mobile for better UX
    if (isIOS() || isAndroid()) {
      await signInWithRedirect(auth, appleProvider);
      return { user: null }; // Will redirect, result handled on return
    }
    
    const result = await signInWithPopup(auth, appleProvider);
    return { user: result.user };
  } catch (error: any) {
    console.error('Apple sign-in error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Sign in was cancelled' };
    }
    return { user: null, error: error.message || 'Failed to sign in with Apple' };
  }
}

// Cache the redirect result promise to ensure it's only called once
let redirectResultPromise: Promise<{ user: FirebaseUser | null; error?: string }> | null = null;

export async function checkRedirectResult(): Promise<{ user: FirebaseUser | null; error?: string }> {
  if (!auth) {
    return { user: null };
  }
  
  // Return cached promise if already called (getRedirectResult can only be called once)
  if (redirectResultPromise) {
    return redirectResultPromise;
  }
  
  redirectResultPromise = (async () => {
    try {
      console.log('[Firebase] Checking redirect result...');
      const result = await getRedirectResult(auth!);
      if (result) {
        console.log('[Firebase] Redirect result found:', result.user?.email);
        return { user: result.user };
      }
      console.log('[Firebase] No redirect result');
      return { user: null };
    } catch (error: any) {
      console.error('Redirect result error:', error);
      return { user: null, error: error.message };
    }
  })();
  
  return redirectResultPromise;
}

export async function signOutFirebase(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

export function onFirebaseAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function getFirebaseAuth() {
  return auth;
}

export type { FirebaseUser };

async function registerFirebaseServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  
  try {
    // Check if already registered
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    
    if (!registration) {
      console.log('[FCM] Registering new service worker...');
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } else {
      console.log('[FCM] Service worker already registered');
    }
    
    // Wait for service worker to be ready
    if (registration.installing) {
      console.log('[FCM] Waiting for service worker to install...');
      await new Promise<void>((resolve) => {
        const worker = registration!.installing!;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            resolve();
          }
        });
      });
    }
    
    // Send config to active worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
    }
    
    return registration;
  } catch (error) {
    console.error('[FCM] SW registration failed:', error);
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

// Web Push subscription for iOS Safari PWA (FCM doesn't support iOS Safari)
// Uses a separate VAPID key from FCM - fetched from server
async function requestWebPushSubscription(): Promise<{ subscription: PushSubscription | null; error?: string; instructions?: string }> {
  console.log('[WebPush] Requesting Web Push subscription for iOS...');
  
  try {
    // Register service worker if not already registered
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      console.log('[WebPush] Registering service worker...');
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
    }
    
    console.log('[WebPush] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('[WebPush] Permission result:', permission);
    
    if (permission !== 'granted') {
      if (permission === 'denied') {
        return { 
          subscription: null, 
          error: 'Notifications are blocked',
          instructions: 'Go to Settings > Notifications > find this app and enable notifications.'
        };
      }
      return { subscription: null, error: 'Please allow notifications when prompted to follow this athlete' };
    }
    
    // Fetch the Web Push VAPID public key from server (separate from Firebase VAPID key)
    const vapidResponse = await fetch('/api/webpush/vapid-public-key');
    if (!vapidResponse.ok) {
      console.error('[WebPush] Failed to fetch VAPID public key');
      return { subscription: null, error: 'Push notification configuration error.' };
    }
    const { publicKey: vapidKey } = await vapidResponse.json();
    
    if (!vapidKey) {
      console.error('[WebPush] VAPID key is missing from server!');
      return { subscription: null, error: 'Push notification configuration error.' };
    }
    
    // Convert VAPID key to Uint8Array
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };
    
    console.log('[WebPush] Subscribing to push with server VAPID key...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    
    console.log('[WebPush] Subscription obtained:', !!subscription);
    return { subscription };
  } catch (error: any) {
    console.error('[WebPush] Error:', error);
    return { subscription: null, error: error.message || 'Failed to set up notifications' };
  }
}

export async function requestFollowerNotificationPermission(): Promise<{ token: string | null; subscription?: PushSubscription; error?: string; instructions?: string }> {
  // Debug: Log Firebase config status
  console.log('[Push Debug] Check:', {
    apiKey: !!firebaseConfig.apiKey,
    projectId: !!firebaseConfig.projectId,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId,
    messagingInitialized: !!messaging,
    isStandalone: isStandalonePWA(),
    isIOSDevice: isIOS(),
    isSafariDevice: isSafari()
  });
  
  // iOS requires PWA mode
  if (isIOS() && !isStandalonePWA()) {
    console.log('[Push Debug] iOS user not in standalone mode');
    return { 
      token: null, 
      error: 'iOS requires this app to be installed',
      instructions: 'Tap the Share button at the bottom of Safari, then "Add to Home Screen". Open the app from your home screen to enable notifications.'
    };
  }
  
  // For iOS Safari PWA, use native Web Push API (FCM doesn't support iOS)
  if (isIOS() && isStandalonePWA()) {
    console.log('[Push Debug] iOS PWA detected, using native Web Push API');
    const result = await requestWebPushSubscription();
    if (result.subscription) {
      return { token: null, subscription: result.subscription };
    }
    return { token: null, error: result.error, instructions: result.instructions };
  }
  
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
    console.log('[FCM Debug] Config values present:', {
      apiKey: !!firebaseConfig.apiKey,
      projectId: !!firebaseConfig.projectId
    });
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
    console.log('[FCM] Registering service worker...');
    await registerFirebaseServiceWorker();
    
    console.log('[FCM] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('[FCM] Permission result:', permission);
    
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      console.log('[FCM] VAPID key present:', !!vapidKey);
      
      if (!vapidKey) {
        console.error('[FCM] VAPID key is missing!');
        return { token: null, error: 'Push notification configuration error. Please contact support.' };
      }
      
      const swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      console.log('[FCM] Service worker registration:', !!swRegistration);
      
      if (!swRegistration) {
        console.error('[FCM] Service worker not registered!');
        return { token: null, error: 'Failed to register notification service. Please refresh and try again.' };
      }
      
      console.log('[FCM] Getting token...');
      const token = await getToken(messaging, { 
        vapidKey,
        serviceWorkerRegistration: swRegistration 
      });
      console.log('[FCM] Token obtained:', !!token);
      
      if (!token) {
        return { token: null, error: 'Failed to get notification token. Please try again.' };
      }
      
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

// Function to refresh FCM token for existing followers (call on app open)
export async function refreshFCMToken(athleteId: string, oldToken: string): Promise<string | null> {
  if (!messaging) {
    console.log('[FCM Refresh] Messaging not available');
    return oldToken; // Keep existing token
  }
  
  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.log('[FCM Refresh] VAPID key missing');
      return oldToken; // Keep existing token
    }
    
    const swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!swRegistration) {
      console.log('[FCM Refresh] Service worker not registered');
      return oldToken; // Keep existing token
    }
    
    console.log('[FCM Refresh] Getting fresh token...');
    const newToken = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: swRegistration 
    });
    
    if (!newToken) {
      console.log('[FCM Refresh] Failed to get new token');
      return oldToken; // Keep existing token
    }
    
    // If token changed, update it on the server
    if (newToken !== oldToken) {
      console.log('[FCM Refresh] Token changed, updating on server...');
      const res = await fetch(`/api/athletes/${athleteId}/followers/update-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldToken, newToken }),
      });
      
      if (!res.ok) {
        console.log('[FCM Refresh] Failed to update token on server, keeping old token');
        return oldToken; // Keep existing token on failure
      }
      
      console.log('[FCM Refresh] Token updated successfully');
      return newToken;
    }
    
    console.log('[FCM Refresh] Token unchanged');
    return newToken;
  } catch (error) {
    console.error('[FCM Refresh] Error:', error);
    return oldToken; // Keep existing token on error
  }
}

export { messaging, firebaseConfig };
