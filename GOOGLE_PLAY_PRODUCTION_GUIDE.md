# Google Play Production Guide

## Production Identity Check

- Android package: `com.myseedbook.catalogue`
- App version code in Android Gradle: `13`
- App version code in `app.json`: `13`

## Subscription Products

### Essential

- `myseedbook_essential_month` → $7.99/month
- `myseedbook_essential_year` → $63.99/year

### Voice & AI Entry

- `myseedbook_voice_monthly` → $9.99/month
- `myseedbook_voice_yearly` → $79.99/year

## Release Reminder

The $9.99 tier is not a combined charge with Essential. It is the higher plan users upgrade to.

## RevenueCat Checklist

1. Public Android SDK key configured
2. Google service account uploaded to RevenueCat
3. Essential entitlement mapped
4. Voice entitlement mapped
5. Store listing screenshots show current plan structure
