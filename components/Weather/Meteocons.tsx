// Clean re-export from MeteoconsFinal to maintain backward compatibility
export {
  ClearDayMeteocon,
  ClearNightMeteocon,
  CloudyMeteocon,
  PartlyCloudyDayMeteocon,
  RainyMeteocon,
  SnowyMeteocon,
  ThunderstormMeteocon,
  WeatherMeteocon
} from './MeteoconsFinal';

// Legacy aliases
export { ClearDayMeteocon as SunnyMeteocon, ClearNightMeteocon as NightMeteocon } from './MeteoconsFinal';