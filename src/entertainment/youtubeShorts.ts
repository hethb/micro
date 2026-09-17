import shorts from './seed/shorts.json';
import type { EntertainmentItem, EntertainmentProvider, Vibe } from './types';

interface ShortSeed {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  vibe: Vibe;
}

export function createShortsProvider(seed: readonly ShortSeed[]): EntertainmentProvider {
  const items: EntertainmentItem[] = seed.map((s) => ({ ...s, provider: 'youtube-shorts' }));
  const failed = new Set<string>();

  return {
    id: 'youtube-shorts',
    next({ vibes, excludeIds, rng }) {
      const usable = items.filter((item) => !failed.has(item.id));
      if (usable.length === 0) return null;
      const matching = vibes.length ? usable.filter((i) => vibes.includes(i.vibe)) : usable;
      const pool = matching.length ? matching : usable;
      const fresh = pool.filter((i) => !excludeIds.has(i.id));
      const candidates = fresh.length ? fresh : pool;
      return candidates[Math.floor(rng() * candidates.length)];
    },
    reportFailure(id) {
      failed.add(id);
    },
  };
}

export const shortsProvider = createShortsProvider(shorts as ShortSeed[]);
