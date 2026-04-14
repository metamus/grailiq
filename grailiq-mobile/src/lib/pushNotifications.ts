import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

/**
 * Expo push notification setup.
 *
 *   registerForPushNotifications()   → called on app mount (after sign-in).
 *     1. Asks OS for permission if not yet granted.
 *     2. Gets the ExponentPushToken from Expo.
 *     3. POSTs it to /api/v1/push/register so the API can target this device.
 *
 *   unregisterFromPushNotifications() → called on sign-out.
 *
 *   setNotificationHandler (below)    → controls how a notification that
 *     arrives while the app is in the foreground is presented.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Ask for notification permission and return the ExponentPushToken for this
 * device. Returns `null` on simulators, web, or when the user denies.
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Simulators / web can't receive remote pushes.
  if (!Device.isDevice) return null;

  // Android: ensure the channel exists so notifications render with the
  // right sound/vibration.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('restock-alerts', {
      name: 'Restock Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F4C430',
      sound: 'default',
    });
  }

  // Request permission only if not already granted.
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const { status: asked } = await Notifications.requestPermissionsAsync();
    status = asked;
  }
  if (status !== 'granted') return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}

/**
 * Register this device with the GrailIQ API so restock alerts can reach it.
 * Idempotent — safe to call on every app launch.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const token = await getExpoPushToken();
  if (!token) return null;

  try {
    await api.post('/push/register', {
      expoPushToken: token,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
    });
    return token;
  } catch {
    // Registration failures are non-fatal — the user can still use the app.
    return null;
  }
}

/** Called on sign-out — disables the current device's token on the API. */
export async function unregisterFromPushNotifications(): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;
  try {
    await api.delete('/push/register', { data: { expoPushToken: token } });
  } catch {
    // ignore
  }
}
