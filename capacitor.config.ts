import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.statfyr.app",
  appName: "STATFYR",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    hostname: "statfyr.com",
    // For development: uncomment the line below and replace with your Replit URL
    url: "https://statfyr.replit.app",
  },
  plugins: {
    App: {
      iosScheme: "statfyr",
    },
    Camera: {
      permissions: true,
    },
    Haptics: {},
    Share: {},
    Preferences: {},
    Badge: {},
    KeepAwake: {},
    NativeBiometric: {
      useFallback: true,
      fallbackTitle: "Use Passcode",
      maxAttempts: 3,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#F97316",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
    },
  },
  ios: {
    contentInset: "always",
    scrollEnabled: true,
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#0a0a0f",
  },
  android: {
    backgroundColor: "#0a0a0f",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
