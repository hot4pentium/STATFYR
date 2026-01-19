# In-App Purchase Implementation Plan

## Overview

STATFYR will use Apple App Store and Google Play Store for all subscription purchases. The website serves as a companion experience where users can log in and access their features, but subscriptions are managed exclusively through the mobile apps.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   iOS App       │     │  Android App    │     │   Website       │
│   (StoreKit 2)  │     │  (Play Billing) │     │   (Companion)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ Purchase Receipt      │ Purchase Token        │ Login Only
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STATFYR Backend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Apple      │  │  Google     │  │  Entitlements Service   │  │
│  │  Receipt    │  │  Receipt    │  │  (checks subscriptions  │  │
│  │  Validator  │  │  Validator  │  │   from all sources)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (user_subs)   │
                    └─────────────────┘
```

## Phase 1: Capacitor Plugin Setup

### Required Plugins

```bash
npm install @capawesome/capacitor-app-review
npm install cordova-plugin-purchase
npm install @capgo/capacitor-purchases
```

**Recommended: RevenueCat SDK**
RevenueCat simplifies cross-platform subscription management by handling:
- Receipt validation for both stores
- Subscription status syncing
- Webhook notifications for renewals/cancellations
- Analytics and reporting

```bash
npm install @revenuecat/purchases-capacitor
```

### Configuration Files

**iOS (ios/App/App/Info.plist)**
- Add StoreKit configuration
- Enable in-app purchase capability

**Android (android/app/build.gradle)**
- Add Google Play Billing library dependency

## Phase 2: Product Setup

### App Store Connect (Apple)

1. Create App ID with In-App Purchase capability
2. Create subscription products:
   - `com.statfyr.coach_pro_monthly` - $7.99/month
   - `com.statfyr.athlete_pro_monthly` - $2.99/month  
   - `com.statfyr.supporter_pro_monthly` - $5.99/month

3. Create subscription group: "STATFYR Pro"
4. Configure App Store Server Notifications URL

### Google Play Console

1. Create subscription products with same IDs
2. Configure Real-time Developer Notifications (RTDN)
3. Set up service account for server-side validation

## Phase 3: Client Implementation

### Purchase Flow (client/src/lib/purchases.ts)

```typescript
import { Purchases, CustomerInfo, PurchasesPackage } from '@revenuecat/purchases-capacitor';

export async function initializePurchases(userId: string) {
  await Purchases.configure({
    apiKey: Platform.OS === 'ios' 
      ? process.env.REVENUECAT_IOS_KEY 
      : process.env.REVENUECAT_ANDROID_KEY,
  });
  
  await Purchases.logIn({ appUserID: userId });
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages || [];
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const result = await Purchases.purchasePackage({ aPackage: pkg });
  return result.customerInfo;
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  const result = await Purchases.getCustomerInfo();
  return result.customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const result = await Purchases.restorePurchases();
  return result.customerInfo;
}
```

### Updated Subscription Page (Native)

```typescript
// When native, show real purchase options
const [packages, setPackages] = useState<PurchasesPackage[]>([]);

useEffect(() => {
  if (isNative) {
    loadOfferings();
  }
}, []);

const loadOfferings = async () => {
  const pkgs = await getOfferings();
  setPackages(pkgs);
};

const handlePurchase = async (pkg: PurchasesPackage) => {
  try {
    const customerInfo = await purchasePackage(pkg);
    // Sync with backend
    await syncSubscription(user.id, customerInfo);
    refetch(); // Refresh entitlements
  } catch (error) {
    console.error('Purchase failed:', error);
  }
};
```

## Phase 4: Backend Implementation

### New API Endpoints

**POST /api/subscriptions/validate-receipt**
- Receives purchase receipt from client
- Validates with Apple/Google
- Updates user subscription in database

**POST /api/webhooks/revenuecat**
- Receives webhook notifications from RevenueCat
- Updates subscription status on renewals/cancellations/expirations

### Database Schema Updates

```sql
ALTER TABLE subscriptions ADD COLUMN source TEXT; -- 'stripe', 'apple', 'google'
ALTER TABLE subscriptions ADD COLUMN store_transaction_id TEXT;
ALTER TABLE subscriptions ADD COLUMN original_purchase_date TIMESTAMP;
```

### Entitlements Service Update

```typescript
async function getEntitlements(userId: number) {
  // Check all subscription sources
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active'),
      or(
        eq(subscriptions.source, 'apple'),
        eq(subscriptions.source, 'google'),
        eq(subscriptions.source, 'stripe') // Legacy
      )
    )
  });
  
  // Return entitlements based on subscription tier
  return buildEntitlements(subscription);
}
```

## Phase 5: Testing

### Sandbox Testing

**Apple Sandbox**
1. Create sandbox test accounts in App Store Connect
2. Sign into sandbox account on test device
3. Use sandbox environment for all testing

**Google Play**
1. Add test accounts to license testing in Play Console
2. Use closed testing track for internal testing
3. Test purchase flows with test card

### Test Cases

- [ ] New purchase flow (all 3 tiers)
- [ ] Subscription renewal
- [ ] Subscription cancellation
- [ ] Subscription expiration
- [ ] Restore purchases
- [ ] Cross-platform login (purchase on iOS, access on web)
- [ ] Upgrade/downgrade between tiers
- [ ] Grace period handling
- [ ] Billing retry for failed renewals

## Phase 6: App Store Submission

### Required for Apple

1. In-App Purchase products approved in App Store Connect
2. Subscription terms disclosed in app
3. Restore Purchases button accessible
4. Privacy policy with subscription terms

### Required for Google

1. Products published in Play Console
2. Subscription disclosure in app
3. Links to manage subscription in Play Store

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Plugin Setup | 1 day | None |
| Phase 2: Product Setup | 2-3 days | Apple/Google account access |
| Phase 3: Client Implementation | 3-4 days | Phase 1, 2 |
| Phase 4: Backend Implementation | 2-3 days | Phase 2 |
| Phase 5: Testing | 3-5 days | Phase 3, 4 |
| Phase 6: Submission | 1-2 weeks | App Store review time |

**Total: ~3-4 weeks**

## Environment Variables Needed

```
REVENUECAT_IOS_KEY=appl_xxxxx
REVENUECAT_ANDROID_KEY=goog_xxxxx
REVENUECAT_WEBHOOK_SECRET=xxxxx
APPLE_SHARED_SECRET=xxxxx (if not using RevenueCat)
GOOGLE_SERVICE_ACCOUNT_KEY=xxxxx (if not using RevenueCat)
```

## Cost Considerations

- **Apple**: 30% fee (15% for Small Business Program)
- **Google**: 15% for first $1M, then 30%
- **RevenueCat**: Free up to $2,500/month revenue, then 1%

## Recommendation

Use **RevenueCat** for subscription management. It:
- Handles receipt validation for both stores
- Provides unified API across platforms
- Offers webhooks for server-side sync
- Includes analytics dashboard
- Reduces implementation complexity by ~50%

Start with RevenueCat's free tier and scale as needed.
