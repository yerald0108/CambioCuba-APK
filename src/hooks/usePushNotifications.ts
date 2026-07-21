/**
 * usePushNotifications — Inicialización y gestión de notificaciones push
 *
 * Responsabilidades:
 * - Registrar el token del dispositivo en Supabase al montar
 * - Escuchar notificaciones que llegan con la app abierta (foreground)
 * - Manejar el tap en una notificación (deep link a la orden/KYC)
 * - Suscripción Realtime a la tabla notifications para actualizar el badge
 *
 * Se usa UNA SOLA VEZ en el root layout para inicializar todo.
 */

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as ExpoNotifications from 'expo-notifications';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@lib/supabase';
import { QueryKeys } from '@lib/queryClient';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import {
  registerPushToken,
  fetchUnreadCount,
} from '@services/notifications.service';

// ─── CONFIGURACIÓN GLOBAL ─────────────────────────────────────────────────────

// Cómo mostrar las notificaciones cuando la app está en primer plano
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────

export function usePushNotifications() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const notificationListener = useRef<ExpoNotifications.EventSubscription | null>(null);
  const responseListener     = useRef<ExpoNotifications.EventSubscription | null>(null);

  // ── Contador de no leídas (para el badge) ─────────────────────────────────
  const { data: unreadCount = 0 } = useQuery({
    queryKey: QueryKeys.notifications.unread(user?.id ?? ''),
    queryFn:  () => fetchUnreadCount(user!.id),
    enabled:  !!user?.id,
    // Refrescar cada 60 segundos como fallback al Realtime
    refetchInterval: 60 * 1000,
  });

  // ── Registrar token y configurar listeners ─────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Registrar el push token del dispositivo
    registerPushToken(user.id);

    // Listener: notificación recibida con la app en primer plano
    // Mostramos un toast in-app en lugar del banner del sistema
    notificationListener.current = ExpoNotifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content;
        if (title) {
          notify.info(title, body ?? undefined);
        }
        // Invalidar el contador de no leídas
        queryClient.invalidateQueries({
          queryKey: QueryKeys.notifications.unread(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.notifications.list(user.id),
        });
      }
    );

    // Listener: el usuario tocó una notificación (app en fondo o cerrada)
    responseListener.current = ExpoNotifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        handleNotificationTap(data);
      }
    );

    // Limpiar listeners al desmontar
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id, queryClient]);

  // ── Suscripción Realtime a notificaciones nuevas ───────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Nueva notificación en BD → actualizar badge
          queryClient.invalidateQueries({
            queryKey: QueryKeys.notifications.unread(user.id),
          });
          queryClient.invalidateQueries({
            queryKey: QueryKeys.notifications.list(user.id),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // ── Refrescar al volver a primer plano ────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.notifications.unread(user.id),
        });
      }
    });

    return () => subscription.remove();
  }, [user?.id, queryClient]);

  return { unreadCount };
}

// ─── DEEP LINK AL TOCAR UNA NOTIFICACIÓN ─────────────────────────────────────

/**
 * Navega a la pantalla correcta según el tipo de notificación.
 * El campo `data` viene del payload de la Edge Function de Supabase.
 */
function handleNotificationTap(data: Record<string, string>) {
  if (!data?.type) return;

  switch (data.type) {
    case 'order':
      if (data.order_id) {
        router.push({
          pathname: '/(app)/order/[id]',
          params: { id: data.order_id },
        });
      }
      break;

    case 'kyc':
      router.push('/(app)/kyc/basic');
      break;

    case 'chat':
      if (data.order_id) {
        router.push({
          pathname: '/(app)/order/[id]',
          params: { id: data.order_id },
        });
      }
      break;

    default:
      // Navegar a notificaciones para otros tipos
      router.push('/(app)/(tabs)/' as never);
      break;
  }
}