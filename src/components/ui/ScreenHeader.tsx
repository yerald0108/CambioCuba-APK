/**
 * ScreenHeader — Encabezado de pantalla reutilizable
 *
 * Muestra título, subtítulo opcional y botón de retroceso.
 * Respeta el SafeArea (notch / status bar) automáticamente.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  }

  return (
    <View
      style={[
        styles.container,
        // Respeta el notch/status bar dinámicamente
        { paddingTop: Math.max(insets.top, 12) + 8 },
      ]}
    >
      {/* Botón atrás */}
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color={Colors.textPrimary} size={22} strokeWidth={2} />
        </Pressable>
      )}

      {/* Título y subtítulo */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Slot derecho */}
      {rightSlot && <View>{rightSlot}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
