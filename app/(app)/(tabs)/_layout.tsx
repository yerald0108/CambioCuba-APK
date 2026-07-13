/**
 * Tab Bar Layout — Navegación principal de la app
 * Tabs: Marketplace, Mis órdenes, Perfil
 */
import { Tabs } from 'expo-router';
import { LayoutGrid, ArrowLeftRight, User } from 'lucide-react-native';
import { Colors, Spacing } from '@constants/theme';

export default function TabsLayout() {
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
        tabBarActiveTintColor: Colors.accent,
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
