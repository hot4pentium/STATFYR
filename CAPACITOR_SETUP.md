# STATFYR - Capacitor App Store Setup Guide

This guide walks you through building STATFYR for iOS and Android app stores.

## Prerequisites

- **macOS** with Xcode 15+ (for iOS)
- **Android Studio** (for Android)
- **Apple Developer Account** ($99/year for iOS)
- **Google Play Developer Account** ($25 one-time for Android)

## Step 1: Clone/Download to Your Mac

Download this project to your local Mac machine.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build the Web App

```bash
npm run build
```

## Step 4: Add Native Platforms

### iOS
```bash
npx cap add ios
npx cap sync ios
```

### Android
```bash
npx cap add android
npx cap sync android
```

## Step 5: Generate App Icons & Splash Screens

Replace the placeholder SVGs in the `/assets` folder with your final designs:
- `icon.svg` or `icon.png` (1024x1024 minimum)
- `splash.svg` or `splash.png` (2732x2732 recommended)

Then run:
```bash
npx capacitor-assets generate
```

This generates all required icon sizes for iOS and Android.

## Step 6: Open in Native IDE

### iOS (Xcode)
```bash
npx cap open ios
```

In Xcode:
1. Select your Team in **Signing & Capabilities**
2. Update **Bundle Identifier** if needed (currently `com.statfyr.app`)
3. Set **Version** and **Build** numbers
4. Product > Archive > Distribute App

### Android (Android Studio)
```bash
npx cap open android
```

In Android Studio:
1. Update `applicationId` in `android/app/build.gradle` if needed
2. Set `versionCode` and `versionName`
3. Build > Generate Signed Bundle/APK

## Step 7: App Store Submission

### iOS - App Store Connect
1. Create app at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Upload screenshots (all required device sizes)
3. Fill in app description, keywords, categories
4. Add privacy policy URL
5. Submit for review

### Android - Google Play Console
1. Create app at [play.google.com/console](https://play.google.com/console)
2. Upload AAB (Android App Bundle)
3. Complete store listing with screenshots
4. Fill in content rating questionnaire
5. Submit for review

## Capacitor Configuration

The app is configured in `capacitor.config.ts`:
- **App ID**: `com.statfyr.app`
- **App Name**: `STATFYR`
- **Plugins**: Camera, Haptics, Share, Biometrics, Push Notifications, etc.

## Installed Capacitor Plugins

- `@capacitor/app` - App lifecycle events
- `@capacitor/camera` - Photo capture
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/share` - Native sharing
- `@capacitor/preferences` - Key-value storage
- `@capacitor/splash-screen` - Splash screen control
- `@capacitor-community/keep-awake` - Prevent screen dimming
- `@capawesome/capacitor-badge` - App badge management
- `@capgo/capacitor-native-biometric` - Face ID / Touch ID

## Daily Development Workflow

When making changes:
```bash
npm run build
npx cap sync
npx cap open ios  # or android
```

## Troubleshooting

### iOS Build Fails
- Ensure Xcode is up to date
- Clean build folder: Product > Clean Build Folder
- Delete `ios/App/Pods` and run `pod install` in `ios/App`

### Android Build Fails
- Sync Gradle: File > Sync Project with Gradle Files
- Invalidate caches: File > Invalidate Caches / Restart

### Assets Not Updating
- Delete `ios` and `android` folders
- Re-run `npx cap add ios` and `npx cap add android`
- Run `npx cap sync`
