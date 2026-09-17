import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SavedList } from '@/components/saved/SavedList';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, space, type } from '@/theme/tokens';

export default function MeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Saved</Text>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Preferences and settings"
          hitSlop={10}
          style={({ pressed }) => [styles.settings, pressed && { opacity: 0.8 }]}>
          <Icon name="settings" size={18} color={colors.text} />
          <Text style={styles.settingsLabel}>Preferences</Text>
        </Pressable>
      </View>
      <SavedList />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  heading: { ...type.hero, color: colors.text },
  settings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  settingsLabel: { ...type.small, color: colors.text },
});
