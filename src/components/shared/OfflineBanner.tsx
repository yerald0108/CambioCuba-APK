import { View, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { Colors } from '@constants/theme';

/** Aviso no intrusivo: los datos ya cargados siguen disponibles en caché. */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: Colors.dangerMuted, borderBottomWidth: 1, borderBottomColor: Colors.danger,
      paddingHorizontal: 16, paddingVertical: 10,
    }}>
      <WifiOff color={Colors.danger} size={16} strokeWidth={2} />
      <Text style={{ color: Colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
        Sin conexión. Mostramos la última información disponible.
      </Text>
    </View>
  );
}
