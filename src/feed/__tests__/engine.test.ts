import { FORMATS, TOPIC_IDS, type Card, type Format, type TopicId } from '@/content/types';
import type { EntertainmentProvider } from '@/entertainment/types';

import { buildNextBatch } from '../engine';
import { computeAffinity } from '../scoring';
import { createRng } from '../rng';
import { INITIAL_CURSOR, type FeedItem, type FeedPrefs, type FeedSignals } from '../types';

function makeCard(format: Format, topic: TopicId, n: number): Card {
  const base = {
    id: `${format}-${topic}-${n}`,
    topic,
    depth: n % 3 === 0 ? 'deep' : 'light',
    // Half of each topic's cards share a concept, so concept tuning can be measured within a topic.
    concepts: n % 2 === 0 ? [`${topic}-even`, 'shared'] : [`${topic}-odd`, 'shared'],
  } as const;
  switch (format) {
    case 'fact':
      return { ...base, format, headline: 'h', body: 'b', emoji: '✨', sourceLabel: 's', sourceUrl: 'u' };
    case 'quote':
      return { ...base, format, text: 't', author: 'a', context: 'c' };
    case 'book':
      return { ...base, format, title: 't', author: 'a', hook: 'h', slides: [], takeaway: 't' };
    case 'video':
      return { ...base, format, title: 't', caption: 'c', youtubeId: 'abcdefghijk', channel: 'c', durationSec: 30 };
  }
}

const CARDS: Card[] = FORMATS.flatMap((format) =>
  TOPIC_IDS.flatMap((topic) => Array.from({ length: 6 }, (_, n) => makeCard(format, topic, n))),
);

function fakeProvider(): EntertainmentProvider {
  let n = 0;
  return {
    id: 'fake',
    next: () => {
      const id = `ent-${n++}`;
      return { id, provider: 'youtube-shorts', videoId: id, title: 't', channel: 'c', vibe: 'comedy' };
    },
  };
}

const PREFS: FeedPrefs = {
  topics: ['space', 'science', 'history'],
  formatBias: 0,
  depthBias: 0,
  breakEvery: 5,
  vibes: [],
};
const NO_SIGNALS: FeedSignals = { events: [], hiddenTopics: [], hiddenFormats: [], followedConcepts: [], mutedConcepts: [] };

function simulate(total: number, prefs = PREFS, signals = NO_SIGNALS, seed = 42, batchSize = 10) {
  const rng = createRng(seed);
  const shown = new Set<string>();
  let cursor = INITIAL_CURSOR;
  const items: FeedItem[] = [];
  const entertainment = fakeProvider();
  while (items.length < total) {
    const result = buildNextBatch({
      cards: CARDS,
      prefs,
      signals,
      excludeIds: shown,
      cursor,
      rng,
      entertainment,
      batchSize,
    });
    for (const item of result.items) shown.add(item.kind === 'card' ? item.card.id : item.item.id);
    items.push(...result.items);
    cursor = result.cursor;
  }
  return items.slice(0, total);
}

const learningFormats = (items: FeedItem[]) =>
  items.flatMap((i) => (i.kind === 'card' ? [i.card.format] : []));

describe('buildNextBatch', () => {
  it('places an entertainment break at exactly every 5th slot, across batch boundaries', () => {
    // Batch size 7 deliberately misaligns batches and blocks.
    const items = simulate(200, PREFS, NO_SIGNALS, 1, 7);
    items.forEach((item, i) => {
      expect(item.kind).toBe((i + 1) % 5 === 0 ? 'break' : 'card');
    });
  });

  it.each([3, 8, 10] as const)('respects a custom break frequency of %i', (breakEvery) => {
    const items = simulate(120, { ...PREFS, breakEvery });
    items.forEach((item, i) => {
      expect(item.kind).toBe((i + 1) % breakEvery === 0 ? 'break' : 'card');
    });
  });

  it('never emits breaks when they are turned off', () => {
    const items = simulate(100, { ...PREFS, breakEvery: 0 });
    expect(items.every((i) => i.kind === 'card')).toBe(true);
  });

  it('never shows the same format twice in a row', () => {
    const formats = learningFormats(simulate(1000));
    for (let i = 1; i < formats.length; i++) expect(formats[i]).not.toBe(formats[i - 1]);
  });

  it('includes at least one video and at most one quote in every block', () => {
    const items = simulate(1000);
    for (let start = 0; start < items.length; start += 5) {
      const block = learningFormats(items.slice(start, start + 4));
      expect(block).toContain('video');
      expect(block.filter((f) => f === 'quote').length).toBeLessThanOrEqual(1);
    }
  });

  it('shows book summaries at most once every two blocks', () => {
    const items = simulate(1000);
    let lastBookBlock = -Infinity;
    items.forEach((item, i) => {
      if (item.kind === 'card' && item.card.format === 'book') {
        const block = Math.floor(i / 5);
        expect(block - lastBookBlock).toBeGreaterThanOrEqual(2);
        lastBookBlock = block;
      }
    });
  });

  it('does not repeat a card until its format pool is exhausted', () => {
    const cards = simulate(60).flatMap((i) => (i.kind === 'card' ? [i.card.id] : []));
    expect(new Set(cards).size).toBe(cards.length);
  });

  it('lets preferred topics dominate', () => {
    const cards = simulate(1000).flatMap((i) => (i.kind === 'card' ? [i.card] : []));
    const preferred = cards.filter((c) => PREFS.topics.includes(c.topic)).length;
    expect(preferred / cards.length).toBeGreaterThan(0.6);
  });

  it('makes hidden topics rare', () => {
    const count = (signals: FeedSignals) =>
      simulate(1000, PREFS, signals).filter((i) => i.kind === 'card' && i.card.topic === 'space')
        .length;
    const before = count(NO_SIGNALS);
    const after = count({ ...NO_SIGNALS, hiddenTopics: ['space'] });
    expect(after).toBeLessThan(before * 0.6);
  });

  it('shifts the format mix toward videos or reads with the slider', () => {
    const videoShare = (formatBias: number) => {
      const formats = learningFormats(simulate(1000, { ...PREFS, formatBias }));
      return formats.filter((f) => f === 'video').length / formats.length;
    };
    expect(videoShare(-1)).toBeGreaterThan(videoShare(1));
  });

  it('boosts topics the user engages with', () => {
    const history = (signals: FeedSignals) =>
      simulate(1000, { ...PREFS, topics: [] }, signals).filter(
        (i) => i.kind === 'card' && i.card.topic === 'money',
      ).length;
    const saves = Array.from({ length: 10 }, () => ({
      type: 'save' as const,
      topic: 'money' as const,
      format: 'fact' as const,
    }));
    expect(history({ ...NO_SIGNALS, events: saves })).toBeGreaterThan(history(NO_SIGNALS));
  });

  it('shows more of followed concepts and less of muted ones', () => {
    const evenShare = (signals: FeedSignals) => {
      const cards = simulate(1000, PREFS, signals).flatMap((i) =>
        i.kind === 'card' && i.card.topic === 'space' ? [i.card] : [],
      );
      return cards.filter((c) => c.concepts?.includes('space-even')).length / cards.length;
    };
    const baseline = evenShare(NO_SIGNALS);
    expect(evenShare({ ...NO_SIGNALS, followedConcepts: ['space-even'] })).toBeGreaterThan(baseline + 0.1);
    expect(evenShare({ ...NO_SIGNALS, mutedConcepts: ['space-even'] })).toBeLessThan(baseline - 0.1);
  });

  it('spills concept engagement over to related concepts', () => {
    const concepts = new Map([
      ['black-holes', { id: 'black-holes', label: 'Black holes', topic: 'space' as const, related: ['relativity'] }],
      ['relativity', { id: 'relativity', label: 'Relativity', topic: 'science' as const, related: [] }],
    ]);
    const events = [{ type: 'save' as const, topic: 'space' as const, format: 'fact' as const, cardId: 'c1' }];
    const conceptsOf = (id: string) => (id === 'c1' ? ['black-holes'] : undefined);

    const direct = computeAffinity(events, { conceptsOf }).concept;
    expect(direct).toEqual({ 'black-holes': 0.3 });

    const withSpillover = computeAffinity(events, { conceptsOf, concepts }).concept;
    expect(withSpillover['black-holes']).toBeCloseTo(0.3);
    expect(withSpillover.relativity).toBeGreaterThan(0);
    expect(withSpillover.relativity).toBeLessThan(0.3);
  });

  it('is deterministic for a given seed', () => {
    const keys = (seed: number) => simulate(100, PREFS, NO_SIGNALS, seed).map((i) => i.key);
    expect(keys(7)).toEqual(keys(7));
    expect(keys(7)).not.toEqual(keys(8));
  });

  it('can resume from any per-item cursor with the same rules', () => {
    const first = buildNextBatch({
      cards: CARDS,
      prefs: PREFS,
      signals: NO_SIGNALS,
      excludeIds: new Set(),
      cursor: INITIAL_CURSOR,
      rng: createRng(5),
      entertainment: fakeProvider(),
      batchSize: 13,
    });
    expect(first.cursors).toHaveLength(first.items.length);
    expect(first.cursors.at(-1)).toEqual(first.cursor);
    // Rebuild everything after item 6 (a mid-block point) and check the break still lands on slot 10.
    const resumed = buildNextBatch({
      cards: CARDS,
      prefs: PREFS,
      signals: NO_SIGNALS,
      excludeIds: new Set(),
      cursor: first.cursors[6],
      rng: createRng(99),
      entertainment: fakeProvider(),
      batchSize: 10,
    });
    const combined = [...first.items.slice(0, 7), ...resumed.items];
    combined.forEach((item, i) => expect(item.kind).toBe((i + 1) % 5 === 0 ? 'break' : 'card'));
  });

  it('skips the break slot but keeps the feed going when no entertainment is available', () => {
    const result = buildNextBatch({
      cards: CARDS,
      prefs: PREFS,
      signals: NO_SIGNALS,
      excludeIds: new Set(),
      cursor: INITIAL_CURSOR,
      rng: createRng(4),
      entertainment: { id: 'empty', next: () => null },
      batchSize: 20,
    });
    expect(result.items).toHaveLength(20);
    expect(result.items.every((i) => i.kind === 'card')).toBe(true);
  });

  it('keeps producing items when a format catalog is tiny', () => {
    const cards = CARDS.filter((c) => c.format !== 'video' || c.topic === 'space');
    const result = buildNextBatch({
      cards,
      prefs: PREFS,
      signals: NO_SIGNALS,
      excludeIds: new Set(),
      cursor: INITIAL_CURSOR,
      rng: createRng(3),
      entertainment: fakeProvider(),
      batchSize: 200,
    });
    expect(result.items).toHaveLength(200);
  });
});
