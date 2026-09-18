import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * Browsers refuse to autoplay anything with sound until the viewer interacts with the page,
 * so the web feed starts muted and the first gesture anywhere turns sound on for the session.
 * Native apps have no such rule and start with sound.
 */
const STARTS_MUTED = Platform.OS === 'web';

/** A tap that already turned sound on shouldn't also be read as "mute". */
const UNLOCK_GRACE_MS = 400;

/** Playback speed while the viewer holds the side of a video. */
export const FAST_FORWARD_RATE = 2;

/** Session-only UI state shared across cards. */
interface UiState {
  muted: boolean;
  /** Video or Short currently held down for fast-forward, if any. */
  fastForwardId: string | null;
  /** True once sound has been on, so a later gesture toggles instead of unmuting again. */
  soundUnlocked: boolean;
  unlockedAt: number;
  toggleMuted(): void;
  setMuted(muted: boolean): void;
  /** Called on the viewer's first gesture on web. */
  unlockSound(): void;
  startFastForward(id: string): void;
  /** Ends it only if that card is the one being held, so a stale release can't stop another card. */
  endFastForward(id: string): void;
}

export const useUi = create<UiState>()((set, get) => ({
  muted: STARTS_MUTED,
  fastForwardId: null,
  soundUnlocked: !STARTS_MUTED,
  unlockedAt: 0,
  toggleMuted: () => {
    const { unlockedAt, soundUnlocked } = get();
    // The gesture that just turned sound on is this same tap; don't undo it.
    if (soundUnlocked && Date.now() - unlockedAt < UNLOCK_GRACE_MS) return;
    set((s) => ({ muted: !s.muted, soundUnlocked: true }));
  },
  setMuted: (muted) => set({ muted }),
  unlockSound: () => {
    if (get().soundUnlocked) return;
    set({ muted: false, soundUnlocked: true, unlockedAt: Date.now() });
  },
  startFastForward: (id) => set({ fastForwardId: id }),
  endFastForward: (id) => set((s) => (s.fastForwardId === id ? { fastForwardId: null } : s)),
}));
