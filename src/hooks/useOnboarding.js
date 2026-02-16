import { useLocalStorage } from './useLocalStorage';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage('onboardingCompleted', false);
  const [onboardingData, setOnboardingData] = useLocalStorage('onboardingData', null);

  const completeOnboarding = (data) => {
    setOnboardingData(data);
    setHasCompletedOnboarding(true);
  };

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    setOnboardingData(null);
  };

  return {
    hasCompletedOnboarding,
    onboardingData,
    completeOnboarding,
    resetOnboarding
  };
}