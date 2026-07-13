/**
 * Auth Store — Estado global de autenticación
 *
 * Patrón: los campos de estado son valores planos (boolean, object).
 * Los getters derivados se calculan con un selector hook separado.
 * Esto evita el conflicto de TypeScript entre `boolean` y `() => boolean`.
 */

import { create } from 'zustand';
import type { UserProfile } from '@/types/user.types';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AuthStore {
  // ── Campos de estado (valores planos) ──────────────────────────────────────
  user:          UserProfile | null;
  isLoading:     boolean;
  isInitialized: boolean;

  // ── Acciones ────────────────────────────────────────────────────────────────
  setUser:        (user: UserProfile | null) => void;
  setLoading:     (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth:      () => void;
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set) => ({
  // Estado inicial
  user:          null,
  isLoading:     true,   // true hasta que Supabase verifique la sesión guardada
  isInitialized: false,

  // Acciones
  setUser:        (user)        => set({ user }),
  setLoading:     (isLoading)   => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),

  clearAuth: () => set({
    user:          null,
    isLoading:     false,
    isInitialized: true,
  }),
}));

// ─── SELECTOR HOOKS ───────────────────────────────────────────────────────────
// Hooks derivados del store — calculan valores booleanos en tiempo real.
// Se usan en lugar de los getters anteriores para evitar conflictos de tipos.

/** true si el usuario está autenticado */
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.user !== null);

/** true si el usuario es administrador */
export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === 'admin');

/** true si el usuario es trapichero o admin */
export const useIsTrapichero = () =>
  useAuthStore((s) =>
    s.user?.role === 'trapichero' || s.user?.role === 'admin'
  );

/** true si el usuario tiene KYC básico aprobado */
export const useHasBasicKyc = () =>
  useAuthStore((s) => {
    const u = s.user;
    return (
      (u?.kyc_level === 'basic' || u?.kyc_level === 'advanced') &&
      u?.kyc_status === 'approved'
    );
  });

/** true si el usuario tiene KYC avanzado aprobado (es Trapichero) */
export const useHasAdvancedKyc = () =>
  useAuthStore((s) =>
    s.user?.kyc_level === 'advanced' && s.user?.kyc_status === 'approved'
  );
