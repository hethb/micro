import { useEvent } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TOPICS } from '@/content/topics';
import type { VideoCard as VideoCardData } from '@/content/types';
import { useActivity } from '@/state/activityStore';
import { useUi } from '@/state/uiStore';
import { colors, space, type } from '@/theme/tokens';

import { Icon } from '../ui/Icon';
import type { CardViewProps } from './CardProps';
import { CONTENT_PADDING } from './layout';

export function VideoCard({ card, active, nearby }: CardViewProps & { card: VideoCardData }) {
  const topic = TOPICS[card.topic];
  return (
    <View style={styles.fill}>
      <LinearGradient colors={topic.gradient} style={StyleSheet.absoluteFill} />
      {/* Only mount the native player near the viewport to keep memory flat. */}
      {nearby && <Player card={card} active={active} />}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={styles.caption} pointerEvents="none">
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.body}>{card.caption}</Text>
      </View>
    </View>
  );
}

function Player({ card, active }: { card: VideoCardData; active: boolean }) {
  const muted = useUi((s) => s.muted);
  const completed = useRef(false);
  const player = useVideoPlayer(card.videoUrl, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.5;
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  useEffect(() => setMuted(player, muted), [player, muted]);

  useEffect(() => {
    if (active) {
      player.replay();
    } else {
      player.pause();
    }
  }, [active, player]);

  const duration = Math.min(player.duration || card.durationSec, 60);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  useEffect(() => {
    if (active && progress > 0.8 && !completed.current) {
      completed.current = true;
      useActivity.getState().record(card, 'complete');
    }
  }, [active, progress, card]);

  return (
    <>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      {active && !isPlaying && currentTime > 0 && (
        <View style={styles.paused} pointerEvents="none">
          <Icon name="play" size={64} color="rgba(255,255,255,0.85)" />
        </View>
      )}
      <View style={styles.soundBadge} pointerEvents="none">
        <Icon name={muted ? 'soundOff' : 'soundOn'} size={16} color={colors.text} />
      </View>
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.bar, { width: `${progress * 100}%` }]} />
      </View>
    </>
  );
}

/** The player is a native handle, not React state, so it's updated imperatively. */
function setMuted(player: VideoPlayer, muted: boolean) {
  player.muted = muted;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  caption: {
    position: 'absolute',
    left: CONTENT_PADDING.paddingLeft,
    right: CONTENT_PADDING.paddingRight,
    bottom: CONTENT_PADDING.paddingBottom,
    gap: space.sm,
  },
  title: { ...type.title, color: colors.text },
  body: { ...type.body, color: 'rgba(255,255,255,0.9)' },
  paused: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
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
