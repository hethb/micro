import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BreakPicker,
  GoalPicker,
  SectionLabel,
  StylePicker,
  TopicPicker,
  VibePicker,
} from '@/components/prefs/PrefControls';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FORMAT_LABELS, TOPICS } from '@/content/topics';
import { todayStats, useActivity } from '@/state/activityStore';
import { usePrefs } from '@/state/prefsStore';
import { colors, radius, space, type } from '@/theme/tokens';

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const views = useActivity((s) => s.views);
  const saves = useActivity((s) => s.saves.length);
  const hiddenTopics = useActivity((s) => s.hiddenTopics);
  const hiddenFormats = useActivity((s) => s.hiddenFormats);
  const unhideTopic = useActivity((s) => s.unhideTopic);
  const unhideFormat = useActivity((s) => s.unhideFormat);
  const resetActivity = useActivity((s) => s.reset);
  const goal = usePrefs((s) => s.dailyGoalMin);
  const restartOnboarding = usePrefs((s) => s.restartOnboarding);
  const { learned, minutes } = todayStats(views);

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}>
      <Text style={styles.heading}>Today</Text>
      <View style={styles.stats}>
        <Stat value={String(learned)} label="things learned" />
        <Stat value={goal > 0 ? `${minutes}/${goal}` : String(minutes)} label="minutes" />
        <Stat value={String(saves)} label="saved" />
      </View>

      <Text style={styles.heading}>Your feed</Text>
      <SectionLabel>TOPICS</SectionLabel>
      <TopicPicker />
      <SectionLabel>LEARNING STYLE</SectionLabel>
      <StylePicker />
      <SectionLabel>BRAIN BREAKS</SectionLabel>
      <BreakPicker />
      <SectionLabel>BREAK VIBES</SectionLabel>
      <VibePicker />
      <SectionLabel>DAILY GOAL</SectionLabel>
      <GoalPicker />

      {(hiddenTopics.length > 0 || hiddenFormats.length > 0) && (
        <>
          <SectionLabel>SHOWING LESS OF (TAP TO UNDO)</SectionLabel>
          <View style={styles.wrap}>
            {hiddenTopics.map((t) => (
              <Chip key={t} label={`✕ ${TOPICS[t].label}`} selected={false} onPress={() => unhideTopic(t)} />
            ))}
            {hiddenFormats.map((f) => (
              <Chip key={f} label={`✕ ${FORMAT_LABELS[f]}`} selected={false} onPress={() => unhideFormat(f)} />
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Button
          label="Redo onboarding"
          variant="ghost"
          onPress={() => {
            restartOnboarding();
            router.replace('/onboarding/topics');
          }}
        />
        <Button label="Reset activity & history" variant="ghost" onPress={resetActivity} />
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl * 2, gap: space.md },
  heading: { ...type.hero, color: colors.text, marginTop: space.lg },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, gap: 2 },
  statValue: { ...type.title, color: colors.accent },
  statLabel: { ...type.small, color: colors.textMuted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actions: { marginTop: space.xl },
});
