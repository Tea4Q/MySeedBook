# Google Play Store Production Build Guide

## 📋 Pre-Build Checklist

### 1. Environment Setup
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into Expo: `eas login`
- [ ] Project configured with EAS: `eas build:configure`

### 2. App Configuration Review

#### Current App Details (app.json):
- **App Name**: MySeedBook Catalogue
- **Package Name**: com.myseedbook.catalogue
- **Version**: 1.3.0
- **Version Code**: 13
- **Bundle Identifier (iOS)**: com.myseedbook.catalogue

### 3. Required Assets ✅
- [x] App Icon: `./assets/images/icon1.png` (512x512px recommended)
- [x] Adaptive Icon: Configured with foreground image
- [x] Splash Screen: `./assets/images/splashScreenImage.png`
- [x] Favicon: `./assets/images/favicon.png`

### 4. Permissions Configured ✅
- [x] Camera
- [x] Photo Library
- [x] Location (for weather)
- [x] Storage

---

## 🚀 Building for Google Play Store

### Step 1: Pre-Build Verification

Run this checklist script:
```powershell
# Verify all environment variables
Write-Host "Checking environment setup..." -ForegroundColor Cyan
Write-Host "✓ SUPABASE_URL: $env:EXPO_PUBLIC_SUPABASE_URL" -ForegroundColor Green
Write-Host "✓ WEATHER_API_KEY exists: $($null -ne $env:EXPO_PUBLIC_WEATHER_API_KEY)" -ForegroundColor Green

# Check EAS login
eas whoami
```

### Step 2: Build Production App Bundle (.aab)

**Option A: App Bundle for Google Play (Recommended)**
```bash
eas build --platform android --profile production
```

**Option B: APK for Testing**
```bash
eas build --platform android --profile production-apk
```

### Step 3: Monitor Build Progress

1. Build will start on Expo's servers
2. You'll receive a link to monitor progress: `https://expo.dev/accounts/[your-account]/projects/[project]/builds/[build-id]`
3. Build typically takes 10-15 minutes
4. You'll receive an email when complete

### Step 4: Download Build

Once complete, download the `.aab` or `.apk` file:
```bash
# Download latest build
eas build:list
```

Or download from the Expo dashboard build page.

---

## 📱 Google Play Store Submission

### Step 1: Create Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay one-time $25 registration fee (if not already registered)
3. Complete account setup

### Step 2: Create Your App

1. Click **"Create app"**
2. Fill in required information:
   - **App name**: MySeedBook Catalogue
   - **Default language**: English (United States)
   - **App type**: App
   - **Free or paid**: Free (with in-app purchases)
   - **Declarations**: Complete all required declarations

### Step 3: Store Listing

#### App Details
```
App name: MySeedBook Catalogue
Short description: Manage your seed collection with weather integration
Full description: See STORE_LISTING.md for complete description
```

#### Graphics Requirements
- **App icon**: 512x512 PNG (32-bit with alpha)
- **Feature graphic**: 1024x500 JPG or PNG
- **Phone screenshots**: At least 2 (1080x1920 or 1080x2340)
- **7-inch tablet screenshots**: At least 2 (optional but recommended)
- **10-inch tablet screenshots**: At least 2 (optional but recommended)

#### Categorization
- **Category**: Lifestyle / Home & Garden
- **Content rating**: Complete questionnaire
- **Target audience**: All ages
- **Tags**: gardening, seeds, plants, weather, tracking

### Step 4: App Content

Complete all required sections:
- **Privacy Policy**: [Your website]/privacy-policy (see docs/PRIVACY_POLICY.md)
- **App Access**: Open (no special access needed)
- **Ads**: No ads
- **Content Rating**: Complete questionnaire
- **Target Audience**: All ages
- **News App**: No
- **COVID-19 Contact Tracing**: No
- **Data Safety**: Complete data collection disclosure

#### Data Safety Declarations
```
Data collected:
✓ Location data (approximate) - for weather features
✓ Photos - for plant/seed images
✓ Email address - for account creation

Data shared: None

Data security:
✓ Data is encrypted in transit
✓ Users can request data deletion
✓ Committed to Google Play's Families Policy
```

### Step 5: Release Setup

#### Internal Testing Track (First Release)
1. Go to **"Testing" → "Internal testing"**
2. Create new release
3. Upload your `.aab` file
4. Add release notes:
   ```
   Initial release of MySeedBook Catalogue v1.3.0
   
   Features:
   - Seed collection management
   - Supplier tracking
   - Weather integration
   - Premium features with subscriptions
   - Calendar and planting reminders
   ```
5. Add testers (at least 20 testers required for 14 days)
6. Click **"Review release"** → **"Start rollout"**

#### Production Track (After Testing)
1. Go to **"Production"**
2. Create new release
3. Upload your `.aab` file
4. Set rollout percentage (start with 20%, gradually increase)
5. Add release notes
6. Click **"Review release"** → **"Start rollout"**

---

## 🔐 App Signing

### Google Play App Signing (Recommended)

Google Play will automatically handle app signing when you upload your first `.aab`.

**Benefits:**
- Google manages your signing key
- Supports multiple APKs/bundles
- Easier updates
- Play App Signing protection

**How it works:**
1. Upload your `.aab` file
2. Google Play generates and manages signing keys
3. Future updates must be signed by EAS with the same upload key

### Verify Signing
```bash
# Check if your build is properly signed
eas build:list --platform android
```

---

## 💰 In-App Purchases Setup

### Step 1: Configure In-App Products

1. Go to **"Monetize" → "Products" → "In-app products"**
2. Create subscription products:

#### Premium Monthly
```
Product ID: myseedbook_premium_monthly
Name: Premium Monthly
Description: Full access to all MySeedBook features
Billing period: 1 month
Price: $5.99 USD
Free trial: 7 days (optional)
```

#### Premium Yearly
```
Product ID: myseedbook_premium_yearly
Name: Premium Yearly
Description: Full access to all MySeedBook features (Save 33%)
Billing period: 1 year
Price: $49.99 USD
Free trial: 7 days (optional)
```

### Step 2: Link Products in Code

The app is already configured to use these product IDs in:
- `utils/premiumManager.ts`
- `components/PremiumModal.tsx`

---

## 📊 Post-Release Monitoring

### Dashboard Metrics to Monitor
- **Installs**: Track daily/weekly growth
- **Uninstalls**: Monitor and investigate spikes
- **Ratings**: Respond to user reviews
- **Crashes**: Fix critical issues immediately
- **ANRs**: Application Not Responding errors

### Analytics Setup
Consider integrating:
- Google Analytics for Firebase
- Crashlytics for crash reporting

---

## 🔄 Update Process

### For Future Updates

1. **Update version in app.json**:
   ```json
   "version": "1.3.1",  // Increment version
   "android": {
     "versionCode": 14  // Auto-incremented by EAS
   }
   ```

2. **Build new version**:
   ```bash
   eas build --platform android --profile production
   ```

3. **Upload to Play Console**:
   - Go to Production track
   - Create new release
   - Upload new `.aab`
   - Add release notes
   - Roll out

### OTA Updates (for minor changes)

For JavaScript-only changes (no native code):
```bash
eas update --branch production --message "Bug fixes and improvements"
```

---

## ✅ Pre-Submission Checklist

Before submitting to Google Play:

### Technical
- [ ] Production build successfully created
- [ ] .aab file downloaded and verified
- [ ] App tested on multiple Android devices/emulators
- [ ] All features working (seeds, suppliers, weather, premium)
- [ ] No crashes or critical bugs
- [ ] Permissions properly requested and explained
- [ ] Network requests over HTTPS only
- [ ] API keys secure (not hardcoded)

### Legal & Privacy
- [ ] Privacy Policy URL ready
- [ ] Terms of Service URL ready
- [ ] Data Safety form completed
- [ ] Content rating questionnaire completed
- [ ] App complies with Google Play policies

### Store Listing
- [ ] App name finalized
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (at least 2 for phones)
- [ ] Promotional video (optional)
- [ ] Category selected
- [ ] Tags added

### Monetization
- [ ] In-app products created
- [ ] Pricing set for all regions
- [ ] Free trial period configured (optional)
- [ ] Subscription product IDs match code

---

## 🐛 Common Issues & Solutions

### Issue: Build Fails
**Solution**: Check build logs on Expo dashboard, ensure all dependencies are compatible

### Issue: App Crashes on Launch
**Solution**: Test with `production-apk` profile first, check for missing environment variables

### Issue: In-App Purchases Not Working
**Solution**: Ensure app is signed and published (at least in internal testing), products are active

### Issue: Upload Rejected
**Solution**: Check Google Play Console for specific reasons, common issues:
- Missing privacy policy
- Data safety form incomplete
- Content rating not completed
- App targets outdated Android version

---

## 📞 Support Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Google Play Console**: https://play.google.com/console
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **Expo Forums**: https://forums.expo.dev
- **React Native Community**: https://reactnative.dev/help

---

## 🎉 Quick Start Commands

```bash
# 1. Login to EAS
eas login

# 2. Build production app bundle
eas build --platform android --profile production

# 3. Check build status
eas build:list

# 4. Submit to Google Play (after setting up service account)
eas submit --platform android --latest
```

---

**Version**: 1.0  
**Last Updated**: October 30, 2025  
**App Version**: 1.3.0  
**Build Type**: Production Release
