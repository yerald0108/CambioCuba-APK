/**
 * OfferFilters — Panel de filtros del marketplace
 *
 * Filtros disponibles:
 * - Tipo: Venta / Compra
 * - Método de pago: Transfermóvil / EnZona / MiTransfer
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@constants/theme';
import { BusinessRules } from '@constants/theme';
import type { OfferFilters as Filters } from '@/types/offer.types';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface OfferFiltersProps {
  filters: Filters;
  onUpdate: (key: keyof Filters, value: unknown) => void;
  onClear: () => void;
  hasActive: boolean;
}

// ─── CHIP REUTILIZABLE ────────────────────────────────────────────────────────

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical:   8,
        borderRadius:      99,
        borderWidth:       1,
        borderColor:       selected ? Colors.accent : Colors.border,
        backgroundColor:   selected ? Colors.accentMuted : Colors.surface,
        opacity:           pressed ? 0.7 : 1,
      })}
    >
      <Text style={{
        color:      selected ? Colors.accent : Colors.textSecondary,
        fontSize:   13,
        fontWeight: selected ? '600' : '400',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function OfferFilters({ filters, onUpdate, onClear, hasActive }: OfferFiltersProps) {
  return (
    <View style={{
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingVertical: 12,
      gap: 10,
    }}>

      {/* Fila 1: Tipo de oferta */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <FilterChip
          label="Todos"
          selected={!filters.type}
          onPress={() => onUpdate('type', undefined)}
        />
        {BusinessRules.offerTypes.map((t) => (
          <FilterChip
            key={t.id}
            label={t.label}
            selected={filters.type === t.id}
            onPress={() => onUpdate('type', filters.type === t.id ? undefined : t.id)}
          />
        ))}
      </ScrollView>

      {/* Fila 2: Métodos de pago */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
      >
        <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '500' }}>
          PAGO:
        </Text>
        {BusinessRules.paymentMethods.map((m) => (
          <FilterChip
            key={m.id}
            label={m.label}
            selected={filters.payment_method === m.id}
            onPress={() =>
              onUpdate('payment_method', filters.payment_method === m.id ? undefined : m.id)
            }
          />
        ))}

        {/* Botón limpiar filtros */}
        {hasActive && (
          <Pressable
            onPress={onClear}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 99,
              backgroundColor: Colors.dangerMuted,
              borderWidth: 1,
              borderColor: Colors.danger,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <X color={Colors.danger} size={12} strokeWidth={2.5} />
            <Text style={{ color: Colors.danger, fontSize: 12, fontWeight: '600' }}>
              Limpiar
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
