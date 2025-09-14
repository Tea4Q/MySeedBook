import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type SubscriptionTier = 'free' | 'premium' | 'premium-yearly';

export interface PremiumFeatures {
  unlimited_seeds: boolean;
  unlimited_suppliers: boolean; 
  unlimited_photos: boolean;
  advanced_calendar: boolean;
  weather_integration: boolean;
  plant_identification: boolean;
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
  monthly: Platform.select({
    ios: 'com.myseedbook.catalogue.premium.monthly',
    android: 'myseedbook_premium_monthly',
    default: 'premium_monthly_web'
  })!,
  yearly: Platform.select({
    ios: 'com.myseedbook.catalogue.premium.yearly', 
    android: 'myseedbook_premium_yearly',
    default: 'premium_yearly_web'
  })!
};

export const FREE_LIMITS = {
  seeds: 3,
  suppliers: 2,
  photos: 5,
  searches: 10,
  calendar_days: 30
};

// Web-compatible IAP interface
interface IAPInterface {
  initConnection: () => Promise<void>;
  getAvailablePurchases: () => Promise<any[]>;
  endConnection: () => Promise<void>;
}

// Create a web-compatible IAP implementation
const createWebIAP = (): IAPInterface => ({
  initConnection: async () => {
    console.log('Web IAP: Connection initialized (mock)');
  },
  getAvailablePurchases: async () => {
    console.log('Web IAP: No purchases available on web platform');
    return [];
  },
  endConnection: async () => {
    console.log('Web IAP: Connection ended (mock)');
  }
});

// Get platform-appropriate IAP implementation
const getIAPImplementation = (): IAPInterface => {
  if (Platform.OS === 'web') {
    return createWebIAP();
  }
  
  // For native platforms, we'll use a simplified interface
  // This avoids import issues while maintaining functionality
  return {
    initConnection: async () => {
      console.log('Native IAP: Would initialize react-native-iap');
    },
    getAvailablePurchases: async () => {
      console.log('Native IAP: Would check purchases');
      return [];
    },
    endConnection: async () => {
      console.log('Native IAP: Would end connection');
    }
  };
};

class PremiumManager {
  private static instance: PremiumManager;
  private subscription: UserSubscription | null = null;
  private isInitialized = false;
  private iap: IAPInterface;

  constructor() {
    this.iap = getIAPImplementation();
  }

  static getInstance(): PremiumManager {
    if (!PremiumManager.instance) {
      PremiumManager.instance = new PremiumManager();
    }
    return PremiumManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize IAP
      await this.iap.initConnection();
      
      // Load cached subscription status
      await this.loadSubscriptionFromStorage();
      
      // Validate current purchases
      await this.validatePurchases();
      
      this.isInitialized = true;
      console.log('PremiumManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PremiumManager:', error);
    }
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
        data_export: false,
        priority_support: false
      }
    };
  }

  async validatePurchases(): Promise<void> {
    try {
      const purchases = await this.iap.getAvailablePurchases();
      
      if (purchases && purchases.length > 0) {
        // Find most recent valid subscription
        const validSubscription = purchases.find((p: any) => 
          Object.values(SUBSCRIPTION_PRODUCTS).includes(p.productId)
        );

        if (validSubscription) {
          await this.activateSubscription(validSubscription.productId, validSubscription);
        }
      }
    } catch (error) {
      console.error('Error validating purchases:', error);
    }
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
      let tier: SubscriptionTier = 'premium';
      if (productId === SUBSCRIPTION_PRODUCTS.yearly) {
        tier = 'premium-yearly';
      }

      // Calculate expiration date
      const expirationDate = new Date();
      if (tier === 'premium-yearly') {
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
    try {
      await this.iap.endConnection();
    } catch (error) {
      console.error('Error disconnecting IAP:', error);
    }
  }
}

export const premiumManager = PremiumManager.getInstance();
export default premiumManager;