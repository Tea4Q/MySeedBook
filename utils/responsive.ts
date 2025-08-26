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
}

export const getResponsiveConfig = (): ResponsiveConfig => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  
  // More robust tablet detection
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  
  // Enhanced tablet detection for Android
  // Consider it a tablet if:
  // 1. Either dimension is >= 768px (traditional tablet breakpoint)
  // 2. Or if the smaller dimension is >= 500px (smaller tablets)
  // 3. Or if in landscape and width >= 550px (landscape phone/small tablet)
  // 4. Additional check for common Android tablet resolutions
  const isTablet = Platform.OS === 'web' 
    ? maxDimension >= 1400 || minDimension >= 768 
    : (maxDimension >= 768 || 
       minDimension >= 500 || 
       (isLandscape && width >= 550) ||
       // Common Android tablet screen sizes
       (width >= 800 && height >= 600) ||
       (width >= 600 && height >= 800));
  
  // Calculate optimal grid columns based on screen size - Maximum 2 columns for better spacing
  let gridColumns = 1;
  if (isTablet) {
    if (width >= 768) {
      // For tablets, always use 2 columns for better card spacing
      gridColumns = 2;
    } else {
      // For smaller tablets, use 2 columns in landscape, and also in portrait if width >= 550
      gridColumns = (isLandscape || width >= 550) ? 2 : 1;
    }
  } else if (isLandscape && width >= 550) {
    // Even for large phones in landscape, show 2 columns if width is sufficient
    gridColumns = 2;
  }
  
  // // Debug logging to help troubleshoot (enable for testing)
  // console.log('Responsive Config Debug:', {
  //   width,
  //   height,
  //   minDimension,
  //   maxDimension,
  //   isLandscape,
  //   isTablet,
  //   gridColumns,
  //   platform: Platform.OS
  // });
  
  // Calculate card width for grid layout with better spacing
  const containerPadding = 24; // Increased padding for better spacing with 2 columns
  const itemGap = 16; // Increased gap between items for better visual separation
  let cardWidth;
  
  if (gridColumns === 1) {
    cardWidth = width - (containerPadding * 2);
  } else {
    // For grid layout: total width - padding - gaps between items, divided by columns
    const availableWidth = width - (containerPadding * 2);
    const totalGaps = (gridColumns - 1) * itemGap;
    cardWidth = (availableWidth - totalGaps) / gridColumns;
  }
  
  // Max content width for very large screens
  const maxContentWidth = Math.min(width, 1400);
  
  return {
    isTablet,
    isLandscape,
    screenWidth: width,
    screenHeight: height,
    gridColumns,
    cardWidth,
    maxContentWidth,
  };
};

export const useResponsive = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>(getResponsiveConfig);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
     
      // Add a small delay to ensure the dimensions are fully updated
      setTimeout(() => {
        const newConfig = getResponsiveConfig();
        setConfig(newConfig);
      }, 100);
    });

    return () => subscription?.remove();
  }, []);

  return config;
};
