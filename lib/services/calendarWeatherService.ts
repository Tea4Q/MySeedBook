import { weatherService } from './weatherService';
import { locationService } from './locationService';
import { gardeningInsightsService } from './gardeningInsightsService';
import { 
  WeatherForecast, 
  GardeningConditions, 
  CurrentWeather 
} from '../../types/weather';

// Extended calendar weather data for specific dates
export interface CalendarWeatherData {
  date: string; // YYYY-MM-DD format
  temperature: {
    high: number;
    low: number;
  };
  condition: {
    main: string;
    description: string;
    icon: string;
  };
  precipitation: {
    probability: number;
    amount?: number;
  };
  gardeningConditions: GardeningConditions;
  isToday: boolean;
  isForecast: boolean; // true if forecast data, false if historical
}

class CalendarWeatherService {
  private weatherCache = new Map<string, CalendarWeatherData>();
  
  /**
   * Get weather data for a specific date
   */
  async getWeatherForDate(date: Date): Promise<CalendarWeatherData | null> {
    try {
      const dateString = this.formatDate(date);
      const today = new Date();
      const isToday = this.isSameDate(date, today);
      const isFuture = date > today;
      
      // Check cache first
      if (this.weatherCache.has(dateString)) {
        return this.weatherCache.get(dateString)!;
      }

      const location = await locationService.getBestLocation();
      
      let weatherData: CalendarWeatherData | null = null;

      if (isToday) {
        // Get current weather for today
        const currentWeather = await weatherService.getCurrentWeather(location.lat, location.lon);
        weatherData = this.transformCurrentWeatherToCalendar(currentWeather, dateString);
      } else if (isFuture && this.isWithinForecastRange(date)) {
        // Get forecast data for future dates (within 5 days)
        const forecast = await weatherService.getForecast(location.lat, location.lon);
        const dayForecast = forecast.find(day => day.date === dateString);
        
        if (dayForecast) {
          weatherData = this.transformForecastToCalendar(dayForecast, dateString);
        }
      } else {
        // For historical data or far future dates, return null
        // In a full implementation, you might want to use a historical weather API
        return null;
      }

      if (weatherData) {
        this.weatherCache.set(dateString, weatherData);
      }

      return weatherData;
    } catch (error) {
      console.error('Error getting weather for date:', error);
      return null;
    }
  }

  /**
   * Get weather data for multiple dates (optimized for calendar month view)
   */
  async getWeatherForDateRange(startDate: Date, endDate: Date): Promise<Map<string, CalendarWeatherData>> {
    const weatherMap = new Map<string, CalendarWeatherData>();
    const today = new Date();
    const location = await locationService.getBestLocation();
    
    try {
      // Get current weather if today is in range
      if (this.isDateInRange(today, startDate, endDate)) {
        const currentWeather = await weatherService.getCurrentWeather(location.lat, location.lon);
        const todayData = this.transformCurrentWeatherToCalendar(currentWeather, this.formatDate(today));
        weatherMap.set(this.formatDate(today), todayData);
      }

      // Get forecast data for future dates in range
      const forecast = await weatherService.getForecast(location.lat, location.lon);
      
      forecast.forEach(dayForecast => {
        const forecastDate = new Date(dayForecast.date);
        if (this.isDateInRange(forecastDate, startDate, endDate)) {
          const weatherData = this.transformForecastToCalendar(dayForecast, dayForecast.date);
          weatherMap.set(dayForecast.date, weatherData);
        }
      });

      // Cache all the data
      weatherMap.forEach((data, dateString) => {
        this.weatherCache.set(dateString, data);
      });

      return weatherMap;
    } catch (error) {
      console.error('Error getting weather for date range:', error);
      return weatherMap;
    }
  }

  /**
   * Transform current weather data to calendar format
   */
  private transformCurrentWeatherToCalendar(weather: CurrentWeather, dateString: string): CalendarWeatherData {
    const gardeningConditions = gardeningInsightsService.analyzeCurrentConditions(weather);
    
    return {
      date: dateString,
      temperature: {
        high: weather.temperature,
        low: weather.temperature - 10, // Estimate, actual APIs might provide daily min/max
      },
      condition: weather.condition,
      precipitation: {
        probability: 0, // Current weather doesn't have precipitation probability
      },
      gardeningConditions,
      isToday: true,
      isForecast: false,
    };
  }

  /**
   * Transform forecast data to calendar format
   */
  private transformForecastToCalendar(forecast: WeatherForecast, dateString: string): CalendarWeatherData {
    // Create a mock current weather object for gardening insights
    const mockCurrentWeather: CurrentWeather = {
      location: { name: '', country: '', lat: 0, lon: 0 },
      temperature: forecast.temp.day,
      feelsLike: forecast.temp.day,
      humidity: forecast.humidity,
      pressure: forecast.pressure,
      visibility: 10000,
      condition: forecast.condition,
      wind: forecast.wind,
      timestamp: forecast.timestamp,
      sunrise: forecast.timestamp,
      sunset: forecast.timestamp,
    };

    const gardeningConditions = gardeningInsightsService.analyzeCurrentConditions(mockCurrentWeather);
    
    return {
      date: dateString,
      temperature: {
        high: forecast.temp.max,
        low: forecast.temp.min,
      },
      condition: forecast.condition,
      precipitation: {
        probability: forecast.precipitation?.probability || 0,
        amount: forecast.precipitation?.amount,
      },
      gardeningConditions,
      isToday: false,
      isForecast: true,
    };
  }

  /**
   * Utility functions
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2);
  }

  private isWithinForecastRange(date: Date): boolean {
    const today = new Date();
    const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 5; // 5-day forecast
  }

  private isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
  }

  /**
   * Clear weather cache
   */
  clearCache(): void {
    this.weatherCache.clear();
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.weatherCache.size;
  }

  /**
   * Get suggested planting activities for a specific date
   */
  getPlantingActivitiesForDate(weather: CalendarWeatherData): string[] {
    const activities: string[] = [];
    const conditions = weather.gardeningConditions.conditions;
    
    if (conditions.planting === 'ideal') {
      activities.push('🌱 Ideal day for transplanting seedlings');
      activities.push('🌿 Great conditions for direct sowing');
    } else if (conditions.planting === 'good') {
      activities.push('🌱 Good day for planting activities');
    }
    
    if (conditions.watering === 'needed') {
      activities.push('💧 Water your plants today');
    }
    
    if (conditions.harvesting === 'ideal') {
      activities.push('🥕 Perfect day for harvesting');
    }
    
    if (weather.precipitation.probability > 70) {
      activities.push('🌧️ Rain expected - skip watering');
      activities.push('🏠 Consider indoor gardening tasks');
    }
    
    if (weather.temperature.low <= 35) {
      activities.push('🧊 Frost risk - protect tender plants');
    }
    
    return activities;
  }
}

// Export singleton instance
export const calendarWeatherService = new CalendarWeatherService();