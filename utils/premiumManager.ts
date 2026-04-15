import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Local fallback manager for development/testing when store IAP is unavailable.
// Canonical subscription source of truth is RevenueCat context.

export type SubscriptionTier =
  | 'free'
  | 'essential-monthly'
  | 'essential-yearly'
  | 'voice-monthly'
  | 'voice-yearly';

export interface PremiumFeatures {
  unlimited_seeds: boolean;
  unlimited_suppliers: boolean; 
  unlimited_photos: boolean;
  advanced_calendar: boolean;
  weather_integration: boolean;
  plant_identification: boolean;
  barcode_scanner: boolean;
  data_export: boolean;
  priority_support: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  expiresAt: string | null;
  features: PremiumFeatures;
  isActive: boolean;
}

// Product IDs for App Store and Google Play
export const SUBSCRIPTION_PRODUCTS = {
  essentialMonthly: Platform.select({
    ios: 'com.myseedbook.catalogue.essential.monthly',
    android: 'myseedbook_essential_month',
    default: 'essential_monthly_web',
  })!,
  essentialYearly: Platform.select({
    ios: 'com.myseedbook.catalogue.essential.yearly',
    android: 'myseedbook_essential_year',
    default: 'essential_yearly_web',
  })!,
  voiceMonthly: Platform.select({
    ios: 'com.myseedbook.catalogue.voice.monthly',
    android: 'myseedbook_voice_monthly',
    default: 'voice_monthly_web',
  })!,
  voiceYearly: Platform.select({
    ios: 'com.myseedbook.catalogue.voice.yearly',
    android: 'myseedbook_voice_yearly',
    default: 'voice_yearly_web',
  })!,
};

// Get subscription product IDs as array
export const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'com.myseedbook.catalogue.essential.month',
    'com.myseedbook.catalogue.essential.year',
    'com.myseedbook.catalogue.voice.monthly',
    'com.myseedbook.catalogue.voice.yearly',
  ],
  android: [
    'com_myseedbook_essential_month',
    'com_myseedbook_essential_year',
    'com_myseedbook_voice_monthly',
    'com_myseedbook_voice_yearly',
  ],
  default: []
})!;

export const FREE_LIMITS = {
  seeds: 10,
  suppliers: 3,
  photos: 3,
  searches: 10,
  calendar_days: 30
};

class PremiumManager {
  private static instance: PremiumManager;
  private subscription: UserSubscription | null = null;
  private isInitialized = false;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  static getInstance(): PremiumManager {
    if (!PremiumManager.instance) {
      PremiumManager.instance = new PremiumManager();
    }
    return PremiumManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // IAP will be added in v1.3.2 - currently no native IAP connection
      console.log('PremiumManager initialized (IAP disabled for now)');
      
      // Load cached subscription status
      await this.loadSubscriptionFromStorage();
      
      this.isInitialized = true;
      console.log('PremiumManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PremiumManager:', error);
      await this.loadSubscriptionFromStorage();
      this.isInitialized = true;
    }
  }

  private setupPurchaseListeners(): void {
    // IAP listeners will be added in v1.3.2
    console.log('IAP listeners not configured (billing coming in v1.3.2)');
  }

  async loadSubscriptionFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('user_subscription');
      if (stored) {
        this.subscription = JSON.parse(stored);
        
        // Check if subscription expired
        if (this.subscription?.expiresAt) {
          const expireDate = new Date(this.subscription.expiresAt);
          if (expireDate < new Date()) {
            this.subscription.isActive = false;
            this.subscription.tier = 'free';
          }
        }
      } else {
        this.subscription = this.getDefaultSubscription();
      }
    } catch (error) {
      console.error('Error loading subscription from storage:', error);
      this.subscription = this.getDefaultSubscription();
    }
  }

  private getDefaultSubscription(): UserSubscription {
    return {
      tier: 'free',
      expiresAt: null,
      isActive: false,
      features: {
        unlimited_seeds: false,
        unlimited_suppliers: false,
        unlimited_photos: false,
        advanced_calendar: false,
        weather_integration: false,
        plant_identification: false,
        barcode_scanner: false,
        data_export: false,
        priority_support: false
      }
    };
  }

  async validatePurchases(): Promise<void> {
    // IAP validation will be added in v1.3.2
    console.log('IAP validation skipped (billing coming in v1.3.2)');
  }

  async purchaseSubscription(productId: string): Promise<boolean> {
    try {
      // Simplified purchase flow - will be refined based on IAP version
      console.log('Initiating purchase for:', productId);
      
      // For now, simulate successful purchase for development
      // TODO: Implement actual IAP purchase flow once store products are configured
      await this.simulatePurchase(productId);
      
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }
  
  // Development helper - simulate purchase
  private async simulatePurchase(productId: string): Promise<void> {
    console.log('Simulating purchase for development:', productId);
    await this.activateSubscription(productId, { productId, transactionDate: new Date().toISOString() });
  }

  private async activateSubscription(productId: string, purchase: any): Promise<void> {
    try {
      // Determine subscription tier
      let tier: SubscriptionTier = 'essential-monthly';
      if (productId === SUBSCRIPTION_PRODUCTS.essentialYearly) tier = 'essential-yearly';
      if (productId === SUBSCRIPTION_PRODUCTS.voiceMonthly) tier = 'voice-monthly';
      if (productId === SUBSCRIPTION_PRODUCTS.voiceYearly) tier = 'voice-yearly';

      // Calculate expiration date
      const expirationDate = new Date();
      if (tier === 'essential-yearly' || tier === 'voice-yearly') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      } else {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      }

      // Create premium subscription
      this.subscription = {
        tier,
        expiresAt: expirationDate.toISOString(),
        isActive: true,
        features: {
          unlimited_seeds: true,
          unlimited_suppliers: true,
          unlimited_photos: true,
          advanced_calendar: true,
          weather_integration: true,
          plant_identification: true,
          barcode_scanner: true,
          data_export: true,
          priority_support: true
        }
      };

      // Save to storage
      await AsyncStorage.setItem('user_subscription', JSON.stringify(this.subscription));
      
      console.log('Subscription activated:', tier);
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      await this.validatePurchases();
      return this.subscription?.isActive || false;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  }

  // Feature checking methods
  isPremium(): boolean {
    return this.subscription?.isActive || false;
  }

  hasFeature(feature: keyof PremiumFeatures): boolean {
    return this.subscription?.features[feature] || false;
  }

  getSubscription(): UserSubscription {
    return this.subscription || this.getDefaultSubscription();
  }

  async checkLimit(action: 'seed' | 'supplier' | 'photo' | 'search'): Promise<{ allowed: boolean; limit: number; current: number }> {
    if (this.isPremium()) {
      return { allowed: true, limit: -1, current: 0 }; // Unlimited
    }

    // Check free tier limits
    const limits = FREE_LIMITS;
    const currentUsage = await this.getCurrentUsage(action);
    
    let limit = 0;
    switch (action) {
      case 'seed':
        limit = limits.seeds;
        break;
      case 'supplier':
        limit = limits.suppliers;
        break;
      case 'photo':
        limit = limits.photos;
        break;
      case 'search':
        limit = limits.searches;
        break;
    }

    return {
      allowed: currentUsage < limit,
      limit,
      current: currentUsage
    };
  }

  private async getCurrentUsage(action: string): Promise<number> {
    try {
      const usage = await AsyncStorage.getItem(`usage_${action}`);
      return usage ? parseInt(usage, 10) : 0;
    } catch {
      return 0;
    }
  }

  async trackUsage(action: 'seed' | 'supplier' | 'photo' | 'search'): Promise<void> {
    if (this.isPremium()) return; // No tracking needed for premium users

    try {
      const current = await this.getCurrentUsage(action);
      await AsyncStorage.setItem(`usage_${action}`, (current + 1).toString());
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  async clearUsageData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'usage_seed',
        'usage_supplier', 
        'usage_photo',
        'usage_search'
      ]);
    } catch (error) {
      console.error('Error clearing usage data:', error);
    }
  }

  async disconnect(): Promise<void> {
    // IAP connection will be added in v1.3.2
    console.log('IAP disconnect skipped (billing coming in v1.3.2)');
  }

  // Development helper - enable premium for testing
  async enableTestPremium(): Promise<void> {
    if (!__DEV__) {
      console.warn('Test premium can only be enabled in development mode');
      return;
    }
    
    await this.simulatePurchase(SUBSCRIPTION_PRODUCTS.essentialMonthly);
    console.log('Test premium features enabled');
  }

  // Development helper - disable premium for testing
  async disableTestPremium(): Promise<void> {
    if (!__DEV__) {
      console.warn('Test premium can only be disabled in development mode');
      return;
    }
    
    this.subscription = this.getDefaultSubscription();
    await AsyncStorage.setItem('user_subscription', JSON.stringify(this.subscription));
    console.log('Test premium features disabled');
  }
}

export const premiumManager = PremiumManager.getInstance();
export default premiumManager;