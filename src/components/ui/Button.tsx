/**
 * Button — Componente de botón reutilizable
 *
 * Variantes: primary | secondary | danger | ghost
 * Estados: normal | loading | disabled
 * Incluye haptic feedback.
 */

import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '@constants/theme';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── ESTILOS ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Base
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  // Tamaños
  sizeSm: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, gap: 6 },
  sizeMd: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, gap: 8 },
  sizeLg: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, gap: 8 },
  // Variantes — contenedor
  variantPrimary: {
    backgroundColor: Colors.accent,
  },
  variantSecondary: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  variantDanger: {
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  // Variantes — texto
  textPrimary:   { color: '#FFFFFF' },
  textSecondary: { color: Colors.textPrimary },
  textDanger:    { color: Colors.danger },
  textGhost:     { color: Colors.accent },
  // Texto base
  textBase: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSm: { fontSize: 14 },
  textMd: { fontSize: 15 },
  textLg: { fontSize: 16 },
});

const CONTAINER_STYLE: Record<ButtonVariant, object> = {
  primary:   styles.variantPrimary,
  secondary: styles.variantSecondary,
  danger:    styles.variantDanger,
  ghost:     styles.variantGhost,
};

const TEXT_STYLE: Record<ButtonVariant, object> = {
  primary:   styles.textPrimary,
  secondary: styles.textSecondary,
  danger:    styles.textDanger,
  ghost:     styles.textGhost,
};

const CONTAINER_SIZE: Record<ButtonSize, object> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const TEXT_SIZE: Record<ButtonSize, object> = {
  sm: styles.textSm,
  md: styles.textMd,
  lg: styles.textLg,
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  onPress,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  async function handlePress() {
    if (isDisabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics no disponible — ignorar
    }
    onPress?.({} as any);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        CONTAINER_STYLE[variant],
        CONTAINER_SIZE[size],
        fullWidth && styles.fullWidth,
        isDisabled && { opacity: 0.45 },
      ]}
    >
      {/* Icono izquierdo */}
      {!loading && leftIcon && <View>{leftIcon}</View>}

      {/* Spinner o texto */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : Colors.accent}
        />
      ) : (
        <Text style={[styles.textBase, TEXT_STYLE[variant], TEXT_SIZE[size]]} numberOfLines={1}>
          {label}
        </Text>
      )}

      {/* Icono derecho */}
      {!loading && rightIcon && <View>{rightIcon}</View>}
    </TouchableOpacity>
  );
}
