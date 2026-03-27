# RevenueCat Setup Guide

This project now uses two standalone subscription tiers in RevenueCat:

- Essential: $7.99/month or $63.99/year
- Voice & AI Entry: $9.99/month or $79.99/year
- Advanced AI: coming soon, not yet sold in stores

Users do not pay $7.99 plus $9.99 together. The $9.99 Voice tier is the higher standalone plan.

## App Identity

- Android package: `com.myseedbook.catalogue`
- iOS bundle ID: `com.myseedbook.catalogue`
- RevenueCat project should be attached to the same app identity on both platforms

## RevenueCat Entitlements

Create these entitlements exactly:

- `essential`
- `voice`

## Store Product IDs

### iOS

- `com.myseedbook.catalogue.essential.monthly`
- `com.myseedbook.catalogue.essential.yearly`
- `com.myseedbook.catalogue.voice.monthly`
- `com.myseedbook.catalogue.voice.yearly`

### Android

- `myseedbook_essential_month`
- `myseedbook_essential_year`
- `myseedbook_voice_monthly`
- `myseedbook_voice_yearly`

## Pricing

### Essential

- Monthly: $7.99
- Yearly: $63.99
- Includes unlimited seeds, weather integration, and cloud sync across devices

### Voice & AI Entry

- Monthly: $9.99
- Yearly: $79.99
- Includes everything in Essential plus voice notes and AI-powered voice entry

## Recommended Offerings

Create these RevenueCat offerings:

- `default`
  - monthly package mapped to the Essential monthly product
  - annual package mapped to the Essential yearly product
- `voice`
  - monthly package mapped to the Voice monthly product
  - annual package mapped to the Voice yearly product

The app paywall reads all offerings and groups packages by `essential` and `voice` product IDs.

## Environment Variables

Required public keys:

- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`

These are consumed by:

- `config/env.ts`
- `lib/globalRevenueCat.ts`

## Store Linking Checklist

1. Create the subscriptions in App Store Connect.
2. Create the matching subscriptions in Google Play Console.
3. Import all four product IDs into RevenueCat.
4. Attach Essential products to the `essential` entitlement.
5. Attach Voice products to the `voice` entitlement.
6. Create the `default` and `voice` offerings.
7. Confirm the public SDK keys in `.env.local` and EAS secrets.
8. Build with EAS and test on store-backed builds, not Expo Go.

## Testing Notes

- iOS and Android restores are supported through the in-app Restore Purchases action.
- Refunds are handled by Apple and Google Play.
- If the app cannot load live plans, the paywall still shows fallback pricing text from the app code.
