import React from 'react';
import { Platform, View } from 'react-native';
import LottieView from 'lottie-react-native';

// Map OpenWeatherMap conditions to Basmilius Meteocon names
const toIconName = (weatherCode: string | number): string => {
  const code = weatherCode.toString().toLowerCase();
  
  // OpenWeatherMap icon codes mapping
  if (code.includes('01d')) return 'clear-day';
  if (code.includes('01n')) return 'clear-night';
  if (code.includes('02d') || code.includes('03d')) return 'partly-cloudy-day';
  if (code.includes('02n') || code.includes('03n')) return 'partly-cloudy-night';
  if (code.includes('04')) return 'overcast';
  if (code.includes('09') || code.includes('10')) return 'rain';
  if (code.includes('11')) return 'thunderstorms';
  if (code.includes('13')) return 'snow';
  if (code.includes('50')) return 'fog';
  
  // Fallback for text-based conditions
  const s = code.toLowerCase();
  if (s.includes('clear') && s.includes('night')) return 'clear-night';
  if (s.includes('clear')) return 'clear-day';
  if (s.includes('partly')) return 'partly-cloudy-day';
  if (s.includes('cloud')) return 'overcast';
  if (s.includes('rain')) return 'rain';
  if (s.includes('thunder') || s.includes('storm')) return 'thunderstorms';
  if (s.includes('snow')) return 'snow';
  if (s.includes('fog') || s.includes('mist')) return 'fog';
  
  return 'not-available';
};

interface WeatherIconProps {
  condition: string | number;
  size?: number;
  styleVariant?: 'line' | 'fill';
  autoPlay?: boolean;
  loop?: boolean;
}

export default function WeatherIcon({ 
  condition, 
  size = 96, 
  styleVariant = 'fill',
  autoPlay = true,
  loop = true 
}: WeatherIconProps) {
  const iconName = toIconName(condition);

  if (Platform.OS === 'web') {
    // Use the official Meteocons SVGs on web (animate via SMIL in browsers)
    const base = 'https://basmilius.github.io/weather-icons/production';
    const src = `${base}/${styleVariant}/all/${iconName}.svg`;
    
    return React.createElement('img', {
      src,
      width: size,
      height: size,
      alt: iconName,
      style: { maxWidth: '100%', height: 'auto' }
    });
  }

  // Native: render Lottie JSON
  const source = getMeteoconLottie(iconName);
  
  return (
    <View style={{ width: size, height: size }}>
      <LottieView 
        source={source} 
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: size, height: size }} 
        resizeMode="contain"
      />
    </View>
  );
}

// Simple require map so Metro bundles the JSON
const getMeteoconLottie = (name: string) => {
  switch (name) {
    case 'clear-day': 
      return require('../../assets/meteocons/clear-day.json');
    case 'clear-night': 
      return require('../../assets/meteocons/clear-night.json');
    case 'partly-cloudy-day': 
      return require('../../assets/meteocons/partly-cloudy-day.json');
    case 'partly-cloudy-night': 
      return require('../../assets/meteocons/partly-cloudy-night.json');
    case 'overcast': 
      return require('../../assets/meteocons/overcast.json');
    case 'rain': 
      return require('../../assets/meteocons/rain.json');
    case 'thunderstorms': 
      return require('../../assets/meteocons/thunderstorms.json');
    case 'snow': 
      return require('../../assets/meteocons/snow.json');
    case 'fog': 
      return require('../../assets/meteocons/fog.json');
    default: 
      return require('../../assets/meteocons/not-available.json');
  }
};

// Export for backward compatibility with existing components
export const WeatherMeteocon = WeatherIcon;