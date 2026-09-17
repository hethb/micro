import { Redirect } from 'expo-router';

import { usePrefs } from '@/state/prefsStore';

export default function Index() {
  const onboarded = usePrefs((s) => s.onboarded);
  return <Redirect href={onboarded ? '/feed' : '/onboarding/topics'} />;
}
