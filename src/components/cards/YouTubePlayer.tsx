import { useCallback } from 'react';
import YoutubePlayer, { PLAYER_STATES } from 'react-native-youtube-iframe';

export interface ShortPlayerProps {
  videoId: string;
  height: number;
  width: number;
  play: boolean;
  muted: boolean;
  onError(): void;
  onPlaying(): void;
}

/** Native YouTube player (WebView). The web build uses ShortPlayer.web.tsx instead. */
export function ShortPlayer({ videoId, height, width, play, muted, onError, onPlaying }: ShortPlayerProps) {
  const onChangeState = useCallback(
    (state: PLAYER_STATES) => {
      if (state === PLAYER_STATES.PLAYING) onPlaying();
    },
    [onPlaying],
  );

  return (
    <YoutubePlayer
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
