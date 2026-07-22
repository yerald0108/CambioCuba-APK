/**
 * Perfil — Pantalla principal del usuario
 *
 * Secciones:
 * - Cabecera con avatar, nombre y reputación
 * - Estado de verificación KYC con acceso directo
 * - Acciones de cuenta (logout)
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User, ShieldCheck, ShieldX, Clock,
  ChevronRight, LogOut, ArrowUpCircle, List,
} from 'lucide-react-native';

import { useAuth } from '@hooks/useAuth';
import { useKyc } from '@hooks/useKyc';
import { Badge } from '@components/ui/Badge';
import { Colors } from '@constants/theme';

export default function ProfileScreen() {
  const { user, logout, isTrapichero } = useAuth();
  const { kycStatus, isPending, isApproved, isRejected } = useKyc();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  // ── Badge KYC ─────────────────────────────────────────────────────────────
  const kycBadge = {
    none:     { label: 'Sin verificar', variant: 'neutral'  as const },
    pending:  { label: 'En revisión',   variant: 'warning'  as const },
    approved: { label: 'Verificado',    variant: 'success'  as const },
    rejected: { label: 'Rechazado',     variant: 'danger'   as const },
  }[kycStatus] ?? { label: 'Sin verificar', variant: 'neutral' as const };

  // ── Icono KYC ─────────────────────────────────────────────────────────────
  const KycIcon = isPending  ? Clock
                : isApproved ? ShieldCheck
                : ShieldX;

  const kycIconBg  = isPending  ? Colors.warningMuted
                   : isApproved ? Colors.successMuted
                   : isRejected ? Colors.dangerMuted
                   : Colors.surfaceRaised;

  const kycBorderC = isPending  ? Colors.warning
                   : isApproved ? Colors.success
                   : isRejected ? Colors.danger
                   : Colors.border;

  const kycIconCol = isPending  ? Colors.warning
                   : isApproved ? Colors.success
                   : Colors.textMuted;

  return (
    <View style={s.screen}>

      {/* ── Header con safe area ── */}
      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Text style={s.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Avatar y datos ── */}
        <View style={s.profileBlock}>
          <View style={s.avatar}>
            <User color={Colors.accent} size={36} strokeWidth={1.8} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user.full_name}</Text>
            <Text style={s.profileEmail}>{user.email}</Text>
            {isTrapichero && <Badge label="Trapichero" variant="warning" />}
          </View>
          {user.total_trades > 0 && (
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNum}>{user.total_trades}</Text>
                <Text style={s.statLabel}>Operaciones</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: Colors.success }]}>
                  {`${Math.round((user.successful_trades / user.total_trades) * 100)}%`}
                </Text>
                <Text style={s.statLabel}>Éxito</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNum}>{user.successful_trades}</Text>
                <Text style={s.statLabel}>Completadas</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Verificación ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Verificación</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(app)/kyc/basic')}
            style={[s.card, isApproved && { borderColor: Colors.success }]}
          >
            <View style={[s.cardIcon, { backgroundColor: kycIconBg, borderColor: kycBorderC }]}>
              <KycIcon color={kycIconCol} size={20} strokeWidth={1.8} />
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardTitle}>KYC Básico</Text>
              <Text style={s.cardSub}>
                {isApproved ? 'Identidad verificada — puedes operar'
                : isPending  ? 'Documentos en revisión (hasta 24h)'
                : isRejected ? 'Rechazado — toca para reenviar'
                : 'Requerido para operar en el marketplace'}
              </Text>
            </View>
            <View style={s.cardRight}>
              <Badge label={kycBadge.label} variant={kycBadge.variant} />
              {!isApproved && <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />}
            </View>
          </TouchableOpacity>

          {isApproved && !isTrapichero && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(app)/kyc/advanced')}
              style={[s.card, s.cardAccentLeft]}
            >
              <View style={[s.cardIcon, { backgroundColor: Colors.accentMuted, borderColor: Colors.accent }]}>
                <ArrowUpCircle color={Colors.accent} size={20} strokeWidth={1.8} />
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>Convertirte en Trapichero</Text>
                <Text style={s.cardSub}>KYC Avanzado — Publica tus propias ofertas</Text>
              </View>
              <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {isTrapichero && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Ofertas</Text>
            <TouchableOpacity activeOpacity={0.75} onPress={() => router.push('/(app)/offer/manage')} style={s.card}>
              <View style={[s.cardIcon, { backgroundColor: Colors.accentMuted, borderColor: Colors.accent }]}>
                <List color={Colors.accent} size={20} strokeWidth={1.8} />
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>Gestionar mis ofertas</Text>
                <Text style={s.cardSub}>Pausa, reactiva o elimina tus publicaciones</Text>
              </View>
              <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Cuenta ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Cuenta</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={logout}
            style={s.card}
          >
            <View style={[s.cardIcon, { backgroundColor: Colors.dangerMuted, borderColor: Colors.danger }]}>
              <LogOut color={Colors.danger} size={20} strokeWidth={1.8} />
            </View>
            <Text style={[s.cardTitle, s.cardTitleDanger, s.flex1]}>Cerrar sesión</Text>
            <ChevronRight color={Colors.textMuted} size={16} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text style={s.version}>CambioCuba v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: Colors.background },
  flex1:          { flex: 1 },
  // Header
  header:         { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:    { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  // Profile block
  profileBlock:   { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16, gap: 12 },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentMuted, borderWidth: 2, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  profileInfo:    { alignItems: 'center', gap: 6 },
  profileName:    { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  profileEmail:   { color: Colors.textSecondary, fontSize: 13 },
  // Stats
  statsRow:       { flexDirection: 'row', gap: 24, paddingVertical: 14, paddingHorizontal: 28, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  statItem:       { alignItems: 'center', gap: 2 },
  statNum:        { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  statLabel:      { color: Colors.textSecondary, fontSize: 11 },
  statDivider:    { width: 1, backgroundColor: Colors.border },
  // Section
  section:        { paddingHorizontal: 16, gap: 10, marginBottom: 4 },
  sectionLabel:   { color: Colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 12, marginBottom: 2 },
  // Card — flexDirection ROW es la clave
  card:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  cardAccentLeft: { borderLeftWidth: 3, borderLeftColor: Colors.accent },
  cardIcon:       { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardBody:       { flex: 1, gap: 4 },
  cardTitle:      { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  cardTitleDanger:{ color: Colors.danger },
  cardSub:        { color: Colors.textSecondary, fontSize: 12 },
  cardRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Footer
  version:        { color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 16, marginBottom: 32 },
});
