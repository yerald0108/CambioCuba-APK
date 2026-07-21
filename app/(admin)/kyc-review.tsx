/**
 * KYC Review — Revisión de verificaciones pendientes
 *
 * Lista de usuarios con KYC pendiente.
 * El admin puede ver las fotos, aprobar o rechazar con motivo.
 */

import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image,
  RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, ShieldCheck,
  User, Phone, Mail, ImageIcon,
} from 'lucide-react-native';

import { useKycReview } from '@hooks/useAdmin';
import { Button } from '@components/ui/Button';
import { Colors, Spacing, BorderRadius } from '@constants/theme';
import { formatRelativeTime } from '@utils/format';
import type { KycReviewItem } from '@services/admin.service';

export default function KycReviewScreen() {
  const insets = useSafeAreaInsets();
  const { kycList, isLoading, refetch, approveKyc, isApproving, rejectKyc, isRejecting } =
    useKycReview();

  const [selected,      setSelected]      = useState<KycReviewItem | null>(null);
  const [showReject,    setShowReject]     = useState(false);
  const [rejectReason,  setRejectReason]   = useState('');
  const [expandedImage, setExpandedImage]  = useState<string | null>(null);

  function handleApprove(item: KycReviewItem) {
    Alert.alert(
      'Aprobar verificación',
      `¿Aprobar la identidad de ${item.user.full_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: () => {
            approveKyc({ kycId: item.id, userId: item.user_id });
            setSelected(null);
          },
        },
      ]
    );
  }

  function handleReject() {
    if (!selected || !rejectReason.trim()) {
      Alert.alert('Motivo requerido', 'Escribe el motivo del rechazo.');
      return;
    }
    rejectKyc({
      kycId:  selected.id,
      userId: selected.user_id,
      reason: rejectReason.trim(),
    });
    setShowReject(false);
    setSelected(null);
    setRejectReason('');
  }

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
            Verificaciones KYC
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
            {kycList.length} pendientes
          </Text>
        </View>
      </View>

      {/* Lista de KYC */}
      {selected ? (
        /* ── Detalle del KYC seleccionado ── */
        <ScrollView
          contentContainerStyle={{ padding: Spacing.screenPadding, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Info del usuario */}
          <View style={{
            backgroundColor: Colors.surface,
            borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
            padding: 16, gap: 10,
          }}>
            <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '600' }}>
              DATOS DEL SOLICITANTE
            </Text>
            {[
              { icon: <User color={Colors.textMuted} size={14} />,  text: selected.user.full_name },
              { icon: <Mail color={Colors.textMuted} size={14} />,  text: selected.user.email },
              { icon: <Phone color={Colors.textMuted} size={14} />, text: selected.user.phone ?? 'Sin teléfono' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {item.icon}
                <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>{item.text}</Text>
              </View>
            ))}
            <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
              Enviado {formatRelativeTime(selected.submitted_at ?? selected.created_at)}
            </Text>
          </View>

          {/* Fotos */}
          {[
            { label: 'Cara frontal del carnet', url: selected.id_card_front_url },
            { label: 'Cara trasera del carnet', url: selected.id_card_back_url },
            { label: 'Selfie con el carnet',    url: selected.selfie_with_id_url },
          ].map((photo) => (
            <View key={photo.label} style={{ gap: 8 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                {photo.label}
              </Text>
              <Pressable
                onPress={() => photo.url && setExpandedImage(photo.url)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                {photo.url ? (
                  <Image
                    source={{ uri: photo.url }}
                    style={{
                      width: '100%', height: 200,
                      borderRadius: BorderRadius.lg,
                      backgroundColor: Colors.surfaceRaised,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{
                    width: '100%', height: 120,
                    borderRadius: BorderRadius.lg,
                    backgroundColor: Colors.surfaceRaised,
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <ImageIcon color={Colors.textMuted} size={24} strokeWidth={1.5} />
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Sin imagen</Text>
                  </View>
                )}
              </Pressable>
            </View>
          ))}

          {/* Botones de acción */}
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button
              label="Aprobar verificación"
              onPress={() => handleApprove(selected)}
              loading={isApproving}
              size="lg"
            />
            <Button
              label="Rechazar"
              variant="danger"
              onPress={() => setShowReject(true)}
              disabled={isApproving}
            />
            <Button
              label="Volver a la lista"
              variant="ghost"
              onPress={() => setSelected(null)}
            />
          </View>
        </ScrollView>
      ) : (
        /* ── Lista de solicitudes ── */
        <ScrollView
          contentContainerStyle={{ padding: Spacing.screenPadding, gap: 10, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />
          }
          showsVerticalScrollIndicator={false}
        >
          {kycList.length === 0 && !isLoading && (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <ShieldCheck color={Colors.success} size={40} strokeWidth={1.5} />
              <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                Todo al día
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center' }}>
                No hay verificaciones pendientes de revisión.
              </Text>
            </View>
          )}

          {kycList.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelected(item)}
              style={({ pressed }) => ({
                backgroundColor: Colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: Colors.warning + '44',
                borderLeftWidth: 3,
                borderLeftColor: Colors.warning,
                padding: 14,
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                  {item.user.full_name}
                </Text>
                <Text style={{ color: Colors.warning, fontSize: 11, fontWeight: '600' }}>
                  PENDIENTE
                </Text>
              </View>
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
                {item.user.email}
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
                Enviado {formatRelativeTime(item.submitted_at ?? item.created_at)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Modal: Motivo de rechazo */}
      <Modal visible={showReject} transparent animationType="slide" onRequestClose={() => setShowReject(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setShowReject(false)}
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
            <Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '700' }}>
              Motivo del rechazo
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.surfaceRaised,
                borderWidth: 1, borderColor: Colors.borderStrong,
                borderRadius: BorderRadius.lg, padding: 14,
                color: Colors.textPrimary, fontSize: 14,
                minHeight: 100, textAlignVertical: 'top',
              }}
              placeholder="Explica al usuario por qué se rechazó su verificación..."
              placeholderTextColor={Colors.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              maxLength={300}
            />
            <View style={{ gap: 10 }}>
              <Button
                label="Confirmar rechazo"
                variant="danger"
                onPress={handleReject}
                loading={isRejecting}
              />
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => { setShowReject(false); setRejectReason(''); }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Imagen expandida */}
      <Modal
        visible={!!expandedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedImage(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setExpandedImage(null)}
        >
          {expandedImage && (
            <Image
              source={{ uri: expandedImage }}
              style={{ width: '95%', height: '70%', borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}