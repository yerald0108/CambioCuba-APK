/**
 * useAdmin — Hooks para el panel de administración
 *
 * Tres hooks independientes:
 * - useDashboardStats — estadísticas generales
 * - useKycReview — lista KYC pendiente + aprobar/rechazar
 * - useDisputes — disputas abiertas + resolver
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@lib/queryClient';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import {
  fetchDashboardStats,
  fetchPendingKyc,
  approveKyc,
  rejectKyc,
  fetchOpenDisputes,
  resolveDisputeBuyer,
  resolveDisputeSeller,
} from '@services/admin.service';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QueryKeys.admin.stats,
    queryFn:  fetchDashboardStats,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });

  return {
    stats:     data?.data ?? null,
    isLoading,
    isError,
    refetch,
  };
}

// ─── KYC REVIEW ──────────────────────────────────────────────────────────────

export function useKycReview() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QueryKeys.admin.pendingKyc,
    queryFn:  fetchPendingKyc,
    staleTime: 10 * 1000,
  });

  // Aprobar KYC
  const approveMutation = useMutation({
    mutationFn: ({ kycId, userId }: { kycId: string; userId: string }) =>
      approveKyc(kycId, userId, user!.id),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      notify.success('KYC aprobado', 'El usuario fue notificado.');
      queryClient.invalidateQueries({ queryKey: QueryKeys.admin.pendingKyc });
    },
    onError: () => notify.error('Error inesperado', 'No se pudo aprobar el KYC.'),
  });

  // Rechazar KYC
  const rejectMutation = useMutation({
    mutationFn: ({ kycId, userId, reason }: {
      kycId: string; userId: string; reason: string;
    }) => rejectKyc(kycId, userId, user!.id, reason),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      notify.warning('KYC rechazado', 'El usuario fue notificado.');
      queryClient.invalidateQueries({ queryKey: QueryKeys.admin.pendingKyc });
    },
    onError: () => notify.error('Error inesperado', 'No se pudo rechazar el KYC.'),
  });

  return {
    kycList:    data?.data ?? [],
    isLoading,
    isError,
    refetch,
    approveKyc: approveMutation.mutate,
    isApproving: approveMutation.isPending,
    rejectKyc:  rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
  };
}

// ─── DISPUTES ─────────────────────────────────────────────────────────────────

export function useDisputes() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QueryKeys.admin.disputes,
    queryFn:  fetchOpenDisputes,
    staleTime: 10 * 1000,
  });

  // Resolver a favor del comprador (completar orden)
  const resolveBuyerMutation = useMutation({
    mutationFn: ({ orderId, resolution }: { orderId: string; resolution: string }) =>
      resolveDisputeBuyer(orderId, user!.id, resolution),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      notify.success('Disputa resuelta', 'Orden completada — comprador favorecido.');
      queryClient.invalidateQueries({ queryKey: QueryKeys.admin.disputes });
    },
    onError: () => notify.error('Error inesperado', 'No se pudo resolver la disputa.'),
  });

  // Resolver a favor del vendedor (cancelar orden)
  const resolveSellerMutation = useMutation({
    mutationFn: ({ orderId, resolution }: { orderId: string; resolution: string }) =>
      resolveDisputeSeller(orderId, user!.id, resolution),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      notify.warning('Disputa resuelta', 'Orden cancelada — vendedor favorecido.');
      queryClient.invalidateQueries({ queryKey: QueryKeys.admin.disputes });
    },
    onError: () => notify.error('Error inesperado', 'No se pudo resolver la disputa.'),
  });

  return {
    disputes:          data?.data ?? [],
    isLoading,
    isError,
    refetch,
    resolveBuyer:      resolveBuyerMutation.mutate,
    isResolvingBuyer:  resolveBuyerMutation.isPending,
    resolveSeller:     resolveSellerMutation.mutate,
    isResolvingSeller: resolveSellerMutation.isPending,
  };
}