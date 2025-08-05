# Creating Your MySeedBook Splash Screen

## Quick Start Options

### Option 1: Use the Preview Component (Recommended)
1. **Add the preview component to your app temporarily:**
   ```tsx
   // In your main app file (e.g., app/_layout.tsx)
   import SplashScreenPreview from '../components/SplashScreenPreview';
   
   // Temporarily render it to see the design
   return <SplashScreenPreview />;
   ```

2. **Take a screenshot or export:**
   - Run your app in simulator/emulator
   - Take screenshot at highest resolution
   - Save as `splash.png` in `./assets/images/`

### Option 2: Use the SVG Template
1. **Open the SVG file:** `./assets/splash-template.svg`
2. **Edit in design tool:**
   - Open in Figma, Adobe Illustrator, or Inkscape
   - Customize colors, text, or icons
   - Export as PNG at 1284x2778 pixels
3. **Save as:** `./assets/images/splash.png`

### Option 3: Create from Scratch
Use the specifications in `SPLASH_SCREEN_GUIDE.md` to create your own design.

## Current Configuration

Your `app.json` is already updated to use:
```json
"splash": {
  "image": "./assets/images/splash.png",
  "resizeMode": "contain", 
  "backgroundColor": "#f0f9f0"
}
```

## Design Specs

- **Size**: 1284x2778 pixels (optimal)
- **Background**: #f0f9f0 (light green)
- **Primary Color**: #2d7a3a (green)
- **Text Color**: #1a472a (dark green)
- **Format**: PNG

## Testing Your Splash Screen

Once you have your `splash.png` file:

```bash
# Test in development
npx expo start

# Test production build
eas build --platform android --profile preview
```

## Design Elements to Include

✅ **MySeedBook Catalogue** app name  
✅ **Plant/seed icon** (using Sprout icon)  
✅ **Your brand colors** (greens matching theme)  
✅ **Tagline** "Your Garden's Digital Memory"  
✅ **Professional appearance** for app stores  
✅ **Centered layout** works on all screen sizes  

## Next Steps

1. Choose one of the three options above
2. Create your `splash.png` file (1284x2778px)
3. Save to `./assets/images/splash.png`
4. Test with `npx expo start`
5. Your splash screen is ready!

The splash screen will automatically appear when users open your MySeedBook Catalogue app, giving them a professional first impression while the app loads.
