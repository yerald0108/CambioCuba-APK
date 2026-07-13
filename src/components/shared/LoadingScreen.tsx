/**
 * LoadingScreen — Pantalla de carga global
 * Usada mientras Supabase verifica la sesión al abrir la app.
 */

import { View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '@constants/theme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color={Colors.accent} />
      {message && (
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
