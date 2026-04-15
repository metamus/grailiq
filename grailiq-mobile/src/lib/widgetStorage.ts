/**
 * Shared storage for widgets using App Groups.
 *
 * The mobile app writes portfolio snapshots to UserDefaults with suite name
 * "group.com.grailiq.app", and the WidgetKit extension reads from the same
 * storage to display current portfolio state on the home screen.
 */

export interface WidgetMover {
  name: string;
  delta: number;
  score: number;
  productId: string;
}

export interface WidgetSnapshot {
  portfolioTotal: number;
  delta24h: number;
  movers: WidgetMover[];
}

/**
 * Write a portfolio snapshot to shared UserDefaults so the widget can read it.
 * Call this after fetching portfolio data in your Home screen.
 *
 * On Android: no-op (Android doesn't have equivalent app groups).
 * On iOS: writes JSON to UserDefaults(suiteName: "group.com.grailiq.app").
 */
export async function pushWidgetSnapshot(data: WidgetSnapshot): Promise<void> {
  try {
    // For now, this is a placeholder. In a real app with native modules,
    // you would call a native iOS function like:
    //   SharedUserDefaults.setItem('widget_snapshot', JSON.stringify(data), 'group.com.grailiq.app')
    //
    // Since Expo doesn't have a built-in widget storage module, you have two options:
    // 1. Use a custom native module (see ios-widget/native-modules/)
    // 2. Write a simple Expo module that bridges to native code

    console.log('[widgetStorage] Widget snapshot updated:', data);

    // TODO: Implement native bridge to shared UserDefaults on iOS
    // For now, log the data so you can verify it in development
  } catch (error) {
    console.warn('[widgetStorage] Failed to push widget snapshot:', error);
    // Non-fatal; widget will show stale data or fallback
  }
}
