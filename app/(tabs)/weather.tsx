import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CurrentWeatherCard, WeatherForecastCard, GardeningConditionsCard } from '../../components/Weather';
import { weatherService } from '../../lib/services/weatherService';
import { locationService } from '../../lib/services/locationService';
import { gardeningInsightsService } from '../../lib/services/gardeningInsightsService';
import { usePremiumFeature } from '../../hooks/usePremiumFeature';
import PremiumModal from '../../components/PremiumModal';
import {
  CurrentWeather,
  WeatherForecast,
  GardeningConditions,
} from '../../types/weather';

export default function WeatherScreen() {
  const { checkFeature } = usePremiumFeature();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [gardeningConditions, setGardeningConditions] = useState<GardeningConditions | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Load weather data
  const loadWeatherData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get best location
      const location = await locationService.getBestLocation();
      setLocationName(location.name);
      console.log('📍 Using location:', location);

      // Fetch weather data
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(location.lat, location.lon),
        weatherService.getForecast(location.lat, location.lon),
      ]);

      console.log('✅ Weather data loaded successfully');
      setCurrentWeather(weatherData);
      setForecast(forecastData);

      // Generate gardening insights
      const insights = gardeningInsightsService.analyzeCurrentConditions(weatherData);
      setGardeningConditions(insights);

    } catch (err) {
      console.error('❌ Error loading weather data:', err);
      
      setError(`Failed to load weather data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      Alert.alert(
        'Weather Error',
        `Unable to load weather data.\n\nError: ${err instanceof Error ? err.message : 'Unknown error'}\n\nCheck the console for more details.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load - Check premium access and load weather data
  useEffect(() => {
    if (!checkFeature('weather_integration')) {
      setShowPremiumModal(true);
      setLoading(false); // Stop loading if no premium access
      return;
    }
    loadWeatherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Handle refresh
  const onRefresh = () => {
    loadWeatherData(true);
  };

  // Handle location change
  const handleLocationPress = () => {
    Alert.alert(
      'Change Location',
      'Choose your location preference:',
      [
        {
          text: 'Use Current Location',
          onPress: async () => {
            const success = await locationService.enableCurrentLocation();
            if (success) {
              Alert.alert('Success', 'Current location enabled! Refreshing weather...', [
                { text: 'OK', onPress: () => loadWeatherData(true) }
              ]);
            } else {
              Alert.alert('Error', 'Location permission denied. Please enable location access in your device settings.');
            }
          }
        },
        {
          text: 'Set to Dallas',
          onPress: async () => {
            await locationService.setupDallasLocation();
            Alert.alert('Success', 'Dallas set as your location! Refreshing weather...', [
              { text: 'OK', onPress: () => loadWeatherData(true) }
            ]);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Handle recommendation press
  const handleRecommendationPress = (recommendation: string) => {
    Alert.alert('Garden Tip', recommendation, [{ text: 'Got it!' }]);
  };

  // Handle premium upgrade
  const handlePremiumUpgrade = () => {
    setShowUpgradeModal(true);
  };

  // Show premium upgrade screen if user doesn't have weather integration
  if (showPremiumModal && !showUpgradeModal) {
    return (
      <View style={styles.premiumContainer}>
        <FontAwesome5 name="cloud-sun" size={80} color="#4A90E2" style={styles.premiumIcon} />
        <Text style={styles.premiumTitle}>Weather Integration</Text>
        <Text style={styles.premiumDescription}>
          Get real-time weather data, gardening insights, and personalized recommendations to optimize your gardening success.
        </Text>
        <View style={styles.premiumFeatures}>
          <View style={styles.featureItem}>
            <FontAwesome5 name="thermometer-half" size={20} color="#4A90E2" />
            <Text style={styles.featureText}>Real-time weather conditions</Text>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome5 name="calendar-alt" size={20} color="#4A90E2" />
            <Text style={styles.featureText}>7-day detailed forecast</Text>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome5 name="seedling" size={20} color="#4A90E2" />
            <Text style={styles.featureText}>Gardening condition insights</Text>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome5 name="lightbulb" size={20} color="#4A90E2" />
            <Text style={styles.featureText}>Personalized garden tips</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.upgradeButton} onPress={handlePremiumUpgrade}>
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.backButtonText}>Back to Garden</Text>
        </TouchableOpacity>

        <PremiumModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="Weather Integration"
        />
      </View>
    );
  }

  if (loading && !currentWeather) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  if (error && !currentWeather) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-triangle" size={48} color="#E74C3C" />
        <Text style={styles.errorTitle}>Weather Unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadWeatherData()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <TouchableOpacity onPress={handleLocationPress} style={styles.locationButton}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#4A90E2" />
              <Text style={styles.locationText}>{locationName}</Text>
              <FontAwesome5 name="chevron-right" size={12} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.lastUpdated}>
            Last updated: {currentWeather ? new Date(currentWeather.timestamp).toLocaleTimeString() : '--:--'}
          </Text>
        </View>

        {currentWeather && (
          <CurrentWeatherCard 
            weather={currentWeather}
          />
        )}

        {gardeningConditions && (
          <GardeningConditionsCard 
            conditions={gardeningConditions}
            onRecommendationPress={handleRecommendationPress}
          />
        )}

        {forecast.length > 0 && (
          <WeatherForecastCard 
            forecast={forecast}
            showTitle={true}
          />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Weather data provided by OpenWeatherMap
          </Text>
          <Text style={styles.footerSubtext}>
            Pull down to refresh • Tap location to change
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2C3E50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    paddingBottom: 0,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginHorizontal: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 4,
  },
  // Premium upgrade styles
  premiumContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  premiumIcon: {
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  premiumFeatures: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 16,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
});