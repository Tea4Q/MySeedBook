import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SplashScreenPreview } from '../components/SplashScreenPreview';

/**
 * Splash Screen Test Page
 * 
 * Navigate to this page to see how your splash screen will look.
 * Use this to:
 * 1. Preview your splash screen design
 * 2. Take screenshots for creating the actual splash.png
 * 3. Test different design variations
 * 
 * To access: Navigate to /splash-test in your app
 */
export default function SplashTest() {
  return (
    <View style={styles.container}>
      {/* The actual splash screen preview */}
      <SplashScreenPreview />
      
      {/* Back button (positioned over the splash) */}
      <View style={styles.backButtonContainer}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back to App</Text>
        </Pressable>
      </View>
      
      {/* Instructions overlay */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>Splash Screen Preview</Text>
          <Text style={styles.instructionsText}>
            This is how your splash screen will look.{'\n'}
            Take a screenshot to create splash.png
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  instructionsBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 16,
  },
});
