import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { User, AlertCircle } from 'lucide-react-native';
import { GuestTracker } from '@/utils/guestTracker';

interface GuestSeedLimitBannerProps {
  remainingSeeds: number;
  onUpgrade?: () => void;
}

export function GuestSeedLimitBanner({ remainingSeeds, onUpgrade }: GuestSeedLimitBannerProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/auth');
    }
  };

  if (remainingSeeds > 0) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
        <View style={styles.content}>
          <User size={16} color={colors.primary} />
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Guest Mode: {remainingSeeds} seeds remaining
          </Text>
          <Pressable 
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Text style={[styles.upgradeText, { color: colors.primaryText }]}>
              Create Account
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
      <View style={styles.content}>
        <AlertCircle size={16} color={colors.error} />
        <Text style={[styles.text, { color: colors.error }]}>
          Seed limit reached. Create an account to continue.
        </Text>
        <Pressable 
          style={[styles.upgradeButton, { backgroundColor: colors.error }]}
          onPress={handleUpgrade}
        >
          <Text style={[styles.upgradeText, { color: colors.primaryText }]}>
            Create Account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Keep original component for backward compatibility but make it simple
export default function GuestStatusBanner() {
  const { isGuest, guestUsage } = useAuth();

  if (!isGuest || !guestUsage) {
    return null;
  }

  const remainingSeeds = Math.max(0, GuestTracker.GUEST_SEED_LIMIT - (guestUsage.demoSeedsCreated?.length ?? guestUsage.seedsAdded));

  return <GuestSeedLimitBanner remainingSeeds={remainingSeeds} />;
}

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    flex: 1,
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
