import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAccountConfigured } from '@/account/accountStore';
import { Button } from '@/components/ui/Button';
import { colors, radius, space, type } from '@/theme/tokens';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🧠</Text>
        <Text style={styles.title}>Micro</Text>
        <Text style={styles.tagline}>Doomscroll, minus the doom.</Text>
        <Text style={styles.body}>
          A feed of bite-sized videos, facts, books and quotes, with a brain break every few cards.
        </Text>
      </View>

      {!isAccountConfigured && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Accounts aren&apos;t set up: add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
            .env.local and restart Expo.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button label="Create your profile" onPress={() => router.push('/auth/sign-up')} />
        <Button label="I already have an account" variant="ghost" onPress={() => router.push('/auth/log-in')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl },
  hero: { flex: 1, justifyContent: 'center', gap: space.md },
  emoji: { fontSize: 64 },
  title: { fontSize: 48, lineHeight: 54, fontWeight: '900', color: colors.text },
  tagline: { ...type.title, color: colors.accent },
  body: { ...type.body, color: colors.textMuted },
  notice: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, marginBottom: space.lg },
  noticeText: { ...type.small, color: colors.textMuted },
  actions: { gap: space.sm },
});
