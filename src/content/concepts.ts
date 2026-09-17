import seed from './seed/concepts.json';
import type { Concept } from './types';

interface ConceptSeed {
  concepts: Concept[];
  cards: Record<string, string[]>;
}

const data = seed as ConceptSeed;

export const CONCEPTS: ReadonlyMap<string, Concept> = new Map(data.concepts.map((c) => [c.id, c]));

/** Card id → concept ids. */
export const CARD_CONCEPTS: Readonly<Record<string, readonly string[]>> = data.cards;
