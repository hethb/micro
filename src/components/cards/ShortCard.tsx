import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { EntertainmentItem } from '@/entertainment/types';
import { VIBE_LABELS } from '@/entertainment/types';
import { useUi } from '@/state/uiStore';
import { colors, radius, space, type } from '@/theme/tokens';

import { Icon } from '../ui/Icon';
import type { CardViewProps } from './CardProps';
import { YouTubePlayer } from './YouTubePlayer';

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
  const [ready, setReady] = useState(false);

  const onPlaying = useCallback(() => setReady(true), []);

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

      <Pressable style={StyleSheet.absoluteFill} onPress={toggleMuted} accessibilityLabel="Toggle sound" />

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
