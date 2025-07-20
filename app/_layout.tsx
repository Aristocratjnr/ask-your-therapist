import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { VideoCallProvider } from '@/contexts/VideoCallContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import GlobalCallHandler from '@/components/GlobalCallHandler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    console.log('🚀 App starting...');
    console.log('Platform:', Platform.OS, Platform.Version);
    // Error handling temporarily disabled to prevent startup issues
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MessagingProvider>
          <VideoCallProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#f8fafc' },
              }}
            >
              <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="client-profile" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="client-selection" />
            <Stack.Screen name="therapist-selection" />
            <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            <GlobalCallHandler />
          </VideoCallProvider>
        </MessagingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}