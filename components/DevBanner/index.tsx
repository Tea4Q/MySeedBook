import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ENV } from '@/config/env';

export const DevBanner: React.FC = () => {
  if (!ENV.isDevelopment) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>🚧 Development Mode - Using Image Fallbacks</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff9800',
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DevBanner;
