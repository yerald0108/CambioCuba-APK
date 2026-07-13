/**
 * Button — Componente de botón reutilizable
 *
 * Variantes: primary | secondary | danger | ghost
 * Estados: normal | loading | disabled
 * Incluye haptic feedback en Android.
 */

import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
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

// ─── ESTILOS POR VARIANTE ────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ButtonVariant, {
  container: object;
  text: object;
  pressedOpacity: number;
}> = {
  primary: {
    container: {
      backgroundColor: Colors.accent,
      borderWidth: 0,
    },
    text: { color: Colors.background },
    pressedOpacity: 0.85,
  },
  secondary: {
    container: {
      backgroundColor: Colors.surfaceRaised,
      borderWidth: 1,
      borderColor: Colors.borderStrong,
    },
    text: { color: Colors.textPrimary },
    pressedOpacity: 0.7,
  },
  danger: {
    container: {
      backgroundColor: Colors.dangerMuted,
      borderWidth: 1,
      borderColor: Colors.danger,
    },
    text: { color: Colors.danger },
    pressedOpacity: 0.7,
  },
  ghost: {
    container: {
      backgroundColor: Colors.transparent,
      borderWidth: 0,
    },
    text: { color: Colors.accent },
    pressedOpacity: 0.6,
  },
};

const SIZE_STYLES: Record<ButtonSize, { paddingVertical: number; fontSize: number; borderRadius: number }> = {
  sm: { paddingVertical: 10, fontSize: 14, borderRadius: 10 },
  md: { paddingVertical: 14, fontSize: 15, borderRadius: 12 },
  lg: { paddingVertical: 16, fontSize: 16, borderRadius: 14 },
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
  ...rest
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle    = SIZE_STYLES[size];
  const isDisabled   = disabled || loading;

  async function handlePress(e: Parameters<NonNullable<PressableProps['onPress']>>[0]) {
    if (isDisabled) return;
    // Haptic feedback sutil al presionar
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => ({
        // Layout
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        // Dimensiones
        width: fullWidth ? '100%' : undefined,
        paddingVertical: sizeStyle.paddingVertical,
        paddingHorizontal: 20,
        borderRadius: sizeStyle.borderRadius,
        // Colores de variante
        ...variantStyle.container,
        // Estado deshabilitado
        opacity: isDisabled ? 0.45 : pressed ? variantStyle.pressedOpacity : 1,
      })}
    >
      {/* Icono izquierdo */}
      {!loading && leftIcon && (
        <View>{leftIcon}</View>
      )}

      {/* Spinner o texto */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.background : Colors.accent}
        />
      ) : (
        <Text
          style={{
            fontSize: sizeStyle.fontSize,
            fontWeight: '600',
            letterSpacing: 0.2,
            ...variantStyle.text,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}

      {/* Icono derecho */}
      {!loading && rightIcon && (
        <View>{rightIcon}</View>
      )}
    </Pressable>
  );
}
