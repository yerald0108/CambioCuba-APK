/**
 * useOffers — Hook del marketplace de ofertas
 *
 * Maneja el listado de ofertas con filtros reactivos.
 * TanStack Query cachea los resultados y refetch al volver a la pantalla.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@lib/queryClient';
import {
  fetchOffers,
  fetchMyOffers,
  createOffer,
  toggleOfferPause,
  cancelOffer,
} from '@services/offers.service';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import type { OfferFilters, CreateOfferForm } from '@/types/offer.types';

// ─── HOOK: MARKETPLACE ────────────────────────────────────────────────────────

export function useOffers() {
  const [filters, setFilters] = useState<OfferFilters>({});

  const {
    data: offers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.offers.list(filters as Record<string, unknown>),
    queryFn:  () => fetchOffers(filters).then((r) => r.data ?? []),
    staleTime: 30 * 1000, // 30 segundos — las ofertas cambian frecuentemente
  });

  const updateFilter = useCallback((key: keyof OfferFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' || value === undefined ? undefined : value,
    }));
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  return {
    offers: offers ?? [],
    isLoading,
    isError,
    refetch,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

// ─── HOOK: MIS OFERTAS (TRAPICHERO) ──────────────────────────────────────────

export function useMyOffers() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const {
    data: offers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.offers.byTrapichero(user?.id ?? ''),
    queryFn:  () => fetchMyOffers(user!.id).then((r) => r.data ?? []),
    enabled:  !!user?.id,
  });

  // ── Crear oferta ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (form: CreateOfferForm) => createOffer(user!.id, form),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      queryClient.invalidateQueries({ queryKey: QueryKeys.offers.byTrapichero(user!.id) });
      queryClient.invalidateQueries({ queryKey: QueryKeys.offers.all });
      notify.success('Oferta publicada', 'Tu oferta ya es visible en el marketplace.');
    },
    onError: () => notify.error('Error inesperado', 'No se pudo crear la oferta.'),
  });

  // ── Pausar / reactivar ────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) =>
      toggleOfferPause(id, status),
    onSuccess: ({ data, error }) => {
      if (error) { notify.error('Error', error); return; }
      queryClient.invalidateQueries({ queryKey: QueryKeys.offers.byTrapichero(user!.id) });
      queryClient.invalidateQueries({ queryKey: QueryKeys.offers.all });
      const isPaused = data?.status === 'paused';
      notify.success(isPaused ? 'Oferta pausada' : 'Oferta reactivada');
    },
  });

  // ── Cancelar oferta ───────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: (offerId: string) => cancelOffer(offerId),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      queryClient.invalidateQueries({ queryKey: QueryKeys.offers.byTrapichero(user!.id) });
      queryClient.invalidateQueries({ queryKey: QueryKeys.offers.all });
      notify.success('Oferta eliminada');
    },
  });

  return {
    offers: offers ?? [],
    isLoading,
    isError,
    refetch,
    createOffer:   createMutation.mutate,
    isCreating:    createMutation.isPending,
    toggleOffer:   toggleMutation.mutate,
    isToggling:    toggleMutation.isPending,
    cancelOffer:   cancelMutation.mutate,
    isCancelling:  cancelMutation.isPending,
  };
}
