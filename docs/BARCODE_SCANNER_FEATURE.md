# Barcode Scanner Feature Documentation

**Status**: ✅ Complete and Production Ready  
**Version**: 1.3.1  
**Date**: November 8, 2025  
**Premium Feature**: Yes (Requires Premium Subscription)

## Overview

The Barcode Scanner feature allows premium users to quickly add seeds to their inventory by scanning seed package barcodes. This mobile-only feature uses the device camera to scan UPC/EAN barcodes and automatically fills in seed information.

## Key Features

### 🎯 Core Functionality
- **Camera-Based Scanning**: Real-time barcode detection using device camera
- **Premium Gating**: Feature restricted to premium subscribers with upgrade prompts
- **Mobile-Only**: Available on iOS and Android (not available on web)
- **Auto-Fill Data**: Automatically populates seed name, type, variety, and description
- **Brand Recognition**: Identifies major seed companies by barcode prefix
- **API Integration**: Falls back to Open Food Facts API for unknown barcodes

### 📱 Supported Platforms
- ✅ iOS (iPhone and iPad)
- ✅ Android (phones and tablets)
- ❌ Web (shows "Mobile Feature Only" message)

### 📦 Supported Barcode Formats
- UPC-A
- UPC-E
- EAN-13
- QR Code
- Data Matrix
- Code 128

## Technical Implementation

### Dependencies

```json
{
  "expo-barcode-scanner": "^13.0.1"
}
```

### Installation

```bash
npx expo install expo-barcode-scanner -- --legacy-peer-deps
```

### Configuration

**app.json** - Camera permissions:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "Allow MySeedBook Catalogue to use the camera to scan seed package barcodes for quick inventory management."
        }
      ]
    ]
  }
}
```

### Premium Feature Flag

**utils/premiumManager.ts**:
```typescript
export interface PremiumFeatures {
  barcode_scanner: boolean;
  // ... other features
}

// Free tier
features: {
  barcode_scanner: false
}

// Premium tier
features: {
  barcode_scanner: true
}
```

## Components

### 1. BarcodeScannerModal Component

**Location**: `components/BarcodeScannerModal/index.tsx`

**Props**:
```typescript
interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: ScannedSeedData) => void;
  onUpgradeRequired: () => void;
}
```

**Scanned Data Structure**:
```typescript
interface ScannedSeedData {
  barcode: string;
  barcodeType: string;
  seedName?: string;
  type?: string;
  variety?: string;
  description?: string;
  supplier?: string;
}
```

**Display Modes**:
1. **Web Platform**: Shows "Mobile Feature Only" message
2. **Non-Premium**: Shows premium upgrade prompt with feature benefits
3. **Premium + Permission**: Full-screen camera scanner with visual frame

**Key Features**:
- Platform-specific module loading (iOS/Android only)
- Camera permission handling
- Visual scanning frame overlay
- Processing overlay during lookup
- Barcode detection with haptic feedback
- Auto-close on successful scan

### 2. Seed Data Lookup Service

**Location**: `utils/seedDataLookup.ts`

**Main Function**:
```typescript
async function lookupSeedByBarcode(
  barcode: string, 
  type: string
): Promise<SeedLookupResult>
```

**Lookup Strategy**:
1. **Brand Recognition**: Check barcode prefix against known seed brands
2. **API Lookup**: Query Open Food Facts API for product information
3. **Fallback**: Return basic barcode info if no match found

**Supported Seed Brands**:
```typescript
const SEED_BRAND_PREFIXES = {
  '078742': 'Burpee',
  '071791': 'Ferry-Morse',
  '015844': 'Botanical Interests',
  '071877': 'Park Seed',
  '074272': 'American Seed',
  '039168': 'Jiffy',
  // ... more brands
};
```

**Open Food Facts Integration**:
```typescript
async function queryOpenFoodFacts(barcode: string) {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  );
  // Parse product data for seed information
}
```

## User Interface Integration

### 1. Inventory Screen (Floating Button)

**Location**: `app/(tabs)/index.tsx`

**Implementation**:
```typescript
{(Platform.OS === 'ios' || Platform.OS === 'android') && (
  <Pressable
    style={[styles.floatingScanButton, { backgroundColor: colors.primary }]}
    onPress={() => setShowBarcodeScanner(true)}
  >
    <Scan size={24} color={colors.primaryText} />
  </Pressable>
)}
```

**Position**: Left of the main "Add" floating action button

**Behavior**:
- Opens scanner modal
- On scan success: Navigates to add-seed with pre-filled data
- Shows premium modal if user is not premium

### 2. Add Seed Screen (Header Button)

**Location**: `app/add-seed.tsx`

**Implementation**:
```typescript
{(Platform.OS === 'ios' || Platform.OS === 'android') && !isEditMode && (
  <Pressable
    style={[styles.barcodeButton, { backgroundColor: colors.primary }]}
    onPress={() => setShowBarcodeScanner(true)}
  >
    <Scan size={20} color={colors.primaryText} />
  </Pressable>
)}
```

**Auto-Fill Logic**:
```typescript
useEffect(() => {
  if (scannedData) {
    setSeedName(scannedData.seedName || '');
    setSeedType(scannedData.type || '');
    setDescription(scannedData.description || '');
    Alert.alert('Scan Complete', 'Seed information loaded from barcode!');
  }
}, [scannedData]);
```

## Platform-Specific Considerations

### iOS/Android (Native)

**Module Loading**:
```typescript
let BarcodeScannerModule: any = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    const BarcodeScanner = require('expo-barcode-scanner');
    BarcodeScannerModule = BarcodeScanner.BarCodeScanner;
  } catch (error) {
    console.log('Barcode scanner not available on this platform');
  }
}
```

**Camera Permissions**:
- Automatically requested on first scanner open
- User-friendly error message if permission denied
- Platform-specific permission settings links

### Web Platform

**Graceful Fallback**:
```typescript
if (!isPlatformSupported) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.webContainer}>
        <Text>Mobile Feature Only</Text>
        <Text>Please use the mobile app to scan barcodes.</Text>
      </View>
    </Modal>
  );
}
```

## Testing & Development

### Development Premium Toggle

**Location**: Settings → Test Premium Features

**Usage**:
1. Navigate to Settings
2. Tap "Test Premium Features"
3. Toggle "Test Premium Features" ON
4. Restart the app
5. Barcode scanner now accessible

**Implementation**:
```typescript
// Enable test premium
await premiumManager.enableTestPremium();

// Disable test premium
await premiumManager.disableTestPremium();
```

### Testing Checklist

- [ ] Test camera permission flow on iOS
- [ ] Test camera permission flow on Android
- [ ] Scan known seed brand packages (Burpee, Ferry-Morse)
- [ ] Scan unknown barcodes (should fallback to API)
- [ ] Test premium gate (free user should see upgrade prompt)
- [ ] Test web platform (should show mobile-only message)
- [ ] Test form auto-fill after scan
- [ ] Test scan from inventory screen (floating button)
- [ ] Test scan from add-seed screen (header button)
- [ ] Verify barcode data persists through navigation

## Known Seed Brands

The scanner recognizes these major seed companies by barcode prefix:

| Brand | UPC Prefix | Company |
|-------|-----------|---------|
| Burpee | 078742 | W. Atlee Burpee & Co. |
| Ferry-Morse | 071791 | Ferry-Morse Seed Company |
| Botanical Interests | 015844 | Botanical Interests, Inc. |
| Park Seed | 071877 | Park Seed Company |
| American Seed | 074272 | American Seed Company |
| Jiffy | 039168 | Jiffy Products |

*Note: More brands can be added to the `SEED_BRAND_PREFIXES` mapping*

## API Integration

### Open Food Facts API

**Endpoint**: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`

**Rate Limits**: None (free public API)

**Response Example**:
```json
{
  "product": {
    "product_name": "Organic Tomato Seeds - Roma",
    "brands": "Burpee",
    "categories": "Seeds, Garden supplies",
    "generic_name": "Vegetable Seeds"
  }
}
```

**Future Enhancements**:
- Add custom seed database
- Implement caching for scanned barcodes
- Add user-contributed barcode database
- Integrate with additional seed catalogs

## Troubleshooting

### Camera Not Opening
**Issue**: Scanner modal opens but camera doesn't activate  
**Solution**: 
- Check camera permissions in device settings
- Ensure `expo-barcode-scanner` is installed correctly
- Verify platform is iOS or Android (not web)

### Barcode Not Detected
**Issue**: Scanner doesn't recognize barcode  
**Solution**:
- Ensure good lighting
- Hold device steady with barcode in frame
- Try different angle or distance
- Check if barcode format is supported

### Web Platform Error
**Issue**: "Cannot find native module 'ExpoBarCodeScanner'" on web  
**Solution**: This is expected - feature is mobile-only. Error should be caught gracefully with platform checks.

### Premium Gate Not Working
**Issue**: Free users can access scanner  
**Solution**:
- Verify premium status in `premiumManager.getSubscription()`
- Check `barcode_scanner` feature flag
- Use development toggle to test premium features

## Security & Privacy

### Camera Permissions
- **iOS**: Requested via `NSCameraUsageDescription` in app.json
- **Android**: Requested via `CAMERA` permission in app.json
- **User Control**: Users can revoke permissions in device settings

### Data Handling
- Barcodes processed locally on device
- No barcode data stored without user action
- External API calls only to Open Food Facts (public API)
- No tracking or analytics on scanned barcodes

## Future Enhancements

### Planned Features
- [ ] Local barcode database for offline scanning
- [ ] User-contributed barcode mappings
- [ ] OCR for package text extraction
- [ ] Batch scanning multiple packages
- [ ] Barcode history and favorites
- [ ] Integration with seed supplier APIs
- [ ] Custom barcode generation for seed collections

### Performance Improvements
- [ ] Optimize camera preview rendering
- [ ] Reduce API call latency
- [ ] Add barcode result caching
- [ ] Improve brand recognition accuracy

## Support

### For Users
- Feature available to Premium subscribers only
- Requires iOS or Android device with camera
- Internet connection needed for API lookups
- Contact support via Settings → Feedback

### For Developers
- See `components/BarcodeScannerModal/index.tsx` for implementation
- See `utils/seedDataLookup.ts` for lookup logic
- See `utils/premiumManager.ts` for feature gating
- Check console logs for debugging information

## Related Documentation
- [Premium Features Guide](MONETIZATION_SETUP_GUIDE.md)
- [Camera Permissions](../app.json)
- [expo-barcode-scanner docs](https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/)
- [Open Food Facts API](https://world.openfoodfacts.org/data)
