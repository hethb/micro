import * as Haptics from 'expo-haptics';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TOPICS } from '@/content/topics';
import type { Card } from '@/content/types';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { useActivity } from '@/state/activityStore';
import { colors, radius, space } from '@/theme/tokens';

import { ActionRail } from './ActionRail';
import { HeartBurst } from './HeartBurst';

const FORMAT_BADGE = {
  fact: 'DID YOU KNOW',
  quote: 'QUOTE',
  book: 'BOOK IN 60s',
  video: 'EXPLAINER',
} as const;

interface CardFrameProps {
  card: Card;
  height: number;
  /** Space reserved at the bottom (tab bar etc.). */
  bottomInset: number;
  topInset: number;
  onMore(card: Card): void;
  onSingleTap?(): void;
  children: ReactNode;
}

/**
 * Shared chrome for every learning card: double-tap to like, long-press for
 * "not interested", topic + format badge, and the right-hand action rail.
 */
export function CardFrame({ card, height, bottomInset, topInset, onMore, onSingleTap, children }: CardFrameProps) {
  const [burst, setBurst] = useState(0);
  const topic = TOPICS[card.topic];

  const like = useCallback(() => {
    const { likedIds, toggleLike } = useActivity.getState();
    if (!likedIds.includes(card.id)) toggleLike(card);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBurst((n) => n + 1);
  }, [card]);

  const onTap = useDoubleTap(like, onSingleTap);

  return (
    <View style={{ height }}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onTap}
        onLongPress={() => {
          Haptics.selectionAsync();
          onMore(card);
        }}
        delayLongPress={450}>
        {children}
      </Pressable>

      <View style={[styles.badges, { top: topInset + space.sm }]} pointerEvents="none">
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {topic.emoji} {topic.label.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.badge, styles.formatBadge]}>
          <Text style={[styles.badgeText, styles.formatBadgeText]}>{FORMAT_BADGE[card.format]}</Text>
        </View>
      </View>

      <HeartBurst trigger={burst} />
      <ActionRail card={card} onMore={() => onMore(card)} bottomOffset={bottomInset + space.xl} />
    </View>
  );
}

const styles = StyleSheet.create({
  badges: {
    position: 'absolute',
    left: space.lg,
    flexDirection: 'row',
    gap: space.sm,
  },
  badge: {
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  formatBadge: { backgroundColor: colors.accent },
  formatBadgeText: { color: colors.accentInk },
});
