/**
 * KeyboardAvoidingScreen — Wrapper para pantallas con formularios
 *
 * Combina KeyboardAvoidingView + ScrollView para que el teclado
 * no tape los campos de input en Android e iOS.
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  type ViewStyle,
} from 'react-native';
import { Colors } from '@constants/theme';

interface KeyboardAvoidingScreenProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export function KeyboardAvoidingScreen({
  children,
  contentContainerStyle,
}: KeyboardAvoidingScreenProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: 32,
          },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
