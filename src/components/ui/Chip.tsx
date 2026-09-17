import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress(): void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && { transform: [{ scale: 0.96 }] }]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  selectedLabel: { color: colors.accentInk },
});
