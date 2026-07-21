/**
 * RatingModal — Modal de calificación mutua al completar una orden
 *
 * Aparece automáticamente cuando la orden llega a 'completed'.
 * El usuario califica al contraparte con 1-5 estrellas y un
 * comentario opcional antes de poder salir de la pantalla.
 *
 * Diseño: bottom sheet con estrellas grandes y táctiles.
 */

import { useState } from 'react';
import {
  View, Text, Modal, Pressable, TextInput,
  ActivityIndicator,
} from 'react-native';
import { Star, CheckCircle } from 'lucide-react-native';
import { Colors, BorderRadius, Spacing } from '@constants/theme';
import { useRating } from '@hooks/useRating';
import { Button } from '@components/ui/Button';
import type { RateOrderForm } from '@/types/order.types';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface RatingModalProps {
  visible: boolean;
  orderId: string;
  ratedUserId: string;
  ratedUserName: string;
  role: 'buyer' | 'seller';      // Rol del usuario actual
  onDismiss: () => void;          // Llamado después de calificar o si ya calificó
}

// ─── ETIQUETAS POR PUNTUACIÓN ─────────────────────────────────────────────────

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Muy mala experiencia',  color: Colors.danger },
  2: { label: 'Mala experiencia',      color: Colors.danger },
  3: { label: 'Experiencia regular',   color: Colors.warning },
  4: { label: 'Buena experiencia',     color: Colors.success },
  5: { label: '¡Excelente experiencia!', color: Colors.success },
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function RatingModal({
  visible,
  orderId,
  ratedUserId,
  ratedUserName,
  role,
  onDismiss,
}: RatingModalProps) {
  const [score,   setScore]   = useState(5);
  const [comment, setComment] = useState('');

  const { alreadyRated, isCheckingRated, submitRating, isSubmitting, isSuccess } =
    useRating(orderId, ratedUserId, role);

  function handleSubmit() {
    if (score < 1) return;
    const form: RateOrderForm = {
      score,
      comment: comment.trim() || undefined,
    };
    submitRating(form);
  }

  // Si ya calificó o se acaba de enviar, mostramos el estado de éxito
  const showSuccess = isSuccess || alreadyRated;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        // Permitir cerrar solo si ya calificó
        if (showSuccess) onDismiss();
      }}
    >
      <View style={{
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: Colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: Spacing.screenPadding,
          gap: 20,
          paddingBottom: 36,
        }}>

          {/* ── Indicador de agarre ── */}
          <View style={{
            width: 36, height: 4,
            backgroundColor: Colors.borderStrong,
            borderRadius: 99,
            alignSelf: 'center',
          }} />

          {/* ── Estado de éxito ── */}
          {showSuccess ? (
            <SuccessState
              userName={ratedUserName}
              alreadyRated={alreadyRated}
              onDismiss={onDismiss}
            />
          ) : isCheckingRated ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : (
            /* ── Formulario de calificación ── */
            <>
              {/* Encabezado */}
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: 20,
                  fontWeight: '800',
                  textAlign: 'center',
                }}>
                  ¿Cómo fue la experiencia?
                </Text>
                <Text style={{
                  color: Colors.textSecondary,
                  fontSize: 14,
                  textAlign: 'center',
                  lineHeight: 20,
                }}>
                  Califica tu intercambio con{'\n'}
                  <Text style={{ color: Colors.accent, fontWeight: '600' }}>
                    {ratedUserName}
                  </Text>
                </Text>
              </View>

              {/* Estrellas interactivas */}
              <View style={{ alignItems: 'center', gap: 10 }}>
                <View style={{
                  flexDirection: 'row',
                  gap: 10,
                  justifyContent: 'center',
                }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setScore(star)}
                      hitSlop={8}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Star
                        size={44}
                        strokeWidth={1.5}
                        color={star <= score ? Colors.accent : Colors.borderStrong}
                        fill={star <= score ? Colors.accent : 'transparent'}
                      />
                    </Pressable>
                  ))}
                </View>

                {/* Etiqueta de puntuación */}
                {score > 0 && (
                  <Text style={{
                    color: SCORE_LABELS[score]?.color ?? Colors.textSecondary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    {SCORE_LABELS[score]?.label}
                  </Text>
                )}
              </View>

              {/* Comentario opcional */}
              <View style={{ gap: 8 }}>
                <Text style={{
                  color: Colors.textSecondary,
                  fontSize: 13,
                  fontWeight: '500',
                }}>
                  Comentario opcional
                </Text>
                <TextInput
                  style={{
                    backgroundColor: Colors.surfaceRaised,
                    borderWidth: 1,
                    borderColor: Colors.borderStrong,
                    borderRadius: BorderRadius.lg,
                    padding: 14,
                    color: Colors.textPrimary,
                    fontSize: 14,
                    lineHeight: 20,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="¿Algo que destacar de este intercambio?"
                  placeholderTextColor={Colors.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={300}
                />
                <Text style={{
                  color: Colors.textMuted,
                  fontSize: 11,
                  alignSelf: 'flex-end',
                }}>
                  {comment.length}/300
                </Text>
              </View>

              {/* Botón enviar */}
              <Button
                label="Enviar calificación"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={score < 1}
                size="lg"
              />

              {/* Opción de omitir */}
              <Pressable
                onPress={onDismiss}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  paddingVertical: 8,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
                  Omitir por ahora
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── SUBCOMPONENTE: ESTADO DE ÉXITO ──────────────────────────────────────────

function SuccessState({
  userName,
  alreadyRated,
  onDismiss,
}: {
  userName: string;
  alreadyRated: boolean;
  onDismiss: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 16, paddingVertical: 12 }}>
      <View style={{
        width: 64, height: 64,
        borderRadius: 32,
        backgroundColor: Colors.successMuted,
        borderWidth: 1,
        borderColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CheckCircle color={Colors.success} size={30} strokeWidth={2} />
      </View>

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{
          color: Colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
          textAlign: 'center',
        }}>
          {alreadyRated ? 'Ya calificaste este intercambio' : '¡Gracias por calificar!'}
        </Text>
        <Text style={{
          color: Colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        }}>
          {alreadyRated
            ? `Ya enviaste tu calificación a ${userName} anteriormente.`
            : `Tu calificación a ${userName} ayuda a mejorar la confianza en el marketplace.`
          }
        </Text>
      </View>

      <Button
        label="Cerrar"
        variant="secondary"
        onPress={onDismiss}
        size="lg"
      />
    </View>
  );
}