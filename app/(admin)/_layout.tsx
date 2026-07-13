/**
 * Layout del grupo (admin) — Exclusivo para administradores.
 * Guard: redirige si el usuario no es admin.
 */

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore, useIsAdmin } from '@stores/auth.store';

export default function AdminLayout() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAdmin       = useIsAdmin();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdmin) {
      router.replace('/(app)/(tabs)');
    }
  }, [isInitialized, isAdmin]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="kyc-review" />
      <Stack.Screen name="disputes" />
    </Stack>
  );
}
