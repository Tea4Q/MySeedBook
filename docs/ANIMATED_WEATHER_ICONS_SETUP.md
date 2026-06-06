# Animated Weather Icons Integration Guide

## 📁 Copying Icons from CodePen Folder

Please copy the animated weather icons from your CodePen folder to the project:

**Source:** `C:\dev\CodePen Codes\Animated Weather Icons\`  
**Destination:** `c:\dev\GardeningCatalogue\assets\weather-icons\`

### Expected Icon Files:
Copy these files (if available) and rename them according to the mapping:

| Weather Condition | Expected Filename | Description |
|-------------------|------------------|-------------|
| Clear Day | `sunny.json` | Sunny day animation |
| Clear Night | `clear-night.json` | Clear night animation |
| Partly Cloudy Day | `partly-cloudy-day.json` | Partly cloudy day |
| Partly Cloudy Night | `partly-cloudy-night.json` | Partly cloudy night |
| Cloudy | `cloudy.json` | Cloudy conditions |
| Rain | `rain.json` | Rain animation |
| Rain Day | `rain-day.json` | Rain with sun |
| Rain Night | `rain-night.json` | Rain at night |
| Thunderstorm | `thunderstorm.json` | Thunder/lightning |
| Snow | `snow.json` | Snow animation |
| Mist/Fog | `mist.json` | Mist/fog animation |

### File Format Support:
- **Lottie JSON files** (.json) - Preferred for animations
- **GIF files** (.gif) - Alternative animated format
- **PNG sequences** - Can be converted to Lottie

## 🔄 Installation Steps:

1. **Copy Icon Files:**
   ```bash
   # Copy from your CodePen folder to:
   # c:\dev\GardeningCatalogue\assets\weather-icons\
   ```

2. **Install Lottie for React Native (if using Lottie files):**
   ```bash
   cd c:\dev\GardeningCatalogue
   npm install lottie-react-native
   npm install react-native-svg  # Required for Lottie
   ```

3. **For Expo CLI:**
   ```bash
   expo install lottie-react-native react-native-svg
   ```

## 🎨 Icon Mapping:

The `AnimatedWeatherIcon` component will automatically map OpenWeatherMap weather codes to your animated icons:

```typescript
// OpenWeatherMap icon codes -> Your animated files
'01d' -> 'sunny.json'           // Clear day
'01n' -> 'clear-night.json'     // Clear night
'02d' -> 'partly-cloudy-day.json' // Partly cloudy day
'10d' -> 'rain-day.json'        // Rain with sun
'11d' -> 'thunderstorm.json'    // Thunderstorm
// ... etc
```

## 🔧 After Copying Icons:

1. **Update AnimatedWeatherIcon component** to use Lottie animations
2. **Test the weather integration** in the calendar
3. **Verify animations** work on both web and mobile

## 🚀 Usage in Calendar:

Once icons are copied, the calendar will automatically show:
- **Small weather icons** on calendar dates
- **Temperature badges** on dates with weather data
- **Animated icons** in the weather detail modal
- **5-day forecast** with animated weather conditions

## 📱 Platform Compatibility:

- **Web:** Lottie animations work with lottie-react-web
- **iOS/Android:** Native Lottie support via lottie-react-native
- **Fallback:** FontAwesome icons if animations fail to load

---

**Note:** If you don't have animated icons available, the system will use FontAwesome icons as fallbacks and still provide full functionality.