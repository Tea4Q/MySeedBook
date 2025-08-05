import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { ENV } from '@/config/env';
import { useAuth, clearInvalidAuthState } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { router } from 'expo-router';

export const DevBanner: React.FC = () => {
  const { session, user, initialized } = useAuth();
  const { colors } = useTheme();

  if (!ENV.isDevelopment) {
    return null;
  }

  const handleClearAuth = async () => {
    Alert.alert(
      'Clear Authentication',
      'This will clear all authentication data and redirect to login. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearInvalidAuthState();
              router.replace('/auth');
            } catch (error) {
              console.error('Error clearing auth:', error);
            }
          },
        },
      ]
    );
  };

  const getAuthStatus = () => {
    if (!initialized) return 'Initializing...';
    if (session && user) return 'Authenticated';
    if (session && !user) return 'Session without user';
    return 'Not authenticated';
  };

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning + '40' }]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.text }]}>
          🚧 Dev Mode - Auth: {getAuthStatus()}
        </Text>
        {(!initialized || (session && !user)) && (
          <Text style={[styles.warning, { color: colors.error }]}>
            ⚠️ Auth issues detected
          </Text>
        )}
      </View>
      <Pressable 
        style={[styles.button, { backgroundColor: colors.error + '20' }]}
        onPress={handleClearAuth}
      >
        <Text style={[styles.buttonText, { color: colors.error }]}>
          Clear Auth
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  warning: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default DevBanner;
