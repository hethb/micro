import { router } from 'expo-router';

import { GoalPicker } from '@/components/prefs/PrefControls';
import { StepScreen } from '@/components/ui/StepScreen';
import { usePrefs } from '@/state/prefsStore';

export default function GoalStep() {
  const completeOnboarding = usePrefs((s) => s.completeOnboarding);

  return (
    <StepScreen
      step={3}
      totalSteps={4}
      title="Set a daily goal"
      subtitle="Swap some doomscrolling for learning. You can change this any time."
      cta="Start scrolling"
      footnote="Tip: double-tap to like · long-press to tune your feed"
      onNext={() => {
        completeOnboarding();
        router.replace('/feed');
      }}>
      <GoalPicker />
    </StepScreen>
  );
}
