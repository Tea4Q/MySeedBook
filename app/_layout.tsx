import { Stack, SplashScreen, useRouter } from 'expo-router';
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
  const byPassAuthForTesting = false; // Set to true to skip authentication during development
  const byPassWebAuth = false; // Set to true to skip authentication on web only

  // Determine if the app is ready (auth checked AND fonts loaded/failed)
  const isAppReady = (fontsLoaded || fontError) && initialized;
  // Determine authentication status - consider session OR bypass flags
  const isAuthenticated = !!session || byPassAuthForTesting || (Platform.OS === 'web' && byPassWebAuth);

  console.log('RootLayoutNav - Platform:', Platform.OS);
  console.log('RootLayoutNav - Fonts loaded:', fontsLoaded, 'Font error:', fontError);
  console.log('RootLayoutNav - Auth initialized:', initialized);
  console.log('RootLayoutNav - Session exists:', !!session);
  console.log('RootLayoutNav - App ready:', isAppReady);
  console.log('RootLayoutNav - Authenticated:', isAuthenticated);

  useEffect(() => {
    if (isAppReady) {
      console.log('App ready, hiding splash screen and navigating...');
      SplashScreen.hideAsync();

      // Navigate after app is ready and navigator is mounted
      if (isAuthenticated) {
        // If authenticated or bypassed, ensure user is in the main app area
        console.log('User authenticated, navigating to main app');
        router.replace('/(tabs)'); // Or your desired initial authenticated route
      } else {
        // If not authenticated, ensure user is in the auth area
        console.log('User not authenticated, navigating to auth');
        router.replace('/auth');
      }
    }
  }, [isAppReady, isAuthenticated, router]); // Add dependencies

  // Return null while loading (splash screen is visible)
  if (!isAppReady) {
    console.log('App not ready, showing splash screen');
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
        <Stack.Screen name="add-supplier" />
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
