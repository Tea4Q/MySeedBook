# iOS Invalid API Error - Testing and Diagnostics

## Purpose
Use this checklist when iOS reports API/network errors such as:
- `NetworkError when attempting to fetch resource`
- `AuthRetryableFetchError`
- `Invalid API key`
- Generic "invalid api" failures in auth/weather/subscription flows

## Quick Triage

1. Verify environment keys are available in the iOS build profile:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_OPENWEATHER_API_KEY`
   - `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
2. Confirm the app is using production/staging values expected for the build.
3. Confirm API keys are not restricted to a different bundle identifier.
4. Confirm endpoint/base URL correctness (no typo, no wrong region/project).

## Runtime Checks

1. Auth flow on iOS
   - Sign in with known account
   - Sign up with new account
   - Forgot password
   - Continue as guest
2. Weather flow
   - Verify weather tab loads for premium user
   - Verify non-premium receives upgrade gate (not API crash)
3. Subscription flow
   - Verify offerings fetch behavior
   - Verify purchase/restore UI path responds gracefully to backend errors

## Common Root Causes

- Missing env vars at build time (works in dev, fails in release)
- Wrong Supabase project URL/key pair
- RevenueCat iOS API key not matching app/project
- OpenWeather key restrictions or quota exhausted
- Platform transport/TLS/network policy edge cases

## Mitigations

- Add explicit startup health checks for key env variables
- Show user-facing fallback messages instead of generic crashes
- Keep mocked RevenueCat in CI tests and run sandbox checks manually before submission
- Log normalized error category + endpoint in non-sensitive telemetry

## Release Gate
Treat unresolved iOS invalid API errors as blocker for App Store submission.
