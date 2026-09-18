import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { TOPICS } from '@/content/topics';
import type { Card } from '@/content/types';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { useActivity } from '@/state/activityStore';
import { FAST_FORWARD_RATE, useUi } from '@/state/uiStore';
import { colors, radius, space } from '@/theme/tokens';

import { ActionRail } from './ActionRail';
import { HeartBurst } from './HeartBurst';

/** How much of each edge counts as "the side" for hold-to-fast-forward. */
const SIDE_FRACTION = 0.35;
/** A hold meant as fast-forward shouldn't wait as long as one meant to open a menu. */
const HOLD_MS = { fastForward: 250, menu: 450 };

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
  onComment(card: Card): void;
  onMore(card: Card): void;
  onSingleTap?(): void;
  children: ReactNode;
}

/**
 * Shared chrome for every learning card: double-tap to like, long-press for
 * "not interested", hold the side of a video to fast-forward, topic + format badge,
 * and the right-hand action rail (like, comment, save, share).
 */
export function CardFrame(props: CardFrameProps) {
  const { card, height, bottomInset, topInset, onComment, onMore, onSingleTap, children } = props;
  const [burst, setBurst] = useState(0);
  const [width, setWidth] = useState(0);
  const topic = TOPICS[card.topic];
  // Only videos have something to fast-forward.
  const canFastForward = card.format === 'video';
  const fastForwarding = useUi((s) => s.fastForwardId === card.id);

  // A card can be swiped away mid-hold, which skips the release handler.
  useEffect(() => () => useUi.getState().endFastForward(card.id), [card.id]);

  const onHold = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    const onSide = width > 0 && (x < width * SIDE_FRACTION || x > width * (1 - SIDE_FRACTION));
    if (canFastForward && onSide) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      useUi.getState().startFastForward(card.id);
      return;
    }
    Haptics.selectionAsync();
    onMore(card);
  };

  const like = useCallback(() => {
    const { likedIds, toggleLike } = useActivity.getState();
    if (!likedIds.includes(card.id)) toggleLike(card);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBurst((n) => n + 1);
  }, [card]);

  const onTap = useDoubleTap(like, onSingleTap);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={{ height }} onLayout={onLayout}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onTap}
        onLongPress={onHold}
        onPressOut={() => useUi.getState().endFastForward(card.id)}
        delayLongPress={canFastForward ? HOLD_MS.fastForward : HOLD_MS.menu}>
        {children}
      </Pressable>

      {fastForwarding && (
        <View style={[styles.speedPill, { top: topInset + space.xxl * 2 }]} pointerEvents="none">
          <Text style={styles.speedText}>{FAST_FORWARD_RATE}× SPEED ▶▶</Text>
        </View>
      )}

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
      <ActionRail
        card={card}
        onComment={() => onComment(card)}
        onMore={() => onMore(card)}
        bottomOffset={bottomInset + space.xl}
      />
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
  speedPill: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  speedText: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  formatBadge: { backgroundColor: colors.accent },
  formatBadgeText: { color: colors.accentInk },
});
