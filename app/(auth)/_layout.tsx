/**
 * Layout del grupo (auth) — Pantallas públicas
 * Redirige al app si el usuario ya está autenticado.
 */

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore, useIsAuthenticated, useIsAdmin } from '@stores/auth.store';

export default function AuthLayout() {
  const isInitialized   = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useIsAuthenticated();
  const isAdmin         = useIsAdmin();

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      router.replace(isAdmin ? '/(admin)/dashboard' : '/(app)/(tabs)');
    }
  }, [isInitialized, isAuthenticated, isAdmin]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
