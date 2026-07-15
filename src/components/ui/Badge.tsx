/**
 * Badge — Etiqueta de estado reutilizable
 * Usada para KYC status, estado de órdenes, tipos de oferta, etc.
 */

import { View, Text } from 'react-native';
import { Colors } from '@constants/theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const VARIANT_CONFIG: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: Colors.successMuted, text: Colors.success,       border: Colors.success },
  danger:  { bg: Colors.dangerMuted,  text: Colors.danger,        border: Colors.danger },
  warning: { bg: Colors.warningMuted, text: Colors.warning,       border: Colors.warning },
  info:    { bg: Colors.infoMuted,    text: Colors.info,          border: Colors.info },
  neutral: { bg: Colors.surface,      text: Colors.textSecondary, border: Colors.border },
};

export function Badge({ label, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const config = VARIANT_CONFIG[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: config.bg,
        borderWidth: 1,
        borderColor: config.border,
        borderRadius: 99,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical:   isSmall ? 3 : 5,
      }}
    >
      <Text
        style={{
          color:      config.text,
          fontSize:   isSmall ? 11 : 13,
          fontWeight: '600',
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
