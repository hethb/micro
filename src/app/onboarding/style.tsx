import { router } from 'expo-router';

import { StylePicker } from '@/components/prefs/PrefControls';
import { StepScreen } from '@/components/ui/StepScreen';

export default function StyleStep() {
  return (
    <StepScreen
      step={1}
      totalSteps={4}
      title="How do you like to learn?"
      subtitle="We'll balance explainer videos, facts, book summaries and quotes around this."
      cta="Continue"
      onNext={() => router.push('/onboarding/breaks')}>
      <StylePicker />
    </StepScreen>
  );
}
