/**
 * Root Layout — CambioCuba
 * Providers globales + listener de sesión Supabase.
 */

import '../src/styles/global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@lib/queryClient';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/auth.store';
import { NotificationToast } from '@components/shared/NotificationToast';
import { OfflineBanner } from '@components/shared/OfflineBanner';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { LoadingScreen } from '@components/shared/LoadingScreen';
import { Colors } from '@constants/theme';

export default function RootLayout() {
  const setUser        = useAuthStore((s) => s.setUser);
  const setLoading     = useAuthStore((s) => s.setLoading);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const isInitialized  = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    // Verificar sesión guardada al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    // Escuchar cambios de autenticación en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          setInitialized(true);
          queryClient.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setUser(data ?? null);
    } catch (err) {
      console.error('[Auth] Error cargando perfil:', err);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }

  // Splash mientras Supabase verifica la sesión
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor={Colors.background} />

          <AppWithNotifications />

          <NotificationToast />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}


// ─── COMPONENTE INTERNO ───────────────────────────────────────────────────────
// Separado del RootLayout para tener acceso al QueryClient
// (usePushNotifications usa useQuery internamente)

function AppWithNotifications() {
  usePushNotifications();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(admin)" />
      </Stack>
      <OfflineBanner />
    </>
  );
}
