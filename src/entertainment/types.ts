export const VIBES = [
  'comedy',
  'animals',
  'satisfying',
  'sports',
  'food',
  'lifehacks',
  'science',
] as const;
export type Vibe = (typeof VIBES)[number];

export const VIBE_LABELS: Record<Vibe, string> = {
  comedy: '😂 Comedy',
  animals: '🐶 Animals',
  satisfying: '🌀 Satisfying',
  sports: '🏀 Sports',
  food: '🍜 Food',
  lifehacks: '💡 Life hacks',
  science: '🧪 Cool science',
};

export interface EntertainmentItem {
  id: string;
  provider: 'youtube-shorts';
  videoId: string;
  title: string;
  channel: string;
  vibe: Vibe;
}

export interface EntertainmentRequest {
  vibes: readonly Vibe[];
  excludeIds: ReadonlySet<string>;
  rng: () => number;
}

/**
 * Source of the "break" slot. Swappable so licensed clips or another platform
 * can replace YouTube Shorts without touching the feed engine.
 */
export interface EntertainmentProvider {
  id: string;
  next(request: EntertainmentRequest): EntertainmentItem | null;
  /** Called when an item can't be played (embedding disabled, removed, ...). */
  reportFailure?(id: string): void;
}
