/**
 * useOrder — Hook de estado de una orden con Supabase Realtime
 *
 * Maneja:
 * - Carga inicial de la orden
 * - Suscripción en tiempo real para cambios de estado
 * - Timer de cuenta regresiva cuando la orden está en 'both_confirmed'
 * - Todas las acciones de la state machine (confirmar, cancelar, disputar)
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@lib/supabase';
import { QueryKeys } from '@lib/queryClient';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import {
  fetchOrderById,
  fetchOrderHistory,
  fetchActiveOrder,
  confirmReady,
  cancelOrder,
  openDispute,
  createOrder,
} from '@services/orders.service';
import type { Order, CreateOrderForm } from '@/types/order.types';

// ─── HOOK: DETALLE DE ORDEN CON REALTIME ─────────────────────────────────────

/**
 * Hook principal para la pantalla de una orden activa.
 * Sincroniza el estado con Supabase Realtime para que ambas partes
 * vean los cambios sin hacer polling.
 */
export function useOrderDetail(orderId: string) {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // ── Carga inicial de la orden ──────────────────────────────────────────────
  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.orders.detail(orderId),
    queryFn:  () => fetchOrderById(orderId).then((r) => r.data),
    enabled:  !!orderId,
    // Sin staleTime agresivo — Realtime se encarga de las actualizaciones
    staleTime: 5 * 1000,
  });

  // ── Suscripción Realtime ───────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;

    // Canal dedicado a esta orden específica
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',        // INSERT, UPDATE, DELETE
          schema: 'public',
          table:  'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          // Actualizamos la caché de TanStack Query con el nuevo estado
          // Esto hace que la UI refleje el cambio sin refetch extra
          queryClient.setQueryData(
            QueryKeys.orders.detail(orderId),
            (prev: Order | null | undefined) => {
              if (!prev) return prev;
              return { ...prev, ...(payload.new as Partial<Order>) };
            }
          );

          // Invalidamos el historial y la orden activa para que se recarguen
          if (user?.id) {
            queryClient.invalidateQueries({ queryKey: QueryKeys.orders.history(user.id) });
            queryClient.invalidateQueries({ queryKey: QueryKeys.orders.active(user.id) });
          }
        }
      )
      .subscribe();

    // Limpiamos la suscripción al desmontar el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient, user?.id]);

  // ── Timer de cuenta regresiva ──────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Solo activamos el timer cuando ambos confirmaron y hay fecha de expiración
    if (order?.status !== 'both_confirmed' || !order.expires_at) {
      setSecondsLeft(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const calculateSecondsLeft = () => {
      const expiresAt  = new Date(order.expires_at!).getTime();
      const now        = Date.now();
      const remaining  = Math.max(0, Math.floor((expiresAt - now) / 1000));
      return remaining;
    };

    // Calculamos el valor inicial
    setSecondsLeft(calculateSecondsLeft());

    // Actualizamos cada segundo
    timerRef.current = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);

      // Cuando llega a 0 refrescamos la orden (el trigger de Supabase
      // ya la habrá marcado como 'expired')
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        refetch();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [order?.status, order?.expires_at, refetch]);

  // ── Rol del usuario en esta orden ─────────────────────────────────────────
  const isBuyer  = order?.buyer_id  === user?.id;
  const isSeller = order?.seller_id === user?.id;

  const userRole: 'buyer' | 'seller' | null =
    isBuyer ? 'buyer' : isSeller ? 'seller' : null;

  // ── El usuario ya confirmó ─────────────────────────────────────────────────
  const alreadyConfirmed =
    (isBuyer  && order?.buyer_confirmed)  ||
    (isSeller && order?.seller_confirmed) ||
    false;

  // ── Timer en zona crítica (menos de 5 min) ─────────────────────────────────
  const isTimerCritical = secondsLeft !== null && secondsLeft <= 5 * 60;

  // ─── ACCIONES ─────────────────────────────────────────────────────────────

  // Confirmar listo
  const confirmMutation = useMutation({
    mutationFn: () => confirmReady(orderId, userRole!),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      // El Realtime se encargará de actualizar la UI
    },
    onError: () => notify.error('Error inesperado', 'No se pudo confirmar.'),
  });

  // Cancelar orden
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelOrder(orderId, user!.id, reason),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      notify.info('Intercambio cancelado');
      // El Realtime actualizará el estado en la pantalla
    },
    onError: () => notify.error('Error inesperado', 'No se pudo cancelar.'),
  });

  // Abrir disputa
  const disputeMutation = useMutation({
    mutationFn: (reason: string) => openDispute(orderId, user!.id, reason),
    onSuccess: ({ error }) => {
      if (error) { notify.error('Error', error); return; }
      notify.warning('Disputa abierta', 'Un administrador revisará el caso.');
    },
    onError: () => notify.error('Error inesperado', 'No se pudo abrir la disputa.'),
  });

  return {
    // Datos
    order,
    isLoading,
    isError,
    refetch,
    // Timer
    secondsLeft,
    isTimerCritical,
    // Rol
    userRole,
    isBuyer,
    isSeller,
    alreadyConfirmed,
    // Acciones
    confirmReady:    confirmMutation.mutate,
    isConfirming:    confirmMutation.isPending,
    cancelOrder:     cancelMutation.mutate,
    isCancelling:    cancelMutation.isPending,
    openDispute:     disputeMutation.mutate,
    isOpeningDispute: disputeMutation.isPending,
  };
}

// ─── HOOK: CREAR ORDEN ────────────────────────────────────────────────────────

/**
 * Hook para la pantalla de confirmación de una nueva orden.
 */
export function useCreateOrder() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (form: CreateOrderForm) => createOrder(user!.id, form),
    onSuccess: ({ data, error }) => {
      if (error) { notify.error('Error', error); return; }
      if (data) {
        // Guardamos la nueva orden en caché
        queryClient.setQueryData(QueryKeys.orders.detail(data.id), data);
        // Invalidamos listas relacionadas
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: QueryKeys.orders.active(user.id) });
          queryClient.invalidateQueries({ queryKey: QueryKeys.orders.all });
        }
        // Invalidamos el marketplace para que la oferta aparezca como 'in_order'
        queryClient.invalidateQueries({ queryKey: QueryKeys.offers.all });
      }
    },
    onError: () => notify.error('Error inesperado', 'No se pudo crear el intercambio.'),
  });

  return {
    createOrder:   mutation.mutate,
    isCreating:    mutation.isPending,
    createdOrder:  mutation.data?.data ?? null,
    error:         mutation.data?.error ?? null,
  };
}

// ─── HOOK: HISTORIAL DE ÓRDENES ───────────────────────────────────────────────

/**
 * Hook para la tab de órdenes: activas y pasadas del usuario.
 */
export function useOrderHistory() {
  const user = useAuthStore((s) => s.user);

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.orders.history(user?.id ?? ''),
    queryFn:  () => fetchOrderHistory(user!.id).then((r) => r.data ?? []),
    enabled:  !!user?.id,
    staleTime: 15 * 1000,   // 15 segundos — el historial cambia con frecuencia
  });

  // Separamos activas de históricas para mostrarlas en secciones
  const activeStatuses  = ['pending', 'both_confirmed', 'buyer_paid', 'disputed'];
  const activeOrders    = orders?.filter((o) => activeStatuses.includes(o.status)) ?? [];
  const historicalOrders = orders?.filter((o) => !activeStatuses.includes(o.status)) ?? [];

  return {
    orders:           orders ?? [],
    activeOrders,
    historicalOrders,
    isLoading,
    isError,
    refetch,
  };
}

// ─── HOOK: ORDEN ACTIVA (para verificar si el usuario puede iniciar una nueva) ──

/**
 * Verifica si el usuario tiene una orden activa.
 * Se usa en la pantalla de oferta antes de mostrar el formulario.
 */
export function useActiveOrder() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: QueryKeys.orders.active(user?.id ?? ''),
    queryFn:  () => fetchActiveOrder(user!.id).then((r) => r.data),
    enabled:  !!user?.id,
    staleTime: 10 * 1000,
  });

  return {
    activeOrder: data ?? null,
    hasActiveOrder: !!data,
    isLoading,
  };
}