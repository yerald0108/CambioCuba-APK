import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@cambiocuba/onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
}

export function completeOnboarding(): Promise<void> {
  return AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
