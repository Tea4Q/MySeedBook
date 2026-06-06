# Production Build Status - MySeedBook Catalogue

## Current Snapshot (May 3, 2026)

- Branch: release/v1.3.1-with-ai
- Version: 1.3.1
- Latest production build: Build 25 (submitted via `eas build --profile production --platform all --auto-submit`)
- OTA update channel: production

## What Changed in This Build Cycle

- **EAS env var fix**: 4 wrong account-scoped PUBLIC vars deleted; correct project-scoped secrets now used for all builds
- **RevenueCat keys**: iOS `appl_CojCuJUsWqzJiOxzCyhUDQlfLQj` and Android `goog_IIVsFNrpglrinwijYBbvkajOwZK` correctly bundled in Build 25
- **Supabase keys**: Correct project URL and anon key bundled in Build 25
- Build 24 (previous) had wrong keys from a different project — do not use Build 24 for production

## OTA Updates Pushed to Production Channel

All of the following were delivered as OTA updates (no store re-submission needed):

1. Fix crash on Add/Edit Seed screen
2. Fix camera photo upload on mobile (expo-file-system arrayBuffer)
3. Fix AI upgrade button going to dead-end Alert
4. Fix Voice Notes showing wrong price ($7.99 → $9.99)
5. Fix URL image paste showing unhelpful error
6. Truncate long supplier names on seed card

## Validation Notes

- RevenueCat Voice & AI entitlement confirmed working after linking product in RevenueCat dashboard
- Upgrade flow confirmed working from TestFlight (App Store purchase sheet opens correctly)
- Camera upload confirmed working on iOS and Android after expo-file-system fix
- TypeScript project-wide pre-existing Supabase typing errors are deprioritized and do not affect runtime

## Build Commands

```bash
# Both platforms (production, auto-submit to stores)
eas build --profile production --platform all --auto-submit

# OTA update only
eas update --channel production --message "Description of change"
```
