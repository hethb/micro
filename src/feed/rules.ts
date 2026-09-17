import type { Format } from '@/content/types';

import type { FeedCursor } from './types';

/** Learning slots per block when entertainment breaks are off. */
export const VIRTUAL_BLOCK_SIZE = 4;

export function learningSlotsPerBlock(breakEvery: number): number {
  return breakEvery > 0 ? breakEvery - 1 : VIRTUAL_BLOCK_SIZE;
}

interface Rule {
  name: string;
  allows(format: Format, cursor: FeedCursor, learningSlots: number): boolean;
}

/**
 * Ordered from most to least expendable: when no format satisfies every rule,
 * the engine drops rules from the front of this list until something fits.
 */
export const RULES: readonly Rule[] = [
  {
    name: 'book-spacing',
    allows: (format, cursor) =>
      format !== 'book' || cursor.lastBookBlock === null || cursor.blockIndex - cursor.lastBookBlock >= 2,
  },
  {
    name: 'one-quote-per-block',
    allows: (format, cursor) => format !== 'quote' || cursor.quotesInBlock < 1,
  },
  {
    name: 'no-repeat-format',
    allows: (format, cursor) => format !== cursor.lastFormat,
  },
  {
    name: 'video-per-block',
    allows: (format, cursor, learningSlots) => {
      const isLastLearningSlot = cursor.slotInBlock === learningSlots - 1;
      return !isLastLearningSlot || cursor.videosInBlock > 0 || format === 'video';
    },
  },
];

export function allowedFormats(
  formats: readonly Format[],
  cursor: FeedCursor,
  learningSlots: number,
): Format[] {
  for (let dropped = 0; dropped <= RULES.length; dropped++) {
    const active = RULES.slice(dropped);
    const allowed = formats.filter((f) => active.every((rule) => rule.allows(f, cursor, learningSlots)));
    if (allowed.length > 0) return allowed;
  }
  return [];
}
