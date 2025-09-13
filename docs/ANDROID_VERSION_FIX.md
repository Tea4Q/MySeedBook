# Android Version Downgrade Fix Guide

## Problem
Error: `INSTALL_FAILED_VERSION_DOWNGRADE: Downgrade detected: Update version code X is older than current Y`

## Quick Solutions

### Solution 1: Update Version Code (Recommended)
1. Open `app.json`
2. Find the `android.versionCode` field
3. Increase it to a number higher than the current installed version
4. Rebuild and install

```json
{
  "expo": {
    "android": {
      "versionCode": 5  // Increase this number
    }
  }
}
```

### Solution 2: Uninstall Existing App
```bash
# Find your package name in app.json (android.package)
adb uninstall com.myseedbook.catalogue

# Then reinstall
npx expo run:android
```

### Solution 3: Clean Build
```bash
# Clean everything and rebuild
npx expo run:android --clear-cache
```

### Solution 4: Emulator Reset
1. Close Android emulator
2. Open Android Studio
3. Go to AVD Manager
4. Wipe Data on your emulator
5. Restart emulator
6. Run build again

## Prevention
- Always increment `versionCode` before building
- Use development builds during development
- Keep track of version numbers across team

## Current Project Status
- ✅ Version code updated to 5
- ✅ Main version updated to 1.1.0
- ✅ Guest login features implemented
- 🔄 Building with new version code

## Guest Login Features Added
- Guest authentication without signup required
- Limited actions: 1 seed + 1 supplier + 1 view
- Visual status banner showing remaining actions
- Smooth upgrade path to full account
- Persistent tracking across app sessions
