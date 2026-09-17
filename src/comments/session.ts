import { useAccount } from '@/account/accountStore';

import { useComments } from './commentsStore';
import { useModeration } from './moderationStore';

/**
 * Keeps comment state tied to the signed-in account: cached threads are dropped when
 * the account changes, and the new user's block list is loaded. Returns an unsubscriber.
 */
export function watchAccountForComments(): () => void {
  return useAccount.subscribe((state, previous) => {
    if (state.userId === previous.userId) return;
    useComments.getState().reset();
    useModeration.getState().reset();
    if (state.userId) void useModeration.getState().load();
  });
}
