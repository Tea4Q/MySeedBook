# Production Build Status - MySeedBook Catalogue

## Current Snapshot (March 26, 2026)

- Branch: release/v1.3.0-pre-ai
- App runtime: Expo dev server starts successfully (`npx expo start`)
- Build artifacts in workspace: multiple Android AAB files present
- Focus of this branch: pre-AI submission stability and reviewer-safe feature scope

## What Changed Recently

- Voice and AI purchase messaging is hidden/demoted for this branch
- Calendar modal reopen issue was fixed for tab-switch/remount behavior
- Web image ingestion now supports picker, paste, and drag-and-drop
- Full-page drag overlay added for clearer upload UX
- Add Seed and Edit Supplier now include unsaved-changes guards and draft restore

## Validation Notes

- Targeted checks on modified files passed after implementation
- Project-wide TypeScript still contains pre-existing unrelated Supabase typing errors
- Those broader type errors were explicitly deprioritized for this update stream

## Release Guidance

1. Generate fresh Android and iOS production builds from this branch before submission.
2. Run focused smoke tests on:
   - Add Seed and Edit Supplier draft restore/leave prompts
   - Calendar add-event launch flow after tab switches
   - Web image upload methods (picker, paste, drag-and-drop)
3. Confirm store metadata and in-app copy match pre-AI scope.

## Suggested Build Commands

```bash
# Android AAB
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Both
eas build --platform all --profile production
```
