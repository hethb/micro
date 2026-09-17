import type { Card, Format, TopicId } from '@/content/types';
import type { EntertainmentItem, Vibe } from '@/entertainment/types';

export const BREAK_OPTIONS = [0, 3, 5, 8, 10] as const;
/** How many cards per entertainment break. 0 = breaks off. */
export type BreakEvery = (typeof BREAK_OPTIONS)[number];

export interface FeedPrefs {
  topics: readonly TopicId[];
  /** -1 = mostly videos … 1 = mostly quick reads. */
  formatBias: number;
  /** -1 = light & fun … 1 = deep & serious. */
  depthBias: number;
  breakEvery: BreakEvery;
  vibes: readonly Vibe[];
}

export type SignalType = 'like' | 'save' | 'share' | 'comment' | 'complete' | 'skip';

export interface EngagementSignal {
  type: SignalType;
  topic: TopicId;
  format: Format;
  /** Lets engagement flow through to the card's concepts. */
  cardId?: string;
}

export interface FeedSignals {
  events: readonly EngagementSignal[];
  hiddenTopics: readonly TopicId[];
  hiddenFormats: readonly Format[];
  /** Concepts the user asked for more of on the mind map. */
  followedConcepts: readonly string[];
  /** Concepts the user asked for less of on the mind map. */
  mutedConcepts: readonly string[];
}

export type FeedItem =
  | { key: string; kind: 'card'; card: Card }
  | { key: string; kind: 'break'; item: EntertainmentItem };

/** Where the feed left off, so block rules hold across batches. */
export interface FeedCursor {
  position: number;
  blockIndex: number;
  slotInBlock: number;
  lastFormat: Format | null;
  videosInBlock: number;
  quotesInBlock: number;
  lastBookBlock: number | null;
}

export const INITIAL_CURSOR: FeedCursor = {
  position: 0,
  blockIndex: 0,
  slotInBlock: 0,
  lastFormat: null,
  videosInBlock: 0,
  quotesInBlock: 0,
  lastBookBlock: null,
};
