import { CurrentWeather, WeatherForecast, GardeningConditions } from '../../types/weather';
import { ENV } from '../../config/env';

export class GardeningInsightsService {
  private readonly FROST_THRESHOLD = ENV.weather.frostThreshold; // 32°F
  private readonly TEMP_THRESHOLDS = ENV.weather.temperatures;

  /**
   * Analyze current weather and provide gardening insights
   */
  analyzeCurrentConditions(weather: CurrentWeather): GardeningConditions {
    const temp = weather.temperature;
    const humidity = weather.humidity;
    const windSpeed = weather.wind.speed;
    const condition = weather.condition.main.toLowerCase();
    
    // Determine overall suitability
    const suitability = this.calculateSuitability(weather);
    
    // Analyze specific conditions
    const conditions = {
      planting: this.analyzePlantingConditions(weather),
      watering: this.analyzeWateringConditions(weather),
      harvesting: this.analyzeHarvestingConditions(weather),
      soil: this.analyzeSoilConditions(weather)
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(weather, conditions);
    
    // Generate warnings
    const warnings = this.generateWarnings(weather);
    
    // Determine best times
    const bestTimes = this.calculateBestTimes(weather);

    return {
      suitability,
      conditions,
      recommendations,
      warnings,
      bestTimes
    };
  }

  /**
   * Analyze forecast and provide multi-day insights
   */
  analyzeForecast(forecast: WeatherForecast[]): Array<GardeningConditions & { date: string }> {
    return forecast.map(day => ({
      date: day.date,
      ...this.analyzeCurrentConditions({
        location: { name: '', country: '', lat: 0, lon: 0 },
        temperature: day.temp.day,
        feelsLike: day.temp.day,
        humidity: day.humidity,
        pressure: day.pressure,
        visibility: 10000,
        condition: day.condition,
        wind: day.wind,
        timestamp: day.timestamp,
        sunrise: day.timestamp,
        sunset: day.timestamp
      })
    }));
  }

  /**
   * Calculate overall gardening suitability
   */
  private calculateSuitability(weather: CurrentWeather): 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable' {
    const temp = weather.temperature;
    const humidity = weather.humidity;
    const windSpeed = weather.wind.speed;
    const condition = weather.condition.main.toLowerCase();

    // Severe weather conditions
    if (['thunderstorm', 'tornado', 'hurricane'].includes(condition)) {
      return 'unsuitable';
    }

    // Heavy rain or snow
    if (['rain', 'snow'].includes(condition) && weather.condition.description.includes('heavy')) {
      return 'poor';
    }

    // Frost conditions
    if (temp <= this.FROST_THRESHOLD) {
      return 'poor';
    }

    // Extreme temperatures
    if (temp < 40 || temp > 95) {
      return 'poor';
    }

    // High winds
    if (windSpeed > 25) {
      return 'fair';
    }

    // Ideal conditions
    if (temp >= this.TEMP_THRESHOLDS.coldSeason && 
        temp <= 85 && 
        humidity >= 40 && humidity <= 70 && 
        windSpeed <= 15 && 
        !['rain', 'snow'].includes(condition)) {
      return 'excellent';
    }

    // Good conditions
    if (temp >= 45 && temp <= 90 && humidity >= 30 && humidity <= 80) {
      return 'good';
    }

    return 'fair';
  }

  /**
   * Analyze planting conditions
   */
  private analyzePlantingConditions(weather: CurrentWeather): 'ideal' | 'good' | 'challenging' | 'avoid' {
    const temp = weather.temperature;
    const condition = weather.condition.main.toLowerCase();
    const windSpeed = weather.wind.speed;

    // Avoid planting conditions
    if (temp <= this.FROST_THRESHOLD || 
        ['thunderstorm', 'rain'].includes(condition) ||
        windSpeed > 20) {
      return 'avoid';
    }

    // Challenging conditions
    if (temp < 45 || temp > 90 || windSpeed > 15) {
      return 'challenging';
    }

    // Ideal conditions
    if (temp >= this.TEMP_THRESHOLDS.coldSeason && 
        temp <= 85 && 
        condition === 'clear' && 
        windSpeed <= 10) {
      return 'ideal';
    }

    return 'good';
  }

  /**
   * Analyze watering conditions
   */
  private analyzeWateringConditions(weather: CurrentWeather): 'needed' | 'optional' | 'avoid' {
    const temp = weather.temperature;
    const humidity = weather.humidity;
    const condition = weather.condition.main.toLowerCase();

    // Avoid watering during rain or very high humidity
    if (condition === 'rain' || humidity > 85) {
      return 'avoid';
    }

    // Watering needed in hot, dry conditions
    if (temp > 80 && humidity < 40) {
      return 'needed';
    }

    // Watering needed in warm, low humidity
    if (temp > 70 && humidity < 50) {
      return 'needed';
    }

    return 'optional';
  }

  /**
   * Analyze harvesting conditions
   */
  private analyzeHarvestingConditions(weather: CurrentWeather): 'ideal' | 'good' | 'protect' | 'delay' {
    const condition = weather.condition.main.toLowerCase();
    const humidity = weather.humidity;
    const windSpeed = weather.wind.speed;

    // Delay harvesting
    if (['thunderstorm', 'rain'].includes(condition)) {
      return 'delay';
    }

    // Protect harvest
    if (windSpeed > 20 || humidity > 80) {
      return 'protect';
    }

    // Ideal conditions
    if (condition === 'clear' && humidity < 60 && windSpeed <= 10) {
      return 'ideal';
    }

    return 'good';
  }

  /**
   * Analyze soil conditions
   */
  private analyzeSoilConditions(weather: CurrentWeather): 'workable' | 'soggy' | 'frozen' | 'dry' {
    const temp = weather.temperature;
    const condition = weather.condition.main.toLowerCase();
    const humidity = weather.humidity;

    // Frozen soil
    if (temp <= this.FROST_THRESHOLD) {
      return 'frozen';
    }

    // Soggy soil
    if (condition === 'rain' || humidity > 85) {
      return 'soggy';
    }

    // Very dry soil
    if (temp > 85 && humidity < 30) {
      return 'dry';
    }

    return 'workable';
  }

  /**
   * Generate gardening recommendations
   */
  private generateRecommendations(weather: CurrentWeather, conditions: any): string[] {
    const recommendations: string[] = [];
    const temp = weather.temperature;
    const condition = weather.condition.main.toLowerCase();

    // Temperature-based recommendations
    if (temp >= this.TEMP_THRESHOLDS.coldSeason && temp < this.TEMP_THRESHOLDS.warmSeason) {
      recommendations.push('Perfect weather for cool-season crops like lettuce, peas, and spinach');
    }

    if (temp >= this.TEMP_THRESHOLDS.warmSeason && temp < this.TEMP_THRESHOLDS.hotSeason) {
      recommendations.push('Great conditions for warm-season crops like tomatoes and peppers');
    }

    if (temp >= this.TEMP_THRESHOLDS.hotSeason) {
      recommendations.push('Ideal for heat-loving crops like okra, melons, and hot peppers');
    }

    // Watering recommendations
    if (conditions.watering === 'needed') {
      recommendations.push('Water your plants early morning or late evening');
      recommendations.push('Check soil moisture before watering');
    }

    // Planting recommendations
    if (conditions.planting === 'ideal') {
      recommendations.push('Excellent day for transplanting seedlings');
      recommendations.push('Consider direct sowing seeds outdoors');
    }

    // Harvesting recommendations
    if (conditions.harvesting === 'ideal') {
      recommendations.push('Perfect conditions for harvesting fruits and vegetables');
    }

    // Weather-specific recommendations
    if (condition === 'clear') {
      recommendations.push('Great visibility for detailed garden work');
    }

    if (weather.humidity < 50) {
      recommendations.push('Low humidity - increase watering frequency');
    }

    return recommendations;
  }

  /**
   * Generate weather warnings
   */
  private generateWarnings(weather: CurrentWeather): string[] {
    const warnings: string[] = [];
    const temp = weather.temperature;
    const condition = weather.condition.main.toLowerCase();
    const windSpeed = weather.wind.speed;

    // Frost warning
    if (temp <= this.FROST_THRESHOLD + 5) {
      warnings.push('Potential frost risk - protect tender plants');
    }

    // Heat warning
    if (temp > 90) {
      warnings.push('High temperatures - provide shade and extra water');
    }

    // Wind warning
    if (windSpeed > 15) {
      warnings.push('Strong winds - stake tall plants and cover delicate seedlings');
    }

    // Severe weather
    if (condition === 'thunderstorm') {
      warnings.push('Thunderstorms expected - secure garden structures');
    }

    // Heavy rain
    if (condition === 'rain' && weather.condition.description.includes('heavy')) {
      warnings.push('Heavy rain expected - ensure proper drainage');
    }

    return warnings;
  }

  /**
   * Calculate best times for garden activities
   */
  private calculateBestTimes(weather: CurrentWeather): { planting?: string; watering?: string; harvesting?: string } {
    const bestTimes: any = {};
    const temp = weather.temperature;
    const sunrise = new Date(weather.sunrise);
    const sunset = new Date(weather.sunset);

    // Best planting time
    if (temp > 80) {
      bestTimes.planting = 'Early morning or late evening when temperatures are cooler';
    } else if (temp >= 50) {
      bestTimes.planting = 'Mid-morning when soil has warmed up';
    }

    // Best watering time
    if (temp > 75) {
      bestTimes.watering = 'Early morning (6-8 AM) or evening after sunset';
    } else {
      bestTimes.watering = 'Mid-morning when plants can dry before evening';
    }

    // Best harvesting time
    bestTimes.harvesting = 'Early morning when plants are fully hydrated';

    return bestTimes;
  }

  /**
   * Get crop-specific recommendations based on weather
   */
  getCropRecommendations(weather: CurrentWeather, cropType: string): string[] {
    const recommendations: string[] = [];
    const temp = weather.temperature;

    switch (cropType.toLowerCase()) {
      case 'tomatoes':
        if (temp >= 65 && temp <= 85) {
          recommendations.push('Perfect temperature range for tomato growth');
        } else if (temp < 50) {
          recommendations.push('Too cold for tomatoes - consider protection or wait');
        } else if (temp > 90) {
          recommendations.push('Provide afternoon shade and extra water');
        }
        break;

      case 'lettuce':
        if (temp >= 45 && temp <= 70) {
          recommendations.push('Ideal growing conditions for lettuce');
        } else if (temp > 75) {
          recommendations.push('Too warm - lettuce may bolt. Provide shade');
        }
        break;

      case 'peppers':
        if (temp >= 70 && temp <= 85) {
          recommendations.push('Excellent conditions for pepper production');
        } else if (temp < 55) {
          recommendations.push('Too cold for peppers - wait for warmer weather');
        }
        break;

      default:
        recommendations.push('Check specific temperature requirements for this crop');
    }

    return recommendations;
  }

  /**
   * Calculate frost probability for the next few days
   */
  calculateFrostRisk(forecast: WeatherForecast[]): Array<{ date: string; risk: 'none' | 'low' | 'moderate' | 'high' }> {
    return forecast.map(day => {
      const minTemp = day.temp.min;
      let risk: 'none' | 'low' | 'moderate' | 'high' = 'none';

      if (minTemp <= this.FROST_THRESHOLD) {
        risk = 'high';
      } else if (minTemp <= this.FROST_THRESHOLD + 5) {
        risk = 'moderate';
      } else if (minTemp <= this.FROST_THRESHOLD + 10) {
        risk = 'low';
      }

      return {
        date: day.date,
        risk
      };
    });
  }
}

// Export singleton instance
export const gardeningInsightsService = new GardeningInsightsService();