import { useEffect, useEffectEvent, useRef, useState } from 'react';

import type { ShortPlayerProps } from './ShortPlayer';

const YOUTUBE_ORIGIN = 'https://www.youtube.com';
const PLAYING = 1;

/**
 * Web YouTube player: a plain embed iframe driven through YouTube's postMessage
 * protocol (enablejsapi=1). react-native-youtube-iframe needs
 * react-native-web-webview on web, which doesn't work with Metro.
 */
export function ShortPlayer({ videoId, height, width, play, muted, onError, onPlaying }: ShortPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // Only the initial mute state goes into the URL; later changes use commands so the video doesn't reload.
  const [initialMuted] = useState(muted);
  const src =
    `${YOUTUBE_ORIGIN}/embed/${encodeURIComponent(videoId)}?` +
    new URLSearchParams({
      enablejsapi: '1',
      ...(typeof window !== 'undefined' && { origin: window.location.origin }),
      controls: '0',
      loop: '1',
      playlist: videoId, // required for loop=1 on a single video
      modestbranding: '1',
      rel: '0',
      iv_load_policy: '3',
      playsinline: '1',
      mute: initialMuted ? '1' : '0',
    }).toString();

  const onMessage = useEffectEvent((event: MessageEvent) => {
    if (event.source !== iframeRef.current?.contentWindow || typeof event.data !== 'string') return;
    let data: { event?: string; info?: unknown };
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    if (data.event === 'onReady') setReady(true);
    else if (data.event === 'onError') onError();
    else if (data.event === 'onStateChange' && data.info === PLAYING) onPlaying();
    else if (
      data.event === 'infoDelivery' &&
      (data.info as { playerState?: number } | null)?.playerState === PLAYING
    ) {
      onPlaying();
    }
  });

  useEffect(() => {
    const listener = (event: MessageEvent) => onMessage(event);
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const send = (func: string) =>
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), YOUTUBE_ORIGIN);
    send(muted ? 'mute' : 'unMute');
    send(play ? 'playVideo' : 'pauseVideo');
  }, [ready, play, muted]);

  // Ask the player to start sending events (onReady, state changes, errors).
  const onLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), YOUTUBE_ORIGIN);
  };

  return (
    <iframe
      ref={iframeRef}
      src={src}
      onLoad={onLoad}
      width={width}
      height={height}
      title="YouTube Short"
      allow="autoplay; encrypted-media"
      style={{ border: 0, backgroundColor: '#000', display: 'block' }}
    />
  );
}
