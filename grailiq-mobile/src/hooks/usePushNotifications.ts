import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import type { NavigationContainerRef } from '@react-navigation/native';
import {
  registerForPushNotifications,
  unregisterFromPushNotifications,
} from '../lib/pushNotifications';
import { useAuthStore } from '../stores/useAuthStore';

type RootStackParamList = Record<string, object | undefined>;

/**
 * Manages the push-notification lifecycle for an authenticated user:
 *
 *   - On sign-in: registers this device's Expo push token with the API.
 *   - On sign-out: disables the token on the API.
 *   - While the app is running: listens for notification taps and navigates
 *     to the relevant product detail screen when the user taps a restock
 *     notification.
 *
 * Pass the root navigation ref so taps can deep-link into the app.
 */
export function usePushNotifications(
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>,
) {
  const session = useAuthStore((s) => s.session);
  const isSignedIn = Boolean(session);
  const registeredRef = useRef(false);

  // Register on sign-in, unregister on sign-out.
  useEffect(() => {
    if (isSignedIn && !registeredRef.current) {
      registeredRef.current = true;
      void registerForPushNotifications();
    } else if (!isSignedIn && registeredRef.current) {
      registeredRef.current = false;
      void unregisterFromPushNotifications();
    }
  }, [isSignedIn]);

  // Handle taps on notifications (app in background or closed).
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { type?: string; productId?: string }
          | undefined;

        if (data?.type === 'restock' && data.productId && navigationRef.current) {
          // Fire heavy haptic on restock alert
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          navigationRef.current.navigate('ProductDetail', {
            productId: data.productId,
          } as never);
        }
      },
    );
    return () => subscription.remove();
  }, [navigationRef]);

  // Handle foreground notifications (app in foreground).
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as
          | { type?: string; productId?: string }
          | undefined;

        // Fire medium haptic when restock alert arrives in foreground
        if (data?.type === 'restock') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
    );
    return () => subscription.remove();
  }, []);
}
