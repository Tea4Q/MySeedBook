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
  
  return subscription;
};