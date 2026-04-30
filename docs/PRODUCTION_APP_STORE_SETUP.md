# Production App Store Setup

## Bundle ID

- `com.myseedbook.catalogue`

## Auto-Renewable Subscriptions

Create these products in App Store Connect:

- `com.myseedbook.catalogue.essential.monthly` at $7.99/month
- `com.myseedbook.catalogue.essential.annual` at $63.99/year
- `com.myseedbook.catalogue.voice.monthly` at $9.99/month
- `com.myseedbook.catalogue.voice.yearly` at $79.99/year

## Subscription Positioning

- Essential is the entry paid plan
- Voice & AI Entry is the higher paid plan
- Voice replaces Essential pricing for that subscriber; it is not charged on top of Essential

## RevenueCat

Import all four product IDs into RevenueCat and map them to:

- `essential`
- `voice`

## Review Notes

Make sure the paywall includes:

- pricing
- privacy policy
- terms of service
- restore purchases access

That is already reflected in the updated app paywall.
