import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

import { clearLocalData, hasLocalOwner, startSync, stopSync } from './sync';

export type AccountStatus =
  /** Restoring a saved session on launch. */
  | 'loading'
  | 'signedOut'
  /** Signed in, loading the account's saved data. */
  | 'syncing'
  | 'ready'
  /** Signed in, but the saved data couldn't be loaded. */
  | 'error';

interface AccountState {
  status: AccountStatus;
  userId: string | null;
  email: string | null;
  displayName: string | null;
}

export const useAccount = create<AccountState>()(() => ({
  status: 'loading',
  userId: null,
  email: null,
  displayName: null,
}));

export const isAccountConfigured = supabase !== null;

const SIGNED_OUT: AccountState = { status: 'signedOut', userId: null, email: null, displayName: null };

/** Starts listening for session changes. Call once, after the local stores have hydrated. */
export function initAccount(): () => void {
  if (!supabase) {
    useAccount.setState(SIGNED_OUT);
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    // Supabase calls can deadlock if awaited inside this callback, so handle it on the next tick.
    setTimeout(() => void handleSession(session), 0);
  });
  return () => data.subscription.unsubscribe();
}

async function handleSession(session: Session | null) {
  const user = session?.user ?? null;
  const current = useAccount.getState();

  if (!user) {
    if (current.status === 'signedOut') return;
    // Don't leave a previous user's data on the device.
    if (current.userId || (await hasLocalOwner())) await clearLocalData();
    useAccount.setState(SIGNED_OUT);
    return;
  }

  // Token refreshes and profile updates re-emit the same user.
  if (user.id === current.userId && current.status !== 'signedOut') return;

  useAccount.setState({
    status: 'syncing',
    userId: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
  });
  void loadDisplayName(user.id);
  await connect(user.id);
}

async function connect(userId: string) {
  try {
    await startSync(userId);
    if (useAccount.getState().userId === userId) useAccount.setState({ status: 'ready' });
  } catch {
    if (useAccount.getState().userId === userId) useAccount.setState({ status: 'error' });
  }
}

async function loadDisplayName(userId: string) {
  if (!supabase) return;
  const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
  const name = (data as { display_name: string } | null)?.display_name;
  if (name && useAccount.getState().userId === userId) useAccount.setState({ displayName: name });
}

export function retrySync() {
  const { userId } = useAccount.getState();
  if (!userId) return;
  useAccount.setState({ status: 'syncing' });
  void connect(userId);
}

function requireClient() {
  if (!supabase) throw new Error('Accounts are not set up yet. Add your Supabase keys to .env.local.');
  return supabase;
}

export interface SignUpResult {
  /** True when Supabase requires the user to confirm their email before logging in. */
  needsConfirmation: boolean;
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<SignUpResult> {
  const { data, error } = await requireClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { display_name: input.name } },
  });
  if (error) throw new Error(error.message);
  // With email confirmation on, Supabase hides existing accounts by returning a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('An account with this email already exists. Log in instead.');
  }
  return { needsConfirmation: !data.session };
}

export async function signIn(input: { email: string; password: string }): Promise<void> {
  const { error } = await requireClient().auth.signInWithPassword(input);
  if (error) throw new Error(error.message);
}

/** Signs out on this device only. Unsaved changes are uploaded first when possible. */
export async function signOut(): Promise<void> {
  const client = requireClient();
  await stopSync({ flush: true });
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) {
    const { userId } = useAccount.getState();
    if (userId) void connect(userId);
    throw new Error(error.message);
  }
}
