/**
 * ChatBubble — Burbuja individual de mensaje en el chat
 *
 * Tres variantes visuales:
 * - own:    mensaje propio (derecha, fondo dorado oscuro)
 * - other:  mensaje del contraparte (izquierda, fondo surface)
 * - system: evento del sistema (centrado, fondo neutro)
 */

import { View, Text } from 'react-native';
import { Colors, BorderRadius } from '@constants/theme';
import { getInitials } from '@utils/format';
import type { ChatMessage } from '@/types/chat.types';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  /** Mostrar el avatar/nombre — false si el mensaje anterior es del mismo remitente */
  showSender: boolean;
}

export function ChatBubble({ message, isOwn, showSender }: ChatBubbleProps) {

  // ── Mensaje del sistema ────────────────────────────────────────────────────
  if (message.type === 'system') {
    return (
      <View style={{
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 6,
      }}>
        <View style={{
          backgroundColor: Colors.surfaceRaised,
          borderRadius: 99,
          paddingHorizontal: 14,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: Colors.border,
        }}>
          <Text style={{
            color: Colors.textMuted,
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 16,
          }}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  // ── Mensaje de texto (propio o del otro) ───────────────────────────────────
  const senderName = message.sender?.full_name ?? 'Usuario';
  const initials   = getInitials(senderName);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 2,
      // Propio: alinear a la derecha; otro: a la izquierda
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
    }}>

      {/* Avatar del contraparte (izquierda) */}
      {!isOwn && (
        <View style={{ width: 28, marginBottom: 2 }}>
          {showSender ? (
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: Colors.accentMuted,
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                color: Colors.accent,
                fontSize: 10,
                fontWeight: '700',
              }}>
                {initials}
              </Text>
            </View>
          ) : (
            // Espacio reservado para alinear burbujas consecutivas
            <View style={{ width: 28, height: 28 }} />
          )}
        </View>
      )}

      {/* Burbuja del mensaje */}
      <View style={{ maxWidth: '72%', gap: 3 }}>
        {/* Nombre del remitente (solo en el primero de una secuencia) */}
        {!isOwn && showSender && (
          <Text style={{
            color: Colors.textMuted,
            fontSize: 11,
            fontWeight: '500',
            marginLeft: 4,
          }}>
            {senderName}
          </Text>
        )}

        <View style={{
          backgroundColor: isOwn ? Colors.accentMuted : Colors.surface,
          borderRadius: BorderRadius.lg,
          // Esquina afilada en el lado del remitente
          borderBottomRightRadius: isOwn ? 4 : BorderRadius.lg,
          borderBottomLeftRadius:  isOwn ? BorderRadius.lg : 4,
          borderWidth: 1,
          borderColor: isOwn ? Colors.accent + '40' : Colors.border,
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 4,
        }}>
          <Text style={{
            color: isOwn ? Colors.accentSoft : Colors.textPrimary,
            fontSize: 14,
            lineHeight: 20,
          }}>
            {message.content}
          </Text>

          {/* Timestamp */}
          <Text style={{
            color: isOwn ? Colors.accent + '99' : Colors.textMuted,
            fontSize: 10,
            alignSelf: 'flex-end',
          }}>
            {formatMessageTime(message.created_at)}
          </Text>
        </View>
      </View>

      {/* Espacio reservado en mensajes propios para alinear con los del otro */}
      {isOwn && <View style={{ width: 28 }} />}
    </View>
  );
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

/** Formatea la hora del mensaje en HH:MM */
function formatMessageTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('es-CU', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}