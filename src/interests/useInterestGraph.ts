import { useMemo } from 'react';

import { ALL_CARDS } from '@/content';
import { CONCEPTS } from '@/content/concepts';
import { useActivity } from '@/state/activityStore';
import { usePrefs } from '@/state/prefsStore';

import { buildInterestGraph } from './graph';

export function useInterestGraph() {
  const topics = usePrefs((s) => s.topics);
  const events = useActivity((s) => s.events);
  const followed = useActivity((s) => s.followedConcepts);
  const muted = useActivity((s) => s.mutedConcepts);

  return useMemo(
    () => buildInterestGraph({ topics, events, followed, muted, cards: ALL_CARDS, concepts: CONCEPTS }),
    [topics, events, followed, muted],
  );
}
