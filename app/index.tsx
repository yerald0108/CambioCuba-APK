/**
 * Pantalla de entrada — Redirige según estado de autenticación y rol.
 */

import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore, useIsAuthenticated, useIsAdmin } from '@stores/auth.store';
import { Colors } from '@constants/theme';

export default function Index() {
  const isInitialized   = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useIsAuthenticated();
  const isAdmin         = useIsAdmin();

  // Mientras Supabase verifica la sesión guardada
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (isAdmin)          return <Redirect href="/(admin)/dashboard" />;
  return                       <Redirect href="/(app)/(tabs)" />;
}
