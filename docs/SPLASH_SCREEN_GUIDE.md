# Splash Screen Implementation Guide

## Current Status
- ✅ Basic splash configuration exists in app.json
- 🔄 **Needs dedicated splash screen image and configuration**

## What is a Splash Screen?
A splash screen is the first screen users see when they launch your app. It appears while the app is loading and provides a professional, branded experience.

## Current Configuration
Your app.json currently has basic splash screen settings:
```json
"splash": {
  "image": "./assets/images/icon.png",
  "resizeMode": "contain", 
  "backgroundColor": "#f0f9f0"
}
```

## Recommended Splash Screen Design

### Image Specifications
- **Optimal Size**: 1284x2778 pixels (iPhone 14 Pro Max resolution)
- **Minimum Size**: 1242x2436 pixels  
- **Format**: PNG with transparency support
- **File name**: `splash.png`
- **Location**: `./assets/images/splash.png`

### Design Guidelines
- **Center your logo/brand**: Keep important elements in the center
- **Safe area**: Leave margins on all sides (at least 100px)
- **Background**: Can be transparent or match your app's theme
- **Text**: Minimal or no text (consider different languages)
- **Loading indicator**: Usually handled by the platform

## Design Recommendations for MySeedBook Catalogue

### Option 1: Minimalist Design
- **Background**: Light green gradient (#f0f9f0 to #e8f5e8)
- **Center element**: App logo with "MySeedBook" text
- **Icon**: Seed or plant motif
- **Style**: Clean, professional gardening theme

### Option 2: Illustrative Design  
- **Background**: Subtle plant/garden illustration
- **Center**: App name and tagline
- **Colors**: Your theme colors (greens, earth tones)
- **Feel**: Warm, inviting, nature-focused

### Option 3: Photo-based Design
- **Background**: Blurred seed/garden photo
- **Overlay**: Semi-transparent layer
- **Center**: Logo and app name
- **Mood**: Authentic, real gardening experience

## Implementation Steps

### Step 1: Create Splash Screen Image
You'll need to create a 1284x2778 pixel PNG image. Tools you can use:
- **Figma** (free, web-based)
- **Canva** (templates available)
- **Adobe Photoshop/Illustrator**
- **GIMP** (free alternative)

### Step 2: Update app.json Configuration
```json
"splash": {
  "image": "./assets/images/splash.png",
  "resizeMode": "cover",
  "backgroundColor": "#f0f9f0"
}
```

### Step 3: Platform-Specific Considerations

#### iOS Splash Screens
- iOS will automatically handle different screen sizes
- Your splash should work on both iPhone and iPad
- Consider dark mode variant (optional)

#### Android Splash Screens  
- Android 12+ uses new splash screen API
- Your image will be automatically resized
- Background color is important for consistency

#### Web PWA
- Splash screen also appears when installing as PWA
- Should match your web app's loading experience

## Advanced Configuration Options

### Resize Modes
- **"contain"**: Image fits within screen, maintains aspect ratio
- **"cover"**: Image covers entire screen, may crop edges  
- **"stretch"**: Image stretches to fill screen (not recommended)

### Dark Mode Support
```json
"splash": {
  "image": "./assets/images/splash.png",
  "dark": {
    "image": "./assets/images/splash-dark.png", 
    "backgroundColor": "#1a472a"
  },
  "backgroundColor": "#f0f9f0"
}
```

## Brand Consistency

Your splash screen should:
- ✅ Match your app icon design
- ✅ Use your brand colors (#336633, #f0f9f0)
- ✅ Feel cohesive with your app's overall design
- ✅ Load quickly (keep file size reasonable)
- ✅ Look professional in app stores

## Testing Your Splash Screen

### Development Testing
```bash
# Test on iOS simulator
npx expo run:ios

# Test on Android emulator  
npx expo run:android

# Test web version
npx expo start --web
```

### Production Testing
```bash
# Build preview to test splash screen
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## Next Steps

1. **Design your splash screen image**
   - Use your brand colors and logo
   - Keep it simple and professional
   - Test on different screen sizes

2. **Save as splash.png**
   - 1284x2778 pixels recommended
   - Save to `./assets/images/splash.png`

3. **Update app.json**
   - Change image path from icon.png to splash.png
   - Adjust resizeMode if needed
   - Test background color

4. **Test thoroughly**
   - Different devices and orientations
   - Both development and production builds
   - Light and dark modes if supported

## Pro Tips

- **Keep it fast**: Splash screens should load quickly
- **Brand recognition**: Users should immediately know it's your app
- **Consistency**: Should feel connected to your app's main interface
- **Accessibility**: Ensure good contrast for readability
- **Future-proof**: Design should work as your app evolves

Your current gardening theme with green colors (#f0f9f0 background) is perfect for a nature-focused app like MySeedBook Catalogue!
