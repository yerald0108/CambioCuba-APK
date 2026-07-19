/**
 * Orden Activa — Pantalla principal del intercambio P2P
 *
 * Muestra el estado actual, timer de cuenta regresiva, chat en tiempo real
 * y botones de acción según el estado y el rol del usuario.
 *
 * Arquitectura de la pantalla:
 * - Header fijo (estado + timer)
 * - FlatList del chat (crece para ocupar el espacio disponible)
 * - ChatInput fijo en la parte inferior
 * - FAB de acciones (confirmar, cancelar, disputar)
 */

import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Alert, TextInput, Modal,
  ActivityIndicator, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Clock, CheckCircle, XCircle, AlertTriangle,
  User, ArrowRight, ShieldAlert, ChevronLeft, ChevronDown,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOrderDetail } from '@hooks/useOrder';
import { useChat } from '@hooks/useChat';
import { ChatBubble } from '@components/chat/ChatBubble';
import { ChatInput } from '@components/chat/ChatInput';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { ErrorState } from '@components/shared/ErrorState';
import { Colors, Spacing } from '@constants/theme';
import {
  formatUSDT, formatCUP, formatRate, formatCountdown,
} from '@utils/format';
import type { OrderStatus } from '@/types/order.types';
import type { ChatMessage } from '@/types/chat.types';

// ─── CONFIGURACIÓN VISUAL DE ESTADOS ─────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
  label:   string;
  color:   string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon:    (color: string) => React.ReactNode;
}> = {
  pending: {
    label:   'Esperando confirmación',
    color:   Colors.warning,
    variant: 'warning',
    icon:    (c) => <Clock color={c} size={14} strokeWidth={2} />,
  },
  both_confirmed: {
    label:   'Ambos confirmados — pago en curso',
    color:   Colors.info,
    variant: 'info',
    icon:    (c) => <ArrowRight color={c} size={14} strokeWidth={2} />,
  },
  buyer_paid: {
    label:   'Comprobante enviado',
    color:   Colors.accent,
    variant: 'warning',
    icon:    (c) => <CheckCircle color={c} size={14} strokeWidth={2} />,
  },
  completed: {
    label:   'Completado',
    color:   Colors.success,
    variant: 'success',
    icon:    (c) => <CheckCircle color={c} size={14} strokeWidth={2} />,
  },
  disputed: {
    label:   'En disputa',
    color:   Colors.danger,
    variant: 'danger',
    icon:    (c) => <ShieldAlert color={c} size={14} strokeWidth={2} />,
  },
  cancelled: {
    label:   'Cancelado',
    color:   Colors.textMuted,
    variant: 'neutral',
    icon:    (c) => <XCircle color={c} size={14} strokeWidth={2} />,
  },
  expired: {
    label:   'Expirado',
    color:   Colors.textMuted,
    variant: 'neutral',
    icon:    (c) => <Clock color={c} size={14} strokeWidth={2} />,
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  transfermovil: 'Transfermóvil',
  enzona:        'EnZona',
  mitransfer:    'MiTransfer',
};

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────

export default function OrderScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const insets    = useSafeAreaInsets();

  const {
    order, isLoading, isError, refetch,
    secondsLeft, isTimerCritical,
    isBuyer, alreadyConfirmed,
    confirmReady, isConfirming,
    cancelOrder, isCancelling,
    openDispute, isOpeningDispute,
  } = useOrderDetail(id ?? '');

  const {
    messages, isLoading: isChatLoading,
    sendMessage, isSending,
    isOwnMessage, listRef,
  } = useChat(id ?? '');

  // ── Modales ───────────────────────────────────────────────────────────────
  const [showOrderInfo,    setShowOrderInfo]    = useState(false);
  const [showCancelModal,  setShowCancelModal]  = useState(false);
  const [cancelReason,     setCancelReason]     = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason,    setDisputeReason]    = useState('');

  // ── Estados derivados ─────────────────────────────────────────────────────
  const isActive  = ['pending', 'both_confirmed', 'buyer_paid', 'disputed'].includes(order?.status ?? '');
  const canCancel = ['pending', 'both_confirmed'].includes(order?.status ?? '');
  const canDispute= ['both_confirmed', 'buyer_paid'].includes(order?.status ?? '');
  const canConfirm= order?.status === 'pending' && !alreadyConfirmed;

  // ── Render de burbuja ─────────────────────────────────────────────────────
  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwn = isOwnMessage(item);
    // Mostrar avatar/nombre solo si el mensaje anterior es de otro remitente
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSender  = !prevMessage || prevMessage.sender_id !== item.sender_id;

    return (
      <ChatBubble
        message={item}
        isOwn={isOwn}
        showSender={showSender}
      />
    );
  }, [isOwnMessage, messages]);

  // ── Pantalla de carga ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <OrderHeader
          insetTop={insets.top}
          title="Intercambio"
          onBack={() => router.back()}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <OrderHeader
          insetTop={insets.top}
          title="Intercambio"
          onBack={() => router.back()}
        />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  const statusConfig  = STATUS_CONFIG[order.status];
  const counterpart   = isBuyer ? (order as any).seller : (order as any).buyer;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleBack() {
    if (isActive) {
      Alert.alert(
        'Salir del intercambio',
        'La orden seguirá activa. Puedes volver desde "Mis intercambios".',
        [
          { text: 'Quedarme', style: 'cancel' },
          { text: 'Salir',    onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }

  function handleConfirm() {
    Alert.alert(
      'Confirmar que estás listo',
      'Cuando ambos confirmen, el timer de 20 minutos comenzará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => confirmReady() },
      ]
    );
  }

  function handleCancel() {
    cancelOrder(cancelReason.trim() || undefined);
    setShowCancelModal(false);
    setCancelReason('');
  }

  function handleOpenDispute() {
    if (!disputeReason.trim()) {
      Alert.alert('Motivo requerido', 'Describe el problema para abrir la disputa.');
      return;
    }
    openDispute(disputeReason.trim());
    setShowDisputeModal(false);
    setDisputeReason('');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* ── Header: estado + timer ── */}
      <OrderHeader
        insetTop={insets.top}
        title={`#${order.id.slice(-6).toUpperCase()}`}
        onBack={handleBack}
        rightSlot={
          /* Botón para ver info de la orden */
          <Pressable
            onPress={() => setShowOrderInfo(true)}
            hitSlop={10}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 6,
            })}
          >
            <ChevronDown color={Colors.textSecondary} size={20} strokeWidth={2} />
          </Pressable>
        }
      >
        {/* Fila de estado */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.screenPadding,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          backgroundColor: Colors.surface,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {statusConfig.icon(statusConfig.color)}
            <Text style={{ color: statusConfig.color, fontSize: 12, fontWeight: '600' }}>
              {statusConfig.label}
            </Text>
          </View>
          <Badge label={statusConfig.label} variant={statusConfig.variant} />
        </View>

        {/* Timer de cuenta regresiva */}
        {order.status === 'both_confirmed' && secondsLeft !== null && (
          <View style={{
            backgroundColor: isTimerCritical ? Colors.dangerMuted : Colors.surfaceRaised,
            borderBottomWidth: 1,
            borderBottomColor: isTimerCritical ? Colors.danger : Colors.border,
            paddingVertical: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}>
            <Clock
              color={isTimerCritical ? Colors.danger : Colors.textMuted}
              size={14} strokeWidth={2}
            />
            <Text style={{
              color: isTimerCritical ? Colors.danger : Colors.textSecondary,
              fontSize: 20,
              fontWeight: '800',
              letterSpacing: 1,
              fontVariant: ['tabular-nums'],
            }}>
              {formatCountdown(secondsLeft)}
            </Text>
            {isTimerCritical && (
              <Text style={{ color: Colors.danger, fontSize: 12 }}>
                ¡Apresúrate!
              </Text>
            )}
          </View>
        )}

        {/* Banner estado no activo */}
        {!isActive && (
          <View style={{
            backgroundColor: Colors.surfaceRaised,
            paddingVertical: 8,
            paddingHorizontal: Spacing.screenPadding,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            alignItems: 'center',
          }}>
            <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
              Este intercambio ha finalizado · El chat es de solo lectura
            </Text>
          </View>
        )}
      </OrderHeader>

      {/* ── Lista de mensajes ── */}
      {isChatLoading && messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.accent} size="small" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingVertical: 12,
            flexGrow: 1,
            justifyContent: messages.length === 0 ? 'center' : 'flex-start',
          }}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                Sin mensajes aún.{'\n'}Saluda al {isBuyer ? 'vendedor' : 'comprador'} para comenzar.
              </Text>
            </View>
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              listRef.current?.scrollToEnd({ animated: false });
            }
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── Botones de acción sobre el chat (cuando la orden lo requiere) ── */}
      {isActive && order.status !== 'disputed' && (
        <View style={{
          paddingHorizontal: Spacing.screenPadding,
          paddingVertical: 8,
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          flexDirection: 'row',
          gap: 8,
        }}>
          {canConfirm && (
            <View style={{ flex: 1 }}>
              <Button
                label="Confirmar listo"
                onPress={handleConfirm}
                loading={isConfirming}
                size="sm"
              />
            </View>
          )}
          {canDispute && (
            <View style={{ flex: canConfirm ? 0 : 1 }}>
              <Button
                label="Disputa"
                variant="secondary"
                onPress={() => setShowDisputeModal(true)}
                size="sm"
                fullWidth={false}
              />
            </View>
          )}
          {canCancel && (
            <View style={{ flex: 0 }}>
              <Button
                label="Cancelar"
                variant="danger"
                onPress={() => setShowCancelModal(true)}
                size="sm"
                fullWidth={false}
              />
            </View>
          )}
        </View>
      )}

      {/* ── Input del chat ── */}
      <ChatInput
        onSend={sendMessage}
        isSending={isSending}
        disabled={!isActive}
      />

      {/* ── Modal: Info de la orden ── */}
      <Modal
        visible={showOrderInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderInfo(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setShowOrderInfo(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.surface,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, gap: 16,
              paddingBottom: Math.max(insets.bottom, 24),
            }}
            onPress={() => {}}
          >
            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
              Detalles del intercambio
            </Text>

            {/* Contraparte */}
            {counterpart && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: Colors.surfaceRaised,
                borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
                padding: 12,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: Colors.accentMuted,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <User color={Colors.accent} size={16} strokeWidth={2} />
                </View>
                <View>
                  <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                    {isBuyer ? 'Vendedor' : 'Comprador'}
                  </Text>
                  <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                    {counterpart.full_name}
                  </Text>
                </View>
              </View>
            )}

            {/* Montos */}
            {[
              { label: 'USDT',           value: formatUSDT(Number(order.amount_usdt)) },
              { label: 'Total CUP',      value: formatCUP(Number(order.amount_cup)),   bold: true },
              { label: 'Tasa',           value: formatRate(Number(order.exchange_rate)) },
              { label: 'Método de pago', value: PAYMENT_LABELS[order.payment_method] ?? order.payment_method },
            ].map((item, i, arr) => (
              <View key={item.label} style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: Colors.border,
              }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>{item.label}</Text>
                <Text style={{
                  color: item.bold ? Colors.textPrimary : Colors.textSecondary,
                  fontSize: item.bold ? 16 : 14,
                  fontWeight: item.bold ? '700' : '400',
                }}>{item.value}</Text>
              </View>
            ))}

            <Button label="Cerrar" variant="ghost" onPress={() => setShowOrderInfo(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal: Cancelar ── */}
      <ConfirmModal
        visible={showCancelModal}
        title="Cancelar intercambio"
        description="¿Estás seguro? Puedes dejar un motivo opcional."
        confirmLabel="Sí, cancelar"
        confirmVariant="danger"
        loading={isCancelling}
        onConfirm={handleCancel}
        onClose={() => { setShowCancelModal(false); setCancelReason(''); }}
      >
        <TextInput
          style={{
            backgroundColor: Colors.surfaceRaised,
            borderWidth: 1, borderColor: Colors.border,
            borderRadius: 12, padding: 12,
            color: Colors.textPrimary, fontSize: 14,
            minHeight: 80, textAlignVertical: 'top',
          }}
          placeholder="Motivo (opcional)"
          placeholderTextColor={Colors.textMuted}
          value={cancelReason}
          onChangeText={setCancelReason}
          multiline
          maxLength={200}
        />
      </ConfirmModal>

      {/* ── Modal: Disputa ── */}
      <ConfirmModal
        visible={showDisputeModal}
        title="Abrir disputa"
        description="Un administrador revisará el caso."
        confirmLabel="Abrir disputa"
        confirmVariant="danger"
        loading={isOpeningDispute}
        onConfirm={handleOpenDispute}
        onClose={() => { setShowDisputeModal(false); setDisputeReason(''); }}
      >
        <TextInput
          style={{
            backgroundColor: Colors.surfaceRaised,
            borderWidth: 1, borderColor: Colors.borderStrong,
            borderRadius: 12, padding: 12,
            color: Colors.textPrimary, fontSize: 14,
            minHeight: 100, textAlignVertical: 'top',
          }}
          placeholder="Describe el problema..."
          placeholderTextColor={Colors.textMuted}
          value={disputeReason}
          onChangeText={setDisputeReason}
          multiline
          maxLength={500}
        />
      </ConfirmModal>
    </KeyboardAvoidingView>
  );
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function OrderHeader({
  insetTop,
  title,
  onBack,
  rightSlot,
  children,
}: {
  insetTop: number;
  title: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ backgroundColor: Colors.surface }}>
      {/* Fila del título */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.screenPadding,
        paddingTop: insetTop + 8,
        paddingBottom: 10,
        gap: 10,
      }}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft color={Colors.textSecondary} size={24} strokeWidth={2} />
        </Pressable>
        <Text style={{
          color: Colors.textPrimary, fontSize: 16,
          fontWeight: '600', flex: 1,
        }}>
          Intercambio {title}
        </Text>
        {rightSlot}
      </View>
      {children}
    </View>
  );
}

function ConfirmModal({
  visible, title, description, confirmLabel,
  confirmVariant = 'danger', loading, onConfirm, onClose, children,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: Colors.surface,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, gap: 16,
          }}
          onPress={() => {}}
        >
          <View style={{ alignItems: 'center', gap: 8 }}>
            <AlertTriangle color={Colors.warning} size={28} strokeWidth={1.8} />
            <Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '700' }}>
              {title}
            </Text>
            <Text style={{
              color: Colors.textSecondary, fontSize: 14,
              textAlign: 'center', lineHeight: 20,
            }}>
              {description}
            </Text>
          </View>
          {children}
          <View style={{ gap: 10 }}>
            <Button label={confirmLabel} variant={confirmVariant} onPress={onConfirm} loading={loading} />
            <Button label="Volver" variant="ghost" onPress={onClose} disabled={loading} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}