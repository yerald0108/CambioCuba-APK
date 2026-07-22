/**
 * Marketplace — Pantalla principal
 *
 * Muestra las ofertas activas del mercado con filtros.
 * Maneja 4 estados: cargando, vacío, error, lista.
 * Guard: si el usuario no tiene KYC básico aprobado, muestra banner.
 */

import { View, Text, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { LayoutGrid, ShieldAlert, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOffers } from '@hooks/useOffers';
import { useAuth } from '@hooks/useAuth';
import { OfferCard } from '@components/offer/OfferCard';
import { OfferFilters } from '@components/offer/OfferFilters';
import { EmptyState } from '@components/shared/EmptyState';
import { ErrorState } from '@components/shared/ErrorState';
import { OfferListSkeleton } from '@components/shared/Skeleton';
import { Button } from '@components/ui/Button';
import { Colors, Spacing } from '@constants/theme';
import type { Offer } from '@/types/offer.types';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { hasBasicKyc, isTrapichero } = useAuth();
  const {
    offers,
    isLoading,
    isError,
    refetch,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useOffers();

  function handleOfferPress(offer: Offer) {
    router.push(`/(app)/offer/${offer.id}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>

      {/* ── Header ── */}
      <View style={{
        paddingHorizontal: Spacing.screenPadding,
        paddingTop: insets.top + 12,
        paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LayoutGrid color={Colors.accent} size={20} strokeWidth={1.8} />
          <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
            Mercado
          </Text>
        </View>

        {/* Botón crear oferta — solo para Trapicheros */}
        {isTrapichero && (
          <Button
            label="Nueva oferta"
            onPress={() => router.push('/(app)/offer/create')}
            variant="primary"
            size="sm"
            fullWidth={false}
            leftIcon={<Plus color="#0A0E1A" size={14} strokeWidth={2.5} />}
          />
        )}
      </View>

      {/* ── Banner KYC — si no está verificado ── */}
      {!hasBasicKyc && (
        <View style={{
          margin: Spacing.screenPadding,
          padding: 14,
          backgroundColor: Colors.warningMuted,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.warning,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
          <ShieldAlert color={Colors.warning} size={20} strokeWidth={2} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: Colors.warning, fontSize: 13, fontWeight: '600' }}>
              Verifica tu identidad para operar
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12, lineHeight: 16 }}>
              Puedes ver las ofertas, pero necesitas verificación para iniciar un intercambio.
            </Text>
            <Button
              label="Verificarme ahora"
              onPress={() => router.push('/(app)/kyc/basic')}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          </View>
        </View>
      )}

      {/* ── Filtros ── */}
      <OfferFilters
        filters={filters}
        onUpdate={updateFilter}
        onClear={clearFilters}
        hasActive={hasActiveFilters}
      />

      {/* ── Lista de ofertas ── */}
      {isLoading ? (
        <OfferListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlashList
          data={offers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.screenPadding }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          renderItem={({ item }) => (
            <OfferCard offer={item} onPress={handleOfferPress} />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={<LayoutGrid color={Colors.textMuted} size={28} strokeWidth={1.5} />}
                title={hasActiveFilters ? 'Sin resultados' : 'Sin ofertas disponibles'}
                description={
                  hasActiveFilters
                    ? 'Ninguna oferta coincide con los filtros seleccionados. Intenta cambiarlos.'
                    : 'Aún no hay ofertas en el marketplace. Vuelve más tarde.'
                }
                actionLabel={hasActiveFilters ? 'Limpiar filtros' : undefined}
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}
