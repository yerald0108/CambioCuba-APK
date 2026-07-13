/**
 * Input — Campo de texto reutilizable
 *
 * Maneja: label, placeholder, estado de foco, error, icono izquierdo,
 * toggle de contraseña y todos los props de TextInput.
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { Colors } from '@constants/theme';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    isPassword = false,
    secureTextEntry,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const [isFocused,  setIsFocused]  = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // El campo es de contraseña si se pasa isPassword o secureTextEntry
  const isSecure = isPassword || secureTextEntry;

  // Color del borde según estado
  const borderColor = error
    ? Colors.danger
    : isFocused
    ? Colors.accent
    : Colors.border;

  return (
    <View style={{ width: '100%', marginBottom: 4 }}>

      {/* Label */}
      {label && (
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            fontWeight: '500',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      {/* Contenedor del input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.surfaceRaised,
          borderWidth: 1,
          borderColor,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          gap: 10,
        }}
      >
        {/* Icono izquierdo */}
        {leftIcon && (
          <View style={{ opacity: isFocused ? 1 : 0.5 }}>
            {leftIcon}
          </View>
        )}

        {/* Campo de texto */}
        <TextInput
          ref={ref}
          style={{
            flex: 1,
            color: Colors.textPrimary,
            fontSize: 15,
            padding: 0,         // Eliminar padding interno de Android
            margin: 0,
          }}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isSecure && !showSecret}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {/* Toggle mostrar/ocultar contraseña */}
        {isSecure && (
          <Pressable
            onPress={() => setShowSecret((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showSecret ? (
              <EyeOff color={Colors.textMuted} size={18} strokeWidth={1.8} />
            ) : (
              <Eye color={Colors.textMuted} size={18} strokeWidth={1.8} />
            )}
          </Pressable>
        )}
      </View>

      {/* Mensaje de error */}
      {error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 5,
          }}
        >
          <AlertCircle color={Colors.danger} size={13} strokeWidth={2} />
          <Text
            style={{
              color: Colors.danger,
              fontSize: 12,
              fontWeight: '400',
              flex: 1,
            }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Hint (solo si no hay error) */}
      {hint && !error && (
        <Text
          style={{
            color: Colors.textMuted,
            fontSize: 12,
            marginTop: 5,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
});
