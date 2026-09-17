import books from './seed/books.json';
import facts from './seed/facts.json';
import quotes from './seed/quotes.json';
import videos from './seed/videos.json';
import { CARD_CONCEPTS } from './concepts';
import type { Card } from './types';

export const ALL_CARDS: readonly Card[] = [
  ...(videos as Card[]),
  ...(facts as Card[]),
  ...(books as Card[]),
  ...(quotes as Card[]),
].map((card) => ({ ...card, concepts: CARD_CONCEPTS[card.id] ?? [] }));

const byId = new Map(ALL_CARDS.map((card) => [card.id, card]));

export function getCard(id: string): Card | undefined {
  return byId.get(id);
}
