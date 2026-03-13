# RevenueCat Setup Guide — MySeedBook

This document covers the complete RevenueCat integration in this project: dashboard configuration, environment variables, code architecture, and how to test subscriptions.

---

## 1. Prerequisites

| Requirement | Version |
|---|---|
| `react-native-purchases` | `^9.11.2` (see `package.json`) |
| Expo SDK | 52+ |
| EAS Build | Required (native module — no Expo Go support) |

---

## 2. RevenueCat Dashboard

### 2.1 Create a Project

1. Sign in at [app.revenuecat.com](https://app.revenuecat.com).
2. **New Project** → name it **MySeedBook**.
3. Add an **App** for each platform:
   - **Google Play** — package: `com.tea4q.myseedbook`
   - **App Store Connect** — bundle ID: `com.tea4q.myseedbook`

### 2.2 API Keys

Navigate to **Project Settings → API Keys**.

| Key | Environment variable |
|---|---|
| Android (Public) | `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` |
| iOS (Public) | `EXPO_PUBLIC_REVENUECAT_IOS_KEY` |

Copy the **Public SDK keys** — never use the secret keys in the app.

### 2.3 Products

Create the same product IDs in the App Store / Google Play developer consoles first, then import them into RevenueCat:

| Product ID | Type | Price |
|---|---|---|
| `monthly` | Auto-renewable subscription | Your price |
| `annual` | Auto-renewable subscription | Your price |

### 2.4 Entitlement

Create an entitlement named exactly **`premium`** (this is the ID used in `globalRevenueCat.ts`).

Attach both products to this entitlement.

### 2.5 Offering & Packages

1. Create an **Offering** named `default` (this becomes the `current` offering).
2. Inside the offering, create packages:
   - `$rc_monthly` (or a custom ID) → attach `monthly`
   - `$rc_annual` (or a custom ID) → attach `annual`

> The `GlobalSubscriptionModal` reads `offerings.current.availablePackages` — as long as your default offering has packages, they appear in the paywall automatically.

---

## 3. iOS Platform Integration

### 3.1 Apple Developer Portal

1. Sign in at [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**.
2. Select your App ID (`com.tea4q.myseedbook`) → **Edit**.
3. Enable the **In-App Purchase** capability and save.
4. Regenerate any provisioning profiles that use this App ID so they pick up the new capability.

### 3.2 App Store Connect — Products

1. Open [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **MySeedBook** → **Subscriptions**.
2. Create a **Subscription Group** (e.g. `MySeedBook Premium`).
3. Inside the group, add two auto-renewable subscriptions:

   | Product ID | Duration | Reference Name |
   |---|---|---|
   | `monthly` | 1 Month | MySeedBook Monthly |
   | `annual` | 1 Year | MySeedBook Annual |

4. For each product:
   - Set a **price tier** in all required territories.
   - Add a **display name** and **description** (used on the App Store and in the native payment sheet).
   - Check **Subscription Review Information** and provide a screenshot of the paywall if prompted.
5. Submit the subscription group for **Review** — Apple must approve IAP products before a live release, but sandbox testing works immediately after creation.

### 3.3 EAS / Native Build

`react-native-purchases` is a native module that auto-links via CocoaPods — no manual `Podfile` changes are needed.

Make sure `app.json` specifies the correct bundle ID:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tea4q.myseedbook"
    }
  }
}
```

EAS Build picks up the bundle ID automatically and applies the correct provisioning profile.

### 3.4 StoreKit 2 (optional, simulator only)

To test purchases in the iOS Simulator without a device:

1. In Xcode open **File → New → File → StoreKit Configuration File**.
2. Add your two subscription products with the same product IDs.
3. In the scheme editor (**Product → Scheme → Edit Scheme → Run → Options**), set **StoreKit Configuration** to your new file.
4. RevenueCat will detect the local StoreKit environment automatically.

---

## 4. Android Platform Integration

### 4.1 Google Play Console — Products

1. Open [Google Play Console](https://play.google.com/console) → **MySeedBook** → **Monetize → Subscriptions**.
2. Create two subscriptions:

   | Product ID | Billing period |
   |---|---|
   | `monthly` | Monthly |
   | `annual` | Annual |

3. For each subscription:
   - Add a **base plan** with a price and billing period.
   - Optionally add a **free-trial offer** or introductory pricing.
   - Set a **grace period** (recommended: 3 days for monthly, 7 days for annual).
   - **Activate** the subscription — inactive products cannot be purchased.

### 4.2 Service Account (required for RevenueCat server validation)

RevenueCat must validate Android receipts server-side using a Google service account:

1. In Play Console → **Setup → API access**, link your app to a **Google Cloud project**.
2. In [Google Cloud Console](https://console.cloud.google.com) → **IAM & Admin → Service Accounts**, create a service account.
3. Assign the role **"Financial data viewer"** (Play Developer API access).
4. Create and download a **JSON key** for the service account.
5. In RevenueCat Dashboard → **Google Play app → Service Credentials**, upload the JSON key.

> Without the service account, RevenueCat cannot verify subscription status server-side and receipts will fail validation.

### 4.3 EAS / Native Build

The `BILLING` permission is automatically added to `AndroidManifest.xml` by `react-native-purchases` via autolinking — no manual changes needed.

Verify that `app.json` specifies the correct package name:

```json
{
  "expo": {
    "android": {
      "package": "com.tea4q.myseedbook"
    }
  }
}
```

You must upload **at least one build** to an internal testing track before Play Console allows you to create subscriptions or add license testers.

### 4.4 License Testers

1. In Play Console → **Setup → License Testing**, add the Google accounts that should test without real charges.
2. Install the app from the **internal testing track** (sideloading bypasses Play Billing).
3. Test purchases complete instantly and can be cancelled/refunded from the Play Store app.

### 4.5 Real-Time Developer Notifications (optional)

To receive server-to-server events (renewals, cancellations, refunds) in near-real time:

1. In Play Console → **Monetize → Subscriptions → Real-time developer notifications**, configure a Pub/Sub topic URL.
2. RevenueCat provides a webhook endpoint for this in Dashboard → **Integrations → Google Play**.

---

## 5. Environment Variables

Add these to your `.env` file (and to EAS Secrets for CI builds):

```
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

They are read in `config/env.ts`:

```ts
revenuecat: {
  iosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  androidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
},
```

And consumed directly in `lib/globalRevenueCat.ts` via `process.env` (no manual passing required).

---

## 6. Code Architecture

```
lib/
  globalRevenueCat.ts          ← Singleton SDK wrapper
  globalSubscriptionManager.tsx ← React context + useGlobalSubscription hook
components/
  GlobalSubscriptionModal.tsx  ← Paywall UI (reads from context)
app/
  _layout.tsx                  ← Wraps app in <GlobalSubscriptionProvider>
```

### 6.1 `globalRevenueCat.ts` (singleton)

Wraps `react-native-purchases` with safe, platform-aware methods:

| Method | Description |
|---|---|
| `initialize(userId)` | Configures the SDK and logs in the user. Call once after auth. |
| `getCustomerInfo()` | Returns `SubscriptionInfo` with `isPremium`, `planType`, `renewalDate`. |
| `getOfferings()` | Fetches available packages from the RevenueCat dashboard. |
| `purchasePackage(pkg)` | Completes a purchase and returns updated `SubscriptionInfo`. |
| `restorePurchases()` | Restores previous purchases (required by App Store guidelines). |
| `logOut()` | Logs out the current user — call on sign-out. |

**Plan type detection** is based on the product identifier:
- Contains `monthly` → `planType: 'monthly'`
- Contains `yearly` or `annual` → `planType: 'annual'`

> If your product IDs don't contain these strings, update `parseCustomerInfo()` in `globalRevenueCat.ts`.

### 6.2 `globalSubscriptionManager.tsx` (context)

`GlobalSubscriptionProvider` is mounted in `app/_layout.tsx` and receives the Supabase user ID:

```tsx
<GlobalSubscriptionProvider userId={session?.user?.id ?? null}>
  {children}
</GlobalSubscriptionProvider>
```

It initialises RevenueCat, polls for customer info, and loads offerings on mount (and whenever `userId` changes on sign-in/out).

Use the hook anywhere in the app:

```ts
const { isPremium, planType, renewalDate, purchase, restore, refresh } =
  useGlobalSubscription();
```

| Value / Method | Type | Description |
|---|---|---|
| `isPremium` | `boolean` | Active `premium` entitlement |
| `planType` | `'monthly' \| 'annual' \| null` | Current plan |
| `planLabel` | `string` | Human-readable e.g. "Annual Plan" |
| `renewalDate` | `string \| null` | ISO date of next renewal |
| `isLoading` | `boolean` | True while initialising |
| `offerings` | `PurchasesOfferings \| null` | Raw RevenueCat offerings |
| `isEligibleForRefund` | `boolean` | Within refund window (7d monthly / 15d annual) |
| `isResubscribeBlocked` | `boolean` | 30-day cooldown after account deletion |
| `purchase(pkg)` | `Promise<boolean>` | Purchase a package |
| `restore()` | `Promise<boolean>` | Restore purchases |
| `refresh()` | `Promise<void>` | Re-fetch customer info |
| `openManageSubscriptions()` | `Promise<void>` | Opens platform subscription page |
| `requestRefund()` | `Promise<void>` | Opens platform refund page (within window) |

### 6.3 `GlobalSubscriptionModal` (paywall)

Show the modal from any component:

```tsx
const [showModal, setShowModal] = useState(false);

<GlobalSubscriptionModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  feature="Unlimited Seeds"   // optional — shown in the header
/>
```

The modal reads `offerings` from the context — no extra props needed.

---

## 7. Supabase Integration

The context queries the `profiles` table to enforce a 30-day resubscribe cooldown after account deletion:

```sql
-- Profiles table must have this column:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resubscribe_blocked_until TIMESTAMPTZ;
```

Set `resubscribe_blocked_until = NOW() + INTERVAL '30 days'` in your account-deletion logic.

---

## 8. app.json Plugin

`react-native-purchases` does **not** require an explicit `app.json` plugin entry for basic functionality, but if you add the RevenueCat Expo config plugin in future, add it to the `plugins` array in `app.json`:

```json
"plugins": [
  ...
  ["react-native-purchases", { "apiKey": "" }]
]
```

---

## 9. Testing Subscriptions

### Android (Google Play)

1. Add your Google account as a **License Tester** in the Play Console → Setup → License Testing.
2. Use the **internal testing** track to install the build.
3. Test purchases will not charge your card.

### iOS (App Store Connect)

1. Create a **Sandbox Tester** in App Store Connect → Users and Access → Sandbox.
2. Sign in with the sandbox account on the device (Settings → App Store → Sandbox Account).
3. Purchases will complete immediately without a charge.

### RevenueCat Sandbox mode

RevenueCat automatically detects sandbox vs. production receipts. You can verify sandbox purchases in the RevenueCat dashboard under your app's **Customer** view.

### Forced Premium (Dev Only)

During development on web (where RevenueCat is unavailable), you can temporarily force `isPremium: true` by wrapping your provider with a mock context value — or check `Platform.OS !== 'web'` before gating features.

---

## 10. Adding a New Plan

1. Create the product in the App Store / Google Play console.
2. Import it into RevenueCat and attach it to the `premium` entitlement.
3. Add it to the `default` offering as a new package.
4. Update `parseCustomerInfo()` in `globalRevenueCat.ts` if the product ID doesn't contain `monthly` or `annual`.
5. No UI changes needed — `GlobalSubscriptionModal` renders all packages from the offering dynamically.
