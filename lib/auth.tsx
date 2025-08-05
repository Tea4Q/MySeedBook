import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRootNavigation } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Create auth context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  initialized: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const rootNavigation = useRootNavigation();

  // Initialize auth immediately on web, or when navigation is ready on mobile
  useEffect(() => {
    console.log('Auth initialization - Platform:', Platform.OS);
    console.log('Root navigation ready:', rootNavigation?.isReady);
    
    // Web platform doesn't always have rootNavigation ready state working properly
    // Initialize auth immediately on web, wait for navigation on mobile
    const shouldInitialize = Platform.OS === 'web' || rootNavigation?.isReady;
    
    if (!shouldInitialize) {
      console.log('Waiting for navigation to be ready...');
      return;
    }

    console.log('Initializing authentication...');

    // Check auth state and handle invalid refresh tokens
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check - Session:', session?.user?.email || 'No session');
      console.log('Initial session check - Error:', error?.message || 'No error');
      
      if (error) {
        // Clear any invalid session data
        console.log('Session error, clearing auth state:', error.message);
        setSession(null);
        setUser(null);
        setInitialized(true);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
      console.log('Auth initialization complete');
    }).catch((error) => {
      console.error('Failed to get session:', error);
      setSession(null);
      setUser(null);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      console.log('Auth state change session:', session?.user?.email || 'No session');
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [rootNavigation?.isReady]);

  // Web-specific initialization fallback
  useEffect(() => {
    if (Platform.OS === 'web' && !initialized) {
      console.log('Web fallback initialization triggered');
      
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (!initialized) {
          console.log('Forcing web auth initialization');
          supabase.auth.getSession().then(({ data: { session }, error }) => {
            console.log('Web fallback session check - Session:', session?.user?.email || 'No session');
            console.log('Web fallback session check - Error:', error?.message || 'No error');
            
            if (error) {
              console.log('Web fallback session error:', error.message);
              setSession(null);
              setUser(null);
            } else {
              setSession(session);
              setUser(session?.user ?? null);
            }
            setInitialized(true);
          });
        }
      }, 100);

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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, initialized, signIn, signUp, signOut }}>
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
    // Clear the session from Supabase
    await supabase.auth.signOut();
    
    // If on mobile, also clear from secure store
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('supabase.auth.token');
    }
    
    console.log('Cleared invalid authentication state');
  } catch (error) {
    console.log('Error clearing auth state:', error);
  }
};