import { FORMATS, type Card, type Concept, type Format } from '@/content/types';
import type { EntertainmentProvider } from '@/entertainment/types';

import { allowedFormats, learningSlotsPerBlock } from './rules';
import { cardWeight, computeAffinity, formatWeight, type Affinity } from './scoring';
import { weightedIndex } from './rng';
import type { FeedCursor, FeedItem, FeedPrefs, FeedSignals } from './types';

export const DEFAULT_BATCH_SIZE = 10;
/** Format weight multiplier once every card of that format has been shown. */
const EXHAUSTED_FORMAT_FACTOR = 0.1;

export interface BuildBatchInput {
  cards: readonly Card[];
  prefs: FeedPrefs;
  signals: FeedSignals;
  /** Ids already shown (cards and entertainment); avoided until a pool runs dry. */
  excludeIds: ReadonlySet<string>;
  cursor: FeedCursor;
  rng: () => number;
  entertainment?: EntertainmentProvider;
  /** Concept graph; lets engagement spill over to related concepts. */
  concepts?: ReadonlyMap<string, Concept>;
  batchSize?: number;
}

export interface BuildBatchResult {
  items: FeedItem[];
  /** cursors[i] is the cursor right after items[i], so the feed can be rebuilt from any point. */
  cursors: FeedCursor[];
  cursor: FeedCursor;
}

export function buildNextBatch(input: BuildBatchInput): BuildBatchResult {
  const { cards, prefs, signals, rng, entertainment } = input;
  const batchSize = input.batchSize ?? DEFAULT_BATCH_SIZE;
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const affinity = computeAffinity(signals.events, {
    conceptsOf: (id) => cardsById.get(id)?.concepts,
    concepts: input.concepts,
  });
  const shown = new Set(input.excludeIds);
  const byFormat = groupByFormat(cards);
  const learningSlots = learningSlotsPerBlock(prefs.breakEvery);
  const items: FeedItem[] = [];
  const cursors: FeedCursor[] = [];
  let cursor = { ...input.cursor };

  while (items.length < batchSize) {
    const isBreakSlot = prefs.breakEvery > 0 && cursor.slotInBlock >= learningSlots;
    if (isBreakSlot) {
      const item = entertainment?.next({ vibes: prefs.vibes, excludeIds: shown, rng });
      if (item) {
        items.push({ key: `${cursor.position}:${item.id}`, kind: 'break', item });
        shown.add(item.id);
        cursor = startNextBlock({ ...cursor, position: cursor.position + 1 });
        cursors.push(cursor);
      } else {
        cursor = startNextBlock(cursor);
      }
      continue;
    }

    const card = pickCard(byFormat, cursor, learningSlots, prefs, signals, affinity, shown, rng);
    if (!card) break; // empty catalog
    items.push({ key: `${cursor.position}:${card.id}`, kind: 'card', card });
    shown.add(card.id);
    cursor = advanceLearning(cursor, card.format);
    if (prefs.breakEvery === 0 && cursor.slotInBlock >= learningSlots) cursor = startNextBlock(cursor);
    cursors.push(cursor);
  }

  return { items, cursors, cursor };
}

function pickCard(
  byFormat: Map<Format, Card[]>,
  cursor: FeedCursor,
  learningSlots: number,
  prefs: FeedPrefs,
  signals: FeedSignals,
  affinity: Affinity,
  shown: ReadonlySet<string>,
  rng: () => number,
): Card | null {
  const available = FORMATS.filter((f) => (byFormat.get(f)?.length ?? 0) > 0);
  const formats = allowedFormats(available, cursor, learningSlots);
  if (formats.length === 0) return null;

  const weights = formats.map((f) => {
    const exhausted = byFormat.get(f)!.every((c) => shown.has(c.id));
    return formatWeight(f, prefs, signals, affinity) * (exhausted ? EXHAUSTED_FORMAT_FACTOR : 1);
  });
  const format = formats[Math.max(0, weightedIndex(weights, rng))];

  const pool = byFormat.get(format)!;
  const fresh = pool.filter((c) => !shown.has(c.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const index = weightedIndex(
    candidates.map((c) => cardWeight(c, prefs, signals, affinity)),
    rng,
  );
  return candidates[Math.max(0, index)];
}

function advanceLearning(cursor: FeedCursor, format: Format): FeedCursor {
  return {
    ...cursor,
    position: cursor.position + 1,
    slotInBlock: cursor.slotInBlock + 1,
    lastFormat: format,
    videosInBlock: cursor.videosInBlock + (format === 'video' ? 1 : 0),
    quotesInBlock: cursor.quotesInBlock + (format === 'quote' ? 1 : 0),
    lastBookBlock: format === 'book' ? cursor.blockIndex : cursor.lastBookBlock,
  };
}

function startNextBlock(cursor: FeedCursor): FeedCursor {
  return {
    ...cursor,
    blockIndex: cursor.blockIndex + 1,
    slotInBlock: 0,
    videosInBlock: 0,
    quotesInBlock: 0,
  };
}

function groupByFormat(cards: readonly Card[]): Map<Format, Card[]> {
  const map = new Map<Format, Card[]>();
  for (const card of cards) {
    const list = map.get(card.format);
    if (list) list.push(card);
    else map.set(card.format, [card]);
  }
  return map;
}
