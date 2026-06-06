# MySeedBook Catalogue - Pre-Release Checklist

## Release Context
- Branch: `release/v1.3.0-pre-ai`
- Release Scope: Stable/non-AI feature set for store review
- Date: March 26, 2026

## ✅ Completed

### Scope & Messaging
- [x] Voice and AI purchase messaging hidden/demoted for pre-AI release
- [x] Upgrade copy aligned to stable reviewer-testable features
- [x] Voice/AI marked as future release (v1.3.1+)

### Core UX Stability
- [x] Calendar one-shot params cleared after use to prevent modal reopen loops
- [x] Add Seed unsaved-changes leave prompt implemented
- [x] Add Seed draft autosave/restore implemented
- [x] Edit Supplier unsaved-changes leave prompt implemented
- [x] Edit Supplier per-record draft autosave/restore implemented

### Web Image Flow
- [x] File picker upload support
- [x] Clipboard paste image support
- [x] Drag-and-drop image support
- [x] Full-page drag overlay for drop affordance
- [x] Accepted web formats verified: JPG, PNG, GIF, WebP, AVIF

### Documentation
- [x] Root docs updated for March 2026 branch state
- [x] Production/build summary files updated to current branch context

## 🔄 Final Pre-Submission Checks

### Functional Smoke Tests
- [ ] Verify Add Seed draft restores after tab switch / refresh
- [ ] Verify Edit Supplier draft restores for the correct supplier record
- [ ] Verify leave/discard prompts only appear when fields changed
- [ ] Verify calendar add-event launch does not re-open unexpectedly
- [ ] Verify all web image input methods on latest Chrome/Safari/Edge

### Store Readiness
- [ ] Confirm store listing text does not advertise hidden voice/AI functionality
- [ ] Confirm screenshots match current pre-AI UX
- [ ] Confirm privacy policy / terms links resolve correctly in app

### Build & Validation
- [ ] Run fresh Android production AAB build from current branch
- [ ] Run fresh iOS production build from current branch
- [ ] Perform physical-device sanity pass (auth, add seed, edit supplier, calendar)

## Notes
- Project-wide TypeScript includes pre-existing unrelated Supabase typing issues.
- Those issues were explicitly deprioritized for this release stream and should be addressed separately.
