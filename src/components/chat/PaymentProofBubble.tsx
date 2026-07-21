/**
 * PaymentProofBubble — Burbuja especial para el comprobante de pago
 *
 * Muestra la imagen del comprobante con:
 * - Etiqueta "Comprobante de pago" en la parte superior
 * - La imagen táctil (para verla en grande — Fase futura)
 * - Botón "Confirmar pago recibido" visible SOLO para el vendedor
 *   cuando el estado de la orden es 'buyer_paid'
 */

import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { ShieldCheck, ImageIcon } from 'lucide-react-native';
import { Colors, BorderRadius } from '@constants/theme';
import type { ChatMessage } from '@/types/chat.types';

interface PaymentProofBubbleProps {
  message: ChatMessage;
  isSeller: boolean;          // Solo el vendedor ve el botón de confirmar
  canConfirm: boolean;        // true solo cuando order.status === 'buyer_paid'
  onConfirm: () => void;
  isConfirming: boolean;
}

export function PaymentProofBubble({
  message,
  isSeller,
  canConfirm,
  onConfirm,
  isConfirming,
}: PaymentProofBubbleProps) {
  const senderName = message.sender?.full_name ?? 'Comprador';

  return (
    <View style={{
      paddingHorizontal: 12,
      paddingVertical: 4,
      alignItems: 'center',   // Centrado en la pantalla — destaca como evento
    }}>
      <View style={{
        width: '85%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        borderColor: Colors.accent + '66',
        overflow: 'hidden',
      }}>

        {/* ── Encabezado dorado ── */}
        <View style={{
          backgroundColor: Colors.accentMuted,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <ShieldCheck color={Colors.accent} size={16} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '700' }}>
              COMPROBANTE DE PAGO
            </Text>
            <Text style={{ color: Colors.accentSoft, fontSize: 11, marginTop: 1 }}>
              Enviado por {senderName}
            </Text>
          </View>
          <Text style={{ color: Colors.accent + '99', fontSize: 10 }}>
            {formatMessageTime(message.created_at)}
          </Text>
        </View>

        {/* ── Imagen del comprobante ── */}
        <Pressable
          onPress={() => {/* Expandir imagen — Fase futura */}}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          {message.content ? (
            <Image
              source={{ uri: message.content }}
              style={{
                width: '100%',
                height: 220,
                backgroundColor: Colors.surfaceRaised,
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              width: '100%',
              height: 160,
              backgroundColor: Colors.surfaceRaised,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <ImageIcon color={Colors.textMuted} size={28} strokeWidth={1.5} />
              <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
                No se pudo cargar la imagen
              </Text>
            </View>
          )}
        </Pressable>

        {/* ── Botón de confirmar (solo visible para el vendedor) ── */}
        {isSeller && canConfirm && (
          <Pressable
            onPress={onConfirm}
            disabled={isConfirming}
            style={({ pressed }) => ({
              backgroundColor: isConfirming
                ? Colors.surfaceRaised
                : Colors.success,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {isConfirming ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <ShieldCheck color="#fff" size={16} strokeWidth={2} />
            )}
            <Text style={{
              color: isConfirming ? Colors.textMuted : '#fff',
              fontSize: 14,
              fontWeight: '700',
            }}>
              {isConfirming ? 'Confirmando...' : 'Confirmar pago recibido'}
            </Text>
          </Pressable>
        )}

        {/* ── Mensaje de espera para el comprador ── */}
        {!isSeller && canConfirm && (
          <View style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            alignItems: 'center',
          }}>
            <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: 'center' }}>
              Esperando que el vendedor confirme el pago recibido…
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function formatMessageTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('es-CU', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}