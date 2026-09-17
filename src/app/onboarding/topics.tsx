import { router } from 'expo-router';

import { TopicPicker } from '@/components/prefs/PrefControls';
import { useAccount } from '@/account/accountStore';
import { StepScreen } from '@/components/ui/StepScreen';
import { MIN_TOPICS, usePrefs } from '@/state/prefsStore';

export default function TopicsStep() {
  const count = usePrefs((s) => s.topics.length);
  const remaining = Math.max(0, MIN_TOPICS - count);
  const firstName = useAccount((s) => s.displayName?.trim().split(/\s+/)[0]);

  return (
    <StepScreen
      step={0}
      totalSteps={4}
      title={firstName ? `Hey ${firstName}! What do you want to get smarter about?` : 'What do you want to get smarter about?'}
      subtitle="Pick at least 3. Your feed mixes these with a little bit of everything else."
      cta={remaining > 0 ? `Pick ${remaining} more` : 'Continue'}
      ctaDisabled={remaining > 0}
      onNext={() => router.push('/onboarding/style')}>
      <TopicPicker />
    </StepScreen>
  );
}
