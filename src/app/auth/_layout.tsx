import { Redirect, Stack } from 'expo-router';

import { useAccount } from '@/account/accountStore';
import { colors } from '@/theme/tokens';

export default function AuthLayout() {
  const status = useAccount((s) => s.status);
  // Once a login or sign-up produces a session, the root index shows loading and routes onward.
  if (status === 'syncing' || status === 'error') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
