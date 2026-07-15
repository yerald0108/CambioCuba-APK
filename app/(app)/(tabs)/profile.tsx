/**
 * Perfil — Pantalla principal del usuario
 *
 * Secciones:
 * - Cabecera con avatar, nombre y reputación
 * - Estado de verificación KYC con acceso directo
 * - Acciones de cuenta (logout)
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  User, ShieldCheck, ShieldX, Clock,
  ChevronRight, LogOut, ArrowUpCircle,
} from 'lucide-react-native';

import { useAuth } from '@hooks/useAuth';
import { useKyc } from '@hooks/useKyc';
import { Badge } from '@components/ui/Badge';

import { Colors, Spacing } from '@constants/theme';

export default function ProfileScreen() {
  const { user, logout, isTrapichero } = useAuth();
  const { kycStatus, isPending, isApproved, isRejected } = useKyc();

  if (!user) return null;

  // ── Configuración del badge de KYC ────────────────────────────────────────
  const kycBadge = {
    none: { label: 'Sin verificar', variant: 'neutral' as const },
    pending: { label: 'En revisión', variant: 'warning' as const },
    approved: { label: 'Verificado', variant: 'success' as const },
    rejected: { label: 'Rechazado', variant: 'danger' as const },
  }[kycStatus] ?? { label: 'Sin verificar', variant: 'neutral' as const };

  // ── Icono KYC según estado ────────────────────────────────────────────────
  const KycIcon = isPending ? Clock
    : isApproved ? ShieldCheck
      : isRejected ? ShieldX
        : ShieldX;

  const kycIconColor = isPending ? Colors.warning
    : isApproved ? Colors.success
      : Colors.textMuted;



  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>

      {/* ── Header de pantalla ── */}
      <View style={{
        paddingHorizontal: Spacing.screenPadding,
        paddingTop: 16, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
      }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
          Mi Perfil
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Cabecera del perfil ── */}
        <View style={{
          alignItems: 'center',
          paddingVertical: 28,
          paddingHorizontal: Spacing.screenPadding,
          gap: 12,
        }}>
          {/* Avatar */}
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: Colors.accentMuted,
            borderWidth: 2, borderColor: Colors.accent,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <User color={Colors.accent} size={36} strokeWidth={1.8} />
          </View>

          {/* Nombre y rol */}
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '700' }}>
              {user.full_name}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
              {user.email}
            </Text>
            {isTrapichero && (
              <Badge label="Trapichero" variant="warning" />
            )}
          </View>

          {/* Reputación */}
          {user.total_trades > 0 && (
            <View style={{
              flexDirection: 'row', gap: 24,
              paddingVertical: 14, paddingHorizontal: 28,
              backgroundColor: Colors.surface,
              borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
            }}>
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '700' }}>
                  {user.total_trades}
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>Operaciones</Text>
              </View>
              <View style={{ width: 1, backgroundColor: Colors.border }} />
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color: Colors.success, fontSize: 20, fontWeight: '700' }}>
                  {user.total_trades > 0
                    ? `${Math.round((user.successful_trades / user.total_trades) * 100)}%`
                    : '—'}
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>Éxito</Text>
              </View>
              <View style={{ width: 1, backgroundColor: Colors.border }} />
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '700' }}>
                  {user.successful_trades}
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>Completadas</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: Spacing.screenPadding, gap: 12, paddingBottom: 32 }}>

          {/* ── Sección: Verificación de identidad ── */}
          <Text style={{
            color: Colors.textMuted, fontSize: 11, fontWeight: '600',
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4,
          }}>
            Verificación
          </Text>

          {/* Card KYC básico */}
          <Pressable
            onPress={() => router.push('/(app)/kyc/basic')}
            style={({ pressed }) => ({
              backgroundColor: Colors.surface,
              borderRadius: 14, borderWidth: 1,
              borderColor: isApproved ? Colors.success : Colors.border,
              padding: 16, flexDirection: 'row',
              alignItems: 'center', gap: 12,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {/* Icono de estado */}
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: isApproved ? Colors.successMuted
                : isPending ? Colors.warningMuted
                  : isRejected ? Colors.dangerMuted
                    : Colors.surfaceRaised,
              borderWidth: 1,
              borderColor: isApproved ? Colors.success
                : isPending ? Colors.warning
                  : isRejected ? Colors.danger
                    : Colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <KycIcon color={kycIconColor} size={20} strokeWidth={1.8} />
            </View>

            {/* Texto */}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                KYC Básico
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                {isApproved ? 'Identidad verificada — puedes operar'
                  : isPending ? 'Documentos en revisión (hasta 24h)'
                    : isRejected ? 'Rechazado — toca para reenviar'
                      : 'Requerido para operar en el marketplace'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Badge label={kycBadge.label} variant={kycBadge.variant} />
              {!isApproved && (
                <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />
              )}
            </View>
          </Pressable>

          {/* Card KYC avanzado (solo si tiene KYC básico aprobado y no es trapichero) */}
          {isApproved && !isTrapichero && (
            <Pressable
              onPress={() => router.push('/(app)/kyc/advanced')}
              style={({ pressed }) => ({
                backgroundColor: Colors.surface,
                borderRadius: 14, borderWidth: 1,
                borderColor: Colors.border,
                borderLeftWidth: 3, borderLeftColor: Colors.accent,
                padding: 16, flexDirection: 'row',
                alignItems: 'center', gap: 12,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: Colors.accentMuted,
                borderWidth: 1, borderColor: Colors.accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowUpCircle color={Colors.accent} size={20} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                  Convertirte en Trapichero
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                  KYC Avanzado — Publica tus propias ofertas
                </Text>
              </View>
              <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />
            </Pressable>
          )}

          {/* ── Sección: Cuenta ── */}
          <Text style={{
            color: Colors.textMuted, fontSize: 11, fontWeight: '600',
            letterSpacing: 0.8, textTransform: 'uppercase',
            marginTop: 12, marginBottom: 4,
          }}>
            Cuenta
          </Text>

          {/* Cerrar sesión */}
          <Pressable
            onPress={logout}
            style={({ pressed }) => ({
              backgroundColor: Colors.surface,
              borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
              padding: 16, flexDirection: 'row',
              alignItems: 'center', gap: 12,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: Colors.dangerMuted,
              borderWidth: 1, borderColor: Colors.danger,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <LogOut color={Colors.danger} size={20} strokeWidth={1.8} />
            </View>
            <Text style={{ color: Colors.danger, fontSize: 14, fontWeight: '600', flex: 1 }}>
              Cerrar sesión
            </Text>
            <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />
          </Pressable>

          {/* Info de versión */}
          <Text style={{
            color: Colors.textMuted, fontSize: 11,
            textAlign: 'center', marginTop: 8,
          }}>
            CambioCuba v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
