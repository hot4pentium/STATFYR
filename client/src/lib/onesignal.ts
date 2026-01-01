const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

let initialized = false;
let OneSignal: any = null;

// Store pending deep link from notification click
let pendingDeepLink: { athleteId: string; hypePostId: string } | null = null;

// Navigation callback for handling notification clicks
let navigationCallback: ((path: string) => void) | null = null;

export function setNavigationCallback(callback: (path: string) => void) {
  navigationCallback = callback;
  // If there's a pending deep link, navigate immediately
  if (pendingDeepLink) {
    const path = `/share/athlete/${pendingDeepLink.athleteId}/post/${pendingDeepLink.hypePostId}`;
    console.log('[OneSignal] Navigating to pending deep link:', path);
    callback(path);
    pendingDeepLink = null;
  }
}

export function getPendingDeepLink(): { athleteId: string; hypePostId: string } | null {
  const link = pendingDeepLink;
  pendingDeepLink = null;
  return link;
}

export function clearPendingDeepLink() {
  pendingDeepLink = null;
}

// Dynamically load OneSignal to prevent crashes on unsupported browsers
async function loadOneSignal() {
  if (OneSignal) return OneSignal;
  try {
    const module = await import('react-onesignal');
    OneSignal = module.default;
    return OneSignal;
  } catch (e) {
    console.warn('[OneSignal] Failed to load SDK:', e);
    return null;
  }
}

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

  if (isIOS() && !isStandalonePWA()) {
    return { 
      supported: false, 
      reason: 'iOS requires this app to be installed',
      instructions: 'Tap the Share button, then "Add to Home Screen". Open the app from your home screen to enable notifications.'
    };
  }

  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'Service workers are not supported in this browser' };
  }

  return { supported: true };
}

export async function initOneSignal(): Promise<boolean> {
  if (initialized) return true;
  if (typeof window === 'undefined') return false;
  
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] App ID not configured');
    return false;
  }

  try {
    const sdk = await loadOneSignal();
    if (!sdk) return false;
    
    await sdk.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      autoPrompt: false,
      promptOptions: {
        slidedown: {
          enabled: false,
          autoPrompt: false,
        },
      },
    });
    
    // Add notification click handler to capture deep link data
    sdk.Notifications.addEventListener('click', (event: any) => {
      console.log('[OneSignal] Notification clicked:', event);
      const data = event?.notification?.additionalData || event?.result?.additionalData || {};
      console.log('[OneSignal] Notification data:', data);
      
      if (data.athleteId && data.hypePostId) {
        const path = `/share/athlete/${data.athleteId}/post/${data.hypePostId}`;
        console.log('[OneSignal] Deep link path:', path);
        
        if (navigationCallback) {
          // Navigate immediately if callback is set
          console.log('[OneSignal] Navigating via callback');
          navigationCallback(path);
        } else {
          // Store for later if app hasn't set callback yet
          console.log('[OneSignal] Storing pending deep link');
          pendingDeepLink = { athleteId: data.athleteId, hypePostId: data.hypePostId };
        }
      }
    });
    
    initialized = true;
    console.log('[OneSignal] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[OneSignal] Initialization error:', error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  playerId?: string;
  error?: string;
  instructions?: string;
}> {
  const status = getPushNotificationStatus();
  if (!status.supported) {
    return { 
      granted: false, 
      error: status.reason,
      instructions: status.instructions 
    };
  }

  try {
    const initSuccess = await initOneSignal();
    if (!initSuccess) {
      return { granted: false, error: 'Failed to initialize notifications' };
    }
    
    const sdk = await loadOneSignal();
    if (!sdk) {
      return { granted: false, error: 'Notifications not available' };
    }
    
    const permission = await sdk.Notifications.requestPermission();
    
    if (!permission) {
      return { granted: false, error: 'Notification permission denied' };
    }

    const playerId = await sdk.User.PushSubscription.id;
    
    if (!playerId) {
      return { granted: false, error: 'Failed to get subscription ID' };
    }

    console.log('[OneSignal] Got player ID:', playerId);
    return { granted: true, playerId };
  } catch (error: any) {
    console.error('[OneSignal] Permission request error:', error);
    return { granted: false, error: error.message || 'Failed to request notification permission' };
  }
}

export async function getPlayerId(): Promise<string | null> {
  try {
    await initOneSignal();
    const sdk = await loadOneSignal();
    if (!sdk) return null;
    return await sdk.User.PushSubscription.id || null;
  } catch {
    return null;
  }
}

export async function setExternalUserId(userId: string): Promise<void> {
  try {
    await initOneSignal();
    const sdk = await loadOneSignal();
    if (!sdk) return;
    await sdk.login(userId);
    console.log('[OneSignal] External user ID set:', userId);
  } catch (error) {
    console.error('[OneSignal] Failed to set external user ID:', error);
  }
}

export async function addTags(tags: Record<string, string>): Promise<void> {
  try {
    await initOneSignal();
    const sdk = await loadOneSignal();
    if (!sdk) return;
    await sdk.User.addTags(tags);
    console.log('[OneSignal] Tags added:', tags);
  } catch (error) {
    console.error('[OneSignal] Failed to add tags:', error);
  }
}

export async function removeExternalUserId(): Promise<void> {
  try {
    await initOneSignal();
    const sdk = await loadOneSignal();
    if (!sdk) return;
    await sdk.logout();
    console.log('[OneSignal] Logged out');
  } catch (error) {
    console.error('[OneSignal] Failed to logout:', error);
  }
}
