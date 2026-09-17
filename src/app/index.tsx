import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { retrySync, signOut, useAccount } from '@/account/accountStore';
import { Button } from '@/components/ui/Button';
import { usePrefs } from '@/state/prefsStore';
import { colors, space, type } from '@/theme/tokens';

export default function Index() {
  const status = useAccount((s) => s.status);
  const onboarded = usePrefs((s) => s.onboarded);

  if (status === 'signedOut') return <Redirect href="/auth" />;
  if (status === 'ready') return <Redirect href={onboarded ? '/feed' : '/onboarding/topics'} />;

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Couldn&apos;t load your profile</Text>
        <Text style={styles.body}>Check your connection and try again.</Text>
        <View style={styles.actions}>
          <Button label="Try again" onPress={retrySync} />
          <Button label="Log out" variant="ghost" onPress={() => void signOut().catch(() => {})} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.body}>Loading your profile…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
    backgroundColor: colors.bg,
  },
  title: { ...type.title, color: colors.text, textAlign: 'center' },
  body: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: space.sm, marginTop: space.lg },
});
