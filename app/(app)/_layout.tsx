/**
 * Layout del grupo (app) — Pantallas privadas para usuarios autenticados.
 * Guard: redirige a login si no hay sesión o el usuario está baneado.
 */

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore, useIsAuthenticated } from '@stores/auth.store';

export default function AppLayout() {
  const isInitialized   = useAuthStore((s) => s.isInitialized);
  const isBanned        = useAuthStore((s) => s.user?.is_banned ?? false);
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || isBanned) {
      router.replace('/(auth)/login');
    }
  }, [isInitialized, isAuthenticated, isBanned]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="offer/[id]"    options={{ presentation: 'card' }} />
      <Stack.Screen name="offer/create"  options={{ presentation: 'modal' }} />
      <Stack.Screen name="order/[id]"    options={{ presentation: 'card' }} />
      <Stack.Screen name="order/create"  options={{ presentation: 'modal' }} />
      <Stack.Screen name="kyc/basic"     options={{ presentation: 'card' }} />
      <Stack.Screen name="kyc/advanced"  options={{ presentation: 'card' }} />
    </Stack>
  );
}
