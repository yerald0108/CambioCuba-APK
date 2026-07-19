/**
 * OfferCard — Tarjeta de oferta en el marketplace
 *
 * Diseño "Vault Dark":
 * - Borde izquierdo dorado para ventas, verde para compras
 * - Badge del tipo de oferta
 * - Tasa grande y prominente
 * - Métodos de pago como pills
 * - Reputación del Trapichero
 */

import { View, Text, Pressable } from 'react-native';
import { User, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react-native';
import { Badge } from '@components/ui/Badge';
import { Colors, BorderRadius } from '@constants/theme';
import { formatUSDT } from '@utils/format';
import type { Offer } from '@/types/offer.types';

// ─── CONFIGURACIÓN POR TIPO ───────────────────────────────────────────────────

const TYPE_CONFIG = {
  sell: {
    label:       'Vende USDT',
    accentColor: Colors.accent,         // Dorado — venta
    icon:        TrendingDown,
    badgeVariant: 'warning' as const,
  },
  buy: {
    label:       'Compra USDT',
    accentColor: Colors.success,        // Verde — compra
    icon:        TrendingUp,
    badgeVariant: 'success' as const,
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  transfermovil: 'Transfermóvil',
  enzona:        'EnZona',
  mitransfer:    'MiTransfer',
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

interface OfferCardProps {
  offer: Offer;
  onPress: (offer: Offer) => void;
}

export function OfferCard({ offer, onPress }: OfferCardProps) {
  const config      = TYPE_CONFIG[offer.type];
  const Icon        = config.icon;
  const isInOrder   = offer.status === 'in_order';
  const successRate = offer.trapichero
    ? Math.round((offer.trapichero.successful_trades / Math.max(offer.trapichero.total_trades, 1)) * 100)
    : 0;

  return (
    <Pressable
      onPress={() => onPress(offer)}
      style={({ pressed }) => ({
        backgroundColor:  Colors.surface,
        borderRadius:     BorderRadius.xl,
        borderWidth:      1,
        borderColor:      Colors.border,
        borderLeftWidth:  3,
        borderLeftColor:  config.accentColor,
        marginBottom:     12,
        overflow:         'hidden',
        opacity:          pressed ? 0.85 : 1,
      })}
    >
      {/* ── Cuerpo de la card ── */}
      <View style={{ padding: 14, gap: 12 }}>

        {/* Fila superior: tipo + estado + tasa */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: isInOrder ? Colors.surfaceRaised : `${config.accentColor}20`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon
                color={isInOrder ? Colors.textMuted : config.accentColor}
                size={16}
                strokeWidth={2}
              />
            </View>
            <Badge
              label={config.label}
              variant={isInOrder ? 'neutral' : config.badgeVariant}
            />
            {isInOrder && (
              <Badge label="En proceso" variant="info" />
            )}
          </View>

          {/* Tasa de cambio — prominente */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{
              color:      config.accentColor,
              fontSize:   18,
              fontWeight: '700',
              letterSpacing: -0.3,
            }}>
              {offer.exchange_rate.toLocaleString('es-CU')}
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: 10 }}>CUP / USDT</Text>
          </View>
        </View>

        {/* Fila de montos */}
        <View style={{
          flexDirection: 'row',
          gap: 8,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: Colors.surfaceRaised,
            borderRadius: BorderRadius.md,
            padding: 10,
            gap: 2,
          }}>
            <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: '500' }}>
              DISPONIBLE
            </Text>
            <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              {formatUSDT(Number(offer.amount_usdt_remaining))}
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: Colors.surfaceRaised,
            borderRadius: BorderRadius.md,
            padding: 10,
            gap: 2,
          }}>
            <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: '500' }}>
              LÍMITES
            </Text>
            <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
              {formatUSDT(Number(offer.min_order_usdt))} – {formatUSDT(Number(offer.max_order_usdt))}
            </Text>
          </View>
        </View>

        {/* Métodos de pago */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {offer.payment_methods.map((method) => (
            <View
              key={method}
              style={{
                backgroundColor: Colors.surfaceRaised,
                borderRadius:    99,
                borderWidth:     1,
                borderColor:     Colors.border,
                paddingHorizontal: 10,
                paddingVertical:   4,
              }}
            >
              <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '500' }}>
                {PAYMENT_LABELS[method] ?? method}
              </Text>
            </View>
          ))}
        </View>

        {/* Fila inferior: trapichero + flecha */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: Colors.surfaceRaised,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <User color={Colors.textMuted} size={12} strokeWidth={2} />
            </View>
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              {offer.trapichero?.full_name ?? 'Trapichero'}
            </Text>
            {offer.trapichero && offer.trapichero.total_trades > 0 && (
              <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                · {successRate}% ({offer.trapichero.total_trades} ops)
              </Text>
            )}
          </View>

          <ArrowRight color={Colors.textMuted} size={16} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}
