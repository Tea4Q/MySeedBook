import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface MeteoconProps {
  size?: number;
  style?: any;
}

// Clear Day (Sun) - Direct from Basmilius Meteocons
export const ClearDayMeteocon: React.FC<MeteoconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
    <Defs>
      <LinearGradient id="meteoconsSunGrad" x1="150" x2="234" y1="119.2" y2="264.8" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#fbbf24" />
        <Stop offset="0.5" stopColor="#fbbf24" />
        <Stop offset="1" stopColor="#f59e0b" />
      </LinearGradient>
    </Defs>
    <Circle cx="256" cy="192" r="84" fill="url(#meteoconsSunGrad)" stroke="#f8af18" strokeMiterlimit="10" strokeWidth="6" />
    <Path fill="none" stroke="#fbbf24" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="6" d="M256 61.6V12M256 372v-49.6m194.4-66.4H400M112 256H62.4M365.1 146.9l35.1-35.1M111.8 400.2l35.1-35.1M365.1 365.1l35.1 35.1M111.8 111.8l35.1 35.1" />
  </Svg>
);

// Clear Night (Moon)
export const ClearNightMeteocon: React.FC<MeteoconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
    <Defs>
      <LinearGradient id="meteoconsMoonGrad" x1="54.3" x2="240" y1="17" y2="262.7" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#86c3db" />
        <Stop offset="0.5" stopColor="#86c3db" />
        <Stop offset="1" stopColor="#5eafcf" />
      </LinearGradient>
    </Defs>
    <Path fill="url(#meteoconsMoonGrad)" stroke="#72b9d5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" d="M267.4 72.2a190.86 190.86 0 0 1 0 207.6A172.07 172.07 0 0 1 165.7 344C95.7 344 40 287.4 40 217.1s55.7-126.9 125.7-126.9a172.07 172.07 0 0 1 101.7 -18Z" />
  </Svg>
);

// Cloudy
export const CloudyMeteocon: React.FC<MeteoconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
    <Defs>
      <LinearGradient id="meteoconsCloudGrad" x1="99.5" x2="232.6" y1="30.7" y2="261.4" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#f3f7fe" />
        <Stop offset="0.5" stopColor="#f3f7fe" />
        <Stop offset="1" stopColor="#deeafb" />
      </LinearGradient>
    </Defs>
    <Path fill="url(#meteoconsCloudGrad)" stroke="#e6effc" strokeMiterlimit="10" strokeWidth="6" d="M400 288c0 26.5-21.5 48-48 48H96c-26.5 0-48-21.5-48-48s21.5-48 48-48c4.8 0 9.4.7 13.8 2 8.3-24.9 31.4-43 58.2-43 20.1 0 37.9 9.6 49.2 24.4C228.7 206.6 248.8 192 272 192c35.3 0 64 28.7 64 64 0 5.7-.8 11.2-2.1 16.4 3.6-.3 7.2-.4 10.1-.4 26.5 0 48 21.5 48 48z" />
  </Svg>
);

// Partly Cloudy Day
export const PartlyCloudyDayMeteocon: React.FC<MeteoconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
    <Defs>
      <LinearGradient id="meteoconsSun2Grad" x1="26.75" x2="77.25" y1="22.91" y2="119.09" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#fbbf24" />
        <Stop offset="0.5" stopColor="#fbbf24" />
        <Stop offset="1" stopColor="#f59e0b" />
      </LinearGradient>
      <LinearGradient id="meteoconsCloud2Grad" x1="99.5" x2="232.6" y1="30.7" y2="261.4" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#f3f7fe" />
        <Stop offset="0.5" stopColor="#f3f7fe" />
        <Stop offset="1" stopColor="#deeafb" />
      </LinearGradient>
    </Defs>
    <Circle cx="152" cy="171" r="56" fill="url(#meteoconsSun2Grad)" stroke="#f8af18" strokeMiterlimit="10" strokeWidth="6" />
    <Path fill="none" stroke="#fbbf24" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="6" d="M152 71V12M152 330v-49.6m140.4-66.4H244M60 212H12M267.1 146.9l35.1-35.1M76.8 311.2l35.1-35.1M267.1 276.1l35.1 35.1M76.8 111.8l35.1 35.1" />
    <Path fill="url(#meteoconsCloud2Grad)" stroke="#e6effc" strokeMiterlimit="10" strokeWidth="6" d="M400 240c0 26.5-21.5 48-48 48H214c-26.5 0-48-21.5-48-48s21.5-48 48-48c4.8 0 9.4.7 13.8 2 8.3-24.9 31.4-43 58.2-43 20.1 0 37.9 9.6 49.2 24.4C346.7 158.6 366.8 144 390 144c35.3 0 64 28.7 64 64 0 5.7-.8 11.2-2.1 16.4 3.6-.3 7.2-.4 10.1-.4 26.5 0 48 21.5 48 48z" />
  </Svg>
);

// Rainy
export const RainyMeteocon: React.FC<MeteoconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
    <Defs>
      <LinearGradient id="meteoconsRainGrad" x1="99.5" x2="232.6" y1="30.7" y2="261.4" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#f3f7fe" />
        <Stop offset="0.5" stopColor="#f3f7fe" />
        <Stop offset="1" stopColor="#deeafb" />
      </LinearGradient>
    </Defs>
    <Path fill="url(#meteoconsRainGrad)" stroke="#e6effc" strokeMiterlimit="10" strokeWidth="6" d="M400 240c0 26.5-21.5 48-48 48H96c-26.5 0-48-21.5-48-48s21.5-48 48-48c4.8 0 9.4.7 13.8 2 8.3-24.9 31.4-43 58.2-43 20.1 0 37.9 9.6 49.2 24.4C228.7 158.6 248.8 144 272 144c35.3 0 64 28.7 64 64 0 5.7-.8 11.2-2.1 16.4 3.6-.3 7.2-.4 10.1-.4 26.5 0 48 21.5 48 48z" />
    <G>
      <Path fill="none" stroke="#0ea5e9" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="8" d="M144 320l-8 32" opacity="0.3" />
      <Path fill="none" stroke="#0ea5e9" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="8" d="M192 320l-8 32" opacity="0.5" />
      <Path fill="none" stroke="#0ea5e9" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="8" d="M240 320l-8 32" opacity="0.7" />
      <Path fill="none" stroke="#0ea5e9" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="8" d="M288 320l-8 32" opacity="0.4" />
      <Path fill="none" stroke="#0ea5e9" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="8" d="M336 320l-8 32" opacity="0.6" />
    </G>
  </Svg>
);

// Snowy  
export const SnowyMeteocon: React.FC<MeteoconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
    <Defs>
      <LinearGradient id="meteoconsSnowGrad" x1="99.5" x2="232.6" y1="30.7" y2="261.4" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#f3f7fe" />
        <Stop offset="0.5" stopColor="#f3f7fe" />
        <Stop offset="1" stopColor="#deeafb" />
      </LinearGradient>
    </Defs>
    <Path fill="url(#meteoconsSnowGrad)" stroke="#e6effc" strokeMiterlimit="10" strokeWidth="6" d="M400 240c0 26.5-21.5 48-48 48H96c-26.5 0-48-21.5-48-48s21.5-48 48-48c4.8 0 9.4.7 13.8 2 8.3-24.9 31.4-43 58.2-43 20.1 0 37.9 9.6 49.2 24.4C228.7 158.6 248.8 144 272 144c35.3 0 64 28.7 64 64 0 5.7-.8 11.2-2.1 16.4 3.6-.3 7.2-.4 10.1-.4 26.5 0 48 21.5 48 48z" />
    <G>
      <Circle cx="156" cy="332" r="6" fill="#dbeafe" opacity="0.8" />
      <Circle cx="204" cy="340" r="8" fill="#dbeafe" opacity="0.8" />
      <Circle cx="252" cy="328" r="6" fill="#dbeafe" opacity="0.8" />
      <Circle cx="300" cy="336" r="7" fill="#dbeafe" opacity="0.8" />
      <Circle cx="348" cy="334" r="6" fill="#dbeafe" opacity="0.8" />
    </G>
  </Svg>
);

// Thunderstorm
export const ThunderstormMeteocon: React.FC<MeteoconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
    <Defs>
      <LinearGradient id="meteoconsStormGrad" x1="99.5" x2="232.6" y1="30.7" y2="261.4" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#f3f7fe" />
        <Stop offset="0.5" stopColor="#f3f7fe" />
        <Stop offset="1" stopColor="#deeafb" />
      </LinearGradient>
    </Defs>
    <Path fill="url(#meteoconsStormGrad)" stroke="#e6effc" strokeMiterlimit="10" strokeWidth="6" d="M400 240c0 26.5-21.5 48-48 48H96c-26.5 0-48-21.5-48-48s21.5-48 48-48c4.8 0 9.4.7 13.8 2 8.3-24.9 31.4-43 58.2-43 20.1 0 37.9 9.6 49.2 24.4C228.7 158.6 248.8 144 272 144c35.3 0 64 28.7 64 64 0 5.7-.8 11.2-2.1 16.4 3.6-.3 7.2-.4 10.1-.4 26.5 0 48 21.5 48 48z" />
    <Path fill="#fbbf24" stroke="#f59e0b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" d="M240 320l-32 48h32l-16 32 32-48h-32l16-32z" />
  </Svg>
);

// Pre-defined weather icon mappings for common OpenWeatherMap codes
export const METEOCON_WEATHER_MAP: Record<string, React.FC<MeteoconProps>> = {
  // Clear sky
  '01d': ClearDayMeteocon,
  '01n': ClearNightMeteocon,
  
  // Few clouds
  '02d': PartlyCloudyDayMeteocon,
  '02n': ClearNightMeteocon,
  
  // Scattered/broken clouds
  '03d': CloudyMeteocon,
  '03n': CloudyMeteocon,
  '04d': CloudyMeteocon,
  '04n': CloudyMeteocon,
  
  // Shower rain / Rain
  '09d': RainyMeteocon,
  '09n': RainyMeteocon,
  '10d': RainyMeteocon,
  '10n': RainyMeteocon,
  
  // Thunderstorm
  '11d': ThunderstormMeteocon,
  '11n': ThunderstormMeteocon,
  
  // Snow
  '13d': SnowyMeteocon,
  '13n': SnowyMeteocon,
  
  // Mist/Fog - using cloudy for now
  '50d': CloudyMeteocon,
  '50n': CloudyMeteocon,
};

// Helper component for weather icons
export const WeatherMeteocon: React.FC<{
  weatherCode: string | number;
  size?: number;
  style?: any;
}> = ({ weatherCode, size = 24, style }) => {
  const code = weatherCode.toString();
  const IconComponent = METEOCON_WEATHER_MAP[code] || CloudyMeteocon;
  
  return <IconComponent size={size} style={style} />;
};