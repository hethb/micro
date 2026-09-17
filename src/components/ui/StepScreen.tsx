import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space, type } from '@/theme/tokens';

import { Button } from './Button';

interface StepScreenProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  cta: string;
  ctaDisabled?: boolean;
  onNext(): void;
  footnote?: string;
}

export function StepScreen(props: StepScreenProps) {
  const { step, totalSteps, title, subtitle, children, cta, ctaDisabled, onNext, footnote } = props;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.lg }]}>
      <View style={styles.progress}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        {footnote && <Text style={styles.footnote}>{footnote}</Text>}
        <Button label={cta} onPress={onNext} disabled={ctaDisabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: space.xl },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceRaised },
  dotOn: { backgroundColor: colors.accent },
  body: { padding: space.xl, gap: space.lg },
  title: { ...type.hero, color: colors.text, marginTop: space.lg },
  subtitle: { ...type.body, color: colors.textMuted, marginBottom: space.sm },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, gap: space.sm },
  footnote: { ...type.small, color: colors.textDim, textAlign: 'center' },
});
