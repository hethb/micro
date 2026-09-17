import { useCallback, useMemo, useRef, useState } from 'react';

import { ALL_CARDS } from '@/content';
import { CONCEPTS } from '@/content/concepts';
import { shortsProvider } from '@/entertainment/youtubeShorts';
import { buildNextBatch } from '@/feed/engine';
import { createRng } from '@/feed/rng';
import { INITIAL_CURSOR, type FeedCursor, type FeedItem } from '@/feed/types';
import { selectSignals, useActivity } from '@/state/activityStore';
import { selectFeedPrefs, usePrefs } from '@/state/prefsStore';

/** New shuffle each app launch. */
const SESSION_SEED = Date.now() >>> 0;

const itemId = (item: FeedItem) => (item.kind === 'card' ? item.card.id : item.item.id);

/**
 * Owns the in-memory feed: generates batches lazily and can rebuild everything
 * after a given index (when preferences change or the user hides something)
 * without breaking the every-Nth break pattern.
 */
export function useFeed() {
  const rng = useMemo(() => createRng(SESSION_SEED), []);
  const [items, setItems] = useState<FeedItem[]>([]);
  // Refs are the source of truth so generation never runs inside a state updater.
  const itemsRef = useRef<FeedItem[]>([]);
  const cursorsRef = useRef<FeedCursor[]>([]);

  const commit = useCallback((nextItems: FeedItem[], nextCursors: FeedCursor[]) => {
    itemsRef.current = nextItems;
    cursorsRef.current = nextCursors;
    setItems(nextItems);
  }, []);

  const extend = useCallback(
    (baseItems: FeedItem[], baseCursors: FeedCursor[]) => {
      const activity = useActivity.getState();
      const result = buildNextBatch({
        cards: ALL_CARDS,
        prefs: selectFeedPrefs(usePrefs.getState()),
        signals: selectSignals(activity),
        excludeIds: new Set([...activity.seenIds, ...baseItems.map(itemId)]),
        cursor: baseCursors.at(-1) ?? INITIAL_CURSOR,
        rng,
        entertainment: shortsProvider,
        concepts: CONCEPTS,
      });
      commit([...baseItems, ...result.items], [...baseCursors, ...result.cursors]);
    },
    [commit, rng],
  );

  const loadMore = useCallback(() => {
    extend(itemsRef.current, cursorsRef.current);
  }, [extend]);

  /** Keeps items[0..index] and regenerates everything after it. */
  const rebuildAfter = useCallback(
    (index: number) => {
      extend(itemsRef.current.slice(0, index + 1), cursorsRef.current.slice(0, index + 1));
    },
    [extend],
  );

  /** Swaps an entertainment item that failed to play for another one (or drops it). */
  const replaceBrokenBreak = useCallback(
    (index: number) => {
      const current = itemsRef.current;
      const target = current[index];
      if (target?.kind !== 'break') return;
      shortsProvider.reportFailure?.(target.item.id);
      const replacement = shortsProvider.next({
        vibes: usePrefs.getState().vibes,
        excludeIds: new Set(current.map(itemId)),
        rng,
      });
      const nextItems = [...current];
      const nextCursors = [...cursorsRef.current];
      if (replacement) {
        nextItems[index] = { key: `${target.key}~${replacement.id}`, kind: 'break', item: replacement };
      } else {
        nextItems.splice(index, 1);
        nextCursors.splice(index, 1);
      }
      commit(nextItems, nextCursors);
    },
    [commit, rng],
  );

  return { items, loadMore, rebuildAfter, replaceBrokenBreak };
}
