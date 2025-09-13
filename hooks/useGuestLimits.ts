import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { guestTracker } from '@/utils/guestTracker';

export function useGuestLimits() {
  const { isGuest, refreshGuestUsage } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const checkAndPromptForLimit = async (action: 'seed' | 'supplier' | 'view'): Promise<boolean> => {
    if (!isGuest) return true; // Not a guest, allow action
    
    // For demo experience, allow all actions but show upgrade prompts occasionally
    if (action === 'seed') {
      const usage = await guestTracker.getUsage();
      
      // Show upgrade prompt after user has created several demo items
      if (usage.seedsAdded > 0 && usage.seedsAdded % 5 === 0) {
        Alert.alert(
          'Save Your Garden Permanently!',
          `You've created ${usage.seedsAdded} demo seeds. Create an account to save your garden forever and unlock unlimited features!`,
          [
            {
              text: 'Create Account',
              onPress: () => router.push('/auth'),
              style: 'default'
            },
            {
              text: 'Continue Demo',
              style: 'cancel'
            }
          ]
        );
      }
    }
    
    return true; // Always allow the action
  };

  const trackAction = async (action: 'seed' | 'supplier' | 'view') => {
    if (!isGuest) return;

    // Only track seed additions for guests
    if (action === 'seed') {
      await guestTracker.trackSeedAdded();
      await refreshGuestUsage();
    }
  };

  const showUpgradePrompt = (feature: string = 'this feature') => {
    Alert.alert(
      'Demo Mode Active',
      `You're using demo mode. Create an account to save your data permanently and unlock ${feature}!`,
      [
        {
          text: 'Create Account',
          onPress: () => router.push('/auth'),
          style: 'default'
        },
        {
          text: 'Continue Demo',
          style: 'cancel'
        }
      ]
    );
  };

  const getRemainingSeeds = async (): Promise<number> => {
    if (!isGuest) return Infinity;
    return await guestTracker.getRemainingSeeds();
  };

  return {
    isChecking,
    checkAndPromptForLimit,
    trackAction,
    showUpgradePrompt,
    getRemainingSeeds,
  };
}
