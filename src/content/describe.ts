import type { Card } from './types';

const FORMAT_EMOJI = { fact: '💡', quote: '💬', book: '📚', video: '🎬' } as const;

/** Short title + detail used wherever a card is shown outside the feed. */
export function describeCard(card: Card): { emoji: string; title: string; detail: string } {
  const emoji = FORMAT_EMOJI[card.format];
  switch (card.format) {
    case 'fact':
      return { emoji, title: card.headline, detail: card.body };
    case 'quote':
      return { emoji, title: `“${card.text}”`, detail: `— ${card.author}. ${card.context}` };
    case 'book':
      return {
        emoji,
        title: `${card.title} · ${card.author}`,
        detail: [...card.slides.map((s) => `• ${s.heading}: ${s.body}`), `Try this: ${card.takeaway}`].join('\n\n'),
      };
    case 'video':
      return { emoji, title: card.title, detail: card.caption };
  }
}
