import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { WeatherMeteocon } from './MeteoconsFinal';
import { WeatherForecast } from '../../types/weather';

interface WeatherForecastCardProps {
  forecast: WeatherForecast[];
  showTitle?: boolean;
}

export const WeatherForecastCard: React.FC<WeatherForecastCardProps> = ({ 
  forecast, 
  showTitle = true 
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp <= 32) return '#4A90E2'; // Cold - Blue
    if (temp <= 50) return '#7ED321'; // Cool - Green
    if (temp <= 70) return '#F5A623'; // Mild - Orange
    if (temp <= 85) return '#D0021B'; // Warm - Red
    return '#9013FE'; // Hot - Purple
  };

  const getPrecipitationText = (forecast: WeatherForecast): string => {
    if (!forecast.precipitation) return '';
    
    const prob = Math.round(forecast.precipitation.probability);
    if (prob === 0) return '';
    
    return `${prob}% chance`;
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.title}>5-Day Forecast</Text>
      )}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {forecast.slice(0, 5).map((day, index) => (
          <View key={day.date} style={[styles.dayCard, index === 0 && styles.firstCard]}>
            <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
            
            <WeatherMeteocon
              weatherCode={day.condition.icon || '01d'}
              size={32}
              style={styles.weatherIcon}
            />
            
            <View style={styles.temperatureContainer}>
              <Text style={[styles.highTemp, { color: getTemperatureColor(day.temp.max) }]}>
                {Math.round(day.temp.max)}°
              </Text>
              <Text style={styles.lowTemp}>
                {Math.round(day.temp.min)}°
              </Text>
            </View>

            <Text style={styles.condition} numberOfLines={2}>
              {day.condition.description}
            </Text>

            {day.precipitation && day.precipitation.probability > 0 && (
              <View style={styles.precipitationContainer}>
                <FontAwesome5 
                  name="tint" 
                  size={12} 
                  color="#4A90E2" 
                  style={styles.precipIcon}
                />
                <Text style={styles.precipitationText}>
                  {getPrecipitationText(day)}
                </Text>
              </View>
            )}

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <FontAwesome5 name="tint" size={10} color="#4A90E2" />
                <Text style={styles.detailText}>{day.humidity}%</Text>
              </View>
              
              <View style={styles.detailItem}>
                <FontAwesome5 name="wind" size={10} color="#50C878" />
                <Text style={styles.detailText}>{Math.round(day.wind.speed)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  dayCard: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    minWidth: 100,
  },
  firstCard: {
    backgroundColor: '#E3F2FD',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  weatherIcon: {
    marginBottom: 8,
  },
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  highTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  lowTemp: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  condition: {
    fontSize: 12,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'capitalize',
    minHeight: 32,
  },
  precipitationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  precipIcon: {
    marginRight: 4,
  },
  precipitationText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 4,
    fontWeight: '500',
  },
});