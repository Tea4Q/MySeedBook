import React, { useState } from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { ENV, isSupabaseUrl } from '@/config/env';
import { logger } from '@/config/logger';

interface SmartImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackUri?: string;
  localUri?: string; // For development preview
  style?: StyleProp<ImageStyle>;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  showDebugInfo?: boolean; // For development debugging
}

export const SmartImage: React.FC<SmartImageProps> = ({
  uri,
  fallbackUri,
  localUri,
  style,
  onLoadStart,
  onLoadEnd,
  onError,
  showDebugInfo = false,
  ...imageProps
}) => {
  const [hasError, setHasError] = useState(false);

  // Determine the best URI to use
  const getOptimalUri = (): string => {
    // In development, prefer localUri if available
    if (ENV.isDevelopment && localUri) {
      if (showDebugInfo) {
        logger.debug('SmartImage: Using localUri in development');
      }
      return localUri;
    }

    // In development, immediately use fallback for Supabase URLs to avoid network failures
    if (ENV.isDevelopment && isSupabaseUrl(uri) && ENV.images.useFallbackInDev) {
      const fallback = fallbackUri || ENV.images.fallbackUrl;
      // Only log once per session to reduce console spam
      if (showDebugInfo) {
        logger.debug('SmartImage: Using fallback for Supabase URL in development');
      }
      return fallback;
    }

    // If there was an error, use fallback
    if (hasError) {
      const fallback = fallbackUri || ENV.images.fallbackUrl;
      if (showDebugInfo) {
        logger.debug('SmartImage: Using fallback URI due to load error');
      }
      return fallback;
    }

    // Use the original URI
    if (showDebugInfo) {
      logger.debug(`SmartImage: Using original URI: ${uri}`);
    }
    return uri;
  };

  const handleLoadStart = () => {
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setHasError(false);
    onLoadEnd?.();
  };

  const handleError = (error: any) => {
    setHasError(true);
    
    // Only log errors in development mode to reduce console spam
    if (showDebugInfo && ENV.isDevelopment) {
      logger.warn(`SmartImage: Load error for URI: ${uri}, falling back to placeholder`);
    }
    
    onError?.(error);
  };

  const imageUri = getOptimalUri();

  return (
    <Image
      {...imageProps}
      source={{ uri: imageUri }}
      style={style}
      onLoadStart={handleLoadStart}
      onLoadEnd={handleLoadEnd}
      onError={handleError}
    />
  );
};

export default SmartImage;
