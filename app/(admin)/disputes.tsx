/**
 * Disputes — Resolución de disputas activas
 *
 * Muestra las órdenes en disputa con toda la información relevante.
 * El admin puede resolver a favor del comprador (completar orden)
 * o del vendedor (cancelar orden), con un motivo obligatorio.
 */

import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, ShieldAlert, CheckCircle,
  XCircle, User, MessageCircle,
} from 'lucide-react-native';

import { useDisputes } from '@hooks/useAdmin';
import { Button } from '@components/ui/Button';
import { Colors, Spacing, BorderRadius } from '@constants/theme';
import { formatUSDT, formatCUP, formatRelativeTime } from '@utils/format';
import type { DisputeItem } from '@services/admin.service';

const PAYMENT_LABELS: Record<string, string> = {
  transfermovil: 'Transfermóvil',
  enzona:        'EnZona',
  mitransfer:    'MiTransfer',
};

export default function DisputesScreen() {
  const insets = useSafeAreaInsets();
  const {
    disputes, isLoading, refetch,
    resolveBuyer, isResolvingBuyer,
    resolveSeller, isResolvingSeller,
  } = useDisputes();

  const [selected,    setSelected]    = useState<DisputeItem | null>(null);
  const [resolution,  setResolution]  = useState('');
  const [resolveFor,  setResolveFor]  = useState<'buyer' | 'seller' | null>(null);

  function openResolve(item: DisputeItem, side: 'buyer' | 'seller') {
    setSelected(item);
    setResolveFor(side);
    setResolution('');
  }

  function handleResolve() {
    if (!selected || !resolveFor || !resolution.trim()) {
      Alert.alert('Resolución requerida', 'Escribe la resolución antes de confirmar.');
      return;
    }
    const params = { orderId: selected.id, resolution: resolution.trim() };
    if (resolveFor === 'buyer') {
      resolveBuyer(params);
    } else {
      resolveSeller(params);
    }
    setSelected(null);
    setResolveFor(null);
    setResolution('');
  }

  const isResolving = isResolvingBuyer || isResolvingSeller;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: Spacing.screenPadding,
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft color={Colors.textSecondary} size={24} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '700' }}>
            Disputas activas
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
            {disputes.length} en disputa
          </Text>
        </View>
      </View>

      {/* Lista de disputas */}
      <ScrollView
        contentContainerStyle={{ padding: Spacing.screenPadding, gap: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {disputes.length === 0 && !isLoading && (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <ShieldAlert color={Colors.success} size={40} strokeWidth={1.5} />
            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
              Sin disputas activas
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              No hay disputas pendientes de resolución.
            </Text>
          </View>
        )}

        {disputes.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: Colors.danger + '44',
              borderLeftWidth: 3,
              borderLeftColor: Colors.danger,
              overflow: 'hidden',
            }}
          >
            {/* Encabezado */}
            <View style={{
              backgroundColor: Colors.dangerMuted,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderBottomWidth: 1,
              borderBottomColor: Colors.danger + '33',
            }}>
              <ShieldAlert color={Colors.danger} size={16} strokeWidth={2} />
              <Text style={{ color: Colors.danger, fontSize: 12, fontWeight: '700', flex: 1 }}>
                DISPUTA — #{item.id.slice(-6).toUpperCase()}
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                {formatRelativeTime(item.updated_at)}
              </Text>
            </View>

            <View style={{ padding: 14, gap: 12 }}>
              {/* Partes involucradas */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { label: 'Comprador', user: item.buyer },
                  { label: 'Vendedor',  user: item.seller },
                ].map((part) => (
                  <View
                    key={part.label}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.surfaceRaised,
                      borderRadius: 10,
                      padding: 10,
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: '600' }}>
                      {part.label.toUpperCase()}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <User color={Colors.textSecondary} size={13} strokeWidth={2} />
                      <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                        {part.user.full_name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Montos */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Monto</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                    {formatUSDT(Number(item.amount_usdt))}
                  </Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
                    = {formatCUP(Number(item.amount_cup))} · {PAYMENT_LABELS[item.payment_method] ?? item.payment_method}
                  </Text>
                </View>
              </View>

              {/* Motivo de la disputa */}
              {item.dispute_reason && (
                <View style={{
                  backgroundColor: Colors.dangerMuted,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.danger + '33',
                  padding: 12,
                  gap: 4,
                }}>
                  <Text style={{ color: Colors.danger, fontSize: 11, fontWeight: '600' }}>
                    MOTIVO
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                    {item.dispute_reason}
                  </Text>
                </View>
              )}

              {/* Ver chat */}
              <Pressable
                onPress={() => router.push({ pathname: '/(app)/order/[id]', params: { id: item.id } })}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  opacity: pressed ? 0.7 : 1,
                  paddingVertical: 4,
                })}
              >
                <MessageCircle color={Colors.info} size={14} strokeWidth={2} />
                <Text style={{ color: Colors.info, fontSize: 13, fontWeight: '500' }}>
                  Ver chat de la orden
                </Text>
              </Pressable>

              {/* Botones de resolución */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Favorecer comprador"
                    size="sm"
                    onPress={() => openResolve(item, 'buyer')}
                    disabled={isResolving}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Favorecer vendedor"
                    variant="secondary"
                    size="sm"
                    onPress={() => openResolve(item, 'seller')}
                    disabled={isResolving}
                  />
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal: Confirmar resolución */}
      <Modal
        visible={!!resolveFor && !!selected}
        transparent
        animationType="slide"
        onRequestClose={() => { setResolveFor(null); setSelected(null); }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => { setResolveFor(null); setSelected(null); }}
        >
          <Pressable
            style={{
              backgroundColor: Colors.surface,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, gap: 16,
              paddingBottom: 36,
            }}
            onPress={() => {}}
          >
            {/* Encabezado según el lado */}
            <View style={{ alignItems: 'center', gap: 8 }}>
              {resolveFor === 'buyer'
                ? <CheckCircle color={Colors.success} size={28} strokeWidth={2} />
                : <XCircle color={Colors.danger} size={28} strokeWidth={2} />
              }
              <Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
                {resolveFor === 'buyer'
                  ? 'Favorecer al comprador'
                  : 'Favorecer al vendedor'
                }
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                {resolveFor === 'buyer'
                  ? 'La orden se marcará como completada. El comprador recibirá los USDT.'
                  : 'La orden se cancelará. El vendedor no entregará los USDT.'
                }
              </Text>
            </View>

            <TextInput
              style={{
                backgroundColor: Colors.surfaceRaised,
                borderWidth: 1, borderColor: Colors.borderStrong,
                borderRadius: BorderRadius.lg, padding: 14,
                color: Colors.textPrimary, fontSize: 14,
                minHeight: 100, textAlignVertical: 'top',
              }}
              placeholder="Escribe la resolución oficial..."
              placeholderTextColor={Colors.textMuted}
              value={resolution}
              onChangeText={setResolution}
              multiline
              maxLength={400}
            />

            <View style={{ gap: 10 }}>
              <Button
                label="Confirmar resolución"
                variant={resolveFor === 'buyer' ? 'primary' : 'danger'}
                onPress={handleResolve}
                loading={isResolving}
              />
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => { setResolveFor(null); setSelected(null); setResolution(''); }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}