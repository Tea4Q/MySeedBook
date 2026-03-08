# Plan: Revenue Cat + Voice Notes Cloud + AI Tier Roadmap

## TL;DR
Wire RevenueCat SDK into premiumManager.ts, fold cloud voice notes sync (Supabase) into Premium tier, fix the activateSubscription bug that omits AI/voice features, then plan v1.3.2 as the OpenAI AI-assistant upgrade path. Two tiers: Premium ($5.99/mo or $49.99/yr) and Premium AI ($9.99/mo or $79.99/yr in v1.3.2).

---

## Current State (Research Findings)

### Voice Notes — where it lives
- Component: `components/VoiceNotes/VoiceNotes.tsx` — records via expo-av, stubs transcription
- Used only in `app/add-seed.tsx` (lines 1273–1277), behind `checkFeature('voice_notes')`
- Supabase table `seed_voice_notes` already migrated (`supabase/migrations/20260220000100_create_seed_voice_notes.sql`) with `storage_mode: 'local' | 'cloud'`
- Storage bucket `voice-notes` exists with user-scoped RLS
- **Transcription is a stub** — `transcribeRecording()` returns a hardcoded string (no real Whisper call yet)
- Feature flag: `voice_notes: false` in free tier

### RevenueCat — current state
- Keys in `.env`: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` and `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (both test keys, identical)
- SDK (`react-native-purchases`) is NOT installed or imported anywhere
- `premiumManager.ts` uses AsyncStorage simulation; comments say "IAP will be added in v1.3.2"

### Tier bug
- `activateSubscription()` in `premiumManager.ts` (lines 207–228) does NOT include `voice_notes`, `ai_garden_assistant`, `smart_shopping_assistant` in the activated features object — purchasing premium will never unlock these

### Current pricing (PremiumModal.tsx lines 218, 242)
- Premium Monthly: $9.99/mo
- Premium Yearly: $99.99/yr ($8.33/mo, save 30%)

---

## Pricing Recommendations

| Tier | Monthly | Yearly | Notes |
|---|---|---|---|
| **Free** | $0 | $0 | Barcode scanner, local voice notes (device only), 3 seeds, 2 suppliers |
| **Premium** | $9.99/mo | $99.99/yr | Unlimited + weather + cloud voice notes (Supabase sync, any-device playback) + data export + priority support |
| **Premium AI** *(v1.3.2)* | $12.99/mo | $129.99/yr | Everything in Premium + AI Garden Assistant (GPT-4o mini) + Smart Shopping + real Whisper transcription |

Yearly saves: Premium = 17% off, Premium AI = 16% off. The AI tier is a $3/mo or $30/yr add-on to Premium, which seems reasonable given the added value of AI features.

---

## Phase 1 — External Setup (No Code)
1. Create RevenueCat project at app.revenuecat.com
2. Create two entitlements: `premium_access`, `ai_access`
3. Add products matching existing IDs:
   - `myseedbook_premium_monthly` / `com.myseedbook.catalogue.premium.monthly` → `premium_access`
   - `myseedbook_premium_yearly` / `com.myseedbook.catalogue.premium.yearly` → `premium_access`
   - *(v1.3.2)* `myseedbook_ai_monthly` + `myseedbook_ai_yearly` → `ai_access`
4. Replace `.env` test keys with real API keys from RevenueCat dashboard

---

## Phase 2 — RevenueCat SDK (v1.3.1)

**Steps:**
1. Install `react-native-purchases` package
2. Initialize RevenueCat in `app/_layout.tsx` using `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` / `_IOS_KEY`
3. Rewrite `premiumManager.ts`:
   - Replace `AsyncStorage` purchase simulation with `Purchases.purchaseStoreProduct()`
   - Replace `loadSubscriptionFromStorage` with `Purchases.getCustomerInfo()` + entitlement check
   - Map `premium_access` entitlement → enable Premium features
   - Keep `AsyncStorage` only as offline cache
4. Fix `activateSubscription()` to include `voice_notes`, `ai_garden_assistant`, `smart_shopping_assistant` in premium features

**Files to modify:**
- `utils/premiumManager.ts` — full rewrite of IAP section
- `app/_layout.tsx` — add RevenueCat init
- `package.json` — add react-native-purchases

---

## Phase 3 — Voice Notes Cloud Sync (v1.3.1)

**Steps:**
1. Update `VoiceNotes.tsx`:
   - After recording stops: if `checkFeature('voice_notes')` = premium → upload `.m4a` to `voice-notes` Supabase bucket
   - Insert row in `seed_voice_notes` with `storage_mode: 'cloud'`, `storage_url`
   - Free users: save locally only, insert row with `storage_mode: 'local'`, no upload
2. Playback: use `storage_url` for cloud notes (plays from any device), local `fileUri` for local notes
3. Add voice notes list to seed view/edit screen so users can review past notes
4. Upgrade prompt: show on the "play from this device" step → "Unlock cloud playback with Premium"

**Files to modify:**
- `components/VoiceNotes/VoiceNotes.tsx`
- `app/add-seed.tsx` — ensure `seed_id` is passed to VoiceNotes after save

**Where voice notes appear:**
- v1.3.1: `app/add-seed.tsx` (add & edit) — already there
- v1.3.2: Should also appear in a seed detail/view screen if one exists

---

## Phase 4 — Tier/UI Cleanup (v1.3.1)

**Steps:**
1. `components/PremiumModal.tsx` — update benefit list to include "☁️ Cloud voice notes — listen from any device"
2. `utils/premiumManager.ts` — update free tier: `voice_notes: true` (local recording allowed free), add `voice_notes_cloud: boolean` as new feature OR use `voice_notes: true` for cloud flag
3. `premium-settings.tsx` — reflect new benefit descriptions
4. Remove the "IAP will be added in v1.3.2" comments

**Files to modify:**
- `components/PremiumModal.tsx`
- `utils/premiumManager.ts`
- `app/premium-settings.tsx`

---

## Phase 5 — v1.3.2 AI Tier

**Steps:**
1. Create Supabase Edge Function `ai-proxy` — receives prompt + auth token, validates JWT, calls OpenAI API server-side (removes `dangerouslyAllowBrowser: true` security risk)
2. Update `config/ai.ts` — replace direct OpenAI client with fetch to Edge Function URL
3. Wire real Whisper: Edge Function `transcribe-audio` — receives audio blob, calls `openai.audio.transcriptions.create()`, returns text
4. Update `VoiceNotes.tsx` transcription to call the Edge Function
5. Add `ai_access` entitlement check to `AIGardenAssistant` and `SmartShoppingAssistant`
6. New RevenueCat products for AI tier (see Phase 1)
7. `PremiumModal.tsx` — add AI tier option with upsell from Premium

**Files to modify:**
- `supabase/functions/ai-proxy/index.ts` (new)
- `supabase/functions/transcribe-audio/index.ts` (new)
- `config/ai.ts`
- `components/VoiceNotes/VoiceNotes.tsx`
- `components/AIGardenAssistant/AIGardenAssistant.tsx`
- `components/PremiumModal.tsx`
- `utils/premiumManager.ts`

---

## Relevant Files
- `utils/premiumManager.ts` — tier logic, purchase simulation (full rewrite needed)
- `components/VoiceNotes/VoiceNotes.tsx` — recording, playback, stub transcription
- `app/add-seed.tsx` lines 1273–1277 — voice notes render location
- `supabase/migrations/20260220000100_create_seed_voice_notes.sql` — DB schema ready
- `components/PremiumModal.tsx` lines 218, 242 — pricing display
- `app/_layout.tsx` — entry point for RevenueCat init
- `config/ai.ts` — OpenAI config (needs proxy refactor in v1.3.2)
- `components/AIGardenAssistant/AIGardenAssistant.tsx` — AI chat (v1.3.2)
- `components/SmartShoppingAssistant/SmartShoppingAssistant.tsx` — AI shopping (v1.3.2)
- `.env` — RevenueCat keys (need real keys)

---

## Verification
1. RevenueCat dashboard shows test purchase completing and entitlement granted
2. Premium user: voice note recorded → uploads to `voice-notes` bucket → playback works on second device
3. Free user: voice note recorded → stays local → upgrade prompt on "listen from another device"
4. `premiumManager.hasFeature('voice_notes')` returns correct value based on RC entitlement
5. v1.3.2: AI chat sends message → Edge Function → GPT-4o mini response returned correctly

---

## Decisions
- Cloud voice notes folded INTO Premium tier (not a separate add-on) — simpler purchase flow
- Free users CAN record voice notes locally (differentiator: cloud sync is premium)
- OpenAI chosen as AI provider (GPT-4o mini for chat, Whisper for transcription)
- API key stays server-side via Supabase Edge Function (security requirement)
- v1.3.2 = separate RevenueCat product at $9.99/mo or $79.99/yr
