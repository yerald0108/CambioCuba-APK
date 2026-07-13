/**
 * useAuth — Hook de autenticación
 *
 * Centraliza logout, updateProfile y expone el estado del store
 * usando los selectores correctos (sin conflicto de tipos).
 */

import { useCallback } from 'react';
import { router } from 'expo-router';

import { logoutUser, updateUserProfile } from '@services/auth.service';
import {
  useAuthStore,
  useIsAuthenticated,
  useIsAdmin,
  useIsTrapichero,
  useHasBasicKyc,
  useHasAdvancedKyc,
} from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import { queryClient } from '@lib/queryClient';
import type { UserProfile } from '@/types/user.types';

export function useAuth() {
  const user          = useAuthStore((s) => s.user);
  const isLoading     = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const setUser       = useAuthStore((s) => s.setUser);
  const setLoading    = useAuthStore((s) => s.setLoading);
  const clearAuth     = useAuthStore((s) => s.clearAuth);

  // Getters derivados via selectores
  const isAuthenticated = useIsAuthenticated();
  const isAdmin         = useIsAdmin();
  const isTrapichero    = useIsTrapichero();
  const hasBasicKyc     = useHasBasicKyc();
  const hasAdvancedKyc  = useHasAdvancedKyc();

  // ─── Logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    setLoading(true);
    const { error } = await logoutUser();

    if (error) {
      notify.error('Error', error);
      setLoading(false);
      return;
    }

    queryClient.clear();
    clearAuth();
    router.replace('/(auth)/login');
  }, []);

  // ─── Actualizar perfil ────────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>) => {
      if (!user) return;

      const { data, error } = await updateUserProfile(user.id, updates);

      if (error) {
        notify.error('Error', error);
        return;
      }

      if (data) {
        setUser(data);
        notify.success('Perfil actualizado');
      }
    },
    [user]
  );

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    isAdmin,
    isTrapichero,
    hasBasicKyc,
    hasAdvancedKyc,
    logout,
    updateProfile,
    setUser,
  };
}
