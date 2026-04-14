import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';

/**
 * Mobile analytics — parity with web. POSTs events to /api/v1/events.
 * Session ID persisted in SecureStore; IP is hashed server-side.
 */

const SESSION_KEY = 'grailiq.sid';

let cachedSid: string | null = null;

async function getSessionId(): Promise<string> {
  if (cachedSid) return cachedSid;
  try {
    let sid = await SecureStore.getItemAsync(SESSION_KEY);
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await SecureStore.setItemAsync(SESSION_KEY, sid);
    }
    cachedSid = sid;
    return sid;
  } catch {
    return 'mobile-' + Platform.OS;
  }
}

export async function track(
  name: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  try {
    const sid = await getSessionId();
    await api.post('/events', {
      name,
      sessionId: sid,
      properties: { ...properties, platform: Platform.OS, client: 'mobile' },
    });
  } catch {
    // Intentional swallow — analytics must never break the UI.
  }
}

export async function screen(name: string): Promise<void> {
  return track('screen_view', { screen: name });
}
