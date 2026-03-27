# Google Play Store Reviewer Instructions

**App Name**: MySeedBook Catalogue  
**Package**: com.myseedbook.catalogue  
**Version**: 1.3.2  
**Date**: November 11, 2025

## App Access for Reviewers

This app provides **two ways** for reviewers to test all functionality:

---

## Option 1: Guest Mode (Recommended - No Login Required)

### How to Access
1. Launch the app
2. On the login screen, tap **"Continue as Guest"**
3. All core features are immediately available

### What You Can Test in Guest Mode
- ✅ Add and manage seeds (up to 10 seeds - free tier limit)
- ✅ Add and manage suppliers (up to 5 suppliers - free tier limit)
- ✅ View calendar and planting schedules
- ✅ Browse inventory and filter seeds
- ✅ Edit and delete seed entries
- ✅ Add seed photos via camera or gallery
- ✅ View app settings and theme options
- ✅ Submit feedback

### Guest Mode Limitations
- Data is stored locally on device only
- Limited to free tier features (seeds/suppliers limits)
- No cloud sync across devices
- Premium features show upgrade prompts (expected behavior)

---

## Option 2: Test Account with Full Access

If you prefer to test with a registered account:

### Test Account Credentials

**Email**: `ReviewTester@gmail.com`  
**Password**: `Test032026`

### How to Sign In
1. Launch the app
2. On the login screen, enter the email and password above
3. Tap **"Sign In"**
4. All features are immediately available

### What You Can Test with Test Account
- ✅ All Guest Mode features (without limits)
- ✅ Cloud sync and data persistence
- ✅ Unlimited seeds and suppliers
- ✅ Cross-device data synchronization
- ✅ Account settings and profile management
- ✅ Sign out and sign back in

### Test Account Notes
- This is a standard free-tier account
- Premium features will show upgrade prompts
- Account data may be reset periodically for testing

---

## Premium Features Testing

### Premium Features (In-App Purchase Required)
The following features require a premium subscription and will show an upgrade prompt when accessed:

1. **Weather Integration** - Weather-based planting recommendations
2. **Barcode Scanner** - Scan seed packages for quick data entry (mobile only)
3. **Advanced Analytics** - Detailed garden insights and reports
4. **Priority Support** - Direct support channel

### How Premium Prompts Work
- When tapping a premium feature, an upgrade modal appears
- Modal shows Essential pricing ($7.99/month or $63.99/year) and Voice & AI pricing ($9.99/month or $79.99/year)
- This is expected behavior for free users
- **Testing Note**: Premium features cannot be activated without actual purchase

### Premium Purchase Flow (Optional)
If you wish to test the purchase flow:
1. Tap any premium feature
2. Review the upgrade modal design and copy
3. Premium features use standard Google Play Billing
4. **Do not complete the purchase** - testing the UI is sufficient

---

## Testing Scenarios

### Basic Functionality Test (5-10 minutes)
1. ✅ Use Guest Mode or Test Account
2. ✅ Add 2-3 seeds with photos
3. ✅ Add 1-2 suppliers
4. ✅ View calendar
5. ✅ Edit a seed entry
6. ✅ Delete a seed entry
7. ✅ Navigate between tabs
8. ✅ Check settings/theme

### Premium Feature Test (3-5 minutes)
1. ✅ Tap Weather tab (premium prompt appears)
2. ✅ Tap scan button on Add Seed screen (premium prompt appears)
3. ✅ Review premium modal design
4. ✅ Close modals and continue using app

### Authentication Test (2-3 minutes)
1. ✅ Sign out (if using test account)
2. ✅ Sign in with test account
3. ✅ Try "Continue as Guest"
4. ✅ Verify data persists (for test account) or resets (for guest)

---

## Known Limitations & Expected Behavior

### Free Tier Limits
- **10 seeds maximum** - Expected limit for free users
- **5 suppliers maximum** - Expected limit for free users
- When limits reached, app shows upgrade prompt

### Guest Mode Specifics
- Data stored locally only (no cloud backup)
- Data cleared when app is uninstalled
- Cannot access premium features

### Platform-Specific Features
- **Barcode Scanner**: Only available on mobile (iOS/Android), not on tablets without camera
- **Weather Integration**: Requires location permission (premium feature)
- **Camera Access**: Requires camera permission for photo uploads

---

## Permissions

The app requests the following permissions:

### Required Permissions
- **Camera** - For taking seed photos and barcode scanning (premium)
- **Photo Library** - For selecting seed images from gallery

### Optional Permissions
- **Location** (Premium feature) - For weather integration
- **Notifications** (Future feature) - For planting reminders

### Permission Handling
- All permissions requested only when needed
- Clear explanations provided for each permission
- App functions without optional permissions

---

## Support & Feedback

### In-App Feedback
- Navigate to **Settings** → **Feedback**
- Test the feedback submission form
- Feedback is sent directly to developer

### Contact Information
- **Developer**: Chandra Skinner
- **Support Email**: support@myseedbook.com (fictional for demo)
- **Website**: https://myseedbook.com (fictional for demo)

---

## Technical Information

### Minimum Requirements
- **Android**: 8.0 (API 26) or higher
- **iOS**: 13.0 or higher
- **Storage**: ~50 MB
- **Internet**: Required for authentication and cloud features

### Privacy & Data
- Authentication via Supabase (PostgreSQL backend)
- Guest data stored locally on device
- Registered user data encrypted in cloud
- No third-party analytics or tracking
- Privacy policy available in app settings

---

## Troubleshooting

### Cannot Sign In
- **Solution**: Use "Continue as Guest" option
- Guest mode provides full testing capability

### Premium Features Not Working
- **Expected**: Premium features show upgrade prompts for free users
- This is correct behavior and should not be considered a bug

### Camera Not Working
- **Check**: Device has camera and permission granted
- Barcode scanner only works on phones/tablets with cameras

### App Crashes or Freezes
- Please report with:
  - Device model
  - Android/iOS version
  - Steps to reproduce

---

## Review Checklist

- [ ] Tested Guest Mode access
- [ ] Added and managed seeds
- [ ] Added and managed suppliers
- [ ] Navigated all main tabs
- [ ] Viewed calendar functionality
- [ ] Tested photo upload
- [ ] Checked premium feature prompts
- [ ] Reviewed settings and options
- [ ] Verified permissions requests
- [ ] Tested feedback submission

---

**Last Updated**: November 11, 2025  
**For Questions**: Contact developer via app feedback or support email

Thank you for reviewing MySeedBook Catalogue!
