import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '../src/contexts/AuthContext';
import { InspectionProvider } from '../src/contexts/InspectionContext';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <InspectionProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" backgroundColor={colors.white} />
      </InspectionProvider>
    </AuthProvider>
  );
}