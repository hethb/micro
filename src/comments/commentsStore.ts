import { create } from 'zustand';

import { useAccount } from '@/account/accountStore';
import { supabase } from '@/lib/supabase';

export const MAX_COMMENT_LENGTH = 500;
/** Threads in a prototype stay small; newest ones are what people read. */
const MAX_THREAD = 200;

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: number;
}

interface CommentRow {
  id: string;
  card_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

const toComment = (row: CommentRow): Comment => ({
  id: row.id,
  cardId: row.card_id,
  authorId: row.user_id,
  authorName: row.author_name,
  body: row.body,
  createdAt: new Date(row.created_at).getTime(),
});

export type ThreadStatus = 'loading' | 'ready' | 'error';

export interface Thread {
  status: ThreadStatus;
  items: Comment[];
}

interface CommentsState {
  /** Comment count per card id, for the feed's comment button. */
  counts: Record<string, number>;
  threads: Record<string, Thread>;
  /** Fetches counts for card ids that don't have one yet. */
  loadCounts(cardIds: readonly string[]): Promise<void>;
  loadThread(cardId: string): Promise<void>;
  /** Returns the posted comment; throws with a readable message when it fails. */
  post(cardId: string, body: string): Promise<Comment>;
  remove(cardId: string, commentId: string): Promise<void>;
  /** Drops comments the user just hid by reporting or blocking, without refetching. */
  hide(predicate: (comment: Comment) => boolean): void;
  reset(): void;
}

/** The name a comment is posted under. */
function authorName(): string {
  const { displayName, email } = useAccount.getState();
  return displayName?.trim() || email?.split('@')[0] || 'Someone';
}

export const useComments = create<CommentsState>()((set, get) => ({
  counts: {},
  threads: {},

  loadCounts: async (cardIds) => {
    if (!supabase) return;
    const { counts } = get();
    const missing = [...new Set(cardIds)].filter((id) => counts[id] === undefined);
    if (missing.length === 0) return;
    const { data, error } = await supabase.rpc('comment_counts', { card_ids: missing });
    if (error) return;
    const totals = Object.fromEntries((data as { card_id: string; total: number }[]).map((r) => [r.card_id, Number(r.total)]));
    // Remember the zeros too, so empty threads aren't fetched again on every swipe.
    set((s) => ({ counts: { ...s.counts, ...Object.fromEntries(missing.map((id) => [id, totals[id] ?? 0])) } }));
  },

  loadThread: async (cardId) => {
    if (!supabase) {
      set((s) => ({ threads: { ...s.threads, [cardId]: { status: 'error', items: [] } } }));
      return;
    }
    set((s) => ({
      threads: { ...s.threads, [cardId]: { status: 'loading', items: s.threads[cardId]?.items ?? [] } },
    }));
    const { data, error } = await supabase
      // The view leaves out comments from blocked people and ones the user reported.
      .from('visible_comments')
      .select('id, card_id, user_id, author_name, body, created_at')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false })
      .limit(MAX_THREAD);
    if (error) {
      set((s) => ({
        threads: { ...s.threads, [cardId]: { status: 'error', items: s.threads[cardId]?.items ?? [] } },
      }));
      return;
    }
    const items = (data as CommentRow[]).map(toComment);
    set((s) => ({
      threads: { ...s.threads, [cardId]: { status: 'ready', items } },
      counts: { ...s.counts, [cardId]: items.length },
    }));
  },

  post: async (cardId, body) => {
    if (!supabase) throw new Error('Comments need Supabase set up.');
    const { userId } = useAccount.getState();
    if (!userId) throw new Error('Log in to comment.');
    const text = body.trim().slice(0, MAX_COMMENT_LENGTH);
    if (!text) throw new Error('Write something first.');
    const { data, error } = await supabase
      .from('comments')
      .insert({ card_id: cardId, user_id: userId, author_name: authorName(), body: text })
      .select('id, card_id, user_id, author_name, body, created_at')
      .single();
    if (error) throw new Error(error.message);
    const comment = toComment(data as CommentRow);
    set((s) => {
      const items = [comment, ...(s.threads[cardId]?.items ?? [])];
      return {
        threads: { ...s.threads, [cardId]: { status: 'ready', items } },
        counts: { ...s.counts, [cardId]: (s.counts[cardId] ?? 0) + 1 },
      };
    });
    return comment;
  },

  hide: (predicate) =>
    set((s) => {
      const threads: Record<string, Thread> = {};
      const counts = { ...s.counts };
      for (const [cardId, thread] of Object.entries(s.threads)) {
        const items = thread.items.filter((c) => !predicate(c));
        threads[cardId] = { ...thread, items };
        const hidden = thread.items.length - items.length;
        if (hidden > 0) counts[cardId] = Math.max(0, (counts[cardId] ?? hidden) - hidden);
      }
      return { threads, counts };
    }),

  reset: () => set({ counts: {}, threads: {} }),

  remove: async (cardId, commentId) => {
    if (!supabase) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw new Error(error.message);
    set((s) => {
      const items = (s.threads[cardId]?.items ?? []).filter((c) => c.id !== commentId);
      return {
        threads: { ...s.threads, [cardId]: { status: 'ready', items } },
        counts: { ...s.counts, [cardId]: Math.max(0, (s.counts[cardId] ?? 1) - 1) },
      };
    });
  },
}));
