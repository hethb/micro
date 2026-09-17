import { memo } from 'react';

import type { Card } from '@/content/types';
import type { FeedItem } from '@/feed/types';
import { useUi } from '@/state/uiStore';

import { BookSummaryCard } from '../cards/BookSummaryCard';
import { CardFrame } from '../cards/CardFrame';
import { FactCard } from '../cards/FactCard';
import { QuoteCard } from '../cards/QuoteCard';
import { ShortCard } from '../cards/ShortCard';
import { VideoCard } from '../cards/VideoCard';

interface CardRendererProps {
  item: FeedItem;
  index: number;
  active: boolean;
  nearby: boolean;
  height: number;
  width: number;
  topInset: number;
  onComment(card: Card): void;
  onMore(card: Card): void;
  onBreakFailed(index: number): void;
}

export const CardRenderer = memo(function CardRenderer(props: CardRendererProps) {
  const { item, index, active, nearby, height, width, topInset, onComment, onMore, onBreakFailed } = props;
  const toggleMuted = useUi((s) => s.toggleMuted);
  const view = { active, nearby, height, width };

  if (item.kind === 'break') {
    return <ShortCard {...view} item={item.item} topInset={topInset} onFailed={() => onBreakFailed(index)} />;
  }

  const { card } = item;
  return (
    <CardFrame
      card={card}
      height={height}
      topInset={topInset}
      bottomInset={0}
      onComment={onComment}
      onMore={onMore}
      onSingleTap={card.format === 'video' ? toggleMuted : undefined}>
      {card.format === 'fact' && <FactCard {...view} card={card} />}
      {card.format === 'quote' && <QuoteCard {...view} card={card} />}
      {card.format === 'book' && <BookSummaryCard {...view} card={card} />}
      {card.format === 'video' && <VideoCard {...view} card={card} />}
    </CardFrame>
  );
});
