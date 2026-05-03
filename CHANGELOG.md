# May 2026

## v1.3.1 — Voice & AI Launch + Post-Release Fixes

### New Features
- Voice & AI subscription tier now fully live in production
- AI Garden Assistant and Voice Notes features accessible to Voice & AI subscribers

### Bug Fixes
- **RevenueCat entitlement** — Voice & AI product was not linked to an entitlement in the RevenueCat dashboard; adding it resolved all silent upgrade failures for the Voice & AI tier
- **EAS environment variables** — Deleted 4 incorrect account-scoped PUBLIC vars that were overriding correct project-scoped secrets; all API keys (Supabase URL, Supabase anon key, RevenueCat iOS key, RevenueCat Android key) are now project-scoped secrets only
- **Upgrade button dead-end** — AI screen and Voice Notes upgrade buttons now go directly to the paywall modal instead of an Alert with only "Not Now"
- **Voice Notes price** — Upgrade prompt now correctly shows $9.99/month for Voice & AI features (was showing $7.99 Essential price)
- **Camera/gallery upload on mobile** — Fixed "Network request failed" error on native by switching from `fetch(uri).blob()` to `expo-file-system` `File.arrayBuffer()` for reading file:// and content:// URIs
- **URL image paste** — Pasting a webpage URL (not a direct image link) now shows an Alert with guidance to long-press the image and copy the image address, instead of silently showing "Failed to load image"
- **Seed card supplier overflow** — Long supplier names (e.g. "Southern Exposure Seed Exchange") no longer extend beyond the card edge; truncated with ellipsis

### Infrastructure
- New production build (Build 25) triggered with correct API keys after EAS var cleanup
- Multiple OTA updates pushed to production channel for above fixes

---

# March 2026

- Release-prep update for `release/v1.3.0-pre-ai` to keep Apple review scope on stable features
- Hid in-app Voice and AI purchase messaging for this branch and marked advanced voice/AI as coming in v1.3.1
- Added full web image ingestion support (file picker, paste from clipboard, drag and drop)
- Added a full-page drag overlay on web to improve discoverability during file drop
- Expanded accepted image formats in web flows to JPG, PNG, GIF, WebP, and AVIF
- Fixed calendar add-event modal reopen loop by clearing one-time route params after use
- Added unsaved-changes protection plus draft autosave/restore in Add Seed
- Added matching unsaved-changes protection plus per-record draft autosave/restore in Edit Supplier

- Updated subscription structure to standalone Essential and Voice & AI Entry tiers
- Updated RevenueCat product IDs and entitlement model for Essential and Voice plans
- Reworked the upgrade screen with branded sprout imagery, monthly/yearly pricing, privacy and legal links, restore purchases access, and Advanced AI coming soon messaging
- Added website-ready Terms of Service and Delete/Restore Purchases policy files under `docs/legal`

# MySeedBook Catalogue - Development Changelog

## Version 1.3.2 - November 10, 2025
*Camera Integration & Mobile UI Fixes*

### 🔧 Bug Fixes & Improvements
- **Replaced expo-barcode-scanner with expo-camera**
  - Fixed Kotlin compilation errors in Android builds
  - Resolved Gradle build failures related to barcode scanner
  - Migrated to expo-camera with barcode scanning capabilities
  - More stable and better maintained by Expo team
  - Updated BarcodeScannerModal to use CameraView component

- **Premium Modal Scrolling Fixes**
  - Fixed scrolling issues on Samsung S25 Edge and similar devices
  - Changed modal height from fixed `height: '90%'` to `maxHeight: '90%'`
  - Added proper ScrollView contentContainerStyle for bottom padding
  - Improved footer spacing (60px bottom padding + 20px top margin)
  - Restructured overlay to prevent interference with scroll gestures
  - Ensures all premium upgrade buttons are visible and accessible

### 🏗️ Technical Improvements
- Updated app.json with expo-camera plugin configuration
- Removed expo-barcode-scanner from dependencies
- Updated package.json and package-lock.json
- Fixed modal layout for better mobile responsiveness

---

## Version 1.3.1 - November 8, 2025
*Barcode Scanner & Premium Features Enhancement*

### 🎯 New Features
- **Barcode Scanner (Premium)**
  - Scan seed package barcodes for quick inventory entry
  - Mobile-only feature (iOS/Android) with camera integration
  - Premium-gated with upgrade prompts for free users
  - Brand recognition for major seed companies (Burpee, Ferry-Morse, Botanical Interests, etc.)
  - Open Food Facts API integration for seed package information
  - Auto-fill seed name, type, variety, and description from scanned data
  - Floating scan button on inventory screen for quick access
  - Scan button on add-seed form

### 🔧 Bug Fixes & Improvements
- **Premium Settings UI**
  - Added "Barcode Scanner" to premium features list display
  - Added floating back button for proper navigation
  - Implemented development toggle for testing premium features
  - Fixed premium status checking in BarcodeScannerModal
  - Added `enableTestPremium()` and `disableTestPremium()` methods to premiumManager

- **Weather Screen**
  - Fixed infinite loading spinner issue
  - Consolidated duplicate `useEffect` hooks
  - Proper loading state management when premium access is denied
  - Eliminated race conditions in weather data loading

- **Platform Compatibility**
  - Platform-specific module loading for expo-barcode-scanner
  - Prevents native module loading attempts on web platform
  - Strict iOS/Android detection (`Platform.OS === 'ios' || Platform.OS === 'android'`)
  - Graceful web fallback with "Mobile Feature Only" message

### 📚 Documentation
- Updated README.md with barcode scanner feature
- Updated PROJECT_STATUS.md with completion details
- Created comprehensive BARCODE_SCANNER_FEATURE.md (to be added)
- Added premium features section to README

### 🏗️ Technical Improvements
- Added expo-barcode-scanner dependency with camera permissions
- Created BarcodeScannerModal component (560+ lines)
- Created seedDataLookup utility (260+ lines)
- Updated premiumManager with barcode_scanner feature flag
- Enhanced app.json with camera permission configuration

---

## Version 1.2.0 - September 14, 2025
*Production-Ready Release*

### 🔐 Authentication System Improvements
- **Fixed AuthRetryableFetchError during signup/signin**
  - Enhanced error handling for network connectivity issues
  - Added user-friendly error messages with guest mode guidance
  - Implemented robust fallback systems for poor network conditions
  - Resolved "TypeError: NetworkError when attempting to fetch resource" errors

- **Enhanced Sign-in/Sign-up Flow**
  - Improved error messaging for invalid credentials
  - Added detailed logging for debugging authentication issues
  - Cleaned up debug console logs for production readiness
  - Streamlined user feedback during authentication processes

### 🎨 UI/UX Improvements
- **Fixed Duplicate Banner Issue**
  - Removed overlapping "Create Account" banners on supplier pages
  - Implemented contextual banner display logic
  - GuestStatusBanner on main inventory, DemoBanner on supplier pages
  - Improved visual hierarchy and reduced user confusion

- **Console Log Cleanup**
  - Removed verbose debug logging from production builds
  - Kept critical error logging for troubleshooting
  - Cleaned up authentication flow console output
  - Improved developer experience with focused logging

### 🔧 Code Quality & Maintenance
- **TypeScript & ESLint Fixes**
  - Removed unused imports and variables across components
  - Fixed useCallback dependency issues
  - Resolved TypeScript compilation warnings
  - Improved code maintainability and readability

- **Dependency Management**
  - Removed problematic @expo/metro-config dependency
  - Updated app version to 1.2.0 with versionCode 10
  - Fixed expo-doctor configuration issues
  - Optimized package.json for production builds

### 🏗️ Build & Deployment
- **Production Readiness**
  - Passed comprehensive deployment readiness assessment
  - Fixed EAS build configuration issues
  - Updated app.json schema compliance
  - Resolved Android version downgrade conflicts

- **Development Environment**
  - Improved development server stability
  - Enhanced Android emulator compatibility
  - Fixed Metro bundler caching issues
  - Streamlined development workflow

### 📚 Documentation Updates
- **Comprehensive Documentation Overhaul**
  - Updated PROJECT_STATUS.md with latest achievements
  - Created detailed authentication fix documentation
  - Enhanced guest data system documentation
  - Added deployment readiness checklist

### 🔍 Testing & Quality Assurance
- **Authentication Flow Testing**
  - Verified sign-in/sign-up functionality across platforms
  - Tested guest mode transitions and data persistence
  - Validated network error handling scenarios
  - Confirmed banner display logic across all screens

---

## Previous Releases

### Version 1.1.0 - September 12, 2025
- Initial guest data system implementation
- Basic authentication network error handling
- Splash screen system completion
- EAS build configuration setup

### Version 1.0.0 - Earlier
- Initial project setup and core functionality
- Basic seed and supplier management
- Authentication integration with Supabase
- Core UI/UX implementation

---

## Development Notes

### Key Achievements
1. **Zero Critical Errors**: All blocking issues resolved for production deployment
2. **Professional UX**: Clean, intuitive interface with proper error handling
3. **Robust Authentication**: Network-resilient sign-in/sign-up with guest fallback
4. **Code Quality**: TypeScript compliant, ESLint clean, production-ready
5. **Documentation**: Comprehensive technical documentation for maintenance

### Technical Highlights
- Supabase integration with secure token storage
- Professional guest data system with UUID consistency
- Cross-platform compatibility (Web, Android, iOS)
- Responsive design with theme system
- Production-grade error handling and user feedback

### Ready for Production
✅ All systems tested and verified
✅ Code quality standards met
✅ Documentation complete
✅ Build configuration optimized
✅ User experience polished