import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

/**
 * AsyncStorage is localStorage on web, so it needs a browser. Anything that runs the app
 * outside one (a web export's build step, tests) gets a throwaway store instead of a crash.
 */
const sessionStore =
  typeof window === 'undefined'
    ? (() => {
        const memory = new Map<string, string>();
        return {
          getItem: async (key: string) => memory.get(key) ?? null,
          setItem: async (key: string, value: string) => void memory.set(key, value),
          removeItem: async (key: string) => void memory.delete(key),
        };
      })()
    : AsyncStorage;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Null until EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set (see README). */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: sessionStore,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

if (supabase) {
  // Only refresh the session while the app is in the foreground.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
