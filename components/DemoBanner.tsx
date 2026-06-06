import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, User } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';

interface DemoBannerProps {
  type?: 'seed' | 'supplier' | 'general';
  message?: string;
  compact?: boolean;
}

export function DemoBanner({ 
  type = 'general', 
  message,
  compact = false 
}: DemoBannerProps) {
  const { isGuest } = useAuth();
  const router = useRouter();

  if (!isGuest) return null;

  const getDefaultMessage = () => {
    switch (type) {
      case 'seed':
        return compact 
          ? 'Demo seeds - Create account to save permanently'
          : 'You\'re viewing demo seeds. Create an account to save your garden permanently!';
      case 'supplier':
        return compact
          ? 'Demo suppliers - Create account to save permanently'
          : 'You\'re viewing demo suppliers. Create an account to save your connections permanently!';
      default:
        return compact
          ? 'Demo mode - Create account to save data'
          : 'Demo Mode: Your data is temporary. Create an account to save everything permanently!';
    }
  };

  const displayMessage = message || getDefaultMessage();

  const handleUpgrade = () => {
    router.push('/auth');
  };

  if (compact) {
    return (
      <View style={styles.compactBanner}>
        <Leaf size={16} color="#4a7c59" />
        <Text style={styles.compactText}>{displayMessage}</Text>
        <Pressable onPress={handleUpgrade} style={styles.compactButton}>
          <Text style={styles.compactButtonText}>Sign Up</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#4a7c59', '#3d6b4a']}
      style={styles.banner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.bannerContent}>
        <View style={styles.iconContainer}>
          <Leaf size={24} color="#ffffff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>Demo Mode</Text>
          <Text style={styles.bannerMessage}>{displayMessage}</Text>
        </View>
        <Pressable onPress={handleUpgrade} style={styles.upgradeButton}>
          <User size={18} color="#4a7c59" />
          <Text style={styles.upgradeButtonText}>Create Account</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  bannerMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a7c59',
  },
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderColor: 'rgba(74, 124, 89, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    gap: 8,
  },
  compactText: {
    flex: 1,
    fontSize: 12,
    color: '#4a7c59',
    fontWeight: '500',
  },
  compactButton: {
    backgroundColor: '#4a7c59',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
