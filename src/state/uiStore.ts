import { create } from 'zustand';

/** Session-only UI state shared across cards. */
interface UiState {
  muted: boolean;
  toggleMuted(): void;
}

export const useUi = create<UiState>()((set) => ({
  muted: false,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
