# Documentation Index

**Status**: Updated February 2026  
**App Version**: 1.3.0 - Production Ready with Weather Integration  

## 📋 Current & Relevant Documentation

### Production & Deployment
- **[PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md)** - Complete production deployment validation
- **[PRODUCTION_READY.md](../PRODUCTION_READY.md)** - Production readiness summary
- **[EAS_BUILD_FIXES.md](EAS_BUILD_FIXES.md)** - EAS build configuration solutions
- **[PRE_BUILD_CHECKLIST.md](PRE_BUILD_CHECKLIST.md)** - Comprehensive pre-build validation
- **[DEPENDENCY_FIXES_NOV_2025.md](DEPENDENCY_FIXES_NOV_2025.md)** - Recent dependency & bundling fixes (✅ Nov 2025)

### Feature Documentation
- **[WEATHER_INTEGRATION.md](WEATHER_INTEGRATION.md)** - Weather integration with premium features (✅ Nov 2025)
- **[FEEDBACK_SYSTEM.md](FEEDBACK_SYSTEM.md)** - User feedback system (✅ Nov 2025)
- **[MONETIZATION_SETUP_GUIDE.md](MONETIZATION_SETUP_GUIDE.md)** - Premium subscription setup
- **[LOGIN_NAVIGATION_FIX.md](LOGIN_NAVIGATION_FIX.md)** - Authentication flow fixes (✅ Completed)
- **[HEADER_REDESIGN.md](HEADER_REDESIGN.md)** - UI/header improvements (✅ Completed)
- **[INVENTORY_UI_IMPROVEMENTS.md](INVENTORY_UI_IMPROVEMENTS.md)** - Responsive design fixes (✅ Completed)
- **[PASSWORD_RESET_FEATURE.md](PASSWORD_RESET_FEATURE.md)** - Password reset implementation
- **[TABLET_SUPPORT.md](TABLET_SUPPORT.md)** - Responsive design for tablets (✅ Completed)

### Development & Testing
- **[DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md)** - Development ideas and progress
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Comprehensive testing procedures
- **[SIMULATOR_TESTING_GUIDE.md](SIMULATOR_TESTING_GUIDE.md)** - Device testing procedures

### Design & UX
- **[THEME_GUIDE.md](THEME_GUIDE.md)** - Theme system documentation
- **[SPLASH_SCREEN_GUIDE.md](SPLASH_SCREEN_GUIDE.md)** - Splash screen implementation
- **[ICON_REQUIREMENTS.md](ICON_REQUIREMENTS.md)** - App icon specifications

### Legal & Marketing
- **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** - Privacy policy template
- **[TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)** - Terms of service template
- **[MARKETING_COPY.md](MARKETING_COPY.md)** - App store descriptions
- **[STORE_DESCRIPTIONS.md](STORE_DESCRIPTIONS.md)** - Marketing copy

## ⚠️ Outdated/Legacy Documentation
*These files contain historical information but may not reflect current implementation*

- **[REBRAND_SUMMARY.md](REBRAND_SUMMARY.md)** - Historical rebranding notes
- **[SIGN_OUT_ERROR_FIX.md](SIGN_OUT_ERROR_FIX.md)** - Legacy sign-out fixes
- **[WEB_PLATFORM_FIXES.md](WEB_PLATFORM_FIXES.md)** - Platform-specific historical fixes
- **[PORTABLE_TABLET_SUPPORT.md](PORTABLE_TABLET_SUPPORT.md)** - Legacy tablet support (superseded by TABLET_SUPPORT.md)
- **[TRACKING_GUIDE.md](TRACKING_GUIDE.md)** - Analytics implementation (may be outdated)

## 📈 Recent Completions


### ✅ February 2026 Propagate Fix Workflow

This repo includes `.github/workflows/propagate-fix.yml` to cherry-pick a fix commit into multiple target branches and open PRs automatically.

### 1) Manual run (workflow_dispatch)

1. Open **GitHub → Actions → Propagate Fix → Run workflow**.
2. Set:
   - `commit_sha`: commit to backport (usually merge commit from `main`)
   - `source_branch`: usually `main`
   - `target_branches`: comma-separated list (example: `release/v1.3.0-pre-ai,feature/voice,feature/weather`)
3. Run workflow.
4. Review created backport PRs and merge after CI passes.

### 2) Label flow (auto on merged PR)

1. Add label `propagate-fix` to a PR targeting `main`.
2. Merge the PR.
3. Workflow triggers on PR close+merge, then:
   - uses `merge_commit_sha`
   - backports to branches from repo variable `PROPAGATE_TARGET_BRANCHES`
   - falls back to default list in workflow if variable is not set
4. Review and merge generated PRs.

### Notes

- If cherry-pick conflicts, workflow reports conflict and skips PR for that branch.
- Resolve conflicts manually by creating a backport branch and opening a PR.


### ✅ November 2025 - Weather Integration & Premium Features:
1. **Weather Integration** - 5-day forecast with animated icons (Meteocons)
2. **Subscription System** - Essential ($7.99 / $63.99) and Voice & AI Entry ($9.99 / $79.99) tiers
3. **Feedback System** - User feedback with Supabase backend
4. **Dependency Fixes** - Resolved bundling issues with pretty-format and Lottie
5. **Web Platform Support** - Fixed Alert compatibility for web
6. **Guest Mode** - Continue as Guest option for unauthenticated users

### ✅ August 2025 - Major Issues Resolved:
1. **Calendar Event Creation Bug** - Fixed missing user_id in auto-generated events
2. **Authentication Security** - Removed all bypass flags for production
3. **Debug Cleanup** - Cleaned console logging while preserving error handling
4. **Responsive Design** - Android orientation switching now works properly
5. **Image URL Handling** - Direct URLs for trusted seed suppliers (RareSeeds, Burpee)

### ✅ Infrastructure Completed:
1. **CI/CD Pipeline** - GitHub Actions for automated testing and deployment
2. **Security Scanning** - Automated checks for production vulnerabilities
3. **Documentation Automation** - Auto-generating API docs
4. **Production Validation** - Comprehensive deployment checklists

## 🎯 Next Steps

1. **Real IAP Integration** - Replace simulated purchases with actual App Store/Google Play IAP
2. **iOS Testing** - Test weather integration and premium features on iOS devices
3. **Production Weather API** - Configure production OpenWeather API key with proper limits
4. **Store Preparation** - Update app store metadata with weather and premium features
5. **Monitoring Setup** - Error tracking and analytics for premium conversion

---

**Last Updated**: November 8, 2025  
**Maintainer**: Development Team  
**Status**: Production Ready - Weather Integration Branch
