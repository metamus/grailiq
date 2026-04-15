import * as Notifications from 'expo-notifications';

/**
 * Register iOS notification action categories.
 * Called at app boot (in App.tsx root layout).
 *
 * This enables:
 *   - "Buy Now" button (actionIdentifier: 'buy') → opens retailer URL
 *   - "View in App" button (actionIdentifier: 'view') → opens app to product detail
 */
export async function registerNotificationCategories() {
  try {
    // Register the restock_alert category with two action buttons
    await Notifications.setNotificationCategoryAsync('restock_alert', [
      {
        identifier: 'buy',
        buttonTitle: 'Buy Now',
        options: {
          opensAppToForeground: false, // Handle in foreground + let app decide
        },
      },
      {
        identifier: 'view',
        buttonTitle: 'View in App',
        options: {
          opensAppToForeground: true, // Bring app to foreground
        },
      },
    ]);

    // Register price_target category (for watchlist alerts)
    await Notifications.setNotificationCategoryAsync('price_target', [
      {
        identifier: 'view_watchlist',
        buttonTitle: 'View Watchlist',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  } catch (error) {
    // Registering categories may fail on simulators or older OS
    console.warn('[notificationCategories] Failed to register categories:', error);
  }
}
