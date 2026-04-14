import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fontSize } from '../theme/colors';

import { DashboardScreen } from '../screens/DashboardScreen';
import { SetsScreen } from '../screens/SetsScreen';
import { SetDetailScreen } from '../screens/SetDetailScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationPrefsScreen } from '../screens/NotificationPrefsScreen';
import { CompareScreen } from '../screens/CompareScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { useAuthStore } from '../stores/useAuthStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: colors.background },
};

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'GrailIQ' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
    </Stack.Navigator>
  );
}

function SetsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SetsHome" component={SetsScreen} options={{ title: 'Sets' }} />
      <Stack.Screen name="SetDetail" component={SetDetailScreen} options={{ title: 'Set' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="Compare" component={CompareScreen} options={{ title: 'Compare' }} />
    </Stack.Navigator>
  );
}

function PortfolioStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PortfolioHome" component={PortfolioScreen} options={{ title: 'Portfolio' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
    </Stack.Navigator>
  );
}

function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AlertsHome" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
    </Stack.Navigator>
  );
}

function WatchlistStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="WatchlistHome" component={WatchlistScreen} options={{ title: 'Watchlist' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen
        name="NotificationPrefs"
        component={NotificationPrefsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <TabIcon emoji="📊" />,
        }}
      />
      <Tab.Screen
        name="SetsTab"
        component={SetsStack}
        options={{
          tabBarLabel: 'Sets',
          tabBarIcon: () => <TabIcon emoji="📦" />,
        }}
      />
      <Tab.Screen
        name="PortfolioTab"
        component={PortfolioStack}
        options={{
          tabBarLabel: 'Portfolio',
          tabBarIcon: () => <TabIcon emoji="💼" />,
        }}
      />
      <Tab.Screen
        name="WatchlistTab"
        component={WatchlistStack}
        options={{
          tabBarLabel: 'Watch',
          tabBarIcon: () => <TabIcon emoji="❤️" />,
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: () => <TabIcon emoji="🔔" />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => <TabIcon emoji="⚙️" />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="SignIn" component={SignInScreen} />
      )}
    </Stack.Navigator>
  );
}
