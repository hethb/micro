import { useEffect, useState } from 'react';

import { useActivity } from './activityStore';
import { usePrefs } from './prefsStore';

const stores = [usePrefs, useActivity];

/** True once every persisted store has loaded from AsyncStorage. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => stores.every((s) => s.persist.hasHydrated()));

  useEffect(() => {
    if (hydrated) return;
    const check = () => {
      if (stores.every((s) => s.persist.hasHydrated())) setHydrated(true);
    };
    const unsubs = stores.map((s) => s.persist.onFinishHydration(check));
    check();
    return () => unsubs.forEach((u) => u());
  }, [hydrated]);

  return hydrated;
}
