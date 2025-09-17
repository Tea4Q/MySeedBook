import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { CalendarWeatherData } from '../../lib/services/calendarWeatherService';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';

interface WeatherDetailModalProps {
  visible: boolean;
  onClose: () => void;
  weatherData: CalendarWeatherData | null;
  date: Date;
}

export const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({
  visible,
  onClose,
  weatherData,
  date,
}) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSuitabilityColor = (suitability: string): string => {
    switch (suitability) {
      case 'excellent': return '#27AE60';
      case 'good': return '#2ECC71';
      case 'fair': return '#F39C12';
      case 'poor': return '#E74C3C';
      case 'unsuitable': return '#C0392B';
      default: return '#95A5A6';
    }
  };

  const formatCondition = (condition: string): string => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  if (!weatherData) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{formatDate(date)}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.noDataContainer}>
            <FontAwesome5 name="cloud-meatball" size={48} color="#95A5A6" />
            <Text style={styles.noDataTitle}>No Weather Data</Text>
            <Text style={styles.noDataText}>
              Weather information is only available for today and the next 5 days.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{formatDate(date)}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome5 name="times" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Weather Overview */}
          <View style={styles.weatherOverview}>
            <View style={styles.weatherIconSection}>
              <AnimatedWeatherIcon
                weatherCode={weatherData.condition.icon}
                size={80}
                color="#4A90E2"
              />
              <Text style={styles.conditionDescription}>
                {weatherData.condition.description}
              </Text>
            </View>
            
            <View style={styles.temperatureSection}>
              <Text style={styles.highTemp}>{Math.round(weatherData.temperature.high)}°F</Text>
              <Text style={styles.lowTemp}>{Math.round(weatherData.temperature.low)}°F</Text>
              <Text style={styles.tempLabels}>High / Low</Text>
            </View>
          </View>

          {/* Precipitation */}
          {weatherData.precipitation.probability > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <FontAwesome5 name="tint" size={20} color="#3498DB" />
                <Text style={styles.cardTitle}>Precipitation</Text>
              </View>
              <Text style={styles.precipitationText}>
                {weatherData.precipitation.probability}% chance of {
                  weatherData.condition.main.toLowerCase().includes('snow') ? 'snow' : 'rain'
                }
              </Text>
              {weatherData.precipitation.amount && (
                <Text style={styles.precipitationAmount}>
                  Expected: {weatherData.precipitation.amount}mm
                </Text>
              )}
            </View>
          )}

          {/* Gardening Conditions */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="seedling" size={20} color="#27AE60" />
              <Text style={styles.cardTitle}>Gardening Conditions</Text>
            </View>
            
            <View style={styles.suitabilityBadge}>
              <Text style={[
                styles.suitabilityText,
                { color: getSuitabilityColor(weatherData.gardeningConditions.suitability) }
              ]}>
                Overall: {formatCondition(weatherData.gardeningConditions.suitability)}
              </Text>
            </View>

            <View style={styles.conditionsGrid}>
              <View style={styles.conditionItem}>
                <FontAwesome5 name="seedling" size={16} color="#27AE60" />
                <Text style={styles.conditionLabel}>Planting</Text>
                <Text style={styles.conditionValue}>
                  {formatCondition(weatherData.gardeningConditions.conditions.planting)}
                </Text>
              </View>

              <View style={styles.conditionItem}>
                <FontAwesome5 name="tint" size={16} color="#3498DB" />
                <Text style={styles.conditionLabel}>Watering</Text>
                <Text style={styles.conditionValue}>
                  {formatCondition(weatherData.gardeningConditions.conditions.watering)}
                </Text>
              </View>

              <View style={styles.conditionItem}>
                <FontAwesome5 name="apple-alt" size={16} color="#E67E22" />
                <Text style={styles.conditionLabel}>Harvesting</Text>
                <Text style={styles.conditionValue}>
                  {formatCondition(weatherData.gardeningConditions.conditions.harvesting)}
                </Text>
              </View>

              <View style={styles.conditionItem}>
                <FontAwesome5 name="mountain" size={16} color="#8B4513" />
                <Text style={styles.conditionLabel}>Soil</Text>
                <Text style={styles.conditionValue}>
                  {formatCondition(weatherData.gardeningConditions.conditions.soil)}
                </Text>
              </View>
            </View>
          </View>

          {/* Recommendations */}
          {weatherData.gardeningConditions.recommendations.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <FontAwesome5 name="lightbulb" size={20} color="#F39C12" />
                <Text style={styles.cardTitle}>Recommendations</Text>
              </View>
              {weatherData.gardeningConditions.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}

          {/* Warnings */}
          {weatherData.gardeningConditions.warnings.length > 0 && (
            <View style={[styles.card, styles.warningCard]}>
              <View style={styles.cardHeader}>
                <FontAwesome5 name="exclamation-triangle" size={20} color="#E74C3C" />
                <Text style={styles.cardTitle}>Warnings</Text>
              </View>
              {weatherData.gardeningConditions.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  • {warning}
                </Text>
              ))}
            </View>
          )}

          {/* Data Source Info */}
          <View style={styles.footer}>
            <Text style={styles.dataSource}>
              {weatherData.isToday ? 'Current weather data' : 'Forecast data'}
            </Text>
            <Text style={styles.dataProvider}>
              Weather data provided by OpenWeatherMap
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  weatherOverview: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  weatherIconSection: {
    flex: 1,
    alignItems: 'center',
  },
  conditionDescription: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: 8,
  },
  temperatureSection: {
    flex: 1,
    alignItems: 'center',
  },
  highTemp: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  lowTemp: {
    fontSize: 32,
    fontWeight: '600',
    color: '#3498DB',
    marginTop: -8,
  },
  tempLabels: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: '#FDF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 12,
  },
  precipitationText: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 4,
  },
  precipitationAmount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  suitabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginBottom: 16,
  },
  suitabilityText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  conditionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 8,
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    textTransform: 'capitalize',
  },
  recommendationText: {
    fontSize: 14,
    color: '#D68910',
    lineHeight: 20,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#C0392B',
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  dataSource: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  dataProvider: {
    fontSize: 11,
    color: '#95A5A6',
  },
});