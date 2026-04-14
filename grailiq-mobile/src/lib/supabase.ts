import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Simple in-memory storage for Supabase auth tokens.
 * Zero native modules — works in Expo Go, dev builds, and production.
 * Sessions won't persist across app restarts during development,
 * but that's fine for now. Swap to expo-secure-store in a production
 * dev client build later.
 */
const memoryStore = new Map<string, string>();

const MemoryStorageAdapter = {
  getItem: (key: string): string | null => {
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    memoryStore.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: MemoryStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
