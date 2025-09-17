import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { WeatherMeteocon } from './MeteoconsFinal';
import { CurrentWeather } from '../../types/weather';

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
  onPress?: () => void;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ weather, onPress }) => {
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp <= 32) return '#4A90E2'; // Cold - Blue
    if (temp <= 50) return '#7ED321'; // Cool - Green
    if (temp <= 70) return '#F5A623'; // Mild - Orange
    if (temp <= 85) return '#D0021B'; // Warm - Red
    return '#9013FE'; // Hot - Purple
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.location}>{weather.location.name}</Text>
        <Text style={styles.lastUpdated}>
          Updated: {formatTime(weather.timestamp)}
        </Text>
      </View>

      <View style={styles.mainWeather}>
        <View style={styles.temperatureSection}>
          <Text style={[styles.temperature, { color: getTemperatureColor(weather.temperature) }]}>
            {Math.round(weather.temperature)}°
          </Text>
          <Text style={styles.feelsLike}>
            Feels like {Math.round(weather.feelsLike)}°
          </Text>
        </View>

        <View style={styles.conditionSection}>
          <WeatherMeteocon
            weatherCode={weather.condition.icon || '01d'}
            size={50}
            style={styles.weatherIcon}
          />
          <Text style={styles.condition}>{weather.condition.description}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <FontAwesome5 name="tint" size={16} color="#4A90E2" />
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{weather.humidity}%</Text>
          </View>
          
          <View style={styles.detailItem}>
            <FontAwesome5 name="wind" size={16} color="#50C878" />
            <Text style={styles.detailLabel}>Wind</Text>
            <Text style={styles.detailValue}>{Math.round(weather.wind.speed)} mph</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <FontAwesome5 name="thermometer-half" size={16} color="#FF6B35" />
            <Text style={styles.detailLabel}>Pressure</Text>
            <Text style={styles.detailValue}>{Math.round(weather.pressure)} mb</Text>
          </View>
          
          <View style={styles.detailItem}>
            <FontAwesome5 name="eye" size={16} color="#9B59B6" />
            <Text style={styles.detailLabel}>Visibility</Text>
            <Text style={styles.detailValue}>{Math.round(weather.visibility / 1609)} mi</Text>
          </View>
        </View>

        <View style={styles.sunTimes}>
          <View style={styles.sunTimeItem}>
            <FontAwesome5 name="sun" size={14} color="#F39C12" />
            <Text style={styles.sunTimeLabel}>Sunrise</Text>
            <Text style={styles.sunTimeValue}>{formatTime(weather.sunrise)}</Text>
          </View>
          
          <View style={styles.sunTimeItem}>
            <FontAwesome5 name="moon" size={14} color="#2C3E50" />
            <Text style={styles.sunTimeLabel}>Sunset</Text>
            <Text style={styles.sunTimeValue}>{formatTime(weather.sunset)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  location: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  mainWeather: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  temperatureSection: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: 60,
    fontWeight: 'bold',
    lineHeight: 70,
  },
  feelsLike: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: -5,
  },
  conditionSection: {
    alignItems: 'center',
    flex: 1,
    marginLeft: 20,
  },
  weatherIcon: {
    marginBottom: 8,
  },
  condition: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  sunTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  sunTimeItem: {
    alignItems: 'center',
  },
  sunTimeLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    marginBottom: 2,
  },
  sunTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
});