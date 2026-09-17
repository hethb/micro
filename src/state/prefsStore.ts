import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TopicId } from '@/content/types';
import type { Vibe } from '@/entertainment/types';
import type { BreakEvery, FeedPrefs } from '@/feed/types';

import { persistStorage } from './storage';

export const DAILY_GOALS = [0, 5, 15, 30] as const;
export type DailyGoal = (typeof DAILY_GOALS)[number];

export const MIN_TOPICS = 3;

/** The user's preferences as saved to their account. */
export interface PrefsData extends FeedPrefs {
  dailyGoalMin: DailyGoal;
  onboarded: boolean;
}

export const PREFS_DEFAULTS: PrefsData = {
  topics: [],
  formatBias: 0,
  depthBias: 0,
  breakEvery: 5,
  vibes: [],
  dailyGoalMin: 15,
  onboarded: false,
};

interface PrefsState extends PrefsData {
  /** Bumped whenever a feed-affecting preference changes, so the feed can rebuild. */
  version: number;
  toggleTopic(topic: TopicId): void;
  setFormatBias(value: number): void;
  setDepthBias(value: number): void;
  setBreakEvery(value: BreakEvery): void;
  toggleVibe(vibe: Vibe): void;
  setDailyGoal(value: DailyGoal): void;
  completeOnboarding(): void;
  restartOnboarding(): void;
  /** Replaces every preference, e.g. with the signed-in account's saved copy. */
  load(data: PrefsData): void;
}

const toggle = <T,>(list: readonly T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      ...PREFS_DEFAULTS,
      version: 0,
      toggleTopic: (topic) => set((s) => ({ topics: toggle(s.topics, topic), version: s.version + 1 })),
      setFormatBias: (formatBias) => set((s) => ({ formatBias, version: s.version + 1 })),
      setDepthBias: (depthBias) => set((s) => ({ depthBias, version: s.version + 1 })),
      setBreakEvery: (breakEvery) => set((s) => ({ breakEvery, version: s.version + 1 })),
      toggleVibe: (vibe) => set((s) => ({ vibes: toggle(s.vibes, vibe), version: s.version + 1 })),
      setDailyGoal: (dailyGoalMin) => set({ dailyGoalMin }),
      completeOnboarding: () => set({ onboarded: true }),
      restartOnboarding: () => set({ onboarded: false }),
      load: (data) => set((s) => ({ ...PREFS_DEFAULTS, ...data, version: s.version + 1 })),
    }),
    { name: 'micro.prefs', storage: persistStorage },
  ),
);

export function selectPrefsData(s: PrefsState): PrefsData {
  return { ...selectFeedPrefs(s), dailyGoalMin: s.dailyGoalMin, onboarded: s.onboarded };
}

export function selectFeedPrefs(s: PrefsState): FeedPrefs {
  return {
    topics: s.topics,
    formatBias: s.formatBias,
    depthBias: s.depthBias,
    breakEvery: s.breakEvery,
    vibes: s.vibes,
  };
}
