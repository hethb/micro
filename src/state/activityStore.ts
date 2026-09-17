import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Card, Format, TopicId } from '@/content/types';
import type { EngagementSignal, FeedSignals, SignalType } from '@/feed/types';

import { persistStorage } from './storage';

const MAX_EVENTS = 500;
const MAX_SEEN = 400;
const MAX_VIEWS = 1000;
/** A learning card counts as "learned" once it held attention this long. */
export const LEARNED_DWELL_MS = 2500;

interface StoredSignal extends EngagementSignal {
  cardId: string;
  at: number;
}

export interface View {
  id: string;
  learning: boolean;
  dwellMs: number;
  at: number;
}

export type ConceptPreference = 'more' | 'less' | null;

export interface Save {
  cardId: string;
  at: number;
}

/** The user's activity as saved to their account. */
export interface ActivityData {
  events: StoredSignal[];
  likedIds: string[];
  saves: Save[];
  hiddenTopics: TopicId[];
  hiddenFormats: Format[];
  followedConcepts: string[];
  mutedConcepts: string[];
  seenIds: string[];
  views: View[];
}

interface ActivityState extends ActivityData {
  record(card: Card, type: SignalType): void;
  toggleLike(card: Card): boolean;
  toggleSave(card: Card): boolean;
  hideTopic(topic: TopicId): void;
  hideFormat(format: Format): void;
  unhideTopic(topic: TopicId): void;
  unhideFormat(format: Format): void;
  /** 'more' follows a concept, 'less' mutes it, null clears either. */
  setConceptPreference(conceptId: string, preference: ConceptPreference): void;
  logView(view: View): void;
  reset(): void;
  /** Replaces all activity, e.g. with the signed-in account's saved copy. */
  load(data: ActivityData): void;
}

const signal = (card: Card, type: SignalType): StoredSignal => ({
  type,
  topic: card.topic,
  format: card.format,
  cardId: card.id,
  at: Date.now(),
});

const capped = <T,>(list: T[], max: number) => (list.length > max ? list.slice(-max) : list);

const addUnique = <T,>(list: T[], value: T) => (list.includes(value) ? list : [...list, value]);
const without = <T,>(list: T[], value: T) => list.filter((v) => v !== value);

export const EMPTY_ACTIVITY: ActivityData = {
  events: [],
  likedIds: [],
  saves: [],
  hiddenTopics: [],
  hiddenFormats: [],
  followedConcepts: [],
  mutedConcepts: [],
  seenIds: [],
  views: [],
};

export const useActivity = create<ActivityState>()(
  persist(
    (set, get) => ({
      ...EMPTY_ACTIVITY,
      record: (card, type) => set((s) => ({ events: capped([...s.events, signal(card, type)], MAX_EVENTS) })),
      toggleLike: (card) => {
        const liked = !get().likedIds.includes(card.id);
        set((s) =>
          liked
            ? {
                likedIds: [...s.likedIds, card.id],
                events: capped([...s.events, signal(card, 'like')], MAX_EVENTS),
              }
            : {
                likedIds: s.likedIds.filter((id) => id !== card.id),
                events: s.events.filter((e) => !(e.cardId === card.id && e.type === 'like')),
              },
        );
        return liked;
      },
      toggleSave: (card) => {
        const saved = !get().saves.some((x) => x.cardId === card.id);
        set((s) =>
          saved
            ? {
                saves: [...s.saves, { cardId: card.id, at: Date.now() }],
                events: capped([...s.events, signal(card, 'save')], MAX_EVENTS),
              }
            : {
                saves: s.saves.filter((x) => x.cardId !== card.id),
                events: s.events.filter((e) => !(e.cardId === card.id && e.type === 'save')),
              },
        );
        return saved;
      },
      hideTopic: (topic) =>
        set((s) => (s.hiddenTopics.includes(topic) ? s : { hiddenTopics: [...s.hiddenTopics, topic] })),
      hideFormat: (format) =>
        set((s) => (s.hiddenFormats.includes(format) ? s : { hiddenFormats: [...s.hiddenFormats, format] })),
      unhideTopic: (topic) => set((s) => ({ hiddenTopics: s.hiddenTopics.filter((t) => t !== topic) })),
      unhideFormat: (format) => set((s) => ({ hiddenFormats: s.hiddenFormats.filter((f) => f !== format) })),
      setConceptPreference: (id, preference) =>
        set((s) => ({
          followedConcepts: preference === 'more' ? addUnique(s.followedConcepts, id) : without(s.followedConcepts, id),
          mutedConcepts: preference === 'less' ? addUnique(s.mutedConcepts, id) : without(s.mutedConcepts, id),
        })),
      logView: (view) =>
        set((s) => ({
          views: capped([...s.views, view], MAX_VIEWS),
          seenIds: s.seenIds.includes(view.id) ? s.seenIds : capped([...s.seenIds, view.id], MAX_SEEN),
        })),
      reset: () => set(EMPTY_ACTIVITY),
      load: (data) => set({ ...EMPTY_ACTIVITY, ...data }),
    }),
    { name: 'micro.activity', storage: persistStorage },
  ),
);

export function selectActivityData(s: ActivityState): ActivityData {
  return {
    events: s.events,
    likedIds: s.likedIds,
    saves: s.saves,
    hiddenTopics: s.hiddenTopics,
    hiddenFormats: s.hiddenFormats,
    followedConcepts: s.followedConcepts,
    mutedConcepts: s.mutedConcepts,
    seenIds: s.seenIds,
    views: s.views,
  };
}

export function selectSignals(s: ActivityState): FeedSignals {
  return {
    events: s.events,
    hiddenTopics: s.hiddenTopics,
    hiddenFormats: s.hiddenFormats,
    followedConcepts: s.followedConcepts,
    mutedConcepts: s.mutedConcepts,
  };
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todayStats(views: readonly View[]) {
  const since = startOfToday();
  const today = views.filter((v) => v.at >= since);
  return {
    learned: today.filter((v) => v.learning && v.dwellMs >= LEARNED_DWELL_MS).length,
    minutes: Math.round(today.reduce((sum, v) => sum + v.dwellMs, 0) / 60000),
  };
}
