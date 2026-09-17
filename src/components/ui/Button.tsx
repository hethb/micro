import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

interface ButtonProps {
  label: string;
  onPress(): void;
  disabled?: boolean;
  /** Shows a spinner and ignores presses. */
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}

export function Button({ label, onPress, disabled, loading, variant = 'primary' }: ButtonProps) {
  const ghost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        ghost && styles.ghost,
        disabled && styles.disabled,
        pressed && { opacity: 0.8 },
      ]}>
      {loading ? (
        <ActivityIndicator color={ghost ? colors.textMuted : colors.accentInk} />
      ) : (
        <Text style={[styles.label, ghost && styles.ghostLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.35 },
  label: { color: colors.accentInk, fontSize: 17, fontWeight: '800' },
  ghostLabel: { color: colors.textMuted, fontWeight: '600' },
});
