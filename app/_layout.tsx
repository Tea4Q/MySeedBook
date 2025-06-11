import { Stack, SplashScreen, useRouter } from 'expo-router'; // Import useRouter
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native-appearance';
import { useTheme } from '@/lib/theme';

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session } = useAuth();
  const router = useRouter(); // Get router instance
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Black': require('@/assets/fonts/Poppins/Poppins-Black.ttf'),
    'Poppins-Bold': require('@/assets/fonts/Poppins/Poppins-Bold.ttf'),
  });

  const byPassLoginOnAndroid = true; // Your bypass flag

  // Determine if the app is ready (auth checked AND fonts loaded/failed)
  const isAppReady = (fontsLoaded || fontError);
  // Determine authentication status (considering bypass)
  const isAuthenticated =
    !!session || (byPassLoginOnAndroid && Platform.OS === 'android');

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();

      // Navigate after app is ready and navigator is mounted
      if (isAuthenticated) {
        // If authenticated or bypassed, ensure user is in the main app area
        // Replace might be safer than push to prevent back button going to auth
        router.replace('/(tabs)'); // Or your desired initial authenticated route
      } else {
        // If not authenticated, ensure user is in the auth area
        router.replace('/auth/login');
      }
    }
  }, [isAppReady, isAuthenticated, router]); // Add dependencies

  // Return null while loading (splash screen is visible)
  if (!isAppReady) {
    return null;
  }

  // Always render the Stack navigator once ready.
  // Include all possible screens that can be navigated to directly.
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Screens accessible regardless of auth state initially */}
        {/* Let the useEffect handle redirecting */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-seed" />
        <Stack.Screen name="add-supplier" />
        <Stack.Screen name="edit-supplier/[id]" />
        <Stack.Screen name="auth" />
        {/* Add signup if needed */}
        {/* <Stack.Screen name="auth/signup" /> */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="#000000" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
