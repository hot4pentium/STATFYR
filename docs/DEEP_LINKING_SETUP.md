# Deep Linking Setup for STATFYR

This document explains how Universal Links (iOS) and App Links (Android) are configured for STATFYR.

## How It Works

When a user clicks a `statfyr.com` link:
- **App installed**: Opens directly in the STATFYR app
- **App not installed**: Opens the landing page in browser

## Files Required on Website

Both files are served from `/.well-known/` on your domain.

### iOS: apple-app-site-association

Location: `https://statfyr.com/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.statfyr.app",
        "paths": ["/athlete/*", "/team/*", "/hype/*", "/invite/*", "/dashboard", "/dashboard/*"]
      }
    ]
  }
}
```

**Before publishing:**
1. Replace `TEAM_ID` with your Apple Developer Team ID (found in Apple Developer Portal → Membership)
2. Example: `ABC123XYZ.com.statfyr.app`

### Android: assetlinks.json

Location: `https://statfyr.com/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.statfyr.app",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

**Before publishing:**
1. Get your SHA256 fingerprint:
   - For debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`
   - For release: Get from Google Play Console → Setup → App signing → SHA-256 certificate fingerprint
2. Replace `SHA256_FINGERPRINT_HERE` with your fingerprint (format: `AA:BB:CC:DD:...`)

## iOS Native Configuration

After building with Capacitor, add Associated Domains in Xcode:

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select your app target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" → "Associated Domains"
5. Add: `applinks:statfyr.com`

## Android Native Configuration

The AndroidManifest.xml needs intent filters. Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<activity ...>
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="statfyr.com" />
  </intent-filter>
</activity>
```

## Handling Deep Links in App

The app listens for incoming URLs using the Capacitor App plugin:

```typescript
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', (event) => {
  const url = new URL(event.url);
  
  // Route based on path
  if (url.pathname.startsWith('/athlete/')) {
    const athleteId = url.pathname.split('/')[2];
    navigate(`/hype/${athleteId}`);
  } else if (url.pathname.startsWith('/team/')) {
    const teamCode = url.pathname.split('/')[2];
    navigate(`/join/${teamCode}`);
  }
});
```

## Supported Deep Link Paths

| Path Pattern | Opens |
|-------------|-------|
| `/athlete/:id` | Athlete's public HYPE card |
| `/team/:code` | Team join page |
| `/hype/:id` | HYPE spotlight modal |
| `/invite/:code` | Team invitation |
| `/dashboard` | User's dashboard |

## Testing

### iOS Simulator
```bash
xcrun simctl openurl booted "https://statfyr.com/athlete/123"
```

### Android Emulator
```bash
adb shell am start -a android.intent.action.VIEW -d "https://statfyr.com/athlete/123"
```

### Physical Device
1. Send yourself a link in Messages or Notes
2. Tap the link
3. Should open app (if installed) or browser (if not)

## Troubleshooting

**Links open in browser instead of app:**
- iOS: Check Associated Domains capability is added
- Android: Check `autoVerify="true"` and assetlinks.json is accessible
- Both: Ensure files are served over HTTPS without redirects

**Verification failing:**
- iOS: Apple caches AASA files. Wait 24-48 hours after changes.
- Android: Use `adb shell pm verify-app-links --re-verify com.statfyr.app`

**Testing tools:**
- iOS: https://search.developer.apple.com/appsearch-validation-tool/
- Android: https://developers.google.com/digital-asset-links/tools/generator
