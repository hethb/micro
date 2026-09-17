import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initAccount, useAccount } from '@/account/accountStore';
import { watchAccountForComments } from '@/comments/session';
import { usePrefs } from '@/state/prefsStore';
import { useHydrated } from '@/state/useHydrated';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useHydrated();
  const status = useAccount((s) => s.status);
  const onboarded = usePrefs((s) => s.onboarded);

  // Account sync writes into the stores, so it must start after they've loaded from disk.
  useEffect(() => {
    if (!hydrated) return;
    const stopAccount = initAccount();
    const stopComments = watchAccountForComments();
    return () => {
      stopAccount();
      stopComments();
    };
  }, [hydrated]);

  const loading = !hydrated || status === 'loading';
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  const signedIn = status === 'ready';

  // When a guard turns false the router falls back to `index`, which routes to the right place.
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="settings" />
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
}
