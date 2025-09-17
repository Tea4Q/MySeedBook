// Weather-related TypeScript interfaces

export interface WeatherCondition {
  id: number;
  main: string; // e.g., "Rain", "Clear", "Clouds"
  description: string; // e.g., "light rain", "clear sky"
  icon: string; // OpenWeatherMap icon code
}

export interface CurrentWeather {
  // Location information
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  
  // Current conditions
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  visibility: number;
  uvIndex?: number;
  
  // Weather description
  condition: WeatherCondition;
  
  // Wind information
  wind: {
    speed: number;
    direction: number; // degrees
  };
  
  // Timestamps
  timestamp: number; // Unix timestamp
  sunrise: number;
  sunset: number;
}

export interface WeatherForecast {
  date: string; // ISO date string
  timestamp: number;
  
  // Temperature range
  temp: {
    min: number;
    max: number;
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  
  // Weather conditions
  condition: WeatherCondition;
  
  // Additional data
  humidity: number;
  pressure: number;
  wind: {
    speed: number;
    direction: number;
  };
  
  // Precipitation
  precipitation?: {
    probability: number; // 0-100
    amount?: number; // mm
    type: 'rain' | 'snow' | 'sleet';
  };
  
  // UV Index
  uvIndex?: number;
}

export interface WeatherAlert {
  id: string;
  type: 'frost' | 'heat' | 'rain' | 'wind' | 'general';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  regions: string[];
}

// Gardening-specific weather insights
export interface GardeningConditions {
  // Overall gardening suitability
  suitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
  
  // Specific conditions
  conditions: {
    planting: 'ideal' | 'good' | 'challenging' | 'avoid';
    watering: 'needed' | 'optional' | 'avoid';
    harvesting: 'ideal' | 'good' | 'protect' | 'delay';
    soil: 'workable' | 'soggy' | 'frozen' | 'dry';
  };
  
  // Recommendations
  recommendations: string[];
  
  // Warnings
  warnings: string[];
  
  // Best times for activities
  bestTimes: {
    planting?: string;
    watering?: string;
    harvesting?: string;
  };
}

// User location preferences
export interface LocationSettings {
  // Current location
  current?: {
    lat: number;
    lon: number;
    name: string;
    autoUpdate: boolean;
  };
  
  // Manual locations (for multiple gardens)
  saved: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
    isDefault: boolean;
  }>;
  
  // Location preferences
  preferences: {
    useCurrentLocation: boolean;
    enableLocationAlerts: boolean;
    units: 'imperial' | 'metric';
  };
}

// Weather notification settings
export interface WeatherNotificationSettings {
  // Alert types
  frostWarnings: {
    enabled: boolean;
    hoursAhead: number; // How many hours in advance to warn
    temperature: number; // Custom frost threshold
  };
  
  rainAlerts: {
    enabled: boolean;
    hoursAhead: number;
    minimumAmount: number; // mm of rain to trigger alert
  };
  
  plantingAlerts: {
    enabled: boolean;
    cropTypes: string[]; // Which crops to get alerts for
  };
  
  generalWeather: {
    enabled: boolean;
    dailySummary: boolean;
    extremeWeather: boolean;
  };
  
  // Notification timing
  schedule: {
    morningUpdate: boolean;
    morningTime: string; // "07:00"
    eveningUpdate: boolean;
    eveningTime: string; // "18:00"
  };
}

// Weather data cache interface
export interface WeatherCache {
  current?: {
    data: CurrentWeather;
    timestamp: number;
  };
  
  forecast?: {
    data: WeatherForecast[];
    timestamp: number;
  };
  
  alerts?: {
    data: WeatherAlert[];
    timestamp: number;
  };
  
  // Cache settings
  settings: {
    currentTTL: number; // Time to live in minutes
    forecastTTL: number;
    alertsTTL: number;
  };
}

// API response interfaces (OpenWeatherMap format)
export interface OpenWeatherCurrentResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface OpenWeatherForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number;
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    sys: {
      pod: string;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}