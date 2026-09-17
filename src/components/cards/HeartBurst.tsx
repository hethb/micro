import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

import { Icon } from '../ui/Icon';

/** Big heart that pops in the middle of the card on double-tap. `trigger` changes → animate. */
export function HeartBurst({ trigger }: { trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = withSequence(withSpring(1.1, { damping: 8 }), withTiming(1, { duration: 120 }));
    opacity.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 600 }));
  }, [trigger, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, style]}>
      <Icon name="heart" size={120} color={colors.like} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
