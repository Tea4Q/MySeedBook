import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { premiumManager } from '../utils/premiumManager';

interface UsePremiumFeatureResult {
  isPremium: boolean;
  checkFeature: (feature: keyof import('../utils/premiumManager').PremiumFeatures) => boolean;
  checkLimit: (action: 'seed' | 'supplier' | 'photo' | 'search') => Promise<{ allowed: boolean; limit: number; current: number }>;
  trackUsage: (action: 'seed' | 'supplier' | 'photo' | 'search') => Promise<void>;
  showUpgradePrompt: (feature?: string) => void;
  subscription: import('../utils/premiumManager').UserSubscription;
}

export function usePremiumFeature(): UsePremiumFeatureResult {
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState(premiumManager.getSubscription());

  useEffect(() => {
    // Initialize premium manager and check subscription status
    const initializePremium = async () => {
      await premiumManager.initialize();
      const currentSubscription = premiumManager.getSubscription();
      setSubscription(currentSubscription);
      setIsPremium(premiumManager.isPremium());
    };

    initializePremium();
  }, []);

  const checkFeature = (feature: keyof import('../utils/premiumManager').PremiumFeatures): boolean => {
    return premiumManager.hasFeature(feature);
  };

  const checkLimit = async (action: 'seed' | 'supplier' | 'photo' | 'search') => {
    return await premiumManager.checkLimit(action);
  };

  const trackUsage = async (action: 'seed' | 'supplier' | 'photo' | 'search') => {
    await premiumManager.trackUsage(action);
  };

  const showUpgradePrompt = (feature?: string) => {
    const title = feature ? `Upgrade for ${feature}` : 'Upgrade to Premium';
    const message = feature 
      ? `Unlock ${feature} and all other premium features with a MySeedBook Premium subscription.`
      : 'Unlock all premium features with unlimited access to your garden data.';

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Learn More',
          onPress: () => {
            // TODO: Open premium modal
            console.log('Opening premium modal for feature:', feature);
          },
          style: 'default'
        },
        {
          text: 'Not Now',
          style: 'cancel'
        }
      ]
    );
  };

  return {
    isPremium,
    checkFeature,
    checkLimit,
    trackUsage,
    showUpgradePrompt,
    subscription
  };
}

// Hook for gating premium features
export function usePremiumGate(feature: keyof import('../utils/premiumManager').PremiumFeatures) {
  const { checkFeature, showUpgradePrompt } = usePremiumFeature();
  
  const hasFeature = checkFeature(feature);
  
  const requestFeature = () => {
    if (hasFeature) {
      return true;
    } else {
      showUpgradePrompt(feature);
      return false;
    }
  };

  return {
    hasFeature,
    requestFeature
  };
}

// Hook for managing usage limits
export function useUsageLimit(action: 'seed' | 'supplier' | 'photo' | 'search') {
  const { isPremium, checkLimit, trackUsage, showUpgradePrompt } = usePremiumFeature();
  const [currentUsage, setCurrentUsage] = useState({ current: 0, limit: 0, allowed: true });

  useEffect(() => {
    const updateUsage = async () => {
      const usage = await checkLimit(action);
      setCurrentUsage(usage);
    };
    
    updateUsage();
  }, [action, checkLimit]);

  const requestAction = async (): Promise<boolean> => {
    if (isPremium) {
      return true; // Premium users have unlimited access
    }

    const usage = await checkLimit(action);
    
    if (usage.allowed) {
      await trackUsage(action);
      // Update current usage
      const newUsage = await checkLimit(action);
      setCurrentUsage(newUsage);
      return true;
    } else {
      // Show limit reached prompt
      const actionNames = {
        seed: 'seed additions',
        supplier: 'supplier additions',
        photo: 'photo uploads',
        search: 'plant searches'
      };

      Alert.alert(
        `Free Limit Reached`,
        `You've reached your free limit of ${usage.limit} ${actionNames[action]}. Upgrade to Premium for unlimited access!`,
        [
          {
            text: 'Upgrade Now',
            onPress: () => showUpgradePrompt(`unlimited ${actionNames[action]}`),
            style: 'default'
          },
          {
            text: 'Not Now',
            style: 'cancel'
          }
        ]
      );
      
      return false;
    }
  };

  return {
    canUse: currentUsage.allowed,
    current: currentUsage.current,
    limit: currentUsage.limit,
    isPremium,
    requestAction
  };
}