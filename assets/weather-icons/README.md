# Animated Weather Icons Setup

## Instructions for copying animated weather icons

Please copy the animated weather icon files from your CodePen folder:
`C:\dev\CodePen Codes\Animated Weather Icons\*`

To this directory:
`c:\dev\GardeningCatalogue\assets\weather-icons\`

### Expected file structure:
- sunny.json (or similar weather animation files)
- cloudy.json
- rainy.json
- snowy.json
- thunderstorm.json
- etc.

### Supported formats:
- Lottie animations (.json)
- SVG animations (.svg)
- GIF files (.gif)
- PNG sequences

The `AnimatedWeatherIcon` component will automatically detect and use these files based on weather conditions.

## Weather Code Mapping

The component maps OpenWeatherMap weather codes to animation files:
- 800 (clear sky) → sunny
- 801-804 (clouds) → cloudy  
- 500-531 (rain) → rainy
- 600-622 (snow) → snowy
- 200-232 (thunderstorm) → thunderstorm
- 701-781 (atmosphere) → foggy

Animation files should be named according to these weather conditions.