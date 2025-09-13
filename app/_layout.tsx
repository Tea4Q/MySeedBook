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
import ErrorBoundary from '@/components/ErrorBoundary';

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();


function RootLayoutNav() {
  const { session, initialized, isGuest } = useAuth();
  const router = useRouter(); // Get router instance
  const insets = useSafeAreaInsets();
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Black': require('@/assets/fonts/Poppins/Poppins-Black.ttf'),
    'Poppins-Bold': require('@/assets/fonts/Poppins/Poppins-Bold.ttf'),
  });

  // Determine if the app is ready (auth checked AND fonts loaded/failed)
  const isAppReady = (fontsLoaded || fontError) && initialized;
  // Authenticate with valid session OR guest mode
  const isAuthenticated = !!session || isGuest;

  // Debug auth state changes
  console.log('🔍 Layout Debug:', {
    session: !!session,
    initialized,
    isGuest,
    isAppReady,
    isAuthenticated
  });


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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
