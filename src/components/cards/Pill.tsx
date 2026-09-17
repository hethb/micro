import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

import { Icon, type IconName } from '../ui/Icon';

interface PillProps {
  label: string;
  icon?: IconName;
  onPress(): void;
  tone?: 'glass' | 'accent';
}

export function Pill({ label, icon, onPress, tone = 'glass' }: PillProps) {
  const accent = tone === 'accent';
  const ink = accent ? colors.accentInk : colors.text;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pill, accent && styles.accent, pressed && { opacity: 0.75 }]}>
      {icon && <Icon name={icon} size={14} color={ink} />}
      <Text style={[styles.label, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  accent: { backgroundColor: colors.accent },
  label: { fontSize: 13, fontWeight: '700' },
});
