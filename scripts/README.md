# Build Scripts for MySeedBook Catalogue

## Quick Commands (via npm/yarn)

### Icon Testing & Preview Builds
```bash
# Test icon and build preview (recommended for icon testing)
npm run quick:preview

# Just validate icon without building
npm run test:icon

# Build preview for Android
npm run build:preview

# Build preview for iOS
npm run build:preview:ios

# Build preview for both platforms
npm run build:preview:all
```

### Production Builds
```bash
# Build production Android
npm run build:prod

# Build production iOS
npm run build:prod:ios

# Build production for both platforms
npm run build:prod:all
```

### Web Build
```bash
# Build for web (fastest way to test basic functionality)
npm run build:web
```

## Advanced Usage (Direct Script)

### Windows (PowerShell)
```powershell
# Basic preview build with icon validation
.\scripts\build-and-test.ps1 -BuildType preview -IconTest

# Production build for all platforms
.\scripts\build-and-test.ps1 -BuildType production -Platform all

# Web build only
.\scripts\build-and-test.ps1 -BuildType web
```

### macOS/Linux (Bash)
```bash
# Basic preview build with icon validation
./scripts/build-and-test.sh --build-type preview --icon-test

# Production build for all platforms
./scripts/build-and-test.sh --build-type production --platform all

# Web build only
./scripts/build-and-test.sh --build-type web
```

## Build Types Explained

| Build Type | Purpose | Best For |
|------------|---------|----------|
| `preview` | APK/IPA for testing | **Icon testing**, sharing with testers |
| `production` | App store ready | Final release, store submission |
| `development` | Development client | Development/debugging |
| `web` | Web version | Quick testing, demos |

## Platform Options

- `android` - Android APK/AAB only
- `ios` - iOS IPA only  
- `all` - Both platforms

## Icon Testing Workflow

1. **Prepare your icon** (1024x1024 square PNG)
2. **Replace** `assets/images/icon.png` with your new icon
3. **Run icon test**: `npm run test:icon`
4. **Build preview**: `npm run quick:preview`
5. **Download and install** the APK/IPA on your device
6. **Verify icon** appears correctly on home screen

## Prerequisites

Before running these scripts, ensure you have:

1. **EAS CLI installed**: `npm install -g @expo/eas-cli`
2. **EAS account**: Sign up at [expo.dev](https://expo.dev)
3. **Logged in**: Run `eas login`
4. **Project configured**: Your `eas.json` should be properly set up

## Build Monitoring

After starting a build:

1. **Check build status**: Visit your [EAS Dashboard](https://expo.dev)
2. **Download builds**: Available in dashboard when complete
3. **Install on device**: Use the download link or QR code
4. **Test thoroughly**: Verify all features work correctly

## Troubleshooting

### Common Issues

- **"Not logged in"**: Run `eas login`
- **"Project not found"**: Ensure you're in the correct directory
- **"Build failed"**: Check build logs in EAS dashboard
- **"Icon not found"**: Ensure `assets/images/icon.png` exists

### Icon Issues

- **Icon appears stretched**: Ensure it's exactly square (1024x1024)
- **Icon too small**: File might be compressed, try larger file size
- **Icon not appearing**: Check file path and permissions

### Build Issues

- **Out of build minutes**: Upgrade EAS plan or wait for reset
- **iOS build fails**: Check provisioning profiles and certificates
- **Android build fails**: Check signing configuration

## Next Steps After Successful Build

1. ✅ **Install on test devices**
2. ✅ **Verify icon and branding**
3. ✅ **Test all core features**
4. ✅ **Performance testing**
5. ✅ **Prepare store assets** (screenshots, descriptions)
6. ✅ **Submit to app stores**
