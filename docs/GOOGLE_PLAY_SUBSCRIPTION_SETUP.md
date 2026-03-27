# Google Play Subscription Setup

## Package ID

- `com.myseedbook.catalogue`

## Google Play Subscription IDs

Create four subscriptions in Play Console:

- `myseedbook_essential_month`
- `myseedbook_essential_year`
- `myseedbook_voice_monthly`
- `myseedbook_voice_yearly`

## Pricing

### Essential

- Monthly: $7.99
- Yearly: $63.99

### Voice & AI Entry

- Monthly: $9.99
- Yearly: $79.99

## RevenueCat Mapping

- `myseedbook_essential_month` → entitlement `essential`
- `myseedbook_essential_year` → entitlement `essential`
- `myseedbook_voice_monthly` → entitlement `voice`
- `myseedbook_voice_yearly` → entitlement `voice`

## Notes

- Voice is a higher standalone tier, not a price stacked on top of Essential
- Use an internal testing build from Google Play to validate purchases and restores
- Configure the Google service account in RevenueCat for server-side receipt validation
