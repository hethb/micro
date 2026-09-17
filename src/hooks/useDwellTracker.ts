import { useEffect, useRef } from 'react';

import type { FeedItem } from '@/feed/types';
import { useActivity } from '@/state/activityStore';

/** Below this, moving on counts as a skip signal. */
export const SKIP_THRESHOLD_MS = 1500;
/** Text cards count as "completed" after this long on screen. */
const TEXT_COMPLETE_MS = 6000;

/**
 * Records how long each item held attention when the user moves away from it
 * (or leaves the feed), and turns that into skip/complete signals.
 */
export function useDwellTracker(item: FeedItem | undefined, focused: boolean) {
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!item || !focused) return;
    startedAt.current = Date.now();

    return () => {
      const started = startedAt.current;
      startedAt.current = null;
      if (started === null) return;
      const dwellMs = Date.now() - started;
      const activity = useActivity.getState();

      if (item.kind === 'break') {
        activity.logView({ id: item.item.id, learning: false, dwellMs, at: started });
        return;
      }

      const { card } = item;
      activity.logView({ id: card.id, learning: true, dwellMs, at: started });
      if (dwellMs < SKIP_THRESHOLD_MS) {
        activity.record(card, 'skip');
      } else if ((card.format === 'fact' || card.format === 'quote') && dwellMs >= TEXT_COMPLETE_MS) {
        activity.record(card, 'complete');
      }
    };
  }, [item, focused]);
}
