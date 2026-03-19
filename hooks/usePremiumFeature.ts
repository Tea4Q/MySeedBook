import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { premiumManager } from '../utils/premiumManager';
import { useGlobalSubscription } from '../lib/globalSubscriptionManager';

interface UsePremiumFeatureResult {
  isPremium: boolean;
  checkFeature: (feature: keyof import('../utils/premiumManager').PremiumFeatures) => boolean;
  checkLimit: (action: 'seed' | 'supplier' | 'photo' | 'search') => Promise<{ allowed: boolean; limit: number; current: number }>;
  trackUsage: (action: 'seed' | 'supplier' | 'photo' | 'search') => Promise<void>;
  showUpgradePrompt: (feature?: string) => void;
  subscription: import('../utils/premiumManager').UserSubscription;
}

export function usePremiumFeature(): UsePremiumFeatureResult {
  // Bridge: use RevenueCat isPremium as the source of truth
  const { isPremium: rcIsPremium, tier } = useGlobalSubscription();
  const [subscription, setSubscription] = useState(premiumManager.getSubscription());

  useEffect(() => {
    // Keep legacy subscription state for callers that read subscription.tier etc.
    const initializePremium = async () => {
      await premiumManager.initialize();
      setSubscription(premiumManager.getSubscription());
    };
    initializePremium();
  }, []);

  // isPremium is now driven by RevenueCat
  const isPremium = rcIsPremium;

  const checkFeature = (feature: keyof import('../utils/premiumManager').PremiumFeatures): boolean => {
    // Premium via RevenueCat unlocks all features
    if (isPremium) return true;
    return premiumManager.hasFeature(feature);
  };

  const checkLimit = async (action: 'seed' | 'supplier' | 'photo' | 'search') => {
    // Premium users have unlimited access
    if (isPremium) {
      return { allowed: true, limit: Infinity, current: 0 };
    }
    return await premiumManager.checkLimit(action);
  };

  const trackUsage = async (action: 'seed' | 'supplier' | 'photo' | 'search') => {
    if (!isPremium) {
      await premiumManager.trackUsage(action);
    }
  };

  const showUpgradePrompt = (feature?: string) => {
    const title = feature ? `Upgrade for ${feature}` : 'Choose a Garden Plan';
    const message = feature
      ? `Unlock ${feature} with MySeedBook Essential at $7.99, or move up to Voice & AI at $9.99 for voice notes and AI-powered entry.`
      : 'Start with Essential at $7.99 for unlimited seeds, weather, and cloud sync. Upgrade to Voice & AI at $9.99 when you want voice notes and AI entry.';

    Alert.alert(title, message, [
      { text: 'Not Now', style: 'cancel' },
    ]);
  };

  return {
    isPremium,
    checkFeature,
    checkLimit,
    trackUsage,
    showUpgradePrompt,
    subscription: {
      ...subscription,
      tier:
        tier === 'voice'
          ? 'voice-monthly'
          : tier === 'essential'
            ? 'essential-monthly'
            : subscription.tier,
    },
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
        `You've reached your free limit of ${usage.limit} ${actionNames[action]}. Upgrade to Essential for unlimited access, weather, and cloud sync.`,
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