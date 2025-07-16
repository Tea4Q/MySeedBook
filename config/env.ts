// Environment configuration
export const ENV = {
  isDevelopment: __DEV__ || process.env.NODE_ENV === 'development',
  isProduction: !__DEV__ && process.env.NODE_ENV === 'production',
  
  // Image handling configuration
  images: {
    // TEMPORARILY DISABLED: In development, we'll use fallbacks for Supabase URLs due to CORS
    useFallbackInDev: false, // Changed from true to false for testing
    // Placeholder image for development
    fallbackUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=center&auto=format&q=60',
    // Supabase domain pattern
    supabaseDomain: 'supabase.co',
  },
  
  // API configuration
  api: {
    // Add any API-specific development settings here
    timeout: __DEV__ ? 10000 : 5000,
  }
};

// Helper functions
export const isSupabaseUrl = (url: string): boolean => {
  return url.includes(ENV.images.supabaseDomain);
};

export const shouldUseFallback = (url: string): boolean => {
  return ENV.isDevelopment && ENV.images.useFallbackInDev && isSupabaseUrl(url);
};

export const getImageUrl = (url: string, fallbackUrl?: string): string => {
  if (shouldUseFallback(url)) {
    return fallbackUrl || ENV.images.fallbackUrl;
  }
  return url;
};
