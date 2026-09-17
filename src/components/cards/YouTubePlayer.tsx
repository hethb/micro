import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

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

/**
 * YouTube rejects embeds without an HTTP referrer ("Error 153: video player configuration
 * error"), which WebViews don't send for inline HTML. Loading the page with an https base URL
 * gives the embed an origin and referrer. Any https URL identifying the app works.
 */
const PLAYER_ORIGIN = 'https://micro.app';

/** If the player hasn't initialised by then, treat the video as unplayable. */
const READY_TIMEOUT_MS = 15_000;

const PLAYING = 1;

/** Desktop Chrome UA lets Android WebViews autoplay with sound. */
const ANDROID_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36';

type PlayerMessage =
  | { type: 'ready' }
  | { type: 'state'; data: number }
  | { type: 'error'; data: number }
  | { type: 'progress'; data: { currentTime: number; duration: number } };

function playerHtml(videoId: string, muted: boolean): string {
  const id = JSON.stringify(videoId);
  const origin = JSON.stringify(PLAYER_ORIGIN);
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  #player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="player"></div>
<script>
  function send(type, data) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
  }
  var player = null;
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      width: '100%',
      height: '100%',
      videoId: ${id},
      playerVars: {
        controls: 0, loop: 1, playlist: ${id}, modestbranding: 1, rel: 0, iv_load_policy: 3,
        playsinline: 1, fs: 0, disablekb: 1, mute: ${muted ? 1 : 0},
        origin: ${origin}, widget_referrer: ${origin}
      },
      events: {
        onReady: function () { send('ready'); },
        onStateChange: function (e) { send('state', e.data); },
        onError: function (e) { send('error', e.data); }
      }
    });
  }
  window.microPlayer = {
    set: function (play, muted) {
      if (!player || !player.playVideo) return;
      if (muted) player.mute(); else player.unMute();
      if (play) player.playVideo(); else player.pauseVideo();
    }
  };
  setInterval(function () {
    if (player && player.getPlayerState && player.getPlayerState() === ${PLAYING}) {
      send('progress', { currentTime: player.getCurrentTime(), duration: player.getDuration() });
    }
  }, 1000);
</script>
<script src="https://www.youtube.com/iframe_api"></script>
</body>
</html>`;
}

/**
 * Native YouTube player: YouTube's official IFrame API inside a WebView, so YouTube's branding
 * and terms apply and nothing is downloaded or rehosted. The web build uses YouTubePlayer.web.tsx.
 */
export function YouTubePlayer({ videoId, height, width, play, muted, onError, onPlaying, onProgress }: YouTubePlayerProps) {
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  // Only the initial mute state goes into the page; later changes use commands so the video doesn't reload.
  const [initialMuted] = useState(muted);
  const source = useMemo(
    () => ({ html: playerHtml(videoId, initialMuted), baseUrl: PLAYER_ORIGIN }),
    [videoId, initialMuted],
  );

  // Callers often pass inline callbacks; an effect event keeps the timer from restarting each render.
  const onReadyTimeout = useEffectEvent(() => onError());
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(onReadyTimeout, READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [ready, videoId]);

  useEffect(() => {
    if (!ready) return;
    webViewRef.current?.injectJavaScript(`window.microPlayer && window.microPlayer.set(${play}, ${muted}); true;`);
  }, [ready, play, muted]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: PlayerMessage;
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (message.type === 'ready') setReady(true);
      else if (message.type === 'error') onError();
      else if (message.type === 'state' && message.data === PLAYING) onPlaying();
      else if (message.type === 'progress' && message.data.duration > 0) {
        onProgress?.(message.data.currentTime, message.data.duration);
      }
    },
    [onError, onPlaying, onProgress],
  );

  // Keep the page itself in place; the embed's own iframe navigations are allowed.
  const onShouldStartLoadWithRequest = useCallback(
    (request: ShouldStartLoadRequest) =>
      !request.isTopFrame || request.url.startsWith(PLAYER_ORIGIN) || request.url === 'about:blank',
    [],
  );

  return (
    <View style={{ height, width }}>
      <WebView
        ref={webViewRef}
        source={source}
        originWhitelist={['*']}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        userAgent={Platform.OS === 'android' ? ANDROID_USER_AGENT : undefined}
        style={styles.webView}
        containerStyle={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webView: { flex: 1, backgroundColor: '#000' },
});
