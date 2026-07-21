/**
 * Dashboard Admin — Panel de control principal
 *
 * Muestra estadísticas en tiempo real y accesos rápidos
 * a las secciones de gestión: KYC, Disputas.
 */

import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users, ArrowLeftRight, ShieldCheck,
  ShieldAlert, TrendingUp, ChevronRight, RefreshCw,
} from 'lucide-react-native';

import { useDashboardStats } from '@hooks/useAdmin';
import { Colors, Spacing } from '@constants/theme';
import { formatUSDT } from '@utils/format';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { stats, isLoading, refetch } = useDashboardStats();

  const statCards = [
    {
      label:  'Usuarios',
      value:  stats?.totalUsers ?? 0,
      icon:   (c: string) => <Users color={c} size={20} strokeWidth={1.8} />,
      color:  Colors.info,
    },
    {
      label:  'Órdenes activas',
      value:  stats?.activeOrders ?? 0,
      icon:   (c: string) => <ArrowLeftRight color={c} size={20} strokeWidth={1.8} />,
      color:  Colors.accent,
    },
    {
      label:  'KYC pendientes',
      value:  stats?.pendingKyc ?? 0,
      icon:   (c: string) => <ShieldCheck color={c} size={20} strokeWidth={1.8} />,
      color:  Colors.warning,
      alert:  (stats?.pendingKyc ?? 0) > 0,
      onPress: () => router.push('/(admin)/kyc-review'),
    },
    {
      label:  'Disputas abiertas',
      value:  stats?.openDisputes ?? 0,
      icon:   (c: string) => <ShieldAlert color={c} size={20} strokeWidth={1.8} />,
      color:  Colors.danger,
      alert:  (stats?.openDisputes ?? 0) > 0,
      onPress: () => router.push('/(admin)/disputes'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: Spacing.screenPadding,
        paddingTop: insets.top + 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '600' }}>
            PANEL DE ADMINISTRACIÓN
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
            Dashboard
          </Text>
        </View>
        <Pressable
          onPress={() => refetch()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
        >
          <RefreshCw color={Colors.textSecondary} size={18} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.screenPadding,
          gap: 16,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Volumen del día */}
        <View style={{
          backgroundColor: Colors.accentMuted,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.accent + '44',
          padding: 20,
          gap: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TrendingUp color={Colors.accent} size={18} strokeWidth={2} />
            <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '600' }}>
              VOLUMEN HOY
            </Text>
          </View>
          <Text style={{
            color: Colors.textPrimary,
            fontSize: 32,
            fontWeight: '800',
            marginTop: 4,
          }}>
            {formatUSDT(stats?.volumeToday ?? 0)}
          </Text>
          <Text style={{ color: Colors.accentSoft, fontSize: 13 }}>
            {stats?.completedToday ?? 0} órdenes completadas
          </Text>
        </View>

        {/* Tarjetas de estadísticas */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {statCards.map((card) => (
            <Pressable
              key={card.label}
              onPress={card.onPress}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: '45%',
                backgroundColor: Colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: card.alert ? card.color + '66' : Colors.border,
                borderLeftWidth: 3,
                borderLeftColor: card.color,
                padding: 14,
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {card.icon(card.color)}
                {card.onPress && (
                  <ChevronRight color={Colors.textMuted} size={14} strokeWidth={2} />
                )}
              </View>
              <Text style={{
                color: Colors.textPrimary,
                fontSize: 28,
                fontWeight: '800',
              }}>
                {card.value}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                {card.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Accesos rápidos */}
        <Text style={{
          color: Colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        }}>
          GESTIÓN
        </Text>

        {[
          {
            label:       'Revisar KYC pendientes',
            description: `${stats?.pendingKyc ?? 0} verificaciones esperando`,
            icon:        (c: string) => <ShieldCheck color={c} size={20} strokeWidth={1.8} />,
            color:       Colors.warning,
            route:       '/(admin)/kyc-review' as const,
          },
          {
            label:       'Resolver disputas',
            description: `${stats?.openDisputes ?? 0} disputas abiertas`,
            icon:        (c: string) => <ShieldAlert color={c} size={20} strokeWidth={1.8} />,
            color:       Colors.danger,
            route:       '/(admin)/disputes' as const,
          },
        ].map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => ({
              backgroundColor: Colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: item.color + '22',
              borderWidth: 1, borderColor: item.color + '44',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {item.icon(item.color)}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                {item.label}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {item.description}
              </Text>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} strokeWidth={2} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}