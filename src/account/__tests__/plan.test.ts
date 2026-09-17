import { planInitialSync, type RemoteState } from '../plan';

const REMOTE: RemoteState = { prefs: { onboarded: true }, activity: {} };

describe('planInitialSync', () => {
  it('loads the saved state for an account the device has not seen', () => {
    expect(planInitialSync(null, 'a', REMOTE)).toBe('use-remote');
    expect(planInitialSync({ userId: 'b', dirty: true }, 'a', REMOTE)).toBe('use-remote');
  });

  it('starts a brand-new account blank instead of inheriting local data', () => {
    expect(planInitialSync(null, 'a', null)).toBe('start-fresh');
    expect(planInitialSync({ userId: 'b', dirty: false }, 'a', null)).toBe('start-fresh');
  });

  it("refreshes the same user's cache from the server when nothing is pending", () => {
    expect(planInitialSync({ userId: 'a', dirty: false }, 'a', REMOTE)).toBe('use-remote');
  });

  it('keeps and uploads unsaved local changes for the same user', () => {
    expect(planInitialSync({ userId: 'a', dirty: true }, 'a', REMOTE)).toBe('push-local');
    expect(planInitialSync({ userId: 'a', dirty: true }, 'a', 'unavailable')).toBe('push-local');
    expect(planInitialSync({ userId: 'a', dirty: false }, 'a', null)).toBe('push-local');
  });

  it("works offline from the user's own cache but never from someone else's", () => {
    expect(planInitialSync({ userId: 'a', dirty: false }, 'a', 'unavailable')).toBe('keep-local');
    expect(planInitialSync({ userId: 'b', dirty: false }, 'a', 'unavailable')).toBe('fail');
    expect(planInitialSync(null, 'a', 'unavailable')).toBe('fail');
  });
});
