// Development helper to manually grant premium access for testing
import { premiumManager } from '../utils/premiumManager';

export const devGrantPremium = async () => {
  console.log('🧪 DEV: Granting premium access for testing...');
  
  try {
    // This simulates a yearly premium purchase
    await premiumManager.purchaseSubscription('premium_yearly_web');
    
    console.log('✅ DEV: Premium access granted!');
    console.log('Premium status:', premiumManager.isPremium());
    
    return true;
  } catch (error) {
    console.error('❌ DEV: Failed to grant premium:', error);
    return false;
  }
};

export const devRevokePremium = async () => {
  console.log('🧪 DEV: Revoking premium access...');
  
  try {
    // Clear premium subscription from storage
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.removeItem('user_subscription');
    
    // Reinitialize premium manager to reset to free tier
    await premiumManager.initialize();
    
    console.log('✅ DEV: Premium access revoked!');
    console.log('Premium status:', premiumManager.isPremium());
    
    return true;
  } catch (error) {
    console.error('❌ DEV: Failed to revoke premium:', error);
    return false;
  }
};

// Check current premium status
export const devCheckPremiumStatus = () => {
  const subscription = premiumManager.getSubscription();
  
  console.log('🔍 DEV: Current Premium Status:');
  console.log('  • Is Premium:', premiumManager.isPremium());
  console.log('  • Tier:', subscription.tier);
  console.log('  • Active:', subscription.isActive);
  console.log('  • Expires:', subscription.expiresAt);
  console.log('  • Weather Access:', premiumManager.hasFeature('weather_integration'));
  console.log('  • Barcode Scanner:', premiumManager.hasFeature('barcode_scanner'));
  
  console.log('🤖 AI Features:');
  console.log('  • AI Garden Assistant:', premiumManager.hasFeature('ai_garden_assistant'));
  console.log('  • Smart Shopping:', premiumManager.hasFeature('smart_shopping_assistant'));
  console.log('  • Voice Notes:', premiumManager.hasFeature('voice_notes'));
  console.log('  • Plant Health (Phase 2):', premiumManager.hasFeature('plant_health_diagnostics'));
  
  return subscription;
};

// Grant only AI features for testing
export const devGrantAIFeatures = async () => {
  console.log('🤖 DEV: Granting AI features access for testing...');
  
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    const testSubscription = {
      tier: 'premium',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      isActive: true,
      features: {
        unlimited_seeds: false,
        unlimited_suppliers: false,
        unlimited_photos: false,
        advanced_calendar: false,
        weather_integration: false,
        plant_identification: false,
        barcode_scanner: false,
        data_export: false,
        priority_support: false,
        // AI Features only
        ai_garden_assistant: true,
        smart_shopping_assistant: true,
        voice_notes: true,
        plant_health_diagnostics: false,
        smart_planting_calendar: false,
        harvest_prediction: false,
      }
    };
    
    await AsyncStorage.default.setItem('user_subscription', JSON.stringify(testSubscription));
    await premiumManager.initialize(); // Reload subscription
    
    console.log('✅ DEV: AI features access granted!');
    devCheckPremiumStatus();
    
    return true;
  } catch (error) {
    console.error('❌ DEV: Failed to grant AI features:', error);
    return false;
  }
};