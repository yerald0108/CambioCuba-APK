/**
 * Pantalla KYC Básico — CambioCuba
 *
 * Estados manejados:
 * - none     → Formulario para subir documentos
 * - pending  → Mensaje de espera de revisión
 * - approved → Pantalla de éxito
 * - rejected → Mensaje de rechazo con opción de reenvío
 */

import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  ShieldCheck, Clock, AlertTriangle, CheckCircle,
} from 'lucide-react-native';

import { useKyc } from '@hooks/useKyc';

import { PhotoPicker } from '@components/ui/PhotoPicker';
import { Button } from '@components/ui/Button';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { ErrorState } from '@components/shared/ErrorState';
import { Colors, Spacing } from '@constants/theme';

export default function KycBasicScreen() {
  const {
    kycDocument,
    isPending,
    isApproved,
    isRejected,
    isLoading,
    isError,
    refetch,
    submitKyc,
    isSubmitting,
    uploadProgress,
  } = useKyc();

  const [frontUri,  setFrontUri]  = useState<string | null>(null);
  const [backUri,   setBackUri]   = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const allPhotosSelected = !!frontUri && !!backUri && !!selfieUri;

  // ── Carga inicial ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Verificación de identidad" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Verificación de identidad" showBack />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  // ── KYC Aprobado ───────────────────────────────────────────────────────────
  if (isApproved) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Verificación de identidad" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: Colors.successMuted, borderWidth: 1, borderColor: Colors.success,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck color={Colors.success} size={40} strokeWidth={1.8} />
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
            Identidad verificada
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
            Tu identidad ha sido verificada exitosamente.{'\n'}
            Ya puedes operar en el marketplace de CambioCuba.
          </Text>
          <Button label="Ir al Marketplace" onPress={() => router.replace('/(app)/(tabs)')} size="lg" />
        </View>
      </View>
    );
  }

  // ── KYC Pendiente ──────────────────────────────────────────────────────────
  if (isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScreenHeader title="Verificación de identidad" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: Colors.warningMuted, borderWidth: 1, borderColor: Colors.warning,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock color={Colors.warning} size={40} strokeWidth={1.8} />
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
            En revisión
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
            Tus documentos están siendo revisados por nuestro equipo.{'\n'}
            Este proceso puede tardar hasta 24 horas.
          </Text>
          <View style={{
            width: '100%', padding: 16, backgroundColor: Colors.surface,
            borderRadius: 12, borderWidth: 1, borderColor: Colors.border, gap: 8,
          }}>
            {['Cara frontal del carnet', 'Cara trasera del carnet', 'Selfie sosteniendo el carnet'].map((item) => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle color={Colors.success} size={16} strokeWidth={2} />
                <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── Formulario (none o rejected) ───────────────────────────────────────────
  function handleSubmit() {
    if (!allPhotosSelected) return;
    submitKyc({ id_card_front_uri: frontUri!, id_card_back_uri: backUri!, selfie_uri: selfieUri! });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Verificación de identidad" subtitle="KYC Básico" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Banner de rechazo */}
        {isRejected && (
          <View style={{
            margin: Spacing.screenPadding, padding: 14,
            backgroundColor: Colors.dangerMuted, borderRadius: 12,
            borderWidth: 1, borderColor: Colors.danger,
            flexDirection: 'row', gap: 10,
          }}>
            <AlertTriangle color={Colors.danger} size={18} strokeWidth={2} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.danger, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
                Verificación rechazada
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
                {kycDocument?.rejection_reason ?? 'Los documentos no cumplen los requisitos. Intenta de nuevo con fotos más claras.'}
              </Text>
            </View>
          </View>
        )}

        <View style={{ padding: Spacing.screenPadding, gap: 20 }}>

          {/* Info del proceso */}
          <View style={{
            padding: 16, backgroundColor: Colors.surface,
            borderRadius: 14, borderWidth: 1, borderColor: Colors.border, gap: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ShieldCheck color={Colors.accent} size={20} strokeWidth={1.8} />
              <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                ¿Por qué verificamos tu identidad?
              </Text>
            </View>
            <Text style={{ color: Colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
              Para garantizar la seguridad de todos, es obligatorio verificar tu identidad antes de realizar intercambios P2P.
            </Text>
            {[
              'Foto frontal de tu carnet de identidad',
              'Foto trasera de tu carnet de identidad',
              'Selfie sosteniendo tu carnet',
            ].map((text, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 99,
                  backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <Text style={{ color: Colors.textSecondary, fontSize: 13, flex: 1 }}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Fotos */}
          <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16, marginTop: 4 }}>
            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
              Documentos requeridos
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              Sube las 3 fotos para continuar
            </Text>
          </View>

          <PhotoPicker
            label="1. Cara frontal del carnet"
            description="La foto debe ser legible. Evita reflejos y sombras."
            value={frontUri}
            onChange={setFrontUri}
            disabled={isSubmitting}
          />
          <PhotoPicker
            label="2. Cara trasera del carnet"
            description="Asegúrate de que el texto sea visible y nítido."
            value={backUri}
            onChange={setBackUri}
            disabled={isSubmitting}
          />
          <PhotoPicker
            label="3. Selfie sosteniendo el carnet"
            description="Tu cara y el carnet deben verse claramente en la misma foto."
            value={selfieUri}
            onChange={setSelfieUri}
            disabled={isSubmitting}
          />

          {/* Progreso de subida */}
          {isSubmitting && uploadProgress && (
            <View style={{
              padding: 16, backgroundColor: Colors.surface,
              borderRadius: 12, borderWidth: 1, borderColor: Colors.border, gap: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={Colors.accent} size="small" />
                <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
                  {uploadProgress.label}
                </Text>
              </View>
              <View style={{ height: 4, backgroundColor: Colors.surfaceRaised, borderRadius: 99, overflow: 'hidden' }}>
                <View style={{
                  height: 4, backgroundColor: Colors.accent, borderRadius: 99,
                  width: `${(uploadProgress.step / uploadProgress.total) * 100}%`,
                }} />
              </View>
              <Text style={{ color: Colors.textMuted, fontSize: 11, textAlign: 'right' }}>
                Paso {uploadProgress.step} de {uploadProgress.total}
              </Text>
            </View>
          )}

          {/* Aviso privacidad */}
          <View style={{
            padding: 12, backgroundColor: Colors.surface,
            borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
            flexDirection: 'row', gap: 8,
          }}>
            <ShieldCheck color={Colors.textMuted} size={14} strokeWidth={2} style={{ marginTop: 1 }} />
            <Text style={{ color: Colors.textMuted, fontSize: 11, lineHeight: 16, flex: 1 }}>
              Tus documentos se almacenan de forma segura y encriptada. Solo los administradores
              de CambioCuba pueden acceder a ellos para verificar tu identidad.
            </Text>
          </View>

          <Button
            label={isRejected ? 'Reenviar documentos' : 'Enviar para verificación'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!allPhotosSelected || isSubmitting}
            size="lg"
          />

          {!allPhotosSelected && !isSubmitting && (
            <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: 'center' }}>
              Debes subir las 3 fotos para continuar
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
