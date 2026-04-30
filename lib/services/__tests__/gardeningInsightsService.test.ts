import { GardeningInsightsService } from '../gardeningInsightsService';
import { CurrentWeather } from '@/types/weather';

const makeWeather = (partial: Partial<CurrentWeather> = {}): CurrentWeather => ({
  location: { name: 'Austin', country: 'US', lat: 30.26, lon: -97.74 },
  temperature: 72,
  feelsLike: 72,
  humidity: 50,
  pressure: 1012,
  visibility: 10000,
  condition: { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
  wind: { speed: 5, direction: 120 },
  timestamp: 1711111111,
  sunrise: 1711080000,
  sunset: 1711125000,
  ...partial,
});

describe('GardeningInsightsService', () => {
  const service = new GardeningInsightsService();

  it('returns excellent/ideal-ish signals for mild clear weather', () => {
    const result = service.analyzeCurrentConditions(makeWeather());

    expect(['excellent', 'good']).toContain(result.suitability);
    expect(['ideal', 'good']).toContain(result.conditions.planting);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('flags thunderstorm as unsuitable with warnings', () => {
    const result = service.analyzeCurrentConditions(
      makeWeather({
        temperature: 78,
        condition: { id: 211, main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
        wind: { speed: 22, direction: 90 },
      })
    );

    expect(result.suitability).toBe('unsuitable');
    expect(result.conditions.planting).toBe('avoid');
    expect(result.warnings.join(' ').toLowerCase()).toContain('thunderstorm');
  });

  it('detects frost risk and frozen soil around threshold', () => {
    const result = service.analyzeCurrentConditions(
      makeWeather({
        temperature: 31,
        condition: { id: 800, main: 'Clear', description: 'clear sky', icon: '01n' },
      })
    );

    expect(result.conditions.soil).toBe('frozen');
    expect(result.warnings.join(' ').toLowerCase()).toContain('frost');
  });

  it('analyzes multi-day forecast entries', () => {
    const forecast = [
      {
        date: '2026-03-27',
        timestamp: 1711111111,
        temp: { min: 50, max: 80, day: 70, night: 55, eve: 68, morn: 58 },
        condition: { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
        humidity: 55,
        pressure: 1012,
        wind: { speed: 8, direction: 90 },
      },
      {
        date: '2026-03-28',
        timestamp: 1711197511,
        temp: { min: 42, max: 62, day: 56, night: 44, eve: 54, morn: 46 },
        condition: { id: 500, main: 'Rain', description: 'light rain', icon: '10d' },
        humidity: 81,
        pressure: 1009,
        wind: { speed: 12, direction: 145 },
      },
    ];

    const analyzed = service.analyzeForecast(forecast as any);

    expect(analyzed).toHaveLength(2);
    expect(analyzed[0].date).toBe('2026-03-27');
    expect(analyzed[1].conditions.planting).toBeDefined();
  });
});
