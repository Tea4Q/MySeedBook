# App Icon Requirements

## Current Status
- ✅ App configuration updated for proper icon handling
- ⚠️ Current icon needs to be replaced with 1024x1024 square version

## Required Icon Specifications

### Master Icon (for app stores)
- **Size**: 1024x1024 pixels
- **Format**: PNG (no transparency for iOS)
- **Color space**: sRGB
- **File name**: `icon.png`
- **Location**: `./assets/images/icon.png`

### Design Guidelines
- **Square format** (not rectangular like current 221x177)
- **No rounded corners** (platforms handle this automatically)
- **High contrast** and **clear at small sizes**
- **Consistent with your app's gardening theme**
- **Professional appearance** for app stores

## Platform-Specific Requirements

### iOS App Store
- 1024x1024 pixels (required for App Store Connect)
- No alpha channel/transparency
- No rounded corners
- RGB color space

### Google Play Store
- 512x512 pixels minimum (1024x1024 recommended)
- 32-bit PNG with alpha channel support
- High-resolution icon for high-density displays

### Android Adaptive Icons
- Your current configuration uses the same icon for adaptive icons
- Background color: `#f0f9f0` (light green to match your theme)
- Foreground image: Your main icon

## Expo Icon Generation
When you provide a 1024x1024 master icon, Expo will automatically generate:
- iOS: All required sizes (20x20 to 1024x1024)
- Android: All density variants (mdpi to xxxhdpi)
- Web: Favicon and PWA icons

## Next Steps

1. **Create/commission a 1024x1024 square icon**
   - Consider hiring a designer or using design tools like:
     - Figma (free)
     - Canva (templates available)
     - Adobe Illustrator
     - Sketch

2. **Replace the current icon**
   ```bash
   # Save the new icon as:
   ./assets/images/icon.png
   ```

3. **Test the icon**
   ```bash
   # Build preview to see the icon
   eas build --platform android --profile preview
   ```

4. **Verify icon appears correctly**
   - Check app icon on device home screen
   - Verify in app stores (when submitting)
   - Test on different device sizes

## Design Tips for Your Gardening App

Consider these elements for your icon:
- 🌱 Plant/seedling motif
- 📱 Simple, recognizable symbol
- 🎨 Your brand colors (#336633 green)
- 📏 Clear visibility at 16x16 pixels (smallest size)
- 🔍 Distinctive from other gardening apps

## Current App Configuration

Your `app.json` is now properly configured with:
- ✅ Global icon path: `./assets/images/icon.png`
- ✅ iOS configuration (no separate icon needed)
- ✅ Android adaptive icon with background color
- ✅ Web favicon configuration

Simply replace the current `icon.png` file with your new 1024x1024 version and Expo will handle all the size generation automatically!
