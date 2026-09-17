import type { ActivityData } from '@/state/activityStore';
import type { PrefsData } from '@/state/prefsStore';

/** Whose data the on-device cache holds, and whether it has changes the server hasn't seen. */
export interface LocalOwner {
  userId: string;
  dirty: boolean;
}

export interface RemoteState {
  prefs: Partial<PrefsData>;
  activity: Partial<ActivityData>;
}

export type InitialSync =
  /** The cache has this user's unsaved changes: keep them and upload. */
  | 'push-local'
  /** Load the account's saved state. */
  | 'use-remote'
  /** Server unreachable, but the cache already belongs to this user. */
  | 'keep-local'
  /** A new account: clear whatever the device held and start blank. */
  | 'start-fresh'
  /** Server unreachable and the cache belongs to someone else (or no one). */
  | 'fail';

/** `remote` is null when the account has no saved state yet, 'unavailable' when it couldn't be fetched. */
export function planInitialSync(
  owner: LocalOwner | null,
  userId: string,
  remote: RemoteState | null | 'unavailable',
): InitialSync {
  const sameOwner = owner?.userId === userId;
  if (sameOwner && owner.dirty) return 'push-local';
  if (remote === 'unavailable') return sameOwner ? 'keep-local' : 'fail';
  if (remote) return 'use-remote';
  return sameOwner ? 'push-local' : 'start-fresh';
}
