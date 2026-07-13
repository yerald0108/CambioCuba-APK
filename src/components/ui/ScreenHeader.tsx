/**
 * ScreenHeader — Encabezado de pantalla reutilizable
 *
 * Muestra título, subtítulo opcional y botón de retroceso.
 * Diseño "Vault Dark": borde inferior sutil, texto dorado en el logo.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightSlot,
}: ScreenHeaderProps) {
  function handleBack() {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
        gap: 12,
      }}
    >
      {/* Botón atrás */}
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 4,
          })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft color={Colors.textSecondary} size={22} strokeWidth={2} />
        </Pressable>
      )}

      {/* Título y subtítulo */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
            letterSpacing: -0.3,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 13,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Slot derecho (acciones, iconos, etc.) */}
      {rightSlot && <View>{rightSlot}</View>}
    </View>
  );
}
