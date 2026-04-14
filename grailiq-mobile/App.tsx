import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { supabase } from './src/lib/supabase';
import { useAuthStore } from './src/stores/useAuthStore';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { screen as trackScreen } from './src/lib/analytics';
import { BiometricGate } from './src/components/BiometricGate';
import { colors } from './src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const GrailIQTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setIsLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

/**
 * Inside the NavigationContainer so the hook can read/write the nav ref.
 * Splitting this out keeps App.tsx legible and lets the push hook depend
 * on the mounted navigation tree.
 */
function NavigationRoot() {
  const navigationRef =
    useRef<NavigationContainerRef<Record<string, object | undefined>> | null>(null);

  usePushNotifications(navigationRef);

  const onStateChange = () => {
    const route = navigationRef.current?.getCurrentRoute();
    if (route?.name) void trackScreen(route.name);
  };

  return (
    <NavigationContainer ref={navigationRef} theme={GrailIQTheme} onStateChange={onStateChange}>
      <BiometricGate>
        <AppNavigator />
      </BiometricGate>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationRoot />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
