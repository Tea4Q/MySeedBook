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

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use secure storage for tokens instead of cookies
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Additional cookie/domain configuration
    flowType: 'pkce',
  },
  global: {
    headers: {
      // Add custom headers to avoid cookie domain issues
      'X-Client-Platform': Platform.OS,
    },
  },
});
