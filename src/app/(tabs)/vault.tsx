import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConceptSheet, type MapSelection } from '@/components/interests/ConceptSheet';
import { InterestMap } from '@/components/interests/InterestMap';
import { topicNodeId } from '@/interests/graph';
import { useInterestGraph } from '@/interests/useInterestGraph';
import { colors, radius, space, type } from '@/theme/tokens';

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const graph = useInterestGraph();
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const hasIdeas = graph.nodes.some((node) => node.kind === 'concept');
  const selectedId =
    selection?.kind === 'concept' ? selection.id : selection ? topicNodeId(selection.topic) : null;

  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Mind Map</Text>
        <Text style={styles.subtitle}>
          {hasIdeas
            ? 'Built from what you like, save and finish. Tap an idea to see more or less of it.'
            : 'Just your topics for now. Like, save and finish cards and the ideas behind them will grow here.'}
        </Text>
      </View>

      {graph.nodes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🕸️</Text>
          <Text style={styles.emptyTitle}>Your map is empty</Text>
          <Text style={styles.emptyBody}>Like, save and finish a few cards and your interests will show up here.</Text>
        </View>
      ) : (
        <InterestMap
          graph={graph}
          selectedId={selectedId}
          onSelect={(node) =>
            setSelection(node.kind === 'topic' ? { kind: 'topic', topic: node.topic } : { kind: 'concept', id: node.id })
          }
        />
      )}

      <View style={styles.legend}>
        <LegendItem swatch={styles.swatchEngaged} label="Your interests" />
        <LegendItem swatch={styles.swatchSuggested} label="Suggested" />
        <LegendItem swatch={styles.swatchFollowed} label="More of this" />
      </View>

      <ConceptSheet selection={selection} graph={graph} onSelect={setSelection} onClose={() => setSelection(null)} />
    </View>
  );
}

function LegendItem({ swatch, label }: { swatch: StyleProp<ViewStyle>; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.xs },
  heading: { ...type.hero, color: colors.text },
  subtitle: { ...type.small, fontWeight: '500', color: colors.textMuted },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  legendLabel: { ...type.small, color: colors.textMuted },
  swatch: { width: 12, height: 12, borderRadius: radius.pill },
  swatchEngaged: { backgroundColor: colors.textMuted },
  swatchSuggested: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textMuted },
  swatchFollowed: { backgroundColor: colors.textMuted, borderWidth: 2, borderColor: colors.accent },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.xl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...type.title, color: colors.text },
  emptyBody: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
