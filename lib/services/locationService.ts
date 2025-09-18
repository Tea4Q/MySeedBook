import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationSettings } from '../../types/weather';

class LocationService {
  private readonly STORAGE_KEY = 'location_settings';
  private readonly DEFAULT_LOCATION = {
    lat: 32.7767, // Dallas, Texas coordinates
    lon: -96.7970,
    name: 'Dallas, Texas, United States'
  };

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current device location
   */
  async getCurrentLocation(): Promise<{ lat: number; lon: number; name?: string } | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Try to get place name
      let name = 'Current Location';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          name = [place.city, place.region].filter(Boolean).join(', ') || 'Current Location';
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
      }

      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        name: name || 'Current Location'
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get location settings from storage
   */
  async getLocationSettings(): Promise<LocationSettings> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading location settings:', error);
    }

    // Return default settings
    return {
      saved: [{
        id: 'default',
        name: this.DEFAULT_LOCATION.name,
        lat: this.DEFAULT_LOCATION.lat,
        lon: this.DEFAULT_LOCATION.lon,
        isDefault: true
      }],
      preferences: {
        useCurrentLocation: true, // Enable current location by default
        enableLocationAlerts: true,
        units: 'imperial'
      }
    };
  }

  /**
   * Save location settings
   */
  async saveLocationSettings(settings: LocationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving location settings:', error);
      throw new Error('Failed to save location settings');
    }
  }

  /**
   * Get the best location to use for weather data
   */
  async getBestLocation(): Promise<{ lat: number; lon: number; name: string }> {
    const settings = await this.getLocationSettings();

    // Try current location if enabled
    if (settings.preferences.useCurrentLocation) {
      const currentLoc = await this.getCurrentLocation();
      if (currentLoc) {
        return {
          lat: currentLoc.lat,
          lon: currentLoc.lon,
          name: currentLoc.name || 'Current Location'
        };
      }
    }

    // Use default saved location
    const defaultLocation = settings.saved.find(loc => loc.isDefault) || settings.saved[0];
    if (defaultLocation) {
      return {
        lat: defaultLocation.lat,
        lon: defaultLocation.lon,
        name: defaultLocation.name
      };
    }

    // Fallback to hardcoded default with proper location name
    try {
      const actualLocationName = await this.getLocationName(
        this.DEFAULT_LOCATION.lat, 
        this.DEFAULT_LOCATION.lon
      );
      return {
        lat: this.DEFAULT_LOCATION.lat,
        lon: this.DEFAULT_LOCATION.lon,
        name: actualLocationName !== 'Unknown Location' ? actualLocationName : this.DEFAULT_LOCATION.name
      };
    } catch (error) {
      console.warn('Could not resolve default location name:', error);
      return this.DEFAULT_LOCATION;
    }
  }

  /**
   * Add a new saved location
   */
  async addSavedLocation(name: string, lat: number, lon: number, isDefault = false): Promise<void> {
    const settings = await this.getLocationSettings();
    
    const newLocation = {
      id: Date.now().toString(),
      name,
      lat,
      lon,
      isDefault
    };

    // If this is the new default, remove default from others
    if (isDefault) {
      settings.saved = settings.saved.map(loc => ({ ...loc, isDefault: false }));
    }

    settings.saved.push(newLocation);
    await this.saveLocationSettings(settings);
  }

  /**
   * Remove a saved location
   */
  async removeSavedLocation(id: string): Promise<void> {
    const settings = await this.getLocationSettings();
    const locationToRemove = settings.saved.find(loc => loc.id === id);
    
    // Don't allow removing the last location
    if (settings.saved.length <= 1) {
      throw new Error('Cannot remove the last saved location');
    }

    settings.saved = settings.saved.filter(loc => loc.id !== id);
    
    // If we removed the default, make the first one default
    if (locationToRemove?.isDefault && settings.saved.length > 0) {
      settings.saved[0].isDefault = true;
    }

    await this.saveLocationSettings(settings);
  }

  /**
   * Set a location as default
   */
  async setDefaultLocation(id: string): Promise<void> {
    const settings = await this.getLocationSettings();
    
    settings.saved = settings.saved.map(loc => ({
      ...loc,
      isDefault: loc.id === id
    }));

    await this.saveLocationSettings(settings);
  }

  /**
   * Update location preferences
   */
  async updatePreferences(preferences: Partial<LocationSettings['preferences']>): Promise<void> {
    const settings = await this.getLocationSettings();
    settings.preferences = { ...settings.preferences, ...preferences };
    await this.saveLocationSettings(settings);
  }

  /**
   * Search for locations by name (using OpenWeatherMap Geocoding API)
   */
  async searchLocations(query: string): Promise<{ name: string; lat: number; lon: number; country: string }[]> {
    try {
      const response = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Geocoding API error');
      }

      const data = await response.json();
      
      return data.map((item: any) => ({
        name: [item.name, item.state, item.country].filter(Boolean).join(', '),
        lat: item.lat,
        lon: item.lon,
        country: item.country
      }));
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  /**
   * Get location by coordinates (reverse geocoding)
   */
  async getLocationName(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding API error');
      }

      const data = await response.json();
      
      if (data.length > 0) {
        const place = data[0];
        return [place.name, place.state, place.country].filter(Boolean).join(', ');
      }

      return 'Unknown Location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Calculate distance between two coordinates (in miles)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Quick setup for Dallas location (for development/testing)
   */
  async setupDallasLocation(): Promise<void> {
    const settings: LocationSettings = {
      saved: [{
        id: 'dallas',
        name: 'Dallas, Texas',
        lat: 32.7767,
        lon: -96.7970,
        isDefault: true
      }],
      preferences: {
        useCurrentLocation: false, // Use saved Dallas location instead
        enableLocationAlerts: true,
        units: 'imperial'
      }
    };
    
    await this.saveLocationSettings(settings);
    console.log('✅ Dallas location set as default');
  }

  /**
   * Enable current location detection
   */
  async enableCurrentLocation(): Promise<boolean> {
    const hasPermission = await this.requestLocationPermission();
    if (hasPermission) {
      const settings = await this.getLocationSettings();
      settings.preferences.useCurrentLocation = true;
      await this.saveLocationSettings(settings);
      console.log('✅ Current location enabled');
      return true;
    }
    return false;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
export const locationService = new LocationService();