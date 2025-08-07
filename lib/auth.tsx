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

  // Initialize auth immediately on web, or when navigation is ready on mobile
  useEffect(() => {
     
    // Web platform doesn't always have rootNavigation ready state working properly
    // Initialize auth immediately on web, wait for navigation on mobile
    const shouldInitialize = Platform.OS === 'web' || rootNavigation?.isReady;
    
    if (!shouldInitialize) {
       return;
    }

   
    // Check auth state and handle invalid refresh tokens
    supabase.auth.getSession().then(({ data: { session }, error }) => {
       
      if (error) {
        // Clear any invalid session data
         setSession(null);
        setUser(null);
        setInitialized(true);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
    }).catch((error) => {
       setSession(null);
      setUser(null);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === 'TOKEN_REFRESHED') {
        } else if (event === 'SIGNED_OUT') {
   
      } else if (event === 'SIGNED_IN' && Platform.OS !== 'web') {
       
        // On mobile, add a small delay when signing in to allow splash screen to show
        setTimeout(() => {
          setSession(session);
          setUser(session?.user ?? null);
        }, 1200);
        return;
      }
      
      // Immediate update for web or other events
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      };
  }, [rootNavigation?.isReady]);

  // Web-specific initialization fallback
  useEffect(() => {
    if (Platform.OS === 'web' && !initialized) {
      
      // Shorter delay for web to improve UX
      const timer = setTimeout(() => {
        if (!initialized) {
           supabase.auth.getSession().then(({ data: { session }, error }) => {
             
            if (error) {
               setSession(null);
              setUser(null);
            } else {
              setSession(session);
              setUser(session?.user ?? null);
            }
            setInitialized(true);
          });
        }
      }, 50); // Reduced from 100ms to 50ms for faster web initialization

      return () => clearTimeout(timer);
    }
  }, [initialized]);
  // Handle routing based on auth state - DISABLED to prevent conflict with _layout.tsx
  // useEffect(() => {
  //   if (!initialized) return;

  //   const inAuthGroup = segments[0] === 'auth';

  //   if (user && inAuthGroup) {
  //     // Redirect to home if user is signed in and in auth group
  //     router.replace('/(tabs)');
  //   } else if (!user && !inAuthGroup) {
  //     // Redirect to sign in if user is not signed in and not in auth group
  //     router.replace('/auth/login');
  //   }
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
    });

    if (error) throw error;
  };

  const signOut = async () => {
     
    // Check if there's an active session before attempting to sign out
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // No active session, just clear local state
       setSession(null);
      setUser(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        
        // Handle specific session missing error
        if (error.message.includes('session') && error.message.includes('missing')) {
         setSession(null);
          setUser(null);
          return;
        }
        throw error;
      }
      
      
      // Force clear local state immediately after successful signOut
      setSession(null);
      setUser(null);
      
    // On web, also manually clear localStorage and other storage if needed
    if (Platform.OS === 'web') {
      try {
        
        // Clear localStorage
        const localKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.toLowerCase().includes('supabase') || 
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('session') ||
            key.includes('sb-') || // Supabase prefix
            key.includes('gotrue') // Supabase auth service
          )) {
            localKeysToRemove.push(key);
          }
        }
        localKeysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Clear sessionStorage
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.toLowerCase().includes('supabase') || 
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('session') ||
            key.includes('sb-') || // Supabase prefix
            key.includes('gotrue') // Supabase auth service
          )) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => {
          sessionStorage.removeItem(key);
        });
        
        // Clear auth-related cookies by setting them to expire
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const cookieName = cookie.split('=')[0].trim();
          if (cookieName.toLowerCase().includes('supabase') || 
              cookieName.toLowerCase().includes('auth') ||
              cookieName.toLowerCase().includes('token') ||
              cookieName.toLowerCase().includes('session')) {
            // Set cookie to expire in the past
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            // Also try with different path and domain combinations
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
          }
        });
        
        } catch (webError) {
      }
    }    } catch (signOutError) {
      
      // Even if signOut fails, clear local state since user requested logout
      setSession(null);
      setUser(null);
      
      // Re-throw the error for the UI to handle
      throw signOutError;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${Platform.OS === 'web' ? window.location.origin : 'myseedbook-catalogue://'}auth/reset-password`,
    });

    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    console.log('Auth context: Attempting to update password');
    
    // First check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error during password update:', sessionError);
      throw new Error('Session validation failed. Please request a new reset link.');
    }
    
    if (!session) {
      console.error('No session found during password update');
      throw new Error('No active session. Please request a new reset link.');
    }
    
    console.log('Valid session found, updating password');
    
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Password update error:', error);
      throw error;
    }
    
    console.log('Password updated successfully in auth context');
  };

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

// Add a function to manually clear session for testing
export const clearSession = async () => {
  await supabase.auth.signOut();
};

// Add a function to clear invalid authentication state
export const clearInvalidAuthState = async () => {
  try {
    // First check if there's a session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Clear the session from Supabase
      await supabase.auth.signOut();
    }
    
    // If on mobile, also clear from secure store
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('supabase.auth.token');
    }
    
   } catch (error) {
    
    // Force clear from secure store if there's an error
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync('supabase.auth.token');
      } catch (secureStoreError) {
      }
    }
  }
};