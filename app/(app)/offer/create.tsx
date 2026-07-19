/**
 * Crear Oferta — Solo para Trapicheros
 *
 * Formulario completo con:
 * - Selector de tipo (Venta/Compra)
 * - Cantidad total de USDT
 * - Tasa de cambio CUP/USDT
 * - Mínimo y máximo por orden
 * - Métodos de pago (multi-selección)
 * - Nota opcional
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, TrendingDown, Info } from 'lucide-react-native';

import { useMyOffers } from '@hooks/useOffers';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { Colors, Spacing, BusinessRules } from '@constants/theme';
import { formatCUP } from '@utils/format';
import type { CreateOfferForm } from '@/types/offer.types';
import type { PaymentMethodId, OfferTypeId } from '@constants/theme';

export default function CreateOfferScreen() {
  const { createOffer, isCreating } = useMyOffers();

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [type,           setType]           = useState<OfferTypeId>('sell');
  const [amountUsdt,     setAmountUsdt]     = useState('');
  const [exchangeRate,   setExchangeRate]   = useState('');
  const [minOrder,       setMinOrder]       = useState('');
  const [maxOrder,       setMaxOrder]       = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodId[]>([]);
  const [notes,          setNotes]          = useState('');
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  // ── Cálculo del total estimado ────────────────────────────────────────────
  const totalCup = amountUsdt && exchangeRate
    ? parseFloat(amountUsdt) * parseFloat(exchangeRate)
    : null;

  // ── Toggle método de pago ─────────────────────────────────────────────────
  const toggleMethod = useCallback((id: PaymentMethodId) => {
    setPaymentMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }, []);

  // ── Validación ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(amountUsdt);
    const rate   = parseFloat(exchangeRate);
    const min    = parseFloat(minOrder);
    const max    = parseFloat(maxOrder);

    if (!amountUsdt || isNaN(amount) || amount <= 0)
      newErrors.amount = 'Ingresa una cantidad válida mayor a 0';
    if (!exchangeRate || isNaN(rate) || rate <= 0)
      newErrors.rate = 'Ingresa una tasa de cambio válida';
    if (!minOrder || isNaN(min) || min <= 0)
      newErrors.min = 'Ingresa un monto mínimo válido';
    if (!maxOrder || isNaN(max) || max <= 0)
      newErrors.max = 'Ingresa un monto máximo válido';
    if (!isNaN(min) && !isNaN(max) && min > max)
      newErrors.min = 'El mínimo no puede ser mayor al máximo';
    if (!isNaN(max) && !isNaN(amount) && max > amount)
      newErrors.max = 'El máximo no puede superar la cantidad total';
    if (paymentMethods.length === 0)
      newErrors.payment = 'Selecciona al menos un método de pago';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Enviar ────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!validate()) return;

    const form: CreateOfferForm = {
      type,
      amount_usdt:    parseFloat(amountUsdt),
      exchange_rate:  parseFloat(exchangeRate),
      min_order_usdt: parseFloat(minOrder),
      max_order_usdt: parseFloat(maxOrder),
      payment_methods: paymentMethods,
      notes:          notes.trim() || undefined,
    };

    createOffer(form, {
      onSuccess: () => router.replace('/(app)/(tabs)'),
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Nueva oferta" showBack />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.screenPadding, gap: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Tipo de oferta ── */}
        <View style={{ gap: 10 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
            Tipo de oferta
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {BusinessRules.offerTypes.map((t) => {
              const isSelected = type === t.id;
              const Icon = t.id === 'sell' ? TrendingDown : TrendingUp;
              const color = t.id === 'sell' ? Colors.accent : Colors.success;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setType(t.id)}
                  style={({ pressed }) => ({
                    flex: 1, padding: 14,
                    backgroundColor: isSelected ? (t.id === 'sell' ? Colors.accentMuted : Colors.successMuted) : Colors.surface,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? color : Colors.border,
                    alignItems: 'center', gap: 6,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Icon color={isSelected ? color : Colors.textMuted} size={22} strokeWidth={1.8} />
                  <Text style={{
                    color: isSelected ? color : Colors.textSecondary,
                    fontSize: 14, fontWeight: '600',
                  }}>
                    {t.label} USDT
                  </Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 11, textAlign: 'center' }}>
                    {t.id === 'sell' ? 'Recibes CUP' : 'Pagas CUP'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Cantidad y tasa ── */}
        <View style={{ gap: 14 }}>
          <Input
            label="Cantidad total de USDT"
            placeholder="Ej: 100"
            value={amountUsdt}
            onChangeText={setAmountUsdt}
            error={errors.amount}
            keyboardType="decimal-pad"
            leftIcon={<Text style={{ color: Colors.textMuted, fontSize: 15 }}>₮</Text>}
          />
          <Input
            label="Tasa de cambio (CUP por USDT)"
            placeholder="Ej: 350"
            value={exchangeRate}
            onChangeText={setExchangeRate}
            error={errors.rate}
            keyboardType="decimal-pad"
            leftIcon={<Text style={{ color: Colors.textMuted, fontSize: 13 }}>$</Text>}
          />

          {/* Total estimado */}
          {totalCup !== null && totalCup > 0 && (
            <View style={{
              backgroundColor: Colors.surfaceRaised,
              borderRadius: 10, padding: 12,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Valor total estimado</Text>
              <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '700' }}>
                {formatCUP(totalCup)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Límites por orden ── */}
        <View style={{ gap: 14 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
            Límites por operación
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Mínimo (USDT)"
                placeholder="Ej: 10"
                value={minOrder}
                onChangeText={setMinOrder}
                error={errors.min}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Máximo (USDT)"
                placeholder="Ej: 50"
                value={maxOrder}
                onChangeText={setMaxOrder}
                error={errors.max}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* ── Métodos de pago ── */}
        <View style={{ gap: 10 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
            Métodos de pago aceptados
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BusinessRules.paymentMethods.map((m) => {
              const isSelected = paymentMethods.includes(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMethod(m.id)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16, paddingVertical: 10,
                    borderRadius: 99, borderWidth: 1,
                    borderColor: isSelected ? Colors.accent : Colors.border,
                    backgroundColor: isSelected ? Colors.accentMuted : Colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{
                    color: isSelected ? Colors.accent : Colors.textSecondary,
                    fontSize: 13, fontWeight: isSelected ? '600' : '400',
                  }}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.payment && (
            <Text style={{ color: Colors.danger, fontSize: 12 }}>{errors.payment}</Text>
          )}
        </View>

        {/* ── Nota opcional ── */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
            Nota adicional (opcional)
          </Text>
          <View style={{
            backgroundColor: Colors.surfaceRaised,
            borderWidth: 1, borderColor: Colors.border,
            borderRadius: 12, padding: 14,
          }}>
            <TextInput
              style={{ color: Colors.textPrimary, fontSize: 14, minHeight: 72, textAlignVertical: 'top' }}
              placeholder="Instrucciones adicionales para el comprador..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
            />
          </View>
          <Text style={{ color: Colors.textMuted, fontSize: 11, textAlign: 'right' }}>
            {notes.length}/500
          </Text>
        </View>

        {/* ── Aviso ── */}
        <View style={{
          backgroundColor: Colors.infoMuted,
          borderRadius: 10, padding: 12,
          flexDirection: 'row', gap: 8,
        }}>
          <Info color={Colors.info} size={14} strokeWidth={2} style={{ marginTop: 1 }} />
          <Text style={{ color: Colors.textSecondary, fontSize: 12, lineHeight: 17, flex: 1 }}>
            Tu oferta será visible en el marketplace inmediatamente. Puedes pausarla o eliminarla en cualquier momento desde tu perfil.
          </Text>
        </View>

        {/* ── Botón publicar ── */}
        <Button
          label="Publicar oferta"
          onPress={handleSubmit}
          loading={isCreating}
          size="lg"
        />
      </ScrollView>
    </View>
  );
}
