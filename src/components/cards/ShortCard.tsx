import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import type { EntertainmentItem } from '@/entertainment/types';
import { VIBE_LABELS } from '@/entertainment/types';
import { FAST_FORWARD_RATE, useUi } from '@/state/uiStore';
import { colors, radius, space, type } from '@/theme/tokens';

import { Icon } from '../ui/Icon';
import type { CardViewProps } from './CardProps';
import { YouTubePlayer } from './YouTubePlayer';

/** How much of each edge counts as "the side" for hold-to-fast-forward. */
const SIDE_FRACTION = 0.35;
const HOLD_MS = 250;

interface ShortCardProps extends CardViewProps {
  item: EntertainmentItem;
  topInset: number;
  onFailed(): void;
}

/**
 * Entertainment break. Uses YouTube's official embedded player, so YouTube's
 * branding and terms apply; we never download or rehost the clip.
 */
export function ShortCard({ item, active, nearby, height, width, topInset, onFailed }: ShortCardProps) {
  const muted = useUi((s) => s.muted);
  const muteForAutoplay = useCallback(() => useUi.getState().setMuted(true), []);
  const toggleMuted = useUi((s) => s.toggleMuted);
  const fastForwarding = useUi((s) => s.fastForwardId === item.id);
  const [ready, setReady] = useState(false);

  const onPlaying = useCallback(() => setReady(true), []);

  // A Short can be swiped away mid-hold, which skips the release handler.
  useEffect(() => () => useUi.getState().endFastForward(item.id), [item.id]);

  const onHold = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    if (width > 0 && x > width * SIDE_FRACTION && x < width * (1 - SIDE_FRACTION)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useUi.getState().startFastForward(item.id);
  };

  return (
    <View style={[styles.fill, { height }]}>
      {nearby && (
        // pointerEvents="none" lets vertical swipes reach the feed instead of the WebView.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <YouTubePlayer
            videoId={item.videoId}
            height={height}
            width={width}
            play={active}
            muted={muted}
            rate={fastForwarding ? FAST_FORWARD_RATE : 1}
            onError={onFailed}
            onPlaying={onPlaying}
            onAutoplayBlocked={muteForAutoplay}
          />
        </View>
      )}

      {!ready && (
        <View style={styles.loading} pointerEvents="none">
          <Text style={styles.loadingEmoji}>🍿</Text>
        </View>
      )}

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={toggleMuted}
        onLongPress={onHold}
        onPressOut={() => useUi.getState().endFastForward(item.id)}
        delayLongPress={HOLD_MS}
        accessibilityLabel="Toggle sound"
      />

      {fastForwarding && (
        <View style={[styles.speedPill, { top: topInset + space.xxl * 2 }]} pointerEvents="none">
          <Text style={styles.speedText}>{FAST_FORWARD_RATE}× SPEED ▶▶</Text>
        </View>
      )}

      <View style={[styles.header, { top: topInset + space.sm }]} pointerEvents="none">
        <View style={styles.breakBadge}>
          <Text style={styles.breakText}>☕ BRAIN BREAK</Text>
        </View>
        <View style={styles.soundBadge}>
          <Icon name={muted ? 'soundOff' : 'soundOn'} size={16} color={colors.text} />
        </View>
      </View>

      <View style={styles.footer} pointerEvents="none">
        <Text style={styles.vibe}>{VIBE_LABELS[item.vibe]} · YouTube Shorts</Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.channel}>@{item.channel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#000', overflow: 'hidden' },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 56 },
  header: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedPill: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  speedText: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  breakBadge: {
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FF4D8D',
  },
  breakText: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  soundBadge: { padding: 6, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)' },
  footer: {
    position: 'absolute',
    left: space.xl,
    right: space.xxl * 2,
    bottom: space.xxl,
    gap: 4,
  },
  vibe: { ...type.label, color: 'rgba(255,255,255,0.75)' },
  title: { ...type.body, fontWeight: '700', color: colors.text },
  channel: { ...type.small, color: colors.textMuted },
});
