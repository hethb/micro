import { create } from 'zustand';

import { useAccount } from '@/account/accountStore';
import { supabase } from '@/lib/supabase';

export const REPORT_REASONS = ['spam', 'abuse', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface BlockedPerson {
  id: string;
  name: string;
}

interface ModerationState {
  blocked: BlockedPerson[];
  loaded: boolean;
  load(): Promise<void>;
  block(person: BlockedPerson): Promise<void>;
  unblock(userId: string): Promise<void>;
  report(commentId: string, reason: ReportReason): Promise<void>;
  reset(): void;
}

/**
 * Blocking and reporting. The database hides blocked people's comments and anything
 * the user reported (see the visible_comments view); this store keeps the app in step
 * and backs the blocked list in Settings.
 */
export const useModeration = create<ModerationState>()((set, get) => ({
  blocked: [],
  loaded: false,

  load: async () => {
    if (!supabase) return;
    const { userId } = useAccount.getState();
    if (!userId) return;
    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocked_id, blocked_name')
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false });
    if (error) return;
    const rows = data as { blocked_id: string; blocked_name: string }[];
    set({ blocked: rows.map((r) => ({ id: r.blocked_id, name: r.blocked_name })), loaded: true });
  },

  block: async (person) => {
    if (!supabase) throw new Error('Blocking needs Supabase set up.');
    const { userId } = useAccount.getState();
    if (!userId) throw new Error('Log in first.');
    if (person.id === userId) throw new Error("You can't block yourself.");
    const { error } = await supabase
      .from('blocked_users')
      .upsert({ blocker_id: userId, blocked_id: person.id, blocked_name: person.name });
    if (error) throw new Error(error.message);
    if (!get().blocked.some((b) => b.id === person.id)) {
      set((s) => ({ blocked: [person, ...s.blocked] }));
    }
  },

  unblock: async (userId) => {
    if (!supabase) return;
    const me = useAccount.getState().userId;
    if (!me) return;
    const { error } = await supabase.from('blocked_users').delete().eq('blocker_id', me).eq('blocked_id', userId);
    if (error) throw new Error(error.message);
    set((s) => ({ blocked: s.blocked.filter((b) => b.id !== userId) }));
  },

  report: async (commentId, reason) => {
    if (!supabase) throw new Error('Reporting needs Supabase set up.');
    const { userId } = useAccount.getState();
    if (!userId) throw new Error('Log in first.');
    const { error } = await supabase
      .from('comment_reports')
      .upsert({ comment_id: commentId, reporter_id: userId, reason });
    if (error) throw new Error(error.message);
  },

  reset: () => set({ blocked: [], loaded: false }),
}));
