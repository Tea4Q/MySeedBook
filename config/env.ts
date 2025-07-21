// Environment configuration
export const ENV = {
  isDevelopment: __DEV__ || process.env.NODE_ENV === 'development',
  isProduction: !__DEV__ && process.env.NODE_ENV === 'production',
  
  // Image handling configuration
  images: {
    // Disable fallback in development to show real Supabase images
    useFallbackInDev: false, // Set to false to load actual Supabase images
    // Placeholder image for development - reliable and fast loading
    fallbackUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=center&auto=format&q=60',
    // Supabase domain pattern
    supabaseDomain: 'supabase.co',
    // Additional fallback options for variety
    fallbacks: {
      seeds: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop&crop=center&auto=format&q=60',
      vegetables: 'https://images.unsplash.com/photo-1506629905607-ced74eb28e90?w=400&h=400&fit=crop&crop=center&auto=format&q=60',
      herbs: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop&crop=center&auto=format&q=60',
      flowers: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop&crop=center&auto=format&q=60',
    },
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
