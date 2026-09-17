import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/theme/tokens';

const STEPS = [-1, -0.5, 0, 0.5, 1] as const;

interface ScalePickerProps {
  left: string;
  right: string;
  value: number;
  onChange(value: number): void;
}

/** Five-step scale between two poles (−1 … 1). */
export function ScalePicker({ left, right, value, onChange }: ScalePickerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={styles.pole}>{left}</Text>
        <Text style={styles.pole}>{right}</Text>
      </View>
      <View style={styles.track}>
        {STEPS.map((step) => {
          const selected = Math.abs(step - value) < 0.01;
          return (
            <Pressable
              key={step}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(step);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              hitSlop={6}
              style={[styles.step, selected && styles.stepSelected]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  pole: { ...type.small, color: colors.textMuted },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  step: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceRaised },
  stepSelected: { backgroundColor: colors.accent, transform: [{ scale: 1.15 }] },
});
