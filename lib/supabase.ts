import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

//Use a custom secure store to handle the Supabase client to store the JWT
// This is necessary to ensure the JWT is stored securely and can be accessed across app sessions.

const ExpoSecureStoreAdapter = {
     getItem: (key: string) => {
          return SecureStore.getItemAsync(key);
     },
     setItem: (key: string, value: string) => {
          return SecureStore.setItemAsync(key, value);
     },
     removeItem: (key: string) => {
          return SecureStore.deleteItemAsync(key);
     },
};

// Web storage adapter for better CORS handling
const WebStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use appropriate storage for each platform
    storage: Platform.OS === 'web' ? WebStorageAdapter : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Enable URL session detection on web
    // Additional configuration for web CORS
    flowType: 'pkce',
    ...(Platform.OS === 'web' && {
      storageKey: 'sb-auth-token', // Consistent storage key for web
    }),
  },
  global: {
    headers: {
      // Add custom headers to avoid cookie domain issues
      'X-Client-Platform': Platform.OS,
      ...(Platform.OS === 'web' && {
        'apikey': supabaseAnonKey,
      }),
    },
  },
  ...(Platform.OS === 'web' && {
    // Additional web-specific configuration
    db: {
      schema: 'public',
    },
  }),
});
