import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router, useRootNavigation, useSegments } from 'expo-router';
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
  const segments = useSegments();
  const rootNavigation = useRootNavigation();

  useEffect(() => {
    if (!rootNavigation?.isReady) return;

    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [rootNavigation?.isReady]);
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