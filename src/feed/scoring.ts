import type { Card, Concept, Format, TopicId } from '@/content/types';

import type { EngagementSignal, FeedPrefs, FeedSignals, SignalType } from './types';

export const BASE_FORMAT_WEIGHTS: Record<Format, number> = {
  video: 0.35,
  fact: 0.3,
  book: 0.2,
  quote: 0.15,
};

export const SIGNAL_DELTAS: Record<SignalType, number> = {
  save: 0.3,
  share: 0.3,
  comment: 0.3,
  like: 0.15,
  complete: 0.1,
  skip: -0.1,
};

/** Only recent behaviour shapes the feed. */
const RECENT_EVENTS = 300;
const UNSELECTED_TOPIC_WEIGHT = 0.15;
const HIDDEN_TOPIC_FACTOR = 0.2;
const HIDDEN_FORMAT_FACTOR = 0.5;
const MIN_AFFINITY = 0.3;
const MAX_AFFINITY = 2.5;
/** Concept affinity stacks on top of topic affinity, so it counts for a bit less. */
const CONCEPT_AFFINITY_SCALE = 0.6;
/** Share of a concept's engagement that spills over to its AI-suggested related concepts. */
const RELATED_SPILLOVER = 0.35;
const FOLLOWED_CONCEPT_FACTOR = 1.8;
const MUTED_CONCEPT_FACTOR = 0.25;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface Affinity {
  topic: Partial<Record<TopicId, number>>;
  format: Partial<Record<Format, number>>;
  /** Engagement per concept, including spillover to related concepts when they are known. */
  concept: Record<string, number>;
}

export interface ConceptContext {
  conceptsOf(cardId: string): readonly string[] | undefined;
  /** When given, positive engagement spills over to related concepts. */
  concepts?: ReadonlyMap<string, Concept>;
}

export function computeAffinity(events: readonly EngagementSignal[], context?: ConceptContext): Affinity {
  const topic: Partial<Record<TopicId, number>> = {};
  const format: Partial<Record<Format, number>> = {};
  const direct: Record<string, number> = {};
  for (const event of events.slice(-RECENT_EVENTS)) {
    const delta = SIGNAL_DELTAS[event.type];
    topic[event.topic] = (topic[event.topic] ?? 0) + delta;
    format[event.format] = (format[event.format] ?? 0) + delta;
    const concepts = event.cardId ? context?.conceptsOf(event.cardId) : undefined;
    for (const id of concepts ?? []) direct[id] = (direct[id] ?? 0) + delta;
  }

  const concept = { ...direct };
  for (const [id, sum] of Object.entries(direct)) {
    if (sum <= 0) continue;
    for (const related of context?.concepts?.get(id)?.related ?? []) {
      concept[related] = (concept[related] ?? 0) + sum * RELATED_SPILLOVER;
    }
  }
  return { topic, format, concept };
}

const affinityMultiplier = (sum: number | undefined) => clamp(1 + (sum ?? 0), MIN_AFFINITY, MAX_AFFINITY);

export function formatWeight(
  format: Format,
  prefs: FeedPrefs,
  signals: FeedSignals,
  affinity: Affinity,
): number {
  const bias = clamp(prefs.formatBias, -1, 1);
  const biasFactor = format === 'video' ? 1 - 0.6 * bias : 1 + 0.6 * bias;
  const hidden = signals.hiddenFormats.includes(format) ? HIDDEN_FORMAT_FACTOR : 1;
  return BASE_FORMAT_WEIGHTS[format] * biasFactor * affinityMultiplier(affinity.format[format]) * hidden;
}

export function cardWeight(
  card: Card,
  prefs: FeedPrefs,
  signals: FeedSignals,
  affinity: Affinity,
): number {
  const selected =
    prefs.topics.length === 0 || prefs.topics.includes(card.topic) ? 1 : UNSELECTED_TOPIC_WEIGHT;
  const hidden = signals.hiddenTopics.includes(card.topic) ? HIDDEN_TOPIC_FACTOR : 1;
  const depthBias = clamp(prefs.depthBias, -1, 1);
  const depth = card.depth === 'deep' ? 1 + 0.5 * depthBias : 1 - 0.5 * depthBias;
  return (
    selected *
    hidden *
    depth *
    affinityMultiplier(affinity.topic[card.topic]) *
    conceptFactor(card, signals, affinity)
  );
}

function conceptFactor(card: Card, signals: FeedSignals, affinity: Affinity): number {
  const concepts = card.concepts ?? [];
  if (concepts.length === 0) return 1;
  if (concepts.some((c) => signals.mutedConcepts.includes(c))) return MUTED_CONCEPT_FACTOR;
  const followed = concepts.some((c) => signals.followedConcepts.includes(c)) ? FOLLOWED_CONCEPT_FACTOR : 1;
  const mean =
    concepts.reduce((sum, c) => sum + affinityMultiplier((affinity.concept[c] ?? 0) * CONCEPT_AFFINITY_SCALE), 0) /
    concepts.length;
  return followed * mean;
}
