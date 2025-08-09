import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRootNavigation } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

// Create auth context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  initialized: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const rootNavigation = useRootNavigation();
  // Router and segments removed since navigation is handled in _layout.tsx


  // Initialize auth immediately on web, or when navigation is ready on mobile
  useEffect(() => {
     
    // Web platform doesn't always have rootNavigation ready state working properly
    // Initialize auth immediately on web, wait for navigation on mobile
    const shouldInitialize = Platform.OS === 'web' || rootNavigation?.isReady;
    
    if (!shouldInitialize) {
       return;
    }

   
    // Check auth state and handle invalid refresh tokens
 supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setInitialized(true);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
        setInitialized(true);
      });

    // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change event:', event, 'Session exists:', !!session);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 SIGNED_OUT event - clearing auth state');
        setSession(null);
        setUser(null);
      } else {
        console.log('🔄 Other auth event, updating session');
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [rootNavigation?.isReady]);
      
  // Web-specific initialization to ensure session is set
  useEffect(() => {
    if (Platform.OS === 'web' && !initialized) {
      const timer = setTimeout(() => {
        if (!initialized) {
          supabase.auth.getSession().then(({ data: { session }, error }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setInitialized(true);
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialized]);

   // Auto-redirect based on auth state - DISABLED to prevent conflict with _layout.tsx
  // useEffect(() => {
  //   if (!initialized) return;

  //   const inAuthGroup = segments[0] === 'auth';

  //   const delay = Platform.OS === 'web' ? 0 : 1000; // 1 second delay for mobile splash screen
  //   const timeout = setTimeout(() => {
  //     if (user && inAuthGroup) {
  //       router.replace('/(tabs)');
  //     } else if (!user && !inAuthGroup) {
  //       router.replace('/auth/login');
  //     }
  //   }, delay);

  //   return () => clearTimeout(timeout);
  // }, [user, initialized, segments]);


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${Platform.OS === 'web' ? window.location.origin : 'myseedbook-catalogue://'}auth/callback`,
    },
    });

    if (error) throw error;
  };

const signOut = async () => {
    console.log('🚪 SignOut function called');
    const { error } = await supabase.auth.signOut();
    console.log('🚪 Supabase signOut completed, error:', error);
    
    setSession(null);
    setUser(null);
    console.log('🚪 Local auth state cleared');

    if (Platform.OS === 'web') {
      try {
        console.log('🧹 Clearing web storage and cookies');
        // Clear Supabase-related localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });

        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });
      } catch (err) {
        console.warn('Failed to clear storage and cookies:', err);
      }
    }

    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${Platform.OS === 'web' ? window.location.origin : 'myseedbook-catalogue://'}auth/reset-password`,
    });

    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error('Session invalid. Try resetting again.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };
    
    // First check if we have a valid session
  //   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
  //   if (sessionError) {
  //     console.error('Session error during password update:', sessionError);
  //     throw new Error('Session validation failed. Please request a new reset link.');
  //   }
    
  //   if (!session) {
  //     console.error('No session found during password update');
  //     throw new Error('No active session. Please request a new reset link.');
  //   }
    
  //   console.log('Valid session found, updating password');
    
  //   const { error } = await supabase.auth.updateUser({
  //     password,
  //   });

  //   if (error) {
  //     console.error('Password update error:', error);
  //     throw error;
  //   }
    
  //   console.log('Password updated successfully in auth context');
  // };

  return (
    <AuthContext.Provider value={{ user, session, initialized, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// // Add a function to manually clear session for testing
// export const clearSession = async () => {
//   await supabase.auth.signOut();
// };

// // Add a function to clear invalid authentication state
// export const clearInvalidAuthState = async () => {
//   try {
//     // First check if there's a session
//     const { data: { session } } = await supabase.auth.getSession();
    
//     if (session) {
//       // Clear the session from Supabase
//       await supabase.auth.signOut();
//     }
    
//     // If on mobile, also clear from secure store
//     if (Platform.OS !== 'web') {
//       await SecureStore.deleteItemAsync('supabase.auth.token');
//     }
    
//    } catch (error) {
    
//     // Force clear from secure store if there's an error
//     if (Platform.OS !== 'web') {
//       try {
//         await SecureStore.deleteItemAsync('supabase.auth.token');
//       } catch (secureStoreError) {
//       }
//     }
//   }
// };