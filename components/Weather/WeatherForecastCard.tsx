import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { WeatherMeteocon } from './MeteoconsFinal';
import { WeatherForecast } from '../../types/weather';
import { useTheme, ThemeColors } from '@/lib/theme';

interface WeatherForecastCardProps {
  forecast: WeatherForecast[];
  showTitle?: boolean;
}

export const WeatherForecastCard: React.FC<WeatherForecastCardProps> = ({ 
  forecast, 
  showTitle = true 
}) => {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isTablet = width >= 768; // Tablet breakpoint
  
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

  const renderDayCard = (day: WeatherForecast, index: number) => (
    <View key={day.date} style={[styles.dayCard, index === 0 && styles.firstCard]}>
      {/* Date Header */}
      <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
      
      {/* Weather Icon */}
      <View style={styles.iconContainer}>
        <WeatherMeteocon
          weatherCode={day.condition.icon || '01d'}
          size={40}
          style={styles.weatherIcon}
        />
      </View>
      
      {/* Temperature */}
      <View style={styles.tempRow}>
        <Text style={[styles.temp, { color: getTemperatureColor(day.temp.max) }]}>
          {Math.round(day.temp.max)}°
        </Text>
        <Text style={styles.tempDivider}>/</Text>
        <Text style={[styles.temp, styles.tempLow]}>
          {Math.round(day.temp.min)}°
        </Text>
      </View>

      {/* Condition Description */}
      <Text style={styles.condition} numberOfLines={2}>
        {day.condition.description}
      </Text>

      {/* Weather Details Grid */}
      <View style={styles.detailsGrid}>
        {/* Precipitation */}
        <View style={styles.detailRow}>
          <FontAwesome5 name="tint" size={12} color="#4A90E2" />
          <Text style={styles.detailLabel}>Rain</Text>
          <Text style={styles.detailValue}>
            {day.precipitation?.probability ? `${Math.round(day.precipitation.probability)}%` : '0%'}
          </Text>
        </View>

        {/* Humidity */}
        <View style={styles.detailRow}>
          <FontAwesome5 name="water" size={12} color="#50C878" />
          <Text style={styles.detailLabel}>Humid</Text>
          <Text style={styles.detailValue}>{day.humidity}%</Text>
        </View>

        {/* Wind */}
        <View style={styles.detailRow}>
          <FontAwesome5 name="wind" size={12} color="#95A5A6" />
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>{Math.round(day.wind.speed)} mph</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.title}>
          {isTablet ? '7-Day Forecast' : '7-Day Forecast'}
        </Text>
      )}
      
      {isTablet ? (
        // Grid layout for tablets - no scrolling needed
        <View style={styles.gridContainer}>
          {forecast.map((day, index) => renderDayCard(day, index))}
        </View>
      ) : (
        // Horizontal scroll for phones
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          pagingEnabled={false}
          nestedScrollEnabled={true}
          scrollEnabled={true}
        >
          {forecast.map((day, index) => renderDayCard(day, index))}
        </ScrollView>
      )}
    </View>
  );
};

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      shadowColor: colors.shadowColor,
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
      color: colors.text,
      marginBottom: 16,
    },
    scrollContent: {
      paddingHorizontal: 4,
      paddingRight: 16,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    dayCard: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginRight: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      minWidth: 110,
      width: 110,
    },
    gridCard: {
      flex: 1,
      minWidth: 120,
      maxWidth: 150,
      marginRight: 0,
    },
    firstCard: {
      backgroundColor: colors.primary + '20',
    },
    dayLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
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
      color: colors.textSecondary,
      lineHeight: 20,
    },
    condition: {
      fontSize: 12,
      color: colors.text,
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
      color: colors.textSecondary,
      marginLeft: 4,
      fontWeight: '500',
    },
  });
}