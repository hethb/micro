import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { getCard } from '@/content';
import { describeCard } from '@/content/describe';
import { TOPICS } from '@/content/topics';
import { TOPIC_IDS, type Card } from '@/content/types';
import { useActivity } from '@/state/activityStore';
import { colors, radius, space, type } from '@/theme/tokens';

/** Saved cards, newest first, grouped by topic. */
export function SavedList() {
  const saves = useActivity((s) => s.saves);

  const cards = [...saves]
    .sort((a, b) => b.at - a.at)
    .map((s) => getCard(s.cardId))
    .filter((c): c is Card => c !== undefined);

  const sections = TOPIC_IDS.map((id) => ({
    title: `${TOPICS[id].emoji} ${TOPICS[id].label}`,
    data: cards.filter((c) => c.topic === id),
  })).filter((s) => s.data.length > 0);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(card) => card.id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
      renderItem={({ item }) => <SavedRow card={item} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔖</Text>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyBody}>Tap Save on any card in your feed to keep it here.</Text>
        </View>
      }
    />
  );
}

function SavedRow({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  const toggleSave = useActivity((s) => s.toggleSave);
  const { emoji, title, detail } = describeCard(card);

  return (
    <Pressable onPress={() => setOpen((o) => !o)} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
        <Text style={styles.rowTitle} numberOfLines={open ? undefined : 2}>
          {title}
        </Text>
        <Pressable onPress={() => toggleSave(card)} hitSlop={10} accessibilityLabel="Remove from saved">
          <Icon name="bookmark" size={20} color={colors.accent} />
        </Pressable>
      </View>
      {open && <Text style={styles.rowDetail}>{detail}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.sm },
  section: { ...type.label, color: colors.textDim, marginTop: space.lg, marginBottom: space.xs },
  row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, gap: space.md },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  rowEmoji: { fontSize: 20 },
  rowTitle: { ...type.body, fontWeight: '700', color: colors.text, flex: 1 },
  rowDetail: { ...type.body, fontSize: 15, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 120, gap: space.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...type.title, color: colors.text },
  emptyBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
