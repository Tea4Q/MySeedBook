import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {  useRootNavigation, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '../utils/logger';
import { guestTracker, GuestUsage } from '../utils/guestTracker';
import { debugNetwork, networkErrorHandler } from '../utils/networkDebug';
// import { isLoading } from 'expo-font';
// import { set } from 'date-fns';
// import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

// export const  defaultAuthTestState = {
//   isLogin: true,
//   loginEmail: 'chandraskinner@gmail.com',
//   loginPassword: 'teatime',
//   signupName: 'Chandra Skinner',
//   signupEmail: 'chandraskinner@gmail.com',
//   signupPassword: 'teatime',
//   confirmPassword: 'teatime',
//   isLoading: false,
//   error: null,
//   }
  

// Create auth context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  isGuest: boolean;
  guestUsage: GuestUsage | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshGuestUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  initialized: false,
  isGuest: false,
  guestUsage: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInAsGuest: async () => {},
  forgotPassword: async () => {},
  updatePassword: async () => {},
  refreshGuestUsage: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestUsage, setGuestUsage] = useState<GuestUsage | null>(null);
  const rootNavigation = useRootNavigation();
  const router = useRouter();
  // Profile state is managed in UI screens, not here
  



  // Initialize auth immediately on web, or when navigation is ready on mobile
  useEffect(() => {
     
    // Web platform doesn't always have rootNavigation ready state working properly
    // Initialize auth immediately on web, wait for navigation on mobile
    const shouldInitialize = Platform.OS === 'web' || rootNavigation?.isReady;
    
    if (!shouldInitialize) {
       return;
    }

    // Add error handling for initialization
    const initializeAuth = async () => {
      try {
        // Check auth state and handle invalid refresh tokens
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Auth initialization error:', error);
          // Don't throw, just set to unauthenticated state
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setInitialized(true);
      } catch (error) {
        console.error('Fatal auth initialization error:', error);
        // Even on fatal error, mark as initialized to prevent infinite loading
        setSession(null);
        setUser(null);
        setInitialized(true);
      }
    };

    initializeAuth();

  // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (event === 'SIGNED_IN') {
        setSession(session);
        setUser(session?.user ?? null);
        // Navigate immediately after successful sign in
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [rootNavigation?.isReady, router]);
      
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

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      // Debug network connectivity on Android
      if (Platform.OS === 'android') {
        debugNetwork();
      }
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Enhanced error handling for network issues
        const enhancedError = networkErrorHandler(error, 'signIn');
        throw enhancedError;
      }
    } catch (error: any) {
      logger.error('Sign in error:', error);
      
      // Handle different types of network errors
      if (error.name === 'AuthRetryableFetchError' || 
          error.message?.includes('NetworkError when attempting to fetch resource') ||
          error.message?.includes('Network request failed') ||
          error.message?.includes('fetch')) {
        throw new Error('Network connection issue. Please check your internet connection and try again, or continue as a guest to explore the app.');
      }
      
      // Handle auth-specific errors
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the confirmation link before signing in.');
      }
      
      // Generic fallback
      throw new Error(error.message || 'Unable to sign in. Please try again or continue as a guest.');
    }
  };


  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${Platform.OS === 'web' ? window.location.origin : 'myseedbook-catalogue://'}auth/callback`,
        },
      });
      
      if (error) {
        const enhancedError = networkErrorHandler(error, 'signUp');
        throw enhancedError;
      }
    } catch (error: any) {
      logger.error('Sign up error:', error);
      
      // Handle different types of network errors
      if (error.name === 'AuthRetryableFetchError' || 
          error.message?.includes('NetworkError when attempting to fetch resource') ||
          error.message?.includes('Network request failed') ||
          error.message?.includes('fetch')) {
        throw new Error('Network connection issue. Please check your internet connection and try again, or continue as a guest to explore the app.');
      }
      
      // Handle other auth-specific errors
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      
      if (error.message?.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      if (error.message?.includes('Password should be at least')) {
        throw new Error('Password must be at least 6 characters long.');
      }
      
      // Generic fallback
      throw new Error(error.message || 'Unable to create account. Please try again or continue as a guest.');
    }
  };

const signOut = async () => {
    logger.debug('Signing out user:', user?.email);
    // Call Supabase signOut
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
      // Clear session and user state    
    
    setSession(null);
    setUser(null);
    

    if (Platform.OS === 'web') {
      try {
        
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
        logger.error('Error clearing web storage:', err);
        // Handle web-specific error
        if (window) {
          window.alert('Failed to clear session. Please try again.');
        }
      }
    }

    if (error) throw error;
  };

  const recoverPassword = async (email: string) => {
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

  // Guest authentication functions
  const signInAsGuest = async () => {
    setIsGuest(true);
    setUser(null);
    setSession(null);
    await refreshGuestUsage();
    // Navigate immediately after successful guest sign in
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
  };

  const refreshGuestUsage = async () => {
    const usage = await guestTracker.getUsage();
    setGuestUsage(usage);
  };

  // Enhanced signOut to handle guest state
  const enhancedSignOut = async () => {
    await signOut();
    setIsGuest(false);
    setGuestUsage(null);
  };

  // Enhanced signIn to mark account creation for guests
  const enhancedSignIn = async (email: string, password: string) => {
    if (isGuest) {
      await guestTracker.markAccountCreated();
    }
    await signIn(email, password);
    setIsGuest(false);
    setGuestUsage(null);
  };

  // Enhanced signUp to mark account creation for guests
  const enhancedSignUp = async (email: string, password: string) => {
    if (isGuest) {
      await guestTracker.markAccountCreated();
    }
    await signUp(email, password);
    setIsGuest(false);
    setGuestUsage(null);
  };

  // Initialize guest usage on mount
  useEffect(() => {
    if (isGuest) {
      refreshGuestUsage();
    }
  }, [isGuest]);
    
  return (
  <AuthContext.Provider value={{ 
    user, 
    session, 
    initialized, 
    isGuest,
    guestUsage,
    signIn: enhancedSignIn, 
    signUp: enhancedSignUp, 
    signOut: enhancedSignOut,
    signInAsGuest,
    forgotPassword: recoverPassword, 
    updatePassword,
    refreshGuestUsage 
  }}>
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

