import { useCallback, useEffect, useRef } from 'react';
import YoutubePlayer, { PLAYER_STATES, type YoutubeIframeRef } from 'react-native-youtube-iframe';

export interface YouTubePlayerProps {
  videoId: string;
  height: number;
  width: number;
  play: boolean;
  muted: boolean;
  onError(): void;
  onPlaying(): void;
  /** Reported about once a second while playing. */
  onProgress?(currentTime: number, duration: number): void;
}

const PROGRESS_INTERVAL_MS = 1000;

/**
 * Native YouTube player (WebView) using YouTube's official embed, so YouTube's branding
 * and terms apply and nothing is downloaded or rehosted. The web build uses YouTubePlayer.web.tsx.
 */
export function YouTubePlayer({ videoId, height, width, play, muted, onError, onPlaying, onProgress }: YouTubePlayerProps) {
  const playerRef = useRef<YoutubeIframeRef | null>(null);

  const onChangeState = useCallback(
    (state: PLAYER_STATES) => {
      if (state === PLAYER_STATES.PLAYING) onPlaying();
    },
    [onPlaying],
  );

  useEffect(() => {
    if (!play || !onProgress) return;
    const timer = setInterval(async () => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const [currentTime, duration] = await Promise.all([player.getCurrentTime(), player.getDuration()]);
        onProgress(currentTime, duration);
      } catch {
        // The WebView can be mid-teardown when scrolled away; the next tick or unmount handles it.
      }
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [play, onProgress]);

  return (
    <YoutubePlayer
      ref={playerRef}
      videoId={videoId}
      height={height}
      width={width}
      play={play}
      mute={muted}
      forceAndroidAutoplay
      onError={onError}
      onChangeState={onChangeState}
      initialPlayerParams={{ controls: false, loop: true, modestbranding: true, rel: false, iv_load_policy: 3 }}
      webViewProps={{
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserAction: false,
        scrollEnabled: false,
        style: { backgroundColor: '#000' },
      }}
      webViewStyle={{ backgroundColor: '#000' }}
    />
  );
}
