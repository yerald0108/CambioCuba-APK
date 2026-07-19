/**
 * Mis Intercambios — Tab de órdenes activas e historial
 *
 * Muestra dos secciones:
 * 1. Activos: órdenes en curso (pending, both_confirmed, buyer_paid, disputed)
 * 2. Historial: órdenes terminadas (completed, cancelled, expired)
 */

import { View, Text, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import {
  Clock, CheckCircle, XCircle,
  ArrowRight, ShieldAlert, Inbox,
} from 'lucide-react-native';

import { useOrderHistory } from '@hooks/useOrder';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@components/ui/Badge';
import { LoadingScreen } from '@components/shared/LoadingScreen';
import { ErrorState } from '@components/shared/ErrorState';
import { Colors, Spacing } from '@constants/theme';
import { formatUSDT, formatCUP, formatRelativeTime } from '@utils/format';
import type { Order, OrderStatus } from '@/types/order.types';

// ─── CONFIGURACIÓN DE ESTADO ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
  label:   string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon:    (color: string) => React.ReactNode;
  color:   string;
}> = {
  pending: {
    label: 'Pendiente', variant: 'warning', color: Colors.warning,
    icon: (c) => <Clock color={c} size={14} strokeWidth={2} />,
  },
  both_confirmed: {
    label: 'En proceso', variant: 'info', color: Colors.info,
    icon: (c) => <ArrowRight color={c} size={14} strokeWidth={2} />,
  },
  buyer_paid: {
    label: 'Pago enviado', variant: 'warning', color: Colors.accent,
    icon: (c) => <CheckCircle color={c} size={14} strokeWidth={2} />,
  },
  completed: {
    label: 'Completado', variant: 'success', color: Colors.success,
    icon: (c) => <CheckCircle color={c} size={14} strokeWidth={2} />,
  },
  disputed: {
    label: 'En disputa', variant: 'danger', color: Colors.danger,
    icon: (c) => <ShieldAlert color={c} size={14} strokeWidth={2} />,
  },
  cancelled: {
    label: 'Cancelado', variant: 'neutral', color: Colors.textMuted,
    icon: (c) => <XCircle color={c} size={14} strokeWidth={2} />,
  },
  expired: {
    label: 'Expirado', variant: 'neutral', color: Colors.textMuted,
    icon: (c) => <Clock color={c} size={14} strokeWidth={2} />,
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  transfermovil: 'Transfermóvil',
  enzona:        'EnZona',
  mitransfer:    'MiTransfer',
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { orders, activeOrders, historicalOrders, isLoading, isError, refetch } =
    useOrderHistory();

  if (isLoading) return <LoadingScreen />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  // Combinamos: activos primero, luego histórico, con separadores de sección
  type ListItem =
    | { type: 'header'; title: string; count: number }
    | { type: 'order';  data: Order }
    | { type: 'empty';  message: string };

  const items: ListItem[] = [];

  // Sección activos
  items.push({ type: 'header', title: 'Activos', count: activeOrders.length });
  if (activeOrders.length === 0) {
    items.push({ type: 'empty', message: 'No tienes intercambios en curso' });
  } else {
    activeOrders.forEach((o) => items.push({ type: 'order', data: o }));
  }

  // Sección historial (solo si hay)
  if (historicalOrders.length > 0) {
    items.push({ type: 'header', title: 'Historial', count: historicalOrders.length });
    historicalOrders.forEach((o) => items.push({ type: 'order', data: o }));
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header de la tab */}
      <View style={{
        paddingHorizontal: Spacing.screenPadding,
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '800' }}>
          Mis intercambios
        </Text>
        {orders.length > 0 && (
          <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 2 }}>
            {orders.length} en total
          </Text>
        )}
      </View>

      <FlashList
        data={items}
        keyExtractor={(item, i) => {
          if (item.type === 'order')  return item.data.id;
          if (item.type === 'header') return `header-${item.title}`;
          return `empty-${i}`;
        }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenPadding,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={{
            flex: 1, alignItems: 'center', justifyContent: 'center',
            paddingTop: 80, gap: 12,
          }}>
            <Inbox color={Colors.textMuted} size={40} strokeWidth={1.2} />
            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
              Sin intercambios
            </Text>
            <Text style={{
              color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20,
            }}>
              Tus intercambios aparecerán aquí cuando inicies uno desde el marketplace.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 10, paddingTop: 4,
              }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {item.title.toUpperCase()}
                </Text>
                <View style={{
                  backgroundColor: Colors.surfaceRaised,
                  borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2,
                }}>
                  <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                    {item.count}
                  </Text>
                </View>
              </View>
            );
          }

          if (item.type === 'empty') {
            return (
              <View style={{
                backgroundColor: Colors.surface,
                borderRadius: 14, borderWidth: 1,
                borderColor: Colors.border, borderStyle: 'dashed',
                padding: 20, alignItems: 'center', gap: 6,
              }}>
                <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
                  {item.message}
                </Text>
              </View>
            );
          }

          // Tarjeta de orden
          return <OrderCard order={item.data} />;
        }}
      />
    </View>
  );
}

// ─── TARJETA DE ORDEN ─────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const config = STATUS_CONFIG[order.status];
  const isActive = ['pending', 'both_confirmed', 'buyer_paid', 'disputed'].includes(order.status);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/order/[id]', params: { id: order.id } })}
      style={({ pressed }) => ({
        backgroundColor: Colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isActive ? config.color + '55' : Colors.border,
        borderLeftWidth: 3,
        borderLeftColor: config.color,
        padding: 14,
        gap: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Fila superior: ID + badge de estado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {config.icon(config.color)}
          <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: '600' }}>
            #{order.id.slice(-6).toUpperCase()}
          </Text>
        </View>
        <Badge label={config.label} variant={config.variant} />
      </View>

      {/* Montos */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
          {formatUSDT(Number(order.amount_usdt))}
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
          = {formatCUP(Number(order.amount_cup))}
        </Text>
      </View>

      {/* Método de pago + fecha */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{
          backgroundColor: Colors.surfaceRaised,
          borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
            {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
          </Text>
        </View>
        <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
          {formatRelativeTime(order.created_at)}
        </Text>
      </View>

      {/* Indicador "activo" pulsante — solo para órdenes en curso */}
      {isActive && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.border,
        }}>
          <View style={{
            width: 7, height: 7, borderRadius: 99,
            backgroundColor: config.color,
          }} />
          <Text style={{ color: config.color, fontSize: 12, fontWeight: '500' }}>
            Intercambio en curso — toca para ver
          </Text>
        </View>
      )}
    </Pressable>
  );
}