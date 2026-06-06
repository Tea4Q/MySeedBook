import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function AuthNewScreen() {
  useEffect(() => {
    // Redirect to the main auth screen
    router.replace('/auth');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting to authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});