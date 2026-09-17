import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space, type } from '@/theme/tokens';

import { Icon } from './Icon';

interface FormScreenProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Pinned below the form, above the keyboard. */
  footer: ReactNode;
  onBack?(): void;
}

export function FormScreen({ title, subtitle, children, footer, onBack }: FormScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { paddingTop: insets.top + space.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {onBack && (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} style={styles.back}>
          <Icon name="back" size={24} color={colors.text} />
        </Pressable>
      )}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  back: { paddingHorizontal: space.xl, alignSelf: 'flex-start' },
  body: { padding: space.xl, gap: space.lg },
  title: { ...type.hero, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted, marginBottom: space.sm },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, gap: space.sm },
});
