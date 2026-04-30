import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { guestTracker, GuestTracker } from '@/utils/guestTracker';

export function useGuestLimits() {
  const { isGuest, refreshGuestUsage } = useAuth();
  const router = useRouter();

  const checkAndPromptForLimit = async (action: 'seed' | 'supplier' | 'view'): Promise<boolean> => {
    if (!isGuest) return true; // Not a guest, allow action

    if (action === 'seed') {
      const canAdd = await guestTracker.canAddSeed();
      if (!canAdd) {
        Alert.alert(
          'Guest Limit Reached',
          `You can add up to ${GuestTracker.GUEST_SEED_LIMIT} seeds as a guest. Create a free account to add up to 10 seeds, or upgrade for unlimited access.`,
          [
            { text: 'Create Account', onPress: () => router.push('/auth'), style: 'default' },
            { text: 'Not Now', style: 'cancel' },
          ]
        );
        return false;
      }
    }

    if (action === 'supplier') {
      const canAdd = await guestTracker.canAddSupplier();
      if (!canAdd) {
        Alert.alert(
          'Guest Limit Reached',
          `You can add up to ${GuestTracker.GUEST_SUPPLIER_LIMIT} supplier as a guest. Create a free account to add up to 3 suppliers, or upgrade for unlimited access.`,
          [
            { text: 'Create Account', onPress: () => router.push('/auth'), style: 'default' },
            { text: 'Not Now', style: 'cancel' },
          ]
        );
        return false;
      }
    }

    return true;
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
    checkAndPromptForLimit,
    trackAction,
    showUpgradePrompt,
    getRemainingSeeds,
  };
}
