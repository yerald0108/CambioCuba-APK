/**
 * EmptyState — Estado vacío reutilizable
 *
 * Usado cuando una lista no tiene resultados, el usuario no ha
 * completado una acción, etc. Nunca dejes una lista vacía sin este componente.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/theme';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
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
      {/* Icono con fondo sutil */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        {icon}
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
        {title}
      </Text>

      {/* Descripción */}
      {description && (
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      )}

      {/* Acción */}
      {actionLabel && onAction && (
        <View style={{ marginTop: 8, width: '100%' }}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="secondary"
            size="md"
          />
        </View>
      )}
    </View>
  );
}
