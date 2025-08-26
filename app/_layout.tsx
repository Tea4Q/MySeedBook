import { Stack, SplashScreen, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();


function RootLayoutNav() {
  const { session, initialized } = useAuth();
  const router = useRouter(); // Get router instance
  const insets = useSafeAreaInsets();
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Black': require('@/assets/fonts/Poppins/Poppins-Black.ttf'),
    'Poppins-Bold': require('@/assets/fonts/Poppins/Poppins-Bold.ttf'),
  });

  // Determine if the app is ready (auth checked AND fonts loaded/failed)
  const isAppReady = (fontsLoaded || fontError) && initialized;
  // Only authenticate with valid session (no bypass flags in production)
  const isAuthenticated = !!session;


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

    // Get current path (web only)
    let currentPath = '';
    if (Platform.OS === 'web') {
      currentPath = window.location.pathname + window.location.search;
    }

    // Helper: Save last route to localStorage
    const saveLastRoute = (route: string) => {
      if (Platform.OS === 'web' && route && route !== '/auth' && route !== '/auth/reset-password') {
        window.localStorage.setItem('lastRoute', route);
      }
    };

    // Helper: Restore last route from localStorage
    const getLastRoute = () => {
      if (Platform.OS === 'web') {
        return window.localStorage.getItem('lastRoute') || '/(tabs)';
      }
      return '/(tabs)';
    };

    if (Platform.OS === 'web') {
      // Check if this is a password reset link
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const type = urlParams.get('type');
      const isPasswordReset = accessToken && type === 'recovery';

      // If it's a password reset link, navigate to reset password page
      if (isPasswordReset) {
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 1200);
        router.replace('/auth/reset-password');
        return;
      }

      // GUARD: If already on /auth/reset-password, do not redirect away
      if (currentPath.startsWith('/auth/reset-password')) {
        SplashScreen.hideAsync();
        return;
      }

      // Save the last route if authenticated and not on auth screens
      if (isAuthenticated && currentPath && !currentPath.startsWith('/auth')) {
        saveLastRoute(currentPath);
      }

      setTimeout(() => {
        SplashScreen.hideAsync();
        if (isAuthenticated) {
          // Restore last route if not already there
          const lastRoute = getLastRoute();
          if (currentPath !== lastRoute) {
            router.replace(lastRoute as any);
          }
        } else {
          router.replace('/auth');
        }
      }, 100);
    } else {
      // Mobile: Navigate to main app when authenticated, auth screen when not
      SplashScreen.hideAsync();
      if (isAuthenticated) {
        setTimeout(() => {
          SplashScreen.hideAsync();
          router.replace('/(tabs)');
        }, 500);
      } else {
        router.replace('/auth');
      }
    }
  }, [isAppReady, isAuthenticated, router, session]);

  // Return null while loading (splash screen is visible)
  if (!isAppReady) {
    return null;
  }

  // Always render the Stack navigator once ready.
  // Include all possible screens that can be navigated to directly.
  return (
    <>
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
        <Stack.Screen name="auth" />
        <Stack.Screen name="splash-test" />
        {/* Add signup if needed */}
        {/* <Stack.Screen name="auth/signup" /> */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  // Conditionally wrap with GestureHandlerRootView only on mobile platforms
  const AppContent = (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
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
