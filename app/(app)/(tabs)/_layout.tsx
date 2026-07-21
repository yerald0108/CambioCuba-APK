/**
 * Tab Bar Layout — Navegación principal de la app
 * Tabs: Marketplace, Mis órdenes, Notificaciones, Perfil
 */

import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutGrid, ArrowLeftRight, Bell, User } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@stores/auth.store';
import { QueryKeys } from '@lib/queryClient';
import { fetchUnreadCount } from '@services/notifications.service';
import { Colors, Spacing } from '@constants/theme';

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);

  // Badge de notificaciones no leídas
  const { data: unreadCount = 0 } = useQuery({
    queryKey: QueryKeys.notifications.unread(user?.id ?? ''),
    queryFn:  () => fetchUnreadCount(user!.id),
    enabled:  !!user?.id,
    refetchInterval: 60 * 1000,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Spacing.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mercado',
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Bell color={color} size={size - 2} strokeWidth={1.8} />
              {/* Badge de no leídas */}
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  backgroundColor: Colors.accent,
                  borderRadius: 99,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                  borderWidth: 1.5,
                  borderColor: Colors.surface,
                }}>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}