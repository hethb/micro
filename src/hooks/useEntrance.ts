import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';

/** Fade + rise animation that replays each time a card becomes active. */
export function useEntrance(active: boolean, delayMs = 0, distance = 24) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withDelay(delayMs, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    }
  }, [active, delayMs, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));
}
