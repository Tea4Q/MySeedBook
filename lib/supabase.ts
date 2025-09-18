import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

//Use a custom secure store to handle the Supabase client to store the JWT
// This is necessary to ensure the JWT is stored securely and can be accessed across app sessions.

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      // Check if data was split due to size limits
      const mainItem = await SecureStore.getItemAsync(key);
      if (!mainItem) return null;
      
      // If it's a reference to split data, reconstruct it
      if (mainItem.startsWith('SPLIT_DATA:')) {
        const partCount = parseInt(mainItem.split(':')[1]);
        let reconstructed = '';
        
        for (let i = 0; i < partCount; i++) {
          const part = await SecureStore.getItemAsync(`${key}_part_${i}`);
          if (part) reconstructed += part;
        }
        
        return reconstructed;
      }
      
      return mainItem;
    } catch (error) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string) => {
    try {
      // If data is larger than 2000 bytes (safe margin), split it
      if (value.length > 2000) {
        const chunks = [];
        const chunkSize = 2000;
        
        for (let i = 0; i < value.length; i += chunkSize) {
          chunks.push(value.substring(i, i + chunkSize));
        }
        
        // Store each chunk
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.setItemAsync(`${key}_part_${i}`, chunks[i]);
        }
        
        // Store reference to split data
        await SecureStore.setItemAsync(key, `SPLIT_DATA:${chunks.length}`);
        
        // Clean up any old parts that might exist
        let partIndex = chunks.length;
        while (true) {
          try {
            await SecureStore.deleteItemAsync(`${key}_part_${partIndex}`);
            partIndex++;
          } catch {
            break; // No more parts to clean up
          }
        }
      } else {
        // Data is small enough, store normally
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn('SecureStore setItem error:', error);
      // Fallback to normal storage on error
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (fallbackError) {
        console.error('SecureStore fallback failed:', fallbackError);
      }
    }
  },
  
  removeItem: async (key: string) => {
    try {
      // Check if this was split data
      const mainItem = await SecureStore.getItemAsync(key);
      if (mainItem && mainItem.startsWith('SPLIT_DATA:')) {
        const partCount = parseInt(mainItem.split(':')[1]);
        
        // Remove all parts
        for (let i = 0; i < partCount; i++) {
          try {
            await SecureStore.deleteItemAsync(`${key}_part_${i}`);
          } catch (error) {
            console.warn(`Error deleting part ${i}:`, error);
          }
        }
      }
      
      // Remove the main item
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore removeItem error:', error);
    }
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
