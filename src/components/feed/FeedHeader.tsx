import { StyleSheet, Text, View } from 'react-native';

import { todayStats, useActivity } from '@/state/activityStore';
import { usePrefs } from '@/state/prefsStore';
import { colors, radius, space } from '@/theme/tokens';

/** Small "learned today" counter pinned to the top-right, above the cards. */
export function FeedHeader({ topInset }: { topInset: number }) {
  const views = useActivity((s) => s.views);
  const goal = usePrefs((s) => s.dailyGoalMin);
  const { learned, minutes } = todayStats(views);
  const progress = goal > 0 ? Math.min(1, minutes / goal) : 0;

  return (
    <View style={[styles.wrap, { top: topInset + space.sm }]} pointerEvents="none">
      <Text style={styles.count}>🧠 {learned}</Text>
      {goal > 0 && (
        <View style={styles.track}>
          <View style={[styles.bar, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: space.lg,
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  count: { color: colors.text, fontSize: 12, fontWeight: '800' },
  track: { width: 44, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  bar: { height: 3, borderRadius: 2, backgroundColor: colors.accent },
});
