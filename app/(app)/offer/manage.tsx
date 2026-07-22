import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, CirclePause, CirclePlay, Plus, Trash2 } from 'lucide-react-native';

import { useMyOffers } from '@hooks/useOffers';
import { EmptyState } from '@components/shared/EmptyState';
import { ErrorState } from '@components/shared/ErrorState';
import { OfferListSkeleton } from '@components/shared/Skeleton';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Colors, Spacing } from '@constants/theme';
import { formatRate, formatUSDT } from '@utils/format';
import type { Offer } from '@/types/offer.types';

const STATUS_BADGE = {
  active: ['Activa', 'success'], paused: ['Pausada', 'warning'], in_order: ['En intercambio', 'info'], completed: ['Agotada', 'neutral'], cancelled: ['Eliminada', 'neutral'],
} as const;

export default function ManageOffersScreen() {
  const { offers, isLoading, isError, refetch, toggleOffer, isToggling, cancelOffer, isCancelling } = useMyOffers();

  function confirmCancel(offer: Offer) {
    Alert.alert('Eliminar oferta', 'La oferta dejará de estar disponible y no se podrá recuperar.', [
      { text: 'Volver', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => cancelOffer(offer.id) },
    ]);
  }

  if (isLoading) return <OfferListSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ paddingTop: 56, paddingHorizontal: Spacing.screenPadding, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><ChevronLeft color={Colors.textSecondary} size={24} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Mis ofertas</Text>
          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>{offers.length} publicadas</Text>
        </View>
        <Button label="Nueva" size="sm" fullWidth={false} leftIcon={<Plus color={Colors.background} size={15} />} onPress={() => router.push('/(app)/offer/create')} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.accent} />} contentContainerStyle={{ padding: Spacing.screenPadding, gap: 12 }}>
        {offers.length === 0 ? (
          <EmptyState icon={<Plus color={Colors.accent} size={28} />} title="Aún no tienes ofertas" description="Publica una oferta para empezar a operar." actionLabel="Crear oferta" onAction={() => router.push('/(app)/offer/create')} />
        ) : offers.map((offer) => {
          const [label, variant] = STATUS_BADGE[offer.status];
          const canToggle = offer.status === 'active' || offer.status === 'paused';
          const canCancel = offer.status !== 'in_order' && offer.status !== 'completed';
          return (
            <View key={offer.id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{offer.type === 'sell' ? 'Venta de USDT' : 'Compra de USDT'}</Text>
                <Badge label={label} variant={variant} />
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}><Text style={{ color: Colors.textMuted, fontSize: 10 }}>DISPONIBLE</Text><Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{formatUSDT(offer.amount_usdt_remaining)}</Text></View>
                <View style={{ flex: 1 }}><Text style={{ color: Colors.textMuted, fontSize: 10 }}>TASA</Text><Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '700' }}>{formatRate(offer.exchange_rate)}</Text></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {canToggle && <Button label={offer.status === 'active' ? 'Pausar' : 'Reactivar'} variant="secondary" size="sm" fullWidth={false} loading={isToggling} leftIcon={offer.status === 'active' ? <CirclePause color={Colors.textPrimary} size={15} /> : <CirclePlay color={Colors.textPrimary} size={15} />} onPress={() => toggleOffer({ id: offer.id, status: offer.status as 'active' | 'paused' })} />}
                {canCancel && <Button label="Eliminar" variant="danger" size="sm" fullWidth={false} loading={isCancelling} leftIcon={<Trash2 color={Colors.textPrimary} size={15} />} onPress={() => confirmCancel(offer)} />}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
