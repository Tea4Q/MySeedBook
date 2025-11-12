import React, { useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { ImageStyle, StyleProp } from 'react-native';
import { ENV, isSupabaseUrl } from '@/config/env';

interface SmartImageProps {
  uri: string;
  fallbackUri?: string;
  localUri?: string; // For development preview
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  uri,
  fallbackUri,
  localUri,
  style,
  resizeMode = 'cover',
  onLoadStart,
  onLoadEnd,
  onError,
}) => {
  const [hasError, setHasError] = useState(false);

  // Determine the best URI to use
  const getOptimalUri = (): string => {
    // In development, prefer localUri if available
    if (ENV.isDevelopment && localUri) {
      return localUri;
    }

    // In development, immediately use fallback for Supabase URLs to avoid network failures
    if (ENV.isDevelopment && isSupabaseUrl(uri) && ENV.images.useFallbackInDev) {
      const fallback = fallbackUri || ENV.images.fallbackUrl;
      return fallback;
    }

    // If there was an error, use fallback
    if (hasError) {
      const fallback = fallbackUri || ENV.images.fallbackUrl;
      return fallback;
    }

    // Use the original URI
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
    onError?.(error);
  };

  const imageUri = getOptimalUri();

  return (
    <ExpoImage
      source={{ uri: imageUri }}
      style={style}
      contentFit={resizeMode}
      transition={200}
      cachePolicy="memory-disk"
      onLoadStart={handleLoadStart}
      onLoad={handleLoadEnd}
      onError={handleError}
    />
  );
};

export default SmartImage;
