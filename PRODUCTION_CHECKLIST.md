# Production Deployment Checklist

## Release Context
- Branch: `release/v1.3.0-pre-ai`
- Target: Production deployment with pre-AI reviewer-safe feature scope
- Date: March 26, 2026

## ✅ Security & Stability Baseline
- [x] Auth bypass flags removed
- [x] Critical debug/development artifacts removed
- [x] Core auth flows verified previously
- [x] Calendar modal reopen regression fixed (one-shot route params cleared)
- [x] Add Seed unsaved-change guard + draft restore implemented
- [x] Edit Supplier unsaved-change guard + draft restore implemented

## ✅ Web Upload Readiness
- [x] File picker image upload path
- [x] Clipboard paste image path
- [x] Drag-and-drop image path
- [x] Full-page drag overlay behavior
- [x] Supported formats: JPG, PNG, GIF, WebP, AVIF

## ✅ Product Scope Readiness
- [x] Pre-AI messaging posture applied
- [x] Voice/AI upgrade messaging hidden/demoted for this branch
- [x] Documentation updated to reflect v1.3.0-pre-ai constraints

## 🔄 Required Before Submission

### Build & Packaging
- [ ] Build Android AAB (`production` profile)
- [ ] Build iOS release (`production` profile)
- [ ] Archive build IDs and release notes

### Device Validation
- [ ] Android physical device smoke test
- [ ] iOS physical device smoke test
- [ ] Web regression pass for image and form workflows

### Release Content & Store Setup
- [ ] Confirm listing copy matches pre-AI scope
- [ ] Confirm screenshots reflect current UX
- [ ] Confirm legal links and policy text are up to date
- [ ] Verify App Store / Play Console metadata consistency

### Monitoring & Operations
- [ ] Ensure error/crash monitoring is enabled for production
- [ ] Ensure support channel and rollback path are documented

## Known Non-Blocking Items
- Project-wide TypeScript has pre-existing unrelated Supabase typing errors.
- These were intentionally deprioritized for this release stream and should be handled in a follow-up hardening pass.
