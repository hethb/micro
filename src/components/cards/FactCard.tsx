import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { TOPICS } from '@/content/topics';
import type { FactCard as FactCardData } from '@/content/types';
import { useEntrance } from '@/hooks/useEntrance';
import { useSpeech } from '@/hooks/useSpeech';
import { colors, space, type } from '@/theme/tokens';

import type { CardViewProps } from './CardProps';
import { Pill } from './Pill';
import { CONTENT_PADDING } from './layout';

export function FactCard({ card, active }: CardViewProps & { card: FactCardData }) {
  const topic = TOPICS[card.topic];
  const emojiStyle = useEntrance(active, 0, 40);
  const headlineStyle = useEntrance(active, 120);
  const bodyStyle = useEntrance(active, 320);
  const { speaking, toggle } = useSpeech(`${card.headline}. ${card.body}`, active);

  return (
    <LinearGradient colors={topic.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
      <View style={styles.content}>
        <Animated.Text style={[styles.emoji, emojiStyle]}>{card.emoji}</Animated.Text>
        <Animated.Text style={[styles.headline, headlineStyle]}>{card.headline}</Animated.Text>
        <Animated.View style={[styles.bodyWrap, bodyStyle]}>
          <Text style={styles.body}>{card.body}</Text>
          <View style={styles.row}>
            <Pill icon={speaking ? 'soundOff' : 'soundOn'} label={speaking ? 'Stop' : 'Listen'} onPress={toggle} />
            <Pill
              icon="link"
              label={card.sourceLabel}
              onPress={() => WebBrowser.openBrowserAsync(card.sourceUrl)}
            />
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', ...CONTENT_PADDING },
  emoji: { fontSize: 72, marginBottom: space.lg },
  headline: { ...type.hero, color: colors.text },
  bodyWrap: { marginTop: space.lg, gap: space.xl },
  body: { ...type.body, color: 'rgba(255,255,255,0.86)' },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
