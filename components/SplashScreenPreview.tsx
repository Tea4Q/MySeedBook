import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sprout } from 'lucide-react-native';

/**
 * Splash Screen Preview Component
 * 
 * This component shows what your splash screen will look like.
 * Use this to test your design before creating the actual splash image.
 * 
 * To use this component:
 * 1. Import it in your app
 * 2. Render it temporarily to see the design
 * 3. Take a screenshot or export as image
 * 4. Use that image as your splash.png
 */
export const SplashScreenPreview: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Decorative background elements */}
      <View style={styles.decorativeElements}>
        <View style={[styles.decorativeCircle, { top: '15%', left: '10%' }]} />
        <View style={[styles.decorativeCircle, { top: '25%', right: '15%' }]} />
        <View style={[styles.decorativeCircle, { bottom: '20%', left: '20%' }]} />
        <View style={[styles.decorativeCircle, { bottom: '30%', right: '10%' }]} />
      </View>
      
      {/* Main content */}
      <View style={styles.content}>
        {/* App icon/logo */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Sprout 
              size={80} 
              color="#2d7a3a" 
              strokeWidth={2}
            />
          </View>
        </View>
        
        {/* App name */}
        <View style={styles.textContainer}>
          <Text style={styles.appName}>MySeedBook</Text>
          <Text style={styles.appSubtitle}>Catalogue</Text>
          <Text style={styles.tagline}>Your Garden&apos;s Digital Memory</Text>
        </View>
        
        {/* Decorative dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotSmall]} />
          <View style={[styles.dot, styles.dotMedium]} />
          <View style={[styles.dot, styles.dotLarge]} />
          <View style={[styles.dot, styles.dotMedium]} />
          <View style={[styles.dot, styles.dotSmall]} />
        </View>
      </View>
      
      {/* Bottom branding */}
      <View style={styles.bottomBranding}>
        <Text style={styles.brandingText}>Growing with Technology</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f9f0',
    // Note: For actual gradient, you'd use react-native-linear-gradient
    // or create the gradient in your image editing software
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2d7a3a',
    opacity: 0.1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1a472a',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#4a7c59',
    opacity: 0.8,
    marginBottom: 20,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
    opacity: 0.7,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
  },
  dot: {
    borderRadius: 50,
    backgroundColor: '#4a7c59',
    opacity: 0.3,
  },
  dotSmall: {
    width: 4,
    height: 4,
  },
  dotMedium: {
    width: 6,
    height: 6,
  },
  dotLarge: {
    width: 8,
    height: 8,
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999999',
    opacity: 0.6,
    textAlign: 'center',
  },
});

export default SplashScreenPreview;
