# Basmilius Meteocons Lottie Files Setup

## Download Instructions

You need to download the official Basmilius Meteocons Lottie JSON files from:

**Source:** https://basmilius.github.io/weather-icons/

### Required Files:

1. **clear-day.json** - Clear sunny day
2. **clear-night.json** - Clear night with moon
3. **partly-cloudy-day.json** - Partial clouds with sun
4. **partly-cloudy-night.json** - Partial clouds with moon
5. **overcast.json** - Fully cloudy
6. **rain.json** - Rain drops
7. **thunderstorms.json** - Thunder and lightning
8. **snow.json** - Snowflakes
9. **fog.json** - Mist/fog
10. **not-available.json** - Fallback icon

### Download Steps:

1. Go to https://basmilius.github.io/weather-icons/
2. Navigate to the Lottie/JSON section
3. Download each required icon as JSON format
4. Place all files in this directory: `assets/meteocons/`

### Alternative Method:

You can also clone the repository and copy the JSON files:
```bash
git clone https://github.com/basmilius/weather-icons.git
cp weather-icons/production/lottie/*.json ./assets/meteocons/
```

### Usage:

Once the files are in place, the WeatherIcon component will automatically:
- Use Lottie animations on iOS/Android
- Use official SVGs on web
- Provide smooth, authentic Basmilius weather icon animations

### Current Status:

✅ WeatherIcon component created  
✅ Directory structure ready  
⏳ **Waiting for actual Lottie JSON files to be downloaded**  
⏳ Integration with existing weather components  

The placeholder files are temporary - replace them with official Basmilius Meteocons Lottie JSON files for full functionality.