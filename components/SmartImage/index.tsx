import React, { useState } from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { ENV, getImageUrl, isSupabaseUrl } from '@/config/env';
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
  const [isLoading, setIsLoading] = useState(false);

  // Determine the best URI to use
  const getOptimalUri = (): string => {
    // In development, prefer localUri if available
    if (ENV.isDevelopment && localUri) {
      if (showDebugInfo) {
        logger.debug('SmartImage: Using localUri in development');
      }
      return localUri;
    }

    // If there was an error or we should use fallback, use fallback
    if (hasError || (ENV.isDevelopment && isSupabaseUrl(uri))) {
      const fallback = fallbackUri || ENV.images.fallbackUrl;
      if (showDebugInfo) {
        logger.debug(`SmartImage: Using fallback URI for ${isSupabaseUrl(uri) ? 'Supabase URL' : 'failed image'}`);
      }
      return fallback;
    }

    // Use the original URI
    if (showDebugInfo) {
      logger.debug('SmartImage: Using original URI');
    }
    return uri;
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    setHasError(false);
    onLoadEnd?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    
    if (showDebugInfo) {
      logger.error(`SmartImage: Load error for URI: ${uri}`);
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
