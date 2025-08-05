/**
 * Portable Responsive Utility for React Native/Expo Apps
 * 
 * This utility provides responsive design capabilities that adapt to different screen sizes.
 * Copy this file to your project's utils folder and customize the breakpoints as needed.
 * 
 * Usage:
 * import { useResponsive } from './utils/responsive';
 * const responsive = useResponsive();
 * 
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 */

import { Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';

export interface ResponsiveConfig {
  isTablet: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  gridColumns: number;
  cardWidth: number;
  maxContentWidth: number;
  // Add your custom properties here
  isSmallPhone?: boolean;
  isLargeTablet?: boolean;
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
}

// Customizable configuration - adjust these values for your app
const CONFIG = {
  // Breakpoints (in pixels)
  tabletBreakpoint: 768,
  largeTabletBreakpoint: 1024,
  desktopBreakpoint: 1200,
  
  // Grid settings
  maxColumns: 3,
  minColumns: 1,
  
  // Spacing
  basePadding: 16,
  baseGap: 12,
  
  // Content width limits
  maxContentWidth: 1200,
  tabletMaxContentWidth: 1000,
};

export const getResponsiveConfig = (): ResponsiveConfig => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  
  // Device type detection
  const isTablet = Platform.OS === 'web' 
    ? width >= CONFIG.tabletBreakpoint 
    : (width >= CONFIG.tabletBreakpoint || height >= CONFIG.tabletBreakpoint);
  
  const isSmallPhone = !isTablet && width < 375;
  const isLargeTablet = isTablet && width >= CONFIG.largeTabletBreakpoint;
  
  // Grid column calculation
  let gridColumns = CONFIG.minColumns;
  if (isTablet) {
    if (width >= CONFIG.desktopBreakpoint) {
      gridColumns = CONFIG.maxColumns;
    } else if (width >= 900) {
      gridColumns = 2;
    } else {
      gridColumns = isLandscape ? 2 : 1;
    }
  }
  
  // Dynamic spacing based on screen size
  const spacing = {
    small: isTablet ? CONFIG.basePadding * 0.75 : CONFIG.basePadding * 0.5,
    medium: isTablet ? CONFIG.basePadding : CONFIG.basePadding * 0.75,
    large: isTablet ? CONFIG.basePadding * 1.5 : CONFIG.basePadding,
  };
  
  // Card width calculation
  const effectivePadding = spacing.medium * 2;
  const gap = CONFIG.baseGap;
  const cardWidth = gridColumns === 1 
    ? width - effectivePadding
    : (width - effectivePadding - (gap * (gridColumns - 1))) / gridColumns;
  
  // Content width constraints
  const maxContentWidth = isLargeTablet 
    ? CONFIG.maxContentWidth 
    : CONFIG.tabletMaxContentWidth;
  
  return {
    isTablet,
    isLandscape,
    screenWidth: width,
    screenHeight: height,
    gridColumns,
    cardWidth,
    maxContentWidth: Math.min(width, maxContentWidth),
    isSmallPhone,
    isLargeTablet,
    spacing,
  };
};

export const useResponsive = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>(getResponsiveConfig);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setConfig(getResponsiveConfig());
    });

    return () => subscription?.remove();
  }, []);

  return config;
};

// Utility functions for common responsive patterns
export const getResponsiveValue = <T>(
  mobileValue: T,
  tabletValue: T,
  desktopValue?: T
): T => {
  const { isTablet, screenWidth } = getResponsiveConfig();
  
  if (desktopValue && screenWidth >= CONFIG.desktopBreakpoint) {
    return desktopValue;
  }
  
  return isTablet ? tabletValue : mobileValue;
};

export const getResponsiveFontSize = (baseSize: number): number => {
  const { isTablet, isLargeTablet } = getResponsiveConfig();
  
  if (isLargeTablet) return baseSize * 1.2;
  if (isTablet) return baseSize * 1.1;
  return baseSize;
};

export const getResponsiveIconSize = (baseSize: number): number => {
  const { isTablet } = getResponsiveConfig();
  return isTablet ? baseSize * 1.25 : baseSize;
};

// Export configuration for customization
export { CONFIG as ResponsiveConfig };
