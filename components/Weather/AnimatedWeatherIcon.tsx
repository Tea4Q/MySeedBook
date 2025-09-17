import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { WeatherMeteocon } from './MeteoconsFinal';

interface AnimatedWeatherIconProps {
  weatherCode: string | number;
  size?: number;
  color?: string;
  style?: any;
}

export const AnimatedWeatherIcon: React.FC<AnimatedWeatherIconProps> = ({
  weatherCode,
  size = 24,
  color = '#666',
  style
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Add subtle pulse animation for certain weather conditions
    if (weatherCode && (
      weatherCode.toString().startsWith('11') || // Thunderstorm
      weatherCode.toString().startsWith('09') || // Rain
      weatherCode.toString().startsWith('10')    // Rain
    )) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [weatherCode, pulseAnim]);
  
  return (
    <Animated.View style={[
      styles.container, 
      style,
      {
        transform: [{ scale: pulseAnim }]
      }
    ]}>
      <WeatherMeteocon
        weatherCode={weatherCode}
        size={size}
      />
    </Animated.View>
  );
};

// Component for animated weather icons in calendar cells
export const CalendarWeatherIcon: React.FC<{
  weatherCode: string | number;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}> = ({ weatherCode, size = 'large', onPress }) => {
  const iconSize = size === 'small' ? 28 : size === 'medium' ? 36 : 44;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in and scale up animation with staggered timing
    Animated.sequence([
      Animated.delay(Math.random() * 200), // Random delay for natural feel
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Continuous subtle rotation for windy/stormy weather
    if (weatherCode && (
      weatherCode.toString().startsWith('11') || // Thunderstorm
      weatherCode.toString().startsWith('50')    // Fog/mist
    )) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [weatherCode, fadeAnim, scaleAnim, rotateAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.9,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg']
  });
  
  return (
    <Animated.View style={[
      styles.calendarIconContainer,
      {
        opacity: fadeAnim,
        transform: [
          { scale: Animated.multiply(scaleAnim, pressAnim) },
          ...(weatherCode && (
            weatherCode.toString().startsWith('11') || 
            weatherCode.toString().startsWith('50')
          ) ? [{ rotate: spin }] : [])
        ]
      }
    ]}>
      <WeatherMeteocon
        weatherCode={weatherCode}
        size={iconSize}
        style={styles.calendarIcon}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    opacity: 1, // Full opacity for better visibility
  },
});