import type { Card, Concept, TopicId } from '@/content/types';
import { computeAffinity } from '@/feed/scoring';
import type { EngagementSignal } from '@/feed/types';

export type ConceptState = 'engaged' | 'followed' | 'muted' | 'suggested';

export type GraphNode =
  | { id: string; kind: 'topic'; topic: TopicId }
  | { id: string; kind: 'concept'; topic: TopicId; concept: Concept; state: ConceptState; score: number };

export interface GraphEdge {
  source: string;
  target: string;
  /** topic: hub → concept · shared: tagged on the same card you engaged with · related: AI-suggested link. */
  kind: 'topic' | 'shared' | 'related';
  weight: number;
}

export interface InterestGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface InterestInput {
  topics: readonly TopicId[];
  events: readonly EngagementSignal[];
  followed: readonly string[];
  muted: readonly string[];
  cards: readonly Card[];
  concepts: ReadonlyMap<string, Concept>;
}

const MAX_ENGAGED = 24;
const MAX_SUGGESTED = 8;
const COLD_START_PER_TOPIC = 3;

export const topicNodeId = (topic: TopicId) => `topic:${topic}`;

/**
 * Builds the user's interest mind map: topic hubs, the concepts they engaged with or
 * followed, and AI-related concepts they haven't explored yet as suggestions.
 */
export function buildInterestGraph(input: InterestInput): InterestGraph {
  const { concepts } = input;
  const cardsById = new Map(input.cards.map((card) => [card.id, card]));
  const conceptsOf = (cardId: string) => cardsById.get(cardId)?.concepts;
  // Direct engagement only (no spillover): spillover is what the suggestions visualise.
  const scores = computeAffinity(input.events, { conceptsOf }).concept;

  const states = new Map<string, ConceptState>();
  Object.entries(scores)
    .filter(([id, score]) => score > 0 && concepts.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ENGAGED)
    .forEach(([id]) => states.set(id, 'engaged'));
  for (const id of input.followed) if (concepts.has(id)) states.set(id, 'followed');
  for (const id of input.muted) if (concepts.has(id)) states.set(id, 'muted');

  for (const id of suggestions(states, scores, input)) states.set(id, 'suggested');

  const conceptNodes: GraphNode[] = [...states].map(([id, state]) => {
    const concept = concepts.get(id)!;
    return { id, kind: 'concept', topic: concept.topic, concept, state, score: Math.max(0, scores[id] ?? 0) };
  });
  const hubTopics = new Set<TopicId>([...input.topics, ...conceptNodes.map((n) => n.topic)]);
  const nodes: GraphNode[] = [
    ...[...hubTopics].map((topic): GraphNode => ({ id: topicNodeId(topic), kind: 'topic', topic })),
    ...conceptNodes,
  ];

  return { nodes, edges: buildEdges(states, input, cardsById) };
}

function suggestions(
  states: ReadonlyMap<string, ConceptState>,
  scores: Readonly<Record<string, number>>,
  input: InterestInput,
): string[] {
  const pull = new Map<string, number>();
  for (const [id, state] of states) {
    if (state === 'muted') continue;
    const strength = state === 'followed' ? Math.max(1, scores[id] ?? 0) : (scores[id] ?? 0);
    for (const related of input.concepts.get(id)?.related ?? []) {
      if (states.has(related) || !input.concepts.has(related)) continue;
      pull.set(related, (pull.get(related) ?? 0) + strength);
    }
  }
  if (pull.size > 0) {
    return [...pull]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SUGGESTED)
      .map(([id]) => id);
  }
  if (states.size > 0) return [];

  // Cold start: the most-used concepts under each topic the user picked in onboarding.
  const usage = new Map<string, number>();
  for (const card of input.cards) for (const id of card.concepts ?? []) usage.set(id, (usage.get(id) ?? 0) + 1);
  return input.topics.flatMap((topic) =>
    [...input.concepts.values()]
      .filter((c) => c.topic === topic)
      .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0))
      .slice(0, COLD_START_PER_TOPIC)
      .map((c) => c.id),
  );
}

function buildEdges(
  states: ReadonlyMap<string, ConceptState>,
  input: InterestInput,
  cardsById: ReadonlyMap<string, Card>,
): GraphEdge[] {
  const edges = new Map<string, GraphEdge>();
  const add = (source: string, target: string, kind: GraphEdge['kind'], weight = 1) => {
    const key = source < target ? `${source}|${target}` : `${target}|${source}`;
    const existing = edges.get(key);
    if (!existing) edges.set(key, { source, target, kind, weight });
    // A link the user actually lived through outranks an AI suggestion.
    else if (kind === 'shared') edges.set(key, { ...existing, kind, weight: existing.weight + weight });
  };

  for (const [id] of states) add(topicNodeId(input.concepts.get(id)!.topic), id, 'topic');

  for (const event of input.events) {
    if (event.type === 'skip' || !event.cardId) continue;
    const onMap = (cardsById.get(event.cardId)?.concepts ?? []).filter((id) => states.has(id));
    for (let i = 0; i < onMap.length; i++) {
      for (let j = i + 1; j < onMap.length; j++) add(onMap[i], onMap[j], 'shared');
    }
  }

  for (const [id] of states) {
    for (const related of input.concepts.get(id)!.related) {
      if (states.has(related)) add(id, related, 'related');
    }
  }
  return [...edges.values()];
}
