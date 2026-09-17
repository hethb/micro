import { router } from 'expo-router';

import { BreakPicker, SectionLabel, VibePicker } from '@/components/prefs/PrefControls';
import { StepScreen } from '@/components/ui/StepScreen';

export default function BreaksStep() {
  return (
    <StepScreen
      step={2}
      totalSteps={4}
      title="Brain breaks 🍿"
      subtitle="A popular short video drops in between learning cards so the feed never feels like homework."
      cta="Continue"
      onNext={() => router.push('/onboarding/goal')}>
      <SectionLabel>HOW OFTEN</SectionLabel>
      <BreakPicker />
      <SectionLabel>WHAT VIBES (OPTIONAL)</SectionLabel>
      <VibePicker />
    </StepScreen>
  );
}
