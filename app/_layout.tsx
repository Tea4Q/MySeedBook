import { Stack, SplashScreen, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { GlobalSubscriptionProvider } from '@/lib/globalSubscriptionManager';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Platform, Linking } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();


function RootLayoutNav() {
  const { session, initialized, isGuest } = useAuth();
  const userId = session?.user?.id ?? null;
  const router = useRouter(); // Get router instance
  const insets = useSafeAreaInsets();
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Black': require('@/assets/fonts/Poppins/Poppins-Black.ttf'),
    'Poppins-Bold': require('@/assets/fonts/Poppins/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('@/assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('@/assets/fonts/Poppins/Poppins-Medium.ttf'),
    'Poppins-Regular': require('@/assets/fonts/Poppins/Poppins-Regular.ttf'),
  });

  // Determine if the app is ready (auth checked AND fonts loaded/failed)
  const isAppReady = (fontsLoaded || fontError) && initialized;
  // Authenticate with valid session OR guest mode
  const isAuthenticated = !!session || isGuest;


  useEffect(() => {
    // Configure screen orientation for mobile (more explicit)
    if (Platform.OS !== 'web') {
      const configureOrientation = async () => {
        try {
          // Configure orientation for mobile devices
          await ScreenOrientation.unlockAsync();
          const supportsAllOrientations = ScreenOrientation.OrientationLock.ALL;
          await ScreenOrientation.lockAsync(supportsAllOrientations);
        } catch {
          // Silently handle orientation configuration errors
        }
      };
      
      configureOrientation();
    }
    
    if (!isAppReady) return;

    // Hide splash screen
    SplashScreen.hideAsync();

    // Handle navigation based on auth state
    if (!isAuthenticated) {
      // User is not authenticated and not a guest - redirect to auth
      console.log('🔄 Redirecting to auth screen - user not authenticated');
      router.replace('/auth');
    }
  }, [isAppReady, isAuthenticated, router]);

  // Parse hash fragment tokens from deep links (email confirmation, password reset)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleDeepLink = async (url: string) => {
      try {
        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) return;
        const hash = url.slice(hashIndex + 1);
        const params: Record<string, string> = {};
        hash.split('&').forEach(part => {
          const eqIndex = part.indexOf('=');
          if (eqIndex === -1) return;
          const key = decodeURIComponent(part.slice(0, eqIndex));
          const value = decodeURIComponent(part.slice(eqIndex + 1));
          params[key] = value;
        });

        if (!params.access_token || !params.refresh_token) return;

        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (error) {
          console.warn('Deep link setSession error:', error.message);
          return;
        }

        // For password reset links, navigate to the reset screen
        if (params.type === 'recovery') {
          router.replace('/auth/reset-password');
        }
        // For signup/email confirmation, onAuthStateChange SIGNED_IN handles navigation
      } catch (err) {
        console.warn('Deep link handling error:', err);
      }
    };

    // App opened cold via deep link
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    // App already running, deep link arrives
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [router]);

  // Return null while loading (splash screen is visible)
  if (!isAppReady) {
    return null;
  }

  // Always render the Stack navigator once ready.
  // Include all possible screens that can be navigated to directly.
  return (
    <GlobalSubscriptionProvider userId={userId}>
      {/* Status bar background */}
      <View 
        style={{ 
          height: insets.top, 
          backgroundColor: '#000000',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }} 
      />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Screens accessible regardless of auth state initially */}
        {/* Let the useEffect handle redirecting */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-seed" />
        <Stack.Screen name="edit-supplier/[id]" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="global-profile" />
        {/* Add signup if needed */}
        {/* <Stack.Screen name="auth/signup" /> */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </GlobalSubscriptionProvider>
  );
}

export default function RootLayout() {
  // Conditionally wrap with GestureHandlerRootView only on mobile platforms
  const AppContent = (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web') {
    return AppContent;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {AppContent}
    </GestureHandlerRootView>
  );
}
