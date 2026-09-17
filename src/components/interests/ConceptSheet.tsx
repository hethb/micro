import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Sheet, SheetOption } from '@/components/ui/Sheet';
import { ALL_CARDS, getCard } from '@/content';
import { CONCEPTS } from '@/content/concepts';
import { describeCard } from '@/content/describe';
import { TOPICS } from '@/content/topics';
import type { Card, TopicId } from '@/content/types';
import type { InterestGraph } from '@/interests/graph';
import { useActivity } from '@/state/activityStore';
import { colors, radius, space, type } from '@/theme/tokens';

export type MapSelection = { kind: 'concept'; id: string } | { kind: 'topic'; topic: TopicId };

interface ConceptSheetProps {
  selection: MapSelection | null;
  graph: InterestGraph;
  onSelect(selection: MapSelection): void;
  onClose(): void;
}

const MAX_SAVED_SHOWN = 5;
const cardsById = new Map(ALL_CARDS.map((card) => [card.id, card]));

export function ConceptSheet({ selection, graph, onSelect, onClose }: ConceptSheetProps) {
  const concept = selection?.kind === 'concept' ? CONCEPTS.get(selection.id) : undefined;
  const topic = selection?.kind === 'topic' ? TOPICS[selection.topic] : undefined;
  const title = concept?.label ?? (topic ? `${topic.emoji} ${topic.label}` : '');

  return (
    <Sheet visible={Boolean(concept || topic)} title={title} onClose={onClose}>
      {concept && <ConceptDetail conceptId={concept.id} graph={graph} onSelect={onSelect} />}
      {selection?.kind === 'topic' && (
        <TopicDetail topic={selection.topic} graph={graph} onSelect={onSelect} onClose={onClose} />
      )}
    </Sheet>
  );
}

function ConceptDetail({
  conceptId,
  graph,
  onSelect,
}: {
  conceptId: string;
  graph: InterestGraph;
  onSelect(selection: MapSelection): void;
}) {
  const concept = CONCEPTS.get(conceptId)!;
  const events = useActivity((s) => s.events);
  const saves = useActivity((s) => s.saves);
  const followed = useActivity((s) => s.followedConcepts.includes(conceptId));
  const muted = useActivity((s) => s.mutedConcepts.includes(conceptId));
  const setPreference = useActivity((s) => s.setConceptPreference);

  const tagged = (card: Card | undefined) => card?.concepts?.includes(conceptId) ?? false;
  const engagedCount = new Set(
    events.filter((e) => e.type !== 'skip' && e.cardId !== undefined && tagged(cardsById.get(e.cardId))).map((e) => e.cardId),
  ).size;
  const savedCards = saves
    .map((s) => getCard(s.cardId))
    .filter((card): card is Card => tagged(card))
    .slice(0, MAX_SAVED_SHOWN);
  const onMap = new Set(graph.nodes.map((n) => n.id));
  const linkedFrom = concept.related.filter((id) => onMap.has(id)).map((id) => CONCEPTS.get(id)!.label);

  const why = muted
    ? 'You asked to see less of this.'
    : followed
      ? 'You asked to see more of this.'
      : engagedCount > 0
        ? `From ${engagedCount} ${engagedCount === 1 ? 'card' : 'cards'} you liked, saved, shared or finished.`
        : linkedFrom.length > 0
          ? `Suggested because it connects to ${joinLabels(linkedFrom)}.`
          : 'Not on your map yet.';

  return (
    <>
      <Text style={styles.meta}>
        {TOPICS[concept.topic].emoji} {TOPICS[concept.topic].label}
      </Text>
      <Text style={styles.why}>{why}</Text>

      <SheetOption
        label={followed ? '✓ Showing more of this' : 'More of this'}
        detail={followed ? 'Tap to go back to normal' : 'Boost cards about this idea in your feed'}
        active={followed}
        onPress={() => setPreference(conceptId, followed ? null : 'more')}
      />
      <SheetOption
        label={muted ? '✓ Showing less of this' : 'Less of this'}
        detail={muted ? 'Tap to go back to normal' : 'Show cards about this idea rarely'}
        active={muted}
        onPress={() => setPreference(conceptId, muted ? null : 'less')}
      />

      {concept.related.length > 0 && (
        <>
          <Text style={styles.label}>CONNECTED IDEAS</Text>
          <View style={styles.wrap}>
            {concept.related.map((id) => (
              <Chip
                key={id}
                label={CONCEPTS.get(id)?.label ?? id}
                selected={false}
                onPress={() => onSelect({ kind: 'concept', id })}
              />
            ))}
          </View>
        </>
      )}

      {savedCards.length > 0 && (
        <>
          <Text style={styles.label}>FROM YOUR SAVES</Text>
          {savedCards.map((card) => {
            const { emoji, title } = describeCard(card);
            return (
              <View key={card.id} style={styles.saved}>
                <Text style={styles.savedText} numberOfLines={2}>
                  {emoji} {title}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </>
  );
}

function TopicDetail({
  topic,
  graph,
  onSelect,
  onClose,
}: {
  topic: TopicId;
  graph: InterestGraph;
  onSelect(selection: MapSelection): void;
  onClose(): void;
}) {
  const ideas = graph.nodes.flatMap((n) => (n.kind === 'concept' && n.topic === topic ? [n.concept] : []));
  return (
    <>
      <Text style={styles.why}>
        {ideas.length > 0 ? 'Ideas on your map in this topic. Tap one to tune it.' : 'No ideas mapped here yet.'}
      </Text>
      <View style={styles.wrap}>
        {ideas.map((c) => (
          <Chip key={c.id} label={c.label} selected={false} onPress={() => onSelect({ kind: 'concept', id: c.id })} />
        ))}
      </View>
      <SheetOption
        label="Change your topics"
        detail="Pick topics in Settings"
        onPress={() => {
          onClose();
          router.push('/settings');
        }}
      />
    </>
  );
}

function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
}

const styles = StyleSheet.create({
  meta: { ...type.small, color: colors.textMuted },
  why: { ...type.body, color: colors.text, marginBottom: space.sm },
  label: { ...type.label, color: colors.textDim, marginTop: space.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  saved: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: space.md },
  savedText: { ...type.small, color: colors.text },
});
