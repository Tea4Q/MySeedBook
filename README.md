# MySeedBook Catalogue 🌱

A comprehensive digital gardening companion built with Expo and React Native. Track your seed inventory, plan plantings, and manage your garden with a modern, responsive interface that works across mobile, tablet, and web platforms.

## 🌟 Features

### � Cross-Platform Support
- **Mobile Apps**: Native iOS and Android applications
- **Web Platform**: Full-featured web application  
- **Tablet Optimized**: Responsive design with 2-column layouts
- **Unified Experience**: Consistent functionality across all platforms

### 🌿 Seed Management
- **Digital Inventory**: Track seed varieties, quantities, and suppliers
- **Rich Descriptions**: Scrollable text areas with detailed growing information
- **Visual Organization**: Color-coded seed types with intuitive icons
- **Search & Filter**: Quick discovery of seeds in your collection
- **Barcode Scanner** (Premium): Scan seed package barcodes for quick inventory entry
- **Flexible Web Image Input**: Add images by file picker, clipboard paste, or drag-and-drop
- **Broad Image Format Support**: JPG, PNG, GIF, WebP, and AVIF on web flows

### 📅 Garden Planning
- **Planting Calendar**: Schedule and track planting activities
- **Season Management**: Track planting and harvest seasons
- **Quick Navigation**: Double-tap seeds to create calendar events
- **Weather Integration** (Premium): 5-day forecast with animated icons and gardening insights

### 🎨 Modern Interface
- **Responsive Grid**: Optimized 2-column layout for larger screens
- **Touch-Friendly**: Swipe gestures on mobile, action buttons on web
- **Smooth Scrolling**: Enhanced description areas with proper scroll handling
- **Platform-Aware**: Interface adapts to each platform's conventions

### 💎 Subscription Plans
- **Free**: Limited inventory for trying the app
- **Essential**: $7.99/month or $63.99/year for unlimited seeds, weather integration, and cloud sync across devices
- **Voice & AI**: Planned for a future release (v1.3.1+) and intentionally hidden in the pre-AI release branch

## 🚀 Get Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GardeningCatalogue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

### Development Options

In the terminal output, you'll find options to open the app in:

- **🌐 Web Browser**: Press `w` to open in your default browser
- **📱 Mobile Device**: Scan the QR code with Expo Go app
- **🤖 Android Emulator**: Press `a` (requires Android Studio setup)
- **🍎 iOS Simulator**: Press `i` (requires Xcode on macOS)

## 📚 Documentation

### User Guides
- **[Tablet Support Guide](docs/TABLET_SUPPORT.md)**: Responsive design implementation
- **[Inventory UI Improvements](docs/INVENTORY_UI_IMPROVEMENTS.md)**: Recent interface enhancements
- **[Testing Guide](docs/TESTING_GUIDE.md)**: Comprehensive testing procedures

### Development Resources  
- **[Development Notes](docs/DEVELOPMENT_NOTES.md)**: Technical improvements and ideas
- **[Theme System](docs/THEME_SYSTEM.md)**: Color schemes and theming
- **[Build Configuration](docs/EAS_BUILD_FIXES.md)**: Production build setup
- **[RevenueCat Setup](docs/REVENUECAT_SETUP.md)**: Subscription setup for Apple, Google Play, and RevenueCat

### Project Status
- **[Project Status](PROJECT_STATUS.md)**: Current implementation status
- **[Roadmap](ROADMAP.md)**: Future development plans
- **[Pre-Release Checklist](PRE_RELEASE_CHECKLIST.md)**: Launch preparation

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native with Expo SDK 53
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with social providers
- **Styling**: React Native StyleSheet with custom theme system
- **State Management**: React Hooks and Context API

### Key Components
- **Responsive System**: `utils/responsive.ts` - Device detection and layout optimization
- **Smart Image Handling**: `components/SmartImage/` - Optimized image loading with fallbacks  
- **Theme Management**: `lib/theme.tsx` - Centralized color and styling system
- **Database Integration**: `lib/supabase.ts` - Database client and type definitions

## 🔧 Development

### Project Structure
```
app/                    # File-based routing (Expo Router)
├── (tabs)/            # Tab-based navigation screens
│   ├── index.tsx      # Inventory screen (main)
│   ├── calendar.tsx   # Garden planning calendar
│   └── settings.tsx   # App settings
├── auth/              # Authentication screens
└── _layout.tsx        # Root layout and navigation

components/            # Reusable React components
├── SmartImage/        # Optimized image loading
├── DatePickerField/   # Date selection component
└── ...

utils/                 # Utility functions and helpers
├── responsive.ts      # Responsive design system
└── debounce.ts       # Performance utilities

docs/                  # Documentation and guides
```

### Available Scripts
- `npm start` - Start Expo development server
- `npm run reset-project` - Reset to clean starter template
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator  
- `npm run web` - Run in web browser

## 🌱 Contributing

### Development Workflow
1. **Branch**: Create feature branches from main
2. **Test**: Verify changes across mobile, tablet, and web
3. **Document**: Update relevant documentation files
4. **Review**: Ensure responsive design works on all screen sizes

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React Native preset
- **Responsive First**: All new UI components should work across screen sizes
- **Platform Aware**: Consider platform-specific interactions (swipe vs click)

## 📖 Learn More

### Expo Resources
- **[Expo Documentation](https://docs.expo.dev/)**: Complete framework guide
- **[Expo Router](https://docs.expo.dev/router/introduction/)**: File-based navigation system
- **[EAS Build](https://docs.expo.dev/build/introduction/)**: Cloud build service

### React Native Resources
- **[React Native Documentation](https://reactnative.dev/)**: Core framework guide
- **[React Native Directory](https://reactnativedirectory.com/)**: Component library

### Community
- **[Expo Discord](https://chat.expo.dev)**: Developer community and support
- **[React Native Community](https://github.com/react-native-community)**: Open source resources

---

**MySeedBook Catalogue** - Your digital companion for successful gardening 🌱
