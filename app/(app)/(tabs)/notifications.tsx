/**
 * Notificaciones — Pantalla de historial de notificaciones in-app
 *
 * Muestra las últimas 50 notificaciones del usuario con:
 * - Indicador visual de no leída (punto dorado)
 * - Tipo de notificación con ícono semántico
 * - Tiempo relativo
 * - Tap para navegar a la orden/pantalla relacionada
 * - Botón "Marcar todas como leídas"
 */

import { useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, ArrowLeftRight, ShieldCheck, MessageCircle,
  Info, CheckCheck,
} from 'lucide-react-native';

import { useAuthStore } from '@stores/auth.store';
import { QueryKeys } from '@lib/queryClient';
import {
  fetchNotifications,
  markAllAsRead,
  markAsRead,
} from '@services/notifications.service';
import { Colors, Spacing } from '@constants/theme';
import { formatRelativeTime } from '@utils/format';
import type { AppNotificationRecord } from '@services/notifications.service';

// ─── CONFIGURACIÓN VISUAL POR TIPO ────────────────────────────────────────────

const TYPE_CONFIG = {
  order: {
    icon: (color: string) => <ArrowLeftRight color={color} size={16} strokeWidth={2} />,
    color: Colors.info,
  },
  kyc: {
    icon: (color: string) => <ShieldCheck color={color} size={16} strokeWidth={2} />,
    color: Colors.success,
  },
  chat: {
    icon: (color: string) => <MessageCircle color={color} size={16} strokeWidth={2} />,
    color: Colors.accent,
  },
  system: {
    icon: (color: string) => <Info color={color} size={16} strokeWidth={2} />,
    color: Colors.textMuted,
  },
};

// ─── PANTALLA ─────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets      = useSafeAreaInsets();
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // ── Cargar notificaciones ──────────────────────────────────────────────────
  const {
    data: notifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.notifications.list(user?.id ?? ''),
    queryFn:  () => fetchNotifications(user!.id).then((r) => r.data ?? []),
    enabled:  !!user?.id,
  });

  // ── Marcar todas como leídas al abrir la pantalla ─────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    markAllAsRead(user.id).then(() => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.notifications.unread(user.id),
      });
    });
  }, [user?.id, queryClient]);

  // ── Mutación: marcar todas como leídas (botón manual) ─────────────────────
  const markAllMutation = useMutation({
    mutationFn: () => markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.notifications.list(user!.id),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.notifications.unread(user!.id),
      });
    },
  });

  // ── Tap en una notificación ────────────────────────────────────────────────
  const handleTap = useCallback(async (item: AppNotificationRecord) => {
    // Marcar como leída
    if (!item.is_read) {
      await markAsRead(item.id);
      queryClient.invalidateQueries({
        queryKey: QueryKeys.notifications.list(user!.id),
      });
    }

    // Navegar según el tipo
    if (item.type === 'order' || item.type === 'chat') {
      const orderId = item.data?.order_id;
      if (orderId) {
        router.push({ pathname: '/(app)/order/[id]', params: { id: orderId } });
      }
    } else if (item.type === 'kyc') {
      router.push('/(app)/kyc/basic');
    }
  }, [queryClient, user?.id]);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>

      {/* ── Header ── */}
      <View style={{
        paddingHorizontal: Spacing.screenPadding,
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Bell color={Colors.accent} size={20} strokeWidth={1.8} />
          <Text style={{
            color: Colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
          }}>
            Notificaciones
          </Text>
          {unreadCount > 0 && (
            <View style={{
              backgroundColor: Colors.accent,
              borderRadius: 99,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 5,
            }}>
              <Text style={{
                color: Colors.background,
                fontSize: 11,
                fontWeight: '700',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Marcar todas como leídas */}
        {unreadCount > 0 && (
          <Pressable
            onPress={() => markAllMutation.mutate()}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
          >
            <CheckCheck color={Colors.accent} size={18} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* ── Lista ── */}
      <FlashList
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 80,
              gap: 12,
            }}>
              <Bell color={Colors.textMuted} size={40} strokeWidth={1.2} />
              <Text style={{
                color: Colors.textPrimary,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Sin notificaciones
              </Text>
              <Text style={{
                color: Colors.textMuted,
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 20,
                paddingHorizontal: 32,
              }}>
                Aquí aparecerán las actualizaciones de tus intercambios y verificación.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <NotificationItem item={item} onTap={handleTap} />
        )}
      />
    </View>
  );
}

// ─── ITEM DE NOTIFICACIÓN ─────────────────────────────────────────────────────

function NotificationItem({
  item,
  onTap,
}: {
  item: AppNotificationRecord;
  onTap: (item: AppNotificationRecord) => void;
}) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
  const isNavigable = item.type === 'order' || item.type === 'chat' || item.type === 'kyc';

  return (
    <Pressable
      onPress={() => isNavigable && onTap(item)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: 14,
        backgroundColor: item.is_read ? 'transparent' : Colors.accentMuted + '22',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {/* Ícono del tipo */}
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: config.color + '22',
        borderWidth: 1,
        borderColor: config.color + '44',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
      }}>
        {config.icon(config.color)}
      </View>

      {/* Contenido */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <Text
            style={{
              color: item.is_read ? Colors.textSecondary : Colors.textPrimary,
              fontSize: 14,
              fontWeight: item.is_read ? '400' : '600',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>

        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {item.body}
        </Text>
      </View>

      {/* Punto de no leída */}
      {!item.is_read && (
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: Colors.accent,
          marginTop: 6,
        }} />
      )}
    </Pressable>
  );
}