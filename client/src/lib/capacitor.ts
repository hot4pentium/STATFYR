import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Preferences } from "@capacitor/preferences";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { Badge } from "@capawesome/capacitor-badge";
import { NativeBiometric, BiometryType } from "@capgo/capacitor-native-biometric";
import { Network, ConnectionStatus } from "@capacitor/network";
import { Keyboard, KeyboardStyle } from "@capacitor/keyboard";
import { App, AppState } from "@capacitor/app";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

export type NetworkConnectionType = "wifi" | "cellular" | "none" | "unknown";

export interface NetworkStatus {
  connected: boolean;
  connectionType: NetworkConnectionType;
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (isNative) {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType as NetworkConnectionType,
      };
    } catch (error) {
      console.error("Failed to get network status:", error);
      return { connected: navigator.onLine, connectionType: "unknown" };
    }
  }
  return { connected: navigator.onLine, connectionType: "unknown" };
}

export function addNetworkListener(callback: (status: NetworkStatus) => void): () => void {
  if (isNative) {
    const handler = Network.addListener("networkStatusChange", (status: ConnectionStatus) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType as NetworkConnectionType,
      });
    });
    
    return () => {
      handler.then(h => h.remove());
    };
  } else {
    const handleOnline = () => callback({ connected: true, connectionType: "unknown" });
    const handleOffline = () => callback({ connected: false, connectionType: "none" });
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }
}

export async function setupKeyboard(): Promise<void> {
  if (!isNative) return;
  
  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
    await Keyboard.setScroll({ isDisabled: true });
    
    if (platform === "ios") {
      await Keyboard.setStyle({ style: KeyboardStyle.Dark });
    }
    
    Keyboard.addListener("keyboardWillShow", (info) => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
        
        document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
      }
    });
    
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
    });
  } catch (error) {
    console.error("Failed to setup keyboard:", error);
  }
}

export function addKeyboardListeners(callbacks: {
  onShow?: (height: number) => void;
  onHide?: () => void;
  onWillShow?: (height: number) => void;
  onWillHide?: () => void;
}): () => void {
  if (!isNative) {
    return () => {};
  }
  
  const listeners: Promise<{ remove: () => void }>[] = [];
  
  if (callbacks.onShow) {
    listeners.push(
      Keyboard.addListener("keyboardDidShow", (info) => {
        callbacks.onShow?.(info.keyboardHeight);
      })
    );
  }
  
  if (callbacks.onHide) {
    listeners.push(
      Keyboard.addListener("keyboardDidHide", () => {
        callbacks.onHide?.();
      })
    );
  }
  
  if (callbacks.onWillShow) {
    listeners.push(
      Keyboard.addListener("keyboardWillShow", (info) => {
        callbacks.onWillShow?.(info.keyboardHeight);
      })
    );
  }
  
  if (callbacks.onWillHide) {
    listeners.push(
      Keyboard.addListener("keyboardWillHide", () => {
        callbacks.onWillHide?.();
      })
    );
  }
  
  return () => {
    listeners.forEach(listener => {
      listener.then(l => l.remove());
    });
  };
}

export async function hideKeyboard(): Promise<void> {
  if (!isNative) return;
  try {
    await Keyboard.hide();
  } catch (error) {
    console.error("Failed to hide keyboard:", error);
  }
}

export type AppStateType = "active" | "inactive" | "background";

export function addAppStateListener(callback: (state: AppStateType) => void): () => void {
  if (!isNative) {
    const handleVisibility = () => {
      callback(document.visibilityState === "visible" ? "active" : "background");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }
  
  const handler = App.addListener("appStateChange", (state: AppState) => {
    callback(state.isActive ? "active" : "background");
  });
  
  return () => {
    handler.then(h => h.remove());
  };
}

export function addAppUrlOpenListener(callback: (url: string) => void): () => void {
  if (!isNative) return () => {};
  
  const handler = App.addListener("appUrlOpen", (data) => {
    callback(data.url);
  });
  
  return () => {
    handler.then(h => h.remove());
  };
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof window === "undefined" || !window.getComputedStyle) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue("--sat") || "0", 10) || 
         parseInt(style.getPropertyValue("env(safe-area-inset-top)") || "0", 10),
    bottom: parseInt(style.getPropertyValue("--sab") || "0", 10) ||
            parseInt(style.getPropertyValue("env(safe-area-inset-bottom)") || "0", 10),
    left: parseInt(style.getPropertyValue("--sal") || "0", 10) ||
          parseInt(style.getPropertyValue("env(safe-area-inset-left)") || "0", 10),
    right: parseInt(style.getPropertyValue("--sar") || "0", 10) ||
           parseInt(style.getPropertyValue("env(safe-area-inset-right)") || "0", 10),
  };
}

export interface ShareHypeCardOptions {
  athleteName: string;
  teamName: string;
  hypeScore?: number;
  shareUrl: string;
  imageUrl?: string;
}

export async function shareHypeCard(options: ShareHypeCardOptions): Promise<boolean> {
  const { athleteName, teamName, hypeScore, shareUrl, imageUrl } = options;
  
  const title = `${athleteName} - HYPE Card`;
  const text = hypeScore 
    ? `Check out ${athleteName}'s HYPE Card from ${teamName}! HYPE Score: ${hypeScore}`
    : `Check out ${athleteName}'s HYPE Card from ${teamName}!`;

  if (isNative) {
    try {
      const canShare = await Share.canShare();
      if (!canShare.value) {
        fallbackWebShare(title, text, shareUrl);
        return false;
      }
      
      await Share.share({
        title,
        text,
        url: shareUrl,
        dialogTitle: `Share ${athleteName}'s HYPE Card`,
      });
      
      await hapticSuccess();
      return true;
    } catch (error) {
      console.error("Native share failed:", error);
      fallbackWebShare(title, text, shareUrl);
      return false;
    }
  } else {
    return fallbackWebShare(title, text, shareUrl);
  }
}

export interface ShareHighlightOptions {
  athleteName: string;
  highlightTitle?: string;
  shareUrl: string;
}

export async function shareHighlight(options: ShareHighlightOptions): Promise<boolean> {
  const { athleteName, highlightTitle, shareUrl } = options;
  
  const title = highlightTitle || `${athleteName}'s Highlight`;
  const text = `Watch ${athleteName}'s highlight!`;

  if (isNative) {
    try {
      await Share.share({
        title,
        text,
        url: shareUrl,
        dialogTitle: `Share Highlight`,
      });
      await hapticSuccess();
      return true;
    } catch (error) {
      console.error("Native share failed:", error);
      return fallbackWebShare(title, text, shareUrl);
    }
  } else {
    return fallbackWebShare(title, text, shareUrl);
  }
}

async function fallbackWebShare(title: string, text: string, url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      console.log("Web share canceled:", err);
      return false;
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      console.log("URL copied to clipboard");
      return true;
    } catch {
      console.error("Failed to copy URL");
      return false;
    }
  }
}

export async function takePhoto(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      promptLabelHeader: "Profile Photo",
      promptLabelPhoto: "Choose from Gallery",
      promptLabelPicture: "Take Photo",
    });
    
    return image.dataUrl || null;
  } catch (error) {
    console.error("Camera error:", error);
    return null;
  }
}

export async function pickFromGallery(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    
    return image.dataUrl || null;
  } catch (error) {
    console.error("Gallery picker error:", error);
    return null;
  }
}

const CACHE_PREFIX = "statfyr_cache_";
const CACHE_TTL = 1000 * 60 * 60 * 24;

export async function cacheData(key: string, data: any, ttl: number = CACHE_TTL): Promise<void> {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await Preferences.set({
      key: `${CACHE_PREFIX}${key}`,
      value: JSON.stringify(cacheItem),
    });
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const { value } = await Preferences.get({ key: `${CACHE_PREFIX}${key}` });
    if (!value) return null;
    
    const cacheItem = JSON.parse(value);
    const age = Date.now() - cacheItem.timestamp;
    
    if (age > cacheItem.ttl) {
      await Preferences.remove({ key: `${CACHE_PREFIX}${key}` });
      return null;
    }
    
    return cacheItem.data as T;
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const { keys } = await Preferences.keys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    for (const key of cacheKeys) {
      await Preferences.remove({ key });
    }
  } catch (error) {
    console.error("Cache clear error:", error);
  }
}

export async function hapticTap(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error("Haptic error:", error);
    }
  }
}

export async function hapticSuccess(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.error("Haptic error:", error);
    }
  }
}

export async function hapticWarning(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.error("Haptic error:", error);
    }
  }
}

export async function hapticError(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.error("Haptic error:", error);
    }
  }
}

let isKeepAwakeEnabled = false;

export async function enableKeepAwake(): Promise<void> {
  if (isNative && !isKeepAwakeEnabled) {
    try {
      await KeepAwake.keepAwake();
      isKeepAwakeEnabled = true;
    } catch (error) {
      console.error("Keep awake enable error:", error);
    }
  }
}

export async function disableKeepAwake(): Promise<void> {
  if (isNative && isKeepAwakeEnabled) {
    try {
      await KeepAwake.allowSleep();
      isKeepAwakeEnabled = false;
    } catch (error) {
      console.error("Keep awake disable error:", error);
    }
  }
}

export async function isKeptAwake(): Promise<boolean> {
  if (isNative) {
    try {
      const result = await KeepAwake.isKeptAwake();
      return result.isKeptAwake;
    } catch (error) {
      console.error("Keep awake check error:", error);
      return false;
    }
  }
  return false;
}

export async function setBadgeCount(count: number): Promise<void> {
  try {
    const permission = await Badge.checkPermissions();
    if (permission.display !== "granted") {
      const requested = await Badge.requestPermissions();
      if (requested.display !== "granted") {
        console.log("Badge permission not granted");
        return;
      }
    }
    
    if (count > 0) {
      await Badge.set({ count });
    } else {
      await Badge.clear();
    }
  } catch (error) {
    console.error("Badge error:", error);
  }
}

export async function clearBadge(): Promise<void> {
  try {
    await Badge.clear();
  } catch (error) {
    console.error("Badge clear error:", error);
  }
}

export async function getBadgeCount(): Promise<number> {
  try {
    const result = await Badge.get();
    return result.count;
  } catch (error) {
    console.error("Badge get error:", error);
    return 0;
  }
}

const PENDING_STATS_KEY = "statfyr_pending_stats";

interface PendingStat {
  id: string;
  athleteId: string;
  teamId: string;
  statName: string;
  statValue: number;
  timestamp: number;
  synced: boolean;
}

export async function queueStatForSync(stat: Omit<PendingStat, "id" | "synced">): Promise<void> {
  try {
    const { value } = await Preferences.get({ key: PENDING_STATS_KEY });
    const pendingStats: PendingStat[] = value ? JSON.parse(value) : [];
    
    pendingStats.push({
      ...stat,
      id: `stat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      synced: false,
    });
    
    await Preferences.set({
      key: PENDING_STATS_KEY,
      value: JSON.stringify(pendingStats),
    });
  } catch (error) {
    console.error("Queue stat error:", error);
  }
}

export async function getPendingStats(): Promise<PendingStat[]> {
  try {
    const { value } = await Preferences.get({ key: PENDING_STATS_KEY });
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error("Get pending stats error:", error);
    return [];
  }
}

export async function markStatsSynced(statIds: string[]): Promise<void> {
  try {
    const { value } = await Preferences.get({ key: PENDING_STATS_KEY });
    if (!value) return;
    
    const pendingStats: PendingStat[] = JSON.parse(value);
    const remaining = pendingStats.filter(s => !statIds.includes(s.id));
    
    await Preferences.set({
      key: PENDING_STATS_KEY,
      value: JSON.stringify(remaining),
    });
  } catch (error) {
    console.error("Mark stats synced error:", error);
  }
}

export async function syncPendingStats(syncFn: (stats: PendingStat[]) => Promise<string[]>): Promise<void> {
  try {
    const pendingStats = await getPendingStats();
    if (pendingStats.length === 0) return;
    
    const syncedIds = await syncFn(pendingStats);
    await markStatsSynced(syncedIds);
  } catch (error) {
    console.error("Sync pending stats error:", error);
  }
}

const BIOMETRIC_ENABLED_KEY = "statfyr_biometric_enabled";

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: "none" | "face" | "fingerprint" | "iris" | "unknown";
  isEnabled: boolean;
}

export async function checkBiometricAvailability(): Promise<BiometricStatus> {
  if (!isNative) {
    return { isAvailable: false, biometryType: "none", isEnabled: false };
  }

  try {
    const result = await NativeBiometric.isAvailable();
    const { value: enabledStr } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    const isEnabled = enabledStr === "true";
    
    let biometryType: BiometricStatus["biometryType"] = "unknown";
    switch (result.biometryType) {
      case BiometryType.FACE_ID:
      case BiometryType.FACE_AUTHENTICATION:
        biometryType = "face";
        break;
      case BiometryType.TOUCH_ID:
      case BiometryType.FINGERPRINT:
        biometryType = "fingerprint";
        break;
      case BiometryType.IRIS:
        biometryType = "iris";
        break;
      default:
        biometryType = result.isAvailable ? "unknown" : "none";
    }
    
    return {
      isAvailable: result.isAvailable,
      biometryType,
      isEnabled,
    };
  } catch (error) {
    console.error("Biometric availability check error:", error);
    return { isAvailable: false, biometryType: "none", isEnabled: false };
  }
}

export async function enableBiometricAuth(): Promise<boolean> {
  if (!isNative) return false;

  try {
    const available = await NativeBiometric.isAvailable();
    if (!available.isAvailable) return false;

    await NativeBiometric.verifyIdentity({
      reason: "Enable biometric login for STATFYR",
      title: "Enable Biometric Login",
      subtitle: "Use Face ID or fingerprint to log in faster",
    });

    await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: "true" });
    await hapticSuccess();
    return true;
  } catch (error) {
    console.error("Enable biometric error:", error);
    return false;
  }
}

export async function disableBiometricAuth(): Promise<void> {
  await Preferences.remove({ key: BIOMETRIC_ENABLED_KEY });
}

export async function authenticateWithBiometric(): Promise<boolean> {
  if (!isNative) return false;

  try {
    const { value: enabledStr } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    if (enabledStr !== "true") return false;

    const available = await NativeBiometric.isAvailable();
    if (!available.isAvailable) {
      await disableBiometricAuth();
      return false;
    }

    await NativeBiometric.verifyIdentity({
      reason: "Log in to STATFYR",
      title: "Welcome Back",
      subtitle: "Authenticate to continue",
    });

    await hapticSuccess();
    return true;
  } catch (error) {
    console.error("Biometric auth error:", error);
    await hapticError();
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
  return value === "true";
}
