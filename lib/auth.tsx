import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {  useRootNavigation } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '../utils/logger';
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  initialized: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  forgotPassword: async () => {},
  updatePassword: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const rootNavigation = useRootNavigation();
  // Profile state is managed in UI screens, not here
  



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
      logger.debug('Auth state change:', { event, session });      
      if (event === 'TOKEN_REFRESHED') {
          setSession(session);
      } else if (event === 'SIGNED_OUT') {
               setSession(null);
        setUser(null);
      } else {
        logger.debug('Other auth event, updating session:', { event });
        // For other events, just update session and user
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

  // Sign in function

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    
  return (
  <AuthContext.Provider value={{ user, session, initialized, signIn, signUp, signOut, forgotPassword: recoverPassword, updatePassword }}>
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

