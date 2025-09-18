import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env';
import {
  CurrentWeather,
  WeatherForecast,
  WeatherAlert,
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
} from '../../types/weather';

class WeatherService {
  private readonly API_KEY = ENV.weather.apiKey;
  private readonly BASE_URL = ENV.weather.baseUrl;
  private readonly CACHE_PREFIX = 'weather_cache_';
  
  // Cache TTL in minutes
  private readonly CACHE_TTL = {
    current: 10,    // Current weather cached for 10 minutes
    forecast: 60,   // Forecast cached for 1 hour
    alerts: 30      // Alerts cached for 30 minutes
  };

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
    try {
      // Check cache first
      const cached = await this.getCachedData('current', { lat, lon });
      if (cached) {
        return cached as CurrentWeather;
      }

      const response = await fetch(
        `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=${ENV.weather.units}`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: OpenWeatherCurrentResponse = await response.json();
      const currentWeather = this.transformCurrentWeather(data);

      // Cache the result
      await this.setCachedData('current', { lat, lon }, currentWeather);

      return currentWeather;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new Error('Failed to fetch current weather data');
    }
  }

  /**
   * Get 5-day weather forecast
   */
  async getForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      // Check cache first
      const cached = await this.getCachedData('forecast', { lat, lon });
      if (cached) {
        return cached as WeatherForecast[];
      }

      const response = await fetch(
        `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=${ENV.weather.units}`
      );

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const data: OpenWeatherForecastResponse = await response.json();
      const forecast = this.transformForecast(data);

      // Cache the result
      await this.setCachedData('forecast', { lat, lon }, forecast);

      return forecast;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw new Error('Failed to fetch forecast data');
    }
  }

  /**
   * Get weather alerts for a location
   * Note: This requires One Call API 3.0 (paid plan)
   */
  async getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    try {
      // Check cache first
      const cached = await this.getCachedData('alerts', { lat, lon });
      if (cached) {
        return cached as WeatherAlert[];
      }

      // For now, return empty array as alerts require paid API
      // TODO: Implement when upgrading to paid plan
      const alerts: WeatherAlert[] = [];
      
      await this.setCachedData('alerts', { lat, lon }, alerts);
      return alerts;
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      return [];
    }
  }

  /**
   * Transform OpenWeatherMap current weather response to our format
   */
  private transformCurrentWeather(data: OpenWeatherCurrentResponse): CurrentWeather {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility,
      condition: {
        id: data.weather[0].id,
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon
      },
      wind: {
        speed: data.wind?.speed || 0,
        direction: data.wind?.deg || 0
      },
      timestamp: data.dt * 1000, // Convert to milliseconds
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000
    };
  }

  /**
   * Transform OpenWeatherMap forecast response to our format
   */
  private transformForecast(data: OpenWeatherForecastResponse): WeatherForecast[] {
    // Group by date and get daily summary
    const dailyForecasts = new Map<string, any[]>();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, []);
      }
      dailyForecasts.get(date)!.push(item);
    });

    return Array.from(dailyForecasts.entries()).map(([date, dayData]) => {
      // Calculate daily stats from 3-hourly data
      const temps = dayData.map(d => d.main.temp);
      const humidities = dayData.map(d => d.main.humidity);
      const pressures = dayData.map(d => d.main.pressure);
      const windSpeeds = dayData.map(d => d.wind.speed);
      const windDirs = dayData.map(d => d.wind.deg);
      const pops = dayData.map(d => d.pop);

      // Use midday data for general conditions (around index 4 for 12:00)
      const middayData = dayData[Math.floor(dayData.length / 2)] || dayData[0];

      return {
        date,
        timestamp: new Date(date).getTime(),
        temp: {
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
          day: Math.round(middayData.main.temp),
          night: Math.round(temps[0]), // First entry (usually night/early morning)
          eve: Math.round(temps[temps.length - 1]), // Last entry
          morn: Math.round(temps[1]) // Second entry
        },
        condition: {
          id: middayData.weather[0].id,
          main: middayData.weather[0].main,
          description: middayData.weather[0].description,
          icon: middayData.weather[0].icon
        },
        humidity: Math.round(humidities.reduce((a, b) => a + b) / humidities.length),
        pressure: Math.round(pressures.reduce((a, b) => a + b) / pressures.length),
        wind: {
          speed: windSpeeds.reduce((a, b) => a + b) / windSpeeds.length,
          direction: windDirs.reduce((a, b) => a + b) / windDirs.length
        },
        precipitation: pops.length > 0 ? {
          probability: Math.max(...pops) * 100, // Convert to percentage
          type: this.determinePrecipitationType(middayData)
        } : undefined
      };
    }).slice(0, 5); // Return 5-day forecast
  }

  /**
   * Determine precipitation type from weather data
   */
  private determinePrecipitationType(data: any): 'rain' | 'snow' | 'sleet' {
    if (data.snow && data.snow['3h'] > 0) return 'snow';
    if (data.rain && data.rain['3h'] > 0) return 'rain';
    if (data.weather[0].main.toLowerCase().includes('snow')) return 'snow';
    if (data.weather[0].main.toLowerCase().includes('sleet')) return 'sleet';
    return 'rain'; // Default
  }

  /**
   * Get cached weather data
   */
  private async getCachedData(type: 'current' | 'forecast' | 'alerts', location: { lat: number; lon: number }) {
    try {
      const key = `${this.CACHE_PREFIX}${type}_${location.lat}_${location.lon}`;
      const cached = await AsyncStorage.getItem(key);
      
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const ttl = this.CACHE_TTL[type] * 60 * 1000; // Convert minutes to milliseconds

      if (now - timestamp > ttl) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Set cached weather data
   */
  private async setCachedData(type: 'current' | 'forecast' | 'alerts', location: { lat: number; lon: number }, data: any) {
    try {
      const key = `${this.CACHE_PREFIX}${type}_${location.lat}_${location.lon}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  /**
   * Clear all weather cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(weatherKeys);
    } catch (error) {
      console.error('Error clearing weather cache:', error);
    }
  }

  /**
   * Get cache stats for debugging
   */
  async getCacheStats(): Promise<{ keys: string[]; totalSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of weatherKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return {
        keys: weatherKeys,
        totalSize
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { keys: [], totalSize: 0 };
    }
  }
}

// Export singleton instance
export const weatherService = new WeatherService();