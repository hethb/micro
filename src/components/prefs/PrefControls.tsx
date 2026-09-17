import { StyleSheet, Text, View } from 'react-native';

import { TOPICS } from '@/content/topics';
import { TOPIC_IDS } from '@/content/types';
import { VIBES, VIBE_LABELS } from '@/entertainment/types';
import { BREAK_OPTIONS } from '@/feed/types';
import { DAILY_GOALS, usePrefs } from '@/state/prefsStore';
import { colors, space, type } from '@/theme/tokens';

import { Chip } from '../ui/Chip';
import { ScalePicker } from '../ui/ScalePicker';

/** Preference controls shared by onboarding and the Me tab. */

export function TopicPicker() {
  const topics = usePrefs((s) => s.topics);
  const toggleTopic = usePrefs((s) => s.toggleTopic);
  return (
    <View style={styles.wrap}>
      {TOPIC_IDS.map((id) => (
        <Chip
          key={id}
          label={`${TOPICS[id].emoji} ${TOPICS[id].label}`}
          selected={topics.includes(id)}
          onPress={() => toggleTopic(id)}
        />
      ))}
    </View>
  );
}

export function StylePicker() {
  const formatBias = usePrefs((s) => s.formatBias);
  const depthBias = usePrefs((s) => s.depthBias);
  const setFormatBias = usePrefs((s) => s.setFormatBias);
  const setDepthBias = usePrefs((s) => s.setDepthBias);
  return (
    <View style={styles.stack}>
      <ScalePicker
        left="🎬 Mostly videos"
        right="📖 Mostly quick reads"
        value={formatBias}
        onChange={setFormatBias}
      />
      <ScalePicker left="🎈 Light & fun" right="🧐 Deep & serious" value={depthBias} onChange={setDepthBias} />
    </View>
  );
}

export function BreakPicker() {
  const breakEvery = usePrefs((s) => s.breakEvery);
  const setBreakEvery = usePrefs((s) => s.setBreakEvery);
  return (
    <View style={styles.wrap}>
      {BREAK_OPTIONS.map((n) => (
        <Chip
          key={n}
          label={n === 0 ? 'Off' : `Every ${n} cards`}
          selected={breakEvery === n}
          onPress={() => setBreakEvery(n)}
        />
      ))}
    </View>
  );
}

export function VibePicker() {
  const vibes = usePrefs((s) => s.vibes);
  const toggleVibe = usePrefs((s) => s.toggleVibe);
  return (
    <View style={styles.wrap}>
      {VIBES.map((vibe) => (
        <Chip
          key={vibe}
          label={VIBE_LABELS[vibe]}
          selected={vibes.includes(vibe)}
          onPress={() => toggleVibe(vibe)}
        />
      ))}
    </View>
  );
}

export function GoalPicker() {
  const goal = usePrefs((s) => s.dailyGoalMin);
  const setDailyGoal = usePrefs((s) => s.setDailyGoal);
  return (
    <View style={styles.wrap}>
      {DAILY_GOALS.map((g) => (
        <Chip
          key={g}
          label={g === 0 ? 'No goal' : `${g} min / day`}
          selected={goal === g}
          onPress={() => setDailyGoal(g)}
        />
      ))}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stack: { gap: space.xxl },
  section: { ...type.label, color: colors.textDim, marginTop: space.md },
});
