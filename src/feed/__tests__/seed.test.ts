import { ALL_CARDS } from '@/content';
import { CONCEPTS } from '@/content/concepts';
import { FORMATS, TOPIC_IDS } from '@/content/types';
import shorts from '@/entertainment/seed/shorts.json';
import { VIBES } from '@/entertainment/types';
import { createShortsProvider } from '@/entertainment/youtubeShorts';

import { buildNextBatch } from '../engine';
import { createRng } from '../rng';
import { INITIAL_CURSOR } from '../types';

describe('seed content', () => {
  it('has unique ids and valid topics/depths', () => {
    const ids = ALL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const card of ALL_CARDS) {
      expect(TOPIC_IDS).toContain(card.topic);
      expect(['light', 'deep']).toContain(card.depth);
    }
  });

  it('covers every format and topic', () => {
    for (const format of FORMATS) {
      for (const topic of TOPIC_IDS) {
        const count = ALL_CARDS.filter((c) => c.format === format && c.topic === topic).length;
        // Books are sparser; every other format should exist for every topic.
        if (format !== 'book') expect(count).toBeGreaterThan(0);
      }
    }
  });

  it('keeps videos to 60 seconds and books to 3–5 slides', () => {
    for (const card of ALL_CARDS) {
      if (card.format === 'video') {
        expect(card.durationSec).toBeGreaterThan(0);
        expect(card.durationSec).toBeLessThanOrEqual(60);
        expect(card.youtubeId).toMatch(/^[\w-]{11}$/);
        expect(card.channel.trim()).not.toBe('');
      }
      if (card.format === 'book') {
        expect(card.slides.length).toBeGreaterThanOrEqual(3);
        expect(card.slides.length).toBeLessThanOrEqual(5);
      }
      if (card.format === 'fact') expect(card.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('tags every card with 2–3 known concepts and keeps the concept graph consistent', () => {
    const used = new Set<string>();
    for (const card of ALL_CARDS) {
      expect(card.concepts?.length).toBeGreaterThanOrEqual(2);
      expect(card.concepts?.length).toBeLessThanOrEqual(3);
      for (const id of card.concepts ?? []) {
        expect(CONCEPTS.has(id)).toBe(true);
        used.add(id);
      }
    }
    for (const concept of CONCEPTS.values()) {
      expect(concept.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(TOPIC_IDS).toContain(concept.topic);
      expect(used.has(concept.id)).toBe(true);
      for (const related of concept.related) {
        expect(related).not.toBe(concept.id);
        expect(CONCEPTS.has(related)).toBe(true);
      }
    }
  });

  it('has well-formed Shorts for every vibe', () => {
    for (const s of shorts) {
      expect(s.videoId).toMatch(/^[\w-]{11}$/);
      expect(VIBES).toContain(s.vibe);
    }
    for (const vibe of VIBES) expect(shorts.some((s) => s.vibe === vibe)).toBe(true);
  });

  it('builds a valid 5-block feed from the real catalog', () => {
    const { items } = buildNextBatch({
      cards: ALL_CARDS,
      prefs: { topics: ['space', 'money', 'psychology'], formatBias: 0, depthBias: 0, breakEvery: 5, vibes: ['animals'] },
      signals: { events: [], hiddenTopics: [], hiddenFormats: [], followedConcepts: [], mutedConcepts: [] },
      excludeIds: new Set(),
      cursor: INITIAL_CURSOR,
      rng: createRng(11),
      entertainment: createShortsProvider(shorts as Parameters<typeof createShortsProvider>[0]),
      batchSize: 100,
    });
    expect(items).toHaveLength(100);
    items.forEach((item, i) => expect(item.kind).toBe((i + 1) % 5 === 0 ? 'break' : 'card'));
  });
});
