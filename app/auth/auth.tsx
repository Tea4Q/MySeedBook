import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/lib/theme';

/**
 * Auth redirect component
 * This component redirects to the main auth screen (index.tsx)
 */
export default function AuthRedirect() {
  const { colors } = useTheme();
  
  React.useEffect(() => {
    // Redirect to the main auth screen
    router.replace('/auth');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.loadingText, { color: colors.text }]}>
        Loading authentication...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});