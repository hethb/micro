import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, type } from '@/theme/tokens';

interface SheetProps {
  visible: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
}

/** Slide-up bottom sheet with a dimmed backdrop that closes it. */
export function Sheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={styles.body} bounces={false}>
          <Text style={styles.heading}>{title}</Text>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface SheetOptionProps {
  label: string;
  detail: string;
  onPress(): void;
  active?: boolean;
}

export function SheetOption({ label, detail, onPress, active }: SheetOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
      <Text style={[styles.optionDetail, active && styles.optionLabelActive]}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space.md,
  },
  body: { paddingHorizontal: space.xl, gap: space.sm },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space.sm,
  },
  heading: { ...type.title, color: colors.text, marginBottom: space.sm },
  option: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    gap: 2,
  },
  optionActive: { backgroundColor: colors.accent },
  optionLabel: { ...type.body, fontWeight: '700', color: colors.text },
  optionLabelActive: { color: colors.accentInk },
  optionDetail: { ...type.small, fontWeight: '500', color: colors.textMuted },
});
