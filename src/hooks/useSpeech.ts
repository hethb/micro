import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

/** Optional voiceover for text cards. Stops automatically when the card leaves the screen. */
export function useSpeech(text: string, active: boolean) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Speech.stop() fires onStopped, which resets `speaking`.
    if (!active) Speech.stop();
  }, [active]);

  useEffect(() => () => void Speech.stop(), []);

  const toggle = useCallback(() => {
    Speech.stop();
    if (speaking) return;
    setSpeaking(true);
    Speech.speak(text, {
      rate: 1.02,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [speaking, text]);

  return { speaking: speaking && active, toggle };
}
