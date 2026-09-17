import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { TOPICS } from '@/content/topics';
import type { QuoteCard as QuoteCardData } from '@/content/types';
import { useEntrance } from '@/hooks/useEntrance';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, space, type } from '@/theme/tokens';

import type { CardViewProps } from './CardProps';
import { Pill } from './Pill';
import { CONTENT_PADDING } from './layout';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export function QuoteCard({ card, active }: CardViewProps & { card: QuoteCardData }) {
  const accent = TOPICS[card.topic].gradient[0];
  const markStyle = useEntrance(active, 0, 12);
  const textStyle = useEntrance(active, 150);
  const authorStyle = useEntrance(active, 450);
  const { speaking, toggle } = useSpeech(`${card.text} — ${card.author}`, active);

  return (
    <LinearGradient colors={['#101018', '#050507']} style={styles.fill}>
      <View style={[styles.glow, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <Animated.Text style={[styles.mark, { color: accent }, markStyle]}>“</Animated.Text>
        <Animated.Text style={[styles.quote, textStyle]}>{card.text}</Animated.Text>
        <Animated.View style={[styles.meta, authorStyle]}>
          <View style={[styles.rule, { backgroundColor: accent }]} />
          <Text style={styles.author}>{card.author}</Text>
          <Text style={styles.context}>{card.context}</Text>
          <Pill icon={speaking ? 'soundOff' : 'soundOn'} label={speaking ? 'Stop' : 'Listen'} onPress={toggle} />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -140,
    right: -160,
    opacity: 0.22,
  },
  content: { flex: 1, justifyContent: 'center', ...CONTENT_PADDING },
  mark: { fontFamily: SERIF, fontSize: 120, lineHeight: 120, marginBottom: -30 },
  quote: { fontFamily: SERIF, fontSize: 28, lineHeight: 38, color: colors.text, fontWeight: '600' },
  meta: { marginTop: space.xl, gap: space.sm },
  rule: { width: 36, height: 3, borderRadius: 2, marginBottom: space.xs },
  author: { ...type.small, fontSize: 16, color: colors.text },
  context: { ...type.small, color: colors.textMuted, fontWeight: '500', marginBottom: space.md },
});
