# Testing MySeedBook Catalogue on Simulators

## 🚀 Quick Start - Web Testing (Immediate)

The fastest way to test your app right now:

```bash
# Start the development server
npm start

# Choose 'w' for web when prompted
# Or directly:
npx expo start --web
```

Your app will open in your browser at `http://localhost:8081`

## 📱 Android Simulator Setup (Windows)

### Method 1: Android Studio (Recommended)

1. **Download Android Studio**
   - Go to https://developer.android.com/studio
   - Download and install Android Studio
   - Follow the setup wizard

2. **Set up Android SDK**
   ```bash
   # After installation, add to your PATH:
   # C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
   # C:\Users\%USERNAME%\AppData\Local\Android\Sdk\emulator
   ```

3. **Create Virtual Device**
   - Open Android Studio
   - Go to Tools > AVD Manager
   - Click "Create Virtual Device"
   - Choose a device (Pixel 4 recommended)
   - Select system image (API 30+ recommended)
   - Click "Finish"

4. **Test Your App**
   ```bash
   # Start your Expo dev server
   npm start
   
   # Press 'a' for Android or run:
   npx expo run:android
   ```

### Method 2: Expo Go App (Easier, but limited)

1. **Install Expo Go on a physical Android device**
   - Download from Google Play Store
   - Or use an Android emulator with Play Store

2. **Connect to development server**
   ```bash
   npm start
   # Scan the QR code with Expo Go app
   ```

## 🍎 iOS Simulator Setup (Mac Required)

**Note: iOS simulation requires macOS with Xcode**

For Windows users, you have these alternatives:

### Alternative 1: Expo Go on Physical iOS Device
```bash
npm start
# Scan QR code with Camera app or Expo Go
```

### Alternative 2: EAS Build for iOS Testing
```bash
# Build iOS app for testing
eas build --platform ios --profile preview
# Download .ipa file and install via TestFlight or Xcode
```

### Alternative 3: Cloud-based iOS Testing
- **BrowserStack** (https://www.browserstack.com/)
- **AWS Device Farm**
- **Firebase Test Lab**

## 🔧 Current Issues to Fix First

Based on `expo-doctor` results:

### 1. Fix Icon Issue (Critical)
```bash
# Create a square 1024x1024 icon first
# Replace assets/images/icon.png with square version
```

### 2. Clean Up Project Structure
```bash
# If you want to use Expo managed workflow:
rm -rf android ios

# Or add to .gitignore if keeping native folders:
echo "android/" >> .gitignore
echo "ios/" >> .gitignore
```

## 📋 Step-by-Step Testing Guide

### Step 1: Start Development Server
```bash
cd c:\dev\GardeningCatalogue
npm start
```

### Step 2: Choose Your Platform
When the dev server starts, you'll see options:
- **w** - Web browser (instant testing)
- **a** - Android emulator (if set up)
- **i** - iOS simulator (Mac only)

### Step 3: Interactive Testing Menu
```
Metro waiting on exp://192.168.x.x:8081
 
 › Press a │ open Android
 › Press i │ open iOS simulator  
 › Press w │ open web
 › Press r │ reload app
 › Press m │ toggle menu
 › Press ? │ show all commands
```

## 🛠️ Android Studio Installation Script

Here's a PowerShell script to help with Android setup:

```powershell
# Run as Administrator
# Download and install Android Studio
$url = "https://developer.android.com/studio"
Write-Host "Please download Android Studio from: $url"
Write-Host "After installation, run Android Studio and:"
Write-Host "1. Complete the setup wizard"
Write-Host "2. Go to Tools > AVD Manager"
Write-Host "3. Create a new virtual device"
Write-Host "4. Choose Pixel 4 or similar"
Write-Host "5. Download a system image (API 30+)"

# Set up environment variables (adjust path as needed)
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"
Write-Host "Add these to your PATH:"
Write-Host "- $androidHome\platform-tools"
Write-Host "- $androidHome\emulator"
```

## 🐛 Troubleshooting

### Android Issues
```bash
# If adb not found:
# 1. Ensure Android SDK is installed
# 2. Add platform-tools to PATH
# 3. Restart terminal

# If emulator won't start:
# 1. Enable Hyper-V in Windows Features
# 2. Or disable Hyper-V and use HAXM
# 3. Check BIOS virtualization settings
```

### General Issues
```bash
# Clear Expo cache
npx expo start --clear

# Reset Metro bundler
npx expo start --reset-cache

# Check for updates
npx expo install --fix
```

## 🚀 Quick Commands Reference

```bash
# Start development server
npm start

# Start on specific platform
npx expo start --web          # Web browser
npx expo start --android      # Android emulator
npx expo start --ios          # iOS simulator (Mac)

# Build for testing
npm run build:preview         # Preview build (both platforms)
npm run build:preview:ios     # iOS preview only

# Install on connected device
npx expo run:android          # Connected Android device
npx expo run:ios              # Connected iOS device (Mac)
```

## 📱 Testing Checklist

### Core Functionality
- [ ] App loads and displays correctly
- [ ] Navigation between tabs works
- [ ] Add seed functionality
- [ ] Supplier management
- [ ] Calendar features
- [ ] Camera/photo functionality
- [ ] Search and filtering
- [ ] Theme switching (light/dark)

### Platform-Specific
- [ ] Android adaptive icons display correctly
- [ ] Permissions work (camera, storage)
- [ ] Deep linking works
- [ ] Back button behavior (Android)
- [ ] Swipe gestures work
- [ ] Status bar styling

## 🎯 Recommended Testing Flow

1. **Start with Web** (immediate testing)
2. **Set up Android Studio** (1-2 hours)
3. **Test on Android emulator** 
4. **Use physical device** for final testing
5. **Create preview builds** for broader testing

## 📈 Next Steps After Simulator Testing

1. **Fix any issues found**
2. **Test on physical devices**  
3. **Create preview builds**
4. **Performance testing**
5. **Prepare for app store submission**

Remember: Web testing gives you 80% of what you need to verify immediately, while simulators provide the full native experience!
