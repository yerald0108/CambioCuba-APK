/**
 * useRating — Hook para el flujo de calificación al completar una orden
 *
 * Maneja:
 * - Verificar si el usuario ya calificó en esta orden
 * - Enviar la calificación al contraparte
 * - Invalidar el perfil del calificado para reflejar el nuevo rating
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@lib/queryClient';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import { submitRating, hasRated } from '@services/ratings.service';
import type { RateOrderForm } from '@/types/order.types';

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────

export function useRating(
  orderId: string,
  ratedUserId: string,
  role: 'buyer' | 'seller'
) {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // ── Verificar si ya calificó ───────────────────────────────────────────────
  const { data: alreadyRated, isLoading: isCheckingRated } = useQuery({
    queryKey: QueryKeys.ratings.byOrder(orderId),
    queryFn:  () => hasRated(user!.id, orderId),
    enabled:  !!user?.id && !!orderId,
    staleTime: 60 * 1000,
  });

  // ── Enviar calificación ────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (form: RateOrderForm) =>
      submitRating(user!.id, ratedUserId, orderId, role, form),

    onSuccess: ({ data, error }) => {
      if (error) {
        notify.error('Error', error);
        return;
      }
      if (data) {
        // Invalidar para que el badge "ya calificado" se actualice
        queryClient.invalidateQueries({
          queryKey: QueryKeys.ratings.byOrder(orderId),
        });
        // Invalidar el perfil del calificado para reflejar el nuevo avg_rating
        queryClient.invalidateQueries({
          queryKey: QueryKeys.profile(ratedUserId),
        });
        // Invalidar la orden para que buyer_rated/seller_rated se actualice
        queryClient.invalidateQueries({
          queryKey: QueryKeys.orders.detail(orderId),
        });
      }
    },

    onError: () => {
      notify.error('Error inesperado', 'No se pudo enviar la calificación.');
    },
  });

  return {
    // Estado
    alreadyRated:     alreadyRated ?? false,
    isCheckingRated,
    // Acción
    submitRating:     mutation.mutate,
    isSubmitting:     mutation.isPending,
    isSuccess:        mutation.isSuccess,
  };
}0