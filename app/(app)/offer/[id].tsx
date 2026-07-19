/**
 * Detalle de Oferta — Pantalla completa
 *
 * Muestra:
 * - Información completa de la oferta
 * - Perfil y reputación del Trapichero
 * - Formulario para seleccionar cantidad y método de pago
 * - Botón para iniciar la orden
 *
 * Guards:
 * - KYC básico requerido para iniciar orden
 * - No puede iniciar si ya tiene una orden activa
 * - No puede tomar su propia oferta
 */

import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  User, TrendingUp, TrendingDown,
  ShieldCheck, AlertCircle, CheckCircle,
} from 'lucide-react-native';

import { fetchOfferById } from '@services/offers.service';
import { QueryKeys } from '@lib/queryClient';
import { useAuth } from '@hooks/useAuth';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { ErrorState } from '@components/shared/ErrorState';
import { Colors, Spacing } from '@constants/theme';
import { formatUSDT, formatCUP, formatReputation } from '@utils/format';

const PAYMENT_LABELS: Record<string, string> = {
  transfermovil: 'Transfermóvil',
  enzona: 'EnZona',
  mitransfer: 'MiTransfer',
};

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, hasBasicKyc } = useAuth();

  const [amountUsdt, setAmountUsdt]         = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const { data: offer, isLoading, isError, refetch } = useQuery({
    queryKey: QueryKeys.offers.detail(id ?? ''),
    queryFn:  () => fetchOfferById(id!).then((r) => r.data),
    enabled:  !!id,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Detalle de oferta" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </View>
    );
  }

  if (isError || !offer) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Detalle de oferta" showBack />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  const isSell       = offer.type === 'sell';
  const accentColor  = isSell ? Colors.accent : Colors.success;
  const isOwnOffer   = offer.trapichero_id === user?.id;
  const parsedAmount = parseFloat(amountUsdt);
  const isValidAmount =
    !isNaN(parsedAmount) &&
    parsedAmount >= Number(offer.min_order_usdt) &&
    parsedAmount <= Number(offer.max_order_usdt) &&
    parsedAmount <= Number(offer.amount_usdt_remaining);

  const totalCup = isValidAmount && selectedMethod
    ? parsedAmount * Number(offer.exchange_rate)
    : null;

  const successRate = offer.trapichero
    ? formatReputation(offer.trapichero.successful_trades, offer.trapichero.total_trades)
    : null;

  function handleStartOrder() {
    if (!hasBasicKyc) {
      Alert.alert(
        'Verificación requerida',
        'Necesitas verificar tu identidad antes de operar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Verificarme', onPress: () => router.push('/(app)/kyc/basic') },
        ]
      );
      return;
    }

    if (!isValidAmount || !selectedMethod) return;

    // Navegar a la pantalla de crear orden (Fase 7)
    if (!offer) return;
    router.push({
      pathname: '/(app)/order/create',
      params: {
        offer_id:       offer.id,
        amount_usdt:    parsedAmount.toString(),
        payment_method: selectedMethod,
        exchange_rate:  offer.exchange_rate.toString(),
      },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Detalle de oferta" showBack />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.screenPadding, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card principal de la oferta ── */}
        <View style={{
          backgroundColor: Colors.surface,
          borderRadius: 16,
          borderWidth: 1, borderColor: Colors.border,
          borderLeftWidth: 3, borderLeftColor: accentColor,
          padding: 16, gap: 14,
        }}>
          {/* Tipo y tasa */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isSell
                ? <TrendingDown color={accentColor} size={20} strokeWidth={2} />
                : <TrendingUp color={accentColor} size={20} strokeWidth={2} />
              }
              <Badge
                label={isSell ? 'Vende USDT' : 'Compra USDT'}
                variant={isSell ? 'warning' : 'success'}
              />
            </View>
            {offer.status === 'in_order' && (
              <Badge label="En proceso" variant="info" />
            )}
          </View>

          {/* Tasa prominente */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 12, marginBottom: 4 }}>
              Tasa de cambio
            </Text>
            <Text style={{ color: accentColor, fontSize: 32, fontWeight: '800', letterSpacing: -1 }}>
              {Number(offer.exchange_rate).toLocaleString('es-CU')}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>CUP por USDT</Text>
          </View>

          {/* Grid de datos */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'DISPONIBLE',   value: formatUSDT(Number(offer.amount_usdt_remaining)) },
              { label: 'MÍN. ORDEN',  value: formatUSDT(Number(offer.min_order_usdt)) },
              { label: 'MÁX. ORDEN',  value: formatUSDT(Number(offer.max_order_usdt)) },
            ].map((item) => (
              <View key={item.label} style={{
                flex: 1, backgroundColor: Colors.surfaceRaised,
                borderRadius: 10, padding: 10, gap: 2, alignItems: 'center',
              }}>
                <Text style={{ color: Colors.textMuted, fontSize: 9, fontWeight: '600' }}>
                  {item.label}
                </Text>
                <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Métodos de pago */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '600' }}>
              MÉTODOS DE PAGO
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {offer.payment_methods.map((m) => (
                <View key={m} style={{
                  backgroundColor: Colors.surfaceRaised,
                  borderRadius: 99, borderWidth: 1, borderColor: Colors.border,
                  paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                    {PAYMENT_LABELS[m] ?? m}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Nota del Trapichero */}
          {offer.notes && (
            <View style={{
              backgroundColor: Colors.surfaceRaised,
              borderRadius: 10, padding: 10, gap: 4,
            }}>
              <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '600' }}>NOTA</Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                {offer.notes}
              </Text>
            </View>
          )}
        </View>

        {/* ── Perfil del Trapichero ── */}
        {offer.trapichero && (
          <View style={{
            backgroundColor: Colors.surface,
            borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
            padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: Colors.accentMuted,
              borderWidth: 1, borderColor: Colors.accent,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <User color={Colors.accent} size={20} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                {offer.trapichero.full_name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShieldCheck color={Colors.success} size={12} strokeWidth={2} />
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                  Trapichero verificado
                </Text>
              </View>
              {successRate && (
                <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                  {successRate}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── Formulario de orden ── */}
        {!isOwnOffer && offer.status !== 'cancelled' && (
          <View style={{
            backgroundColor: Colors.surface,
            borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
            padding: 16, gap: 14,
          }}>
            <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
              Iniciar intercambio
            </Text>

            {/* Input de cantidad */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                Cantidad de USDT
              </Text>
              <View style={{
                backgroundColor: Colors.surfaceRaised,
                borderWidth: 1,
                borderColor: amountUsdt && !isValidAmount ? Colors.danger : Colors.border,
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <Text style={{ color: Colors.textMuted, fontSize: 16 }}>₮</Text>
                <TextInput
                  style={{ flex: 1, color: Colors.textPrimary, fontSize: 16, padding: 0 }}
                  placeholder={`${offer.min_order_usdt} – ${offer.max_order_usdt}`}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={amountUsdt}
                  onChangeText={setAmountUsdt}
                />
              </View>
              {amountUsdt !== '' && !isValidAmount && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AlertCircle color={Colors.danger} size={12} strokeWidth={2} />
                  <Text style={{ color: Colors.danger, fontSize: 12 }}>
                    El monto debe estar entre {formatUSDT(Number(offer.min_order_usdt))} y {formatUSDT(Number(offer.max_order_usdt))}
                  </Text>
                </View>
              )}
            </View>

            {/* Selector de método de pago */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                Método de pago
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {offer.payment_methods.map((method) => {
                  const isSelected = selectedMethod === method;
                  return (
                    <View
                      key={method}
                      style={{ position: 'relative' }}
                    >
                      <Button
                        label={PAYMENT_LABELS[method] ?? method}
                        variant={isSelected ? 'primary' : 'secondary'}
                        size="sm"
                        fullWidth={false}
                        onPress={() => setSelectedMethod(isSelected ? null : method)}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Total calculado */}
            {totalCup !== null && (
              <View style={{
                backgroundColor: Colors.surfaceRaised,
                borderRadius: 12, padding: 14,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Total a pagar</Text>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
                    {formatCUP(totalCup)}
                  </Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                    via {PAYMENT_LABELS[selectedMethod!]}
                  </Text>
                </View>
              </View>
            )}

            {/* Aviso de seguridad */}
            <View style={{
              backgroundColor: Colors.infoMuted,
              borderRadius: 10, padding: 10,
              flexDirection: 'row', gap: 8,
            }}>
              <CheckCircle color={Colors.info} size={14} strokeWidth={2} style={{ marginTop: 1 }} />
              <Text style={{ color: Colors.textSecondary, fontSize: 11, lineHeight: 16, flex: 1 }}>
                CambioCuba no toca el dinero. El pago se realiza directamente entre tú y el Trapichero.
              </Text>
            </View>

            {/* Botón iniciar */}
            <Button
              label="Iniciar intercambio"
              onPress={handleStartOrder}
              disabled={!isValidAmount || !selectedMethod || offer.status === 'in_order'}
              size="lg"
            />

            {offer.status === 'in_order' && (
              <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: 'center' }}>
                Esta oferta tiene un intercambio en proceso. Intenta de nuevo más tarde.
              </Text>
            )}
          </View>
        )}

        {/* Banner si es su propia oferta */}
        {isOwnOffer && (
          <View style={{
            padding: 14, backgroundColor: Colors.surfaceRaised,
            borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
            flexDirection: 'row', gap: 8,
          }}>
            <AlertCircle color={Colors.textMuted} size={16} strokeWidth={2} />
            <Text style={{ color: Colors.textSecondary, fontSize: 13, flex: 1 }}>
              Esta es tu oferta. No puedes operar contigo mismo.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
