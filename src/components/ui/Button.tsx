import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

interface ButtonProps {
  label: string;
  onPress(): void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function Button({ label, onPress, disabled, variant = 'primary' }: ButtonProps) {
  const ghost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        ghost && styles.ghost,
        disabled && styles.disabled,
        pressed && { opacity: 0.8 },
      ]}>
      <Text style={[styles.label, ghost && styles.ghostLabel]}>{label}</Text>
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
