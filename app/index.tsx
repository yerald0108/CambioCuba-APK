/**
 * Pantalla de entrada — Redirige según estado de autenticación y rol.
 */

import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore, useIsAuthenticated, useIsAdmin } from '@stores/auth.store';
import { LoadingScreen } from '@components/shared/LoadingScreen';
import { hasSeenOnboarding } from '@lib/onboarding';

export default function Index() {
  const isInitialized   = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useIsAuthenticated();
  const isAdmin         = useIsAdmin();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setOnboardingSeen).catch(() => setOnboardingSeen(true));
  }, []);

  // Mientras Supabase verifica la sesión guardada
  if (!isInitialized || onboardingSeen === null) return <LoadingScreen />;

  if (!isAuthenticated) return <Redirect href={(onboardingSeen ? '/(auth)/login' : '/(auth)/onboarding') as never} />;
  if (isAdmin)          return <Redirect href="/(admin)/dashboard" />;
  return                       <Redirect href="/(app)/(tabs)" />;
}
