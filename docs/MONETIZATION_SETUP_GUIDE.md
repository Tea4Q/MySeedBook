# Monetization Setup Guide

## Current Subscription Model

MySeedBook uses a three-level monetization structure:

- Free
  - 3 seeds
  - 2 suppliers
  - limited photos
- Essential
  - $7.99/month or $63.99/year
  - unlimited seeds
  - weather integration
  - cloud sync across devices
- Voice & AI Entry
  - $9.99/month or $79.99/year
  - everything in Essential
  - voice notes
  - AI voice transcription entry
- Advanced AI
  - coming soon
  - not yet purchasable

## Pricing Rationale

### Essential at $7.99

This price fits the value of unlimited inventory, weather integration, and sync without pushing the app into an enterprise-style gardening price point.

### Voice & AI Entry at $9.99

This is the higher standalone plan, not an add-on stacked on top of Essential.

The voice tier is justified because AI transcription has ongoing usage costs. For example, OpenAI Whisper pricing is currently low enough that $9.99 still leaves strong margin at typical user volumes, while comparable transcription products commonly charge at or above this level.

## Store Product IDs

### iOS

- `com.myseedbook.catalogue.essential.monthly`
- `com.myseedbook.catalogue.essential.yearly`
- `com.myseedbook.catalogue.voice.monthly`
- `com.myseedbook.catalogue.voice.yearly`

### Android

- `myseedbook_essential_monthly`
- `myseedbook_essential_yearly`
- `myseedbook_voice_monthly`
- `myseedbook_voice_yearly`

## RevenueCat Entitlements

- `essential`
- `voice`

## UX Notes

- Use plant or sprout imagery instead of crown imagery
- Keep pricing language explicit: users move from $7.99 to $9.99, they do not pay both
- Always show privacy, terms, and restore purchase access on the paywall
