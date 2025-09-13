# EAS Production Build - Setup Guide

## 🚀 Quick Start

### Prerequisites
1. **EAS CLI installed**: `npm install -g @expo/eas-cli@latest`
2. **Expo account**: Sign up at [expo.dev](https://expo.dev)
3. **EAS logged in**: `eas login`

### Build Commands

#### For Android (Play Store)
```bash
eas build --platform android --profile production
```

#### For iOS (App Store)
```bash
eas build --platform ios --profile production
```

#### For Both Platforms
```bash
eas build --platform all --profile production
```

#### For Android APK (Testing)
```bash
eas build --platform android --profile production-apk
```

---

## 🛠 Automated Build Scripts

### Windows (PowerShell)
```powershell
.\scripts\build-production.ps1
```

### macOS/Linux (Bash)
```bash
./scripts/build-production.sh
```

**Scripts include:**
- Pre-build validation
- Security scanning
- TypeScript checking
- Dependency installation
- Interactive platform selection

---

## 🔧 Production Configuration

### EAS Build Profiles

**Production Profile** (`eas.json`):
- **Distribution**: Store-ready
- **Android**: AAB (App Bundle) for Play Store
- **iOS**: Release configuration
- **Auto-increment**: Version numbers
- **Environment**: NODE_ENV=production

**Production-APK Profile**:
- Same as production but generates APK for testing
- Useful for sharing with testers before store submission

### App Store Configuration

**iOS** (`app.json`):
- Bundle ID: `com.myseedbook.catalogue`
- Encryption: Non-exempt (ITSAppUsesNonExemptEncryption: false)
- Permissions: Camera, Photo Library properly configured

**Android** (`app.json`):
- Package: `com.myseedbook.catalogue`
- Build Type: AAB (App Bundle)
- Permissions: Camera, Storage properly configured

---

## 📋 Pre-Build Checklist

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings reviewed
- [ ] Production security scan passed
- [ ] No authentication bypasses
- [ ] Debug logging cleaned up

### ✅ Configuration
- [ ] Supabase environment URLs configured for production
- [ ] App icons and splash screen finalized
- [ ] App store metadata ready (name, description, keywords)
- [ ] Version numbers incremented

### ✅ Testing
- [ ] All core features tested
- [ ] Authentication flows validated
- [ ] Database operations working
- [ ] Image upload/handling tested
- [ ] Calendar functionality verified

### ✅ Legal & Compliance
- [ ] Privacy policy updated
- [ ] Terms of service current
- [ ] App store guidelines compliance
- [ ] Required permissions justified

---

## 🏪 Store Submission

### Google Play Store
1. **Build**: Use AAB format (production profile)
2. **Upload**: via EAS Submit or manually to Play Console
3. **Testing**: Internal testing track recommended first

```bash
# Auto-submit to Play Store (requires setup)
eas submit --platform android --latest
```

### Apple App Store
1. **Build**: Use production profile
2. **Upload**: via EAS Submit or manually to App Store Connect
3. **Review**: Apple review process typically 24-48 hours

```bash
# Auto-submit to App Store (requires setup)
eas submit --platform ios --latest
```

---

## 🔍 Build Status & Monitoring

### Check Build Status
- **EAS Dashboard**: [expo.dev/accounts/your-account/projects](https://expo.dev/)
- **CLI**: `eas build:list`

### Download Builds
- **Latest**: `eas build:download --latest`
- **Specific**: `eas build:download [build-id]`

### Build Logs
- Available in EAS dashboard
- Download with: `eas build:view [build-id]`

---

## 🚨 Troubleshooting

### Common Issues

**"Project not configured for EAS Build"**
```bash
eas build:configure
```

**"Authentication required"**
```bash
eas login
eas whoami  # Verify login
```

**"Build failed - TypeScript errors"**
```bash
npx tsc --noEmit  # Check locally first
```

**"Missing signing credentials"**
- iOS: EAS handles automatically or use existing certificates
- Android: EAS generates keystore or use existing

### Environment Issues
- Verify `eas.json` profiles are correct
- Check `app.json` configuration
- Ensure production environment variables are set

---

## 📱 Testing Production Builds

### Android
1. **Internal Testing**: Upload to Play Store internal track
2. **APK Testing**: Use production-apk profile for direct installation
3. **Device Testing**: Test on multiple Android versions/devices

### iOS
1. **TestFlight**: Upload to App Store Connect for beta testing
2. **Device Testing**: Test on various iOS versions/devices
3. **Simulator**: Limited testing, physical devices recommended

---

## 🎯 Success Criteria

### Build Success
- ✅ Build completes without errors
- ✅ All platforms build successfully
- ✅ Version numbers increment correctly
- ✅ File sizes within reasonable limits

### Quality Assurance
- ✅ App launches correctly
- ✅ All major features functional
- ✅ No crashes on startup
- ✅ Performance acceptable on target devices

### Store Readiness
- ✅ Meets platform guidelines
- ✅ Required metadata complete
- ✅ Privacy policy accessible
- ✅ All required permissions justified

---

**Ready to build?** Run the automated script or use the EAS commands directly!
