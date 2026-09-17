import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';
import { EMPTY_ACTIVITY, selectActivityData, useActivity, type ActivityData } from '@/state/activityStore';
import { PREFS_DEFAULTS, selectPrefsData, usePrefs, type PrefsData } from '@/state/prefsStore';

import { planInitialSync, type LocalOwner, type RemoteState } from './plan';

const OWNER_KEY = 'micro.account.owner';
/** Batch rapid changes (every swipe logs a view) into one upload. */
const PUSH_DELAY_MS = 3000;
const RETRY_DELAY_MS = 30_000;

interface ActiveSync {
  userId: string;
  dirty: boolean;
  /** Bumped on every local change, so a finished upload knows whether it's still current. */
  revision: number;
  timer: ReturnType<typeof setTimeout> | null;
  queue: Promise<void>;
  cleanup(): void;
}

let active: ActiveSync | null = null;
/** Invalidates in-flight startSync calls when the user signs out or switches accounts. */
let generation = 0;
/** True while remote state is written into the stores, so it isn't echoed back up. */
let applying = false;

async function readOwner(): Promise<LocalOwner | null> {
  try {
    const raw = await AsyncStorage.getItem(OWNER_KEY);
    return raw ? (JSON.parse(raw) as LocalOwner) : null;
  } catch {
    return null;
  }
}

const writeOwner = (owner: LocalOwner) => AsyncStorage.setItem(OWNER_KEY, JSON.stringify(owner));

async function fetchRemote(userId: string): Promise<RemoteState | null | 'unavailable'> {
  if (!supabase) return 'unavailable';
  try {
    const { data, error } = await supabase
      .from('user_state')
      .select('prefs, activity')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return 'unavailable';
    return (data as RemoteState | null) ?? null;
  } catch {
    return 'unavailable';
  }
}

function applyLocal(prefs: Partial<PrefsData>, activity: Partial<ActivityData>) {
  applying = true;
  try {
    usePrefs.getState().load({ ...PREFS_DEFAULTS, ...prefs });
    useActivity.getState().load({ ...EMPTY_ACTIVITY, ...activity });
  } finally {
    applying = false;
  }
}

function enqueuePush(sync: ActiveSync): Promise<void> {
  sync.queue = sync.queue.then(async () => {
    if (!supabase || !sync.dirty) return;
    const revision = sync.revision;
    const { error } = await supabase.from('user_state').upsert({
      user_id: sync.userId,
      prefs: selectPrefsData(usePrefs.getState()),
      activity: selectActivityData(useActivity.getState()),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      if (active === sync) schedulePush(sync, RETRY_DELAY_MS);
      return;
    }
    if (sync.revision === revision) {
      sync.dirty = false;
      if (active === sync) await writeOwner({ userId: sync.userId, dirty: false });
    }
  });
  return sync.queue;
}

function schedulePush(sync: ActiveSync, delay: number) {
  if (sync.timer) clearTimeout(sync.timer);
  sync.timer = setTimeout(() => {
    sync.timer = null;
    void enqueuePush(sync);
  }, delay);
}

function markChanged(sync: ActiveSync) {
  if (applying || active !== sync) return;
  sync.revision++;
  if (!sync.dirty) {
    sync.dirty = true;
    void writeOwner({ userId: sync.userId, dirty: true });
  }
  schedulePush(sync, PUSH_DELAY_MS);
}

/**
 * Loads the signed-in user's saved state into the local stores, then keeps the server
 * up to date as they change. Throws if the state can't be loaded and there's no usable cache.
 */
export async function startSync(userId: string): Promise<void> {
  await stopSync({ flush: true });
  const myGeneration = ++generation;

  const owner = await readOwner();
  const needsRemote = !(owner?.userId === userId && owner.dirty);
  const remote = needsRemote ? await fetchRemote(userId) : 'unavailable';
  if (myGeneration !== generation) return;

  const plan = planInitialSync(owner, userId, remote);
  if (plan === 'fail') throw new Error('Could not load your saved data.');
  if (plan === 'use-remote' && remote && remote !== 'unavailable') applyLocal(remote.prefs, remote.activity);
  if (plan === 'start-fresh') applyLocal(PREFS_DEFAULTS, EMPTY_ACTIVITY);

  const dirty = plan === 'push-local' || plan === 'start-fresh';
  await writeOwner({ userId, dirty });
  if (myGeneration !== generation) return;

  const sync: ActiveSync = { userId, dirty, revision: 0, timer: null, queue: Promise.resolve(), cleanup: () => {} };
  const unsubscribers = [
    usePrefs.subscribe(() => markChanged(sync)),
    useActivity.subscribe(() => markChanged(sync)),
  ];
  const appState = AppState.addEventListener('change', (state) => {
    if (state !== 'active' && sync.dirty) void enqueuePush(sync);
  });
  sync.cleanup = () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    appState.remove();
    if (sync.timer) clearTimeout(sync.timer);
  };
  active = sync;
  if (dirty) void enqueuePush(sync);
}

/** Stops syncing. With `flush`, waits (best effort) for unsaved changes to upload first. */
export async function stopSync({ flush }: { flush: boolean }): Promise<void> {
  generation++;
  const sync = active;
  if (!sync) return;
  active = null;
  sync.cleanup();
  if (flush && sync.dirty) {
    await enqueuePush(sync).catch(() => {});
  }
}

/** Wipes the on-device copy of the user's data (on sign-out). */
export async function clearLocalData(): Promise<void> {
  await stopSync({ flush: false });
  applyLocal(PREFS_DEFAULTS, EMPTY_ACTIVITY);
  await AsyncStorage.removeItem(OWNER_KEY);
}

export async function hasLocalOwner(): Promise<boolean> {
  return (await readOwner()) !== null;
}
