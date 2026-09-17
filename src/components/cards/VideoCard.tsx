import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TOPICS } from '@/content/topics';
import type { VideoCard as VideoCardData } from '@/content/types';
import { useActivity } from '@/state/activityStore';
import { useUi } from '@/state/uiStore';
import { colors, radius, space, type } from '@/theme/tokens';

import { Icon } from '../ui/Icon';
import type { CardViewProps } from './CardProps';
import { CONTENT_PADDING } from './layout';
import { YouTubePlayer } from './YouTubePlayer';

/** Share of the video watched before it counts as completed. */
const COMPLETE_AT = 0.8;

/** A real educator's YouTube Short, with sound, credited to its creator. */
export function VideoCard({ card, active, nearby, height, width }: CardViewProps & { card: VideoCardData }) {
  const topic = TOPICS[card.topic];
  const muted = useUi((s) => s.muted);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const completed = useRef(false);

  const onPlaying = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);
  const onProgress = useCallback(
    (currentTime: number, duration: number) => {
      const fraction = Math.min(1, currentTime / duration);
      setProgress(fraction);
      if (fraction >= COMPLETE_AT && !completed.current) {
        completed.current = true;
        useActivity.getState().record(card, 'complete');
      }
    },
    [card],
  );

  const youtubeUrl = `https://www.youtube.com/shorts/${card.youtubeId}`;

  return (
    <View style={styles.fill}>
      <LinearGradient colors={topic.gradient} style={StyleSheet.absoluteFill} />

      {/* Only mount the player near the viewport to keep memory flat. */}
      {nearby && !failed && (
        // pointerEvents="none" lets taps and swipes reach the feed instead of the embed.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <YouTubePlayer
            videoId={card.youtubeId}
            height={height}
            width={width}
            play={active}
            muted={muted}
            onError={onError}
            onPlaying={onPlaying}
            onProgress={onProgress}
          />
        </View>
      )}

      {!ready && !failed && (
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.loadingEmoji}>🎓</Text>
        </View>
      )}

      {failed && (
        <View style={styles.center}>
          <Text style={styles.failedText}>This video can&apos;t play here.</Text>
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(youtubeUrl)}
            accessibilityRole="link"
            style={({ pressed }) => [styles.watchButton, pressed && { opacity: 0.8 }]}>
            <Icon name="link" size={16} color={colors.accentInk} />
            <Text style={styles.watchText}>Watch on YouTube</Text>
          </Pressable>
        </View>
      )}

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.scrim} pointerEvents="none" />
      <View style={styles.caption} pointerEvents="none">
        <Text style={styles.creator}>@{card.channel} · YouTube</Text>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.body} numberOfLines={3}>
          {card.caption}
        </Text>
      </View>

      <View style={styles.soundBadge} pointerEvents="none">
        <Icon name={muted ? 'soundOff' : 'soundOn'} size={16} color={colors.text} />
      </View>
      <View style={styles.track} pointerEvents="none">
        {/* The bar only shows for the card on screen; it catches up within a second of playing. */}
        <View style={[styles.bar, { width: `${(active ? progress : 0) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
  },
  loadingEmoji: { fontSize: 56 },
  failedText: { ...type.body, color: colors.text },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
  },
  watchText: { ...type.body, fontWeight: '800', color: colors.accentInk },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' },
  caption: {
    position: 'absolute',
    left: CONTENT_PADDING.paddingLeft,
    right: CONTENT_PADDING.paddingRight,
    bottom: CONTENT_PADDING.paddingBottom,
    gap: space.xs,
  },
  creator: { ...type.small, color: 'rgba(255,255,255,0.8)' },
  title: { ...type.title, color: colors.text },
  body: { ...type.body, fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  soundBadge: {
    position: 'absolute',
    top: 92,
    right: space.lg,
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bar: { height: 3, backgroundColor: colors.accent },
});
