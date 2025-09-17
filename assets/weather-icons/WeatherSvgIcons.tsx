import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface WeatherIconProps {
  size?: number;
  color?: string;
  style?: any;
}

// Sunny/Clear Sky - Animated rotating sun
export const SunnyIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[{ width: size, height: size, transform: [{ rotate: spin }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id="sunny-gradient" x1="150" x2="234" y1="119.2" y2="264.8">
            <Stop offset="0" stopColor="#fbbf24" />
            <Stop offset="0.5" stopColor="#fbbf24" />
            <Stop offset="1" stopColor="#f59e0b" />
          </LinearGradient>
        </Defs>
        <G transform="translate(256 256)">
          <Circle
            r="80"
            fill="url(#sunny-gradient)"
            stroke="#f59e0b"
            strokeWidth="6"
          />
          <Path
            fill="none"
            stroke="#f59e0b"
            strokeLinecap="round"
            strokeWidth="24"
            d="M-112-112l16-16M112-112l-16-16M112 112l-16 16M-112 112l16 16M-112 0h-24M112 0h24M0-112v-24M0 112v24"
          />
        </G>
      </Svg>
    </Animated.View>
  );
};

// Cloudy - Simple cloud with subtle pulse
export const CloudyIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[{ width: size, height: size, transform: [{ scale: pulseAnim }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id="cloud-gradient" x1="99.5" x2="232.6" y1="30.7" y2="261.4">
            <Stop offset="0" stopColor="#d1d5db" />
            <Stop offset="0.5" stopColor="#9ca3af" />
            <Stop offset="1" stopColor="#6b7280" />
          </LinearGradient>
        </Defs>
        <Path
          fill="url(#cloud-gradient)"
          stroke="#9ca3af"
          strokeWidth="6"
          d="M400 240c0-79.5-64.5-144-144-144-69.3 0-127.2 49.3-140.6 114.8C60.6 222.4 16 272.7 16 334c0 65.1 52.9 118 118 118h248c57.4 0 104-46.6 104-104 0-55.9-44.2-101.4-99.5-103.8z"
        />
      </Svg>
    </Animated.View>
  );
};

// Partly Cloudy - Sun with cloud
export const PartlyCloudyIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => (
  <View style={[{ width: size, height: size }, style]}>
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="sun-gradient" x1="26.75" x2="37.25" y1="22.91" y2="41.09">
          <Stop offset="0" stopColor="#fbbf24" />
          <Stop offset="0.5" stopColor="#fbbf24" />
          <Stop offset="1" stopColor="#f59e0b" />
        </LinearGradient>
        <LinearGradient id="cloud-gradient2" x1="99.5" x2="232.6" y1="30.7" y2="261.4">
          <Stop offset="0" stopColor="#f3f4f6" />
          <Stop offset="0.5" stopColor="#d1d5db" />
          <Stop offset="1" stopColor="#9ca3af" />
        </LinearGradient>
      </Defs>
      <G transform="translate(0 0)">
        <Circle cx="180" cy="120" r="50" fill="url(#sun-gradient)" />
        <Path
          fill="url(#cloud-gradient2)"
          stroke="#d1d5db"
          strokeWidth="4"
          d="M400 240c0-79.5-64.5-144-144-144-69.3 0-127.2 49.3-140.6 114.8C60.6 222.4 16 272.7 16 334c0 65.1 52.9 118 118 118h248c57.4 0 104-46.6 104-104 0-55.9-44.2-101.4-99.5-103.8z"
          transform="translate(40 80) scale(0.8)"
        />
      </G>
    </Svg>
  </View>
);

// Rainy - Cloud with animated rain drops
export const RainyIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => {
  const rainAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rainAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(rainAnim, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rainAnim]);

  return (
    <Animated.View style={[{ width: size, height: size, opacity: rainAnim }, style]}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id="rain-cloud-gradient" x1="99.5" x2="232.6" y1="30.7" y2="261.4">
            <Stop offset="0" stopColor="#9ca3af" />
            <Stop offset="0.5" stopColor="#9ca3af" />
            <Stop offset="1" stopColor="#6b7280" />
          </LinearGradient>
        </Defs>
        <G transform="translate(81 120)">
          <Path
            fill="url(#rain-cloud-gradient)"
            stroke="#9ca3af"
            strokeWidth="6"
            d="m291 107-2.5.1A83.9 83.9 0 00135.6 43 56 56 0 0051 91a56.6 56.6 0 00.8 9A60 60 0 0063 219l4-.2v.2h224a56 56 0 000-112Z"
          />
          <Path
            fill="none"
            stroke="#0ea5e9"
            strokeLinecap="round"
            strokeWidth="8"
            d="m70 250 8-16 8 16 8-16 8 16 8-16 8 16m-50 30 8-16 8 16 8-16 8 16 8-16 8 16"
          />
        </G>
      </Svg>
    </Animated.View>
  );
};

// Snowy - Cloud with snowflakes
export const SnowyIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => (
  <View style={[{ width: size, height: size }, style]}>
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="snow-gradient" x1="99.5" x2="232.6" y1="30.7" y2="261.4">
          <Stop offset="0" stopColor="#e5e7eb" />
          <Stop offset="0.5" stopColor="#d1d5db" />
          <Stop offset="1" stopColor="#9ca3af" />
        </LinearGradient>
      </Defs>
      <G transform="translate(81 120)">
        <Path
          fill="url(#snow-gradient)"
          stroke="#d1d5db"
          strokeWidth="6"
          d="m291 107-2.5.1A83.9 83.9 0 00135.6 43 56 56 0 0051 91a56.6 56.6 0 00.8 9A60 60 0 0063 219l4-.2v.2h224a56 56 0 000-112Z"
        />
        <Circle cx="70" cy="280" r="4" fill="#ffffff" />
        <Circle cx="120" cy="300" r="4" fill="#ffffff" />
        <Circle cx="170" cy="275" r="4" fill="#ffffff" />
        <Circle cx="220" cy="295" r="4" fill="#ffffff" />
      </G>
    </Svg>
  </View>
);

// Thunderstorm - Cloud with lightning
export const ThunderstormIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => {
  const flashAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [flashAnim]);

  return (
    <Animated.View style={[{ width: size, height: size, opacity: flashAnim }, style]}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Defs>
          <LinearGradient id="storm-gradient" x1="99.5" x2="232.6" y1="30.7" y2="261.4">
            <Stop offset="0" stopColor="#4b5563" />
            <Stop offset="0.5" stopColor="#374151" />
            <Stop offset="1" stopColor="#1f2937" />
          </LinearGradient>
        </Defs>
        <G transform="translate(81 120)">
          <Path
            fill="url(#storm-gradient)"
            stroke="#374151"
            strokeWidth="6"
            d="m291 107-2.5.1A83.9 83.9 0 00135.6 43 56 56 0 0051 91a56.6 56.6 0 00.8 9A60 60 0 0063 219l4-.2v.2h224a56 56 0 000-112Z"
          />
          <Path
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="2"
            d="M140 250l20-40h-15l15-30-20 35h10l-10 35z"
          />
        </G>
      </Svg>
    </Animated.View>
  );
};

// Foggy/Misty
export const FoggyIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => (
  <View style={[{ width: size, height: size }, style]}>
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="fog-gradient">
          <Stop offset="0" stopColor="#e5e7eb" />
          <Stop offset="1" stopColor="#9ca3af" />
        </LinearGradient>
      </Defs>
      <G transform="translate(50 180)">
        <Path
          fill="none"
          stroke="url(#fog-gradient)"
          strokeLinecap="round"
          strokeWidth="12"
          d="M0 0h300M0 30h250M0 60h350M0 90h280M0 120h320"
        />
      </G>
    </Svg>
  </View>
);

// Windy
export const WindyIcon: React.FC<WeatherIconProps> = ({ size = 24, style }) => (
  <View style={[{ width: size, height: size }, style]}>
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="wind-gradient">
          <Stop offset="0" stopColor="#60a5fa" />
          <Stop offset="1" stopColor="#3b82f6" />
        </LinearGradient>
      </Defs>
      <G transform="translate(50 150)">
        <Path
          fill="none"
          stroke="url(#wind-gradient)"
          strokeLinecap="round"
          strokeWidth="8"
          d="M0 0h200c20 0 40 20 20 40s-40 20-20 40M0 40h250c25 0 45 25 20 50s-45 25-20 50M0 80h180c15 0 35 15 15 35s-35 15-15 35"
        />
      </G>
    </Svg>
  </View>
);