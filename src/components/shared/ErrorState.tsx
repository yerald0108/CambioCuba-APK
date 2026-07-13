/**
 * ErrorState — Estado de error reutilizable
 *
 * Siempre ofrece al usuario una acción de reintento.
 * Nunca dejes un error sin forma de recuperarse.
 */

import { View, Text } from 'react-native';
import { WifiOff, AlertTriangle } from 'lucide-react-native';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'network' | 'generic';
}

export function ErrorState({
  title,
  message,
  onRetry,
  type = 'generic',
}: ErrorStateProps) {
  const defaultTitle   = type === 'network' ? 'Sin conexión' : 'Algo salió mal';
  const defaultMessage = type === 'network'
    ? 'Verifica tu conexión a internet e intenta de nuevo.'
    : 'Ocurrió un error inesperado. Por favor intenta de nuevo.';

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 12,
      }}
    >
      {/* Icono */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: Colors.dangerMuted,
          borderWidth: 1,
          borderColor: Colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        {type === 'network' ? (
          <WifiOff color={Colors.danger} size={30} strokeWidth={1.8} />
        ) : (
          <AlertTriangle color={Colors.danger} size={30} strokeWidth={1.8} />
        )}
      </View>

      {/* Título */}
      <Text
        style={{
          color: Colors.textPrimary,
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {title ?? defaultTitle}
      </Text>

      {/* Mensaje */}
      <Text
        style={{
          color: Colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {message ?? defaultMessage}
      </Text>

      {/* Botón de reintento */}
      {onRetry && (
        <View style={{ marginTop: 8, width: '100%' }}>
          <Button
            label="Intentar de nuevo"
            onPress={onRetry}
            variant="secondary"
            size="md"
          />
        </View>
      )}
    </View>
  );
}
