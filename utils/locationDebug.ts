// Location debug utilities
import { locationService } from '../lib/services/locationService';

/**
 * Quick setup for Dallas location
 */
export const setupDallasLocation = async () => {
  console.log('🌆 Setting up Dallas location...');
  try {
    await locationService.setupDallasLocation();
    console.log('✅ Dallas location configured successfully');
    
    // Test the location
    const bestLocation = await locationService.getBestLocation();
    console.log('📍 Best location now:', bestLocation);
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up Dallas location:', error);
    return false;
  }
};

/**
 * Enable current location detection
 */
export const enableCurrentLocation = async () => {
  console.log('📱 Enabling current location...');
  try {
    const success = await locationService.enableCurrentLocation();
    if (success) {
      console.log('✅ Current location enabled successfully');
      
      // Test getting current location
      const currentLoc = await locationService.getCurrentLocation();
      if (currentLoc) {
        console.log('📍 Your current location:', currentLoc);
      }
    } else {
      console.log('❌ Location permission denied');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error enabling current location:', error);
    return false;
  }
};

/**
 * Debug current location settings
 */
export const debugLocationSettings = async () => {
  console.log('🐛 Location Debug Info:');
  
  try {
    const settings = await locationService.getLocationSettings();
    console.log('Settings:', {
      useCurrentLocation: settings.preferences.useCurrentLocation,
      savedLocations: settings.saved.length,
      defaultLocation: settings.saved.find(loc => loc.isDefault)?.name
    });
    
    const bestLocation = await locationService.getBestLocation();
    console.log('Best location:', bestLocation);
    
  } catch (error) {
    console.error('Error debugging location:', error);
  }
};