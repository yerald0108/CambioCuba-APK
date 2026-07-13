/**
 * TanStack Query — Configuración del cliente de caché
 *
 * Estrategia de caché diseñada para una app P2P donde los datos
 * cambian frecuentemente (órdenes, ofertas, chat).
 */

import { QueryClient } from '@tanstack/react-query';

// ─── CLAVES DE QUERY ─────────────────────────────────────────────────────────
// Centralizamos las claves para evitar typos y facilitar la invalidación.

export const QueryKeys = {
  // Perfil y auth
  profile: (userId: string) => ['profile', userId] as const,

  // Ofertas
  offers: {
    all: ['offers'] as const,
    list: (filters?: Record<string, unknown>) => ['offers', 'list', filters] as const,
    detail: (id: string) => ['offers', 'detail', id] as const,
    byTrapichero: (userId: string) => ['offers', 'trapichero', userId] as const,
  },

  // Órdenes
  orders: {
    all: ['orders'] as const,
    active: (userId: string) => ['orders', 'active', userId] as const,
    history: (userId: string) => ['orders', 'history', userId] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },

  // Chat
  chat: {
    messages: (orderId: string) => ['chat', orderId] as const,
  },

  // KYC
  kyc: {
    document: (userId: string) => ['kyc', userId] as const,
  },

  // Admin
  admin: {
    pendingKyc: ['admin', 'kyc', 'pending'] as const,
    disputes: ['admin', 'disputes'] as const,
    users: (page: number) => ['admin', 'users', page] as const,
  },
} as const;

// ─── CLIENTE DE QUERY ─────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" antes de hacer refetch
      // En una app P2P esto debe ser corto para tener datos actualizados
      staleTime: 30 * 1000,          // 30 segundos

      // Tiempo que los datos permanecen en caché después de que
      // ningún componente los usa (garbage collection)
      gcTime: 5 * 60 * 1000,         // 5 minutos

      // Reintentos en caso de error
      retry: (failureCount, error) => {
        // No reintentamos en errores de autenticación (401/403)
        if (error instanceof Error && error.message.includes('401')) return false;
        if (error instanceof Error && error.message.includes('403')) return false;
        return failureCount < 2;
      },

      // Refetch al volver a la pantalla (útil para datos de órdenes activas)
      refetchOnWindowFocus: true,

      // No refetch automático — usamos Supabase Realtime para datos en tiempo real
      refetchInterval: false,
    },
    mutations: {
      // No reintentar mutaciones (pueden causar duplicados en P2P)
      retry: false,
    },
  },
});
