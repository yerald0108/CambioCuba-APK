/**
 * ChatInput — Barra de entrada de mensajes
 *
 * Características:
 * - TextInput multiline que crece hasta 4 líneas
 * - Botón de enviar deshabilitado si no hay texto o está enviando
 * - Limpia el input al enviar
 * - Se deshabilita completo si la orden ya no está activa
 */

import { useState } from 'react';
import {
  View, TextInput, Pressable, ActivityIndicator, Platform,
} from 'react-native';
import { SendHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius } from '@constants/theme';

interface ChatInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isSending,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const canSend = text.trim().length > 0 && !isSending && !disabled;

  function handleSend() {
    if (!canSend) return;
    const content = text.trim();
    setText('');
    onSend(content);
  }

  return (
    <View style={{
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      backgroundColor: Colors.surface,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: Math.max(insets.bottom, 12),
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    }}>
      {/* Campo de texto */}
      <TextInput
        style={{
          flex: 1,
          backgroundColor: Colors.surfaceRaised,
          borderWidth: 1,
          borderColor: disabled ? Colors.border : Colors.borderStrong,
          borderRadius: BorderRadius.xl,
          paddingHorizontal: 14,
          paddingTop: Platform.OS === 'ios' ? 10 : 8,
          paddingBottom: Platform.OS === 'ios' ? 10 : 8,
          color: Colors.textPrimary,
          fontSize: 14,
          lineHeight: 20,
          maxHeight: 100,   // Limita a ~4 líneas
          minHeight: 42,
        }}
        placeholder={disabled ? 'El chat está cerrado' : placeholder}
        placeholderTextColor={Colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        editable={!disabled}
        returnKeyType="default"
        // En Android, Enter inserta salto de línea (no envía)
        blurOnSubmit={false}
      />

      {/* Botón enviar */}
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => ({
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: canSend ? Colors.accent : Colors.surfaceRaised,
          borderWidth: 1,
          borderColor: canSend ? Colors.accent : Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {isSending ? (
          <ActivityIndicator
            color={Colors.background}
            size="small"
          />
        ) : (
          <SendHorizontal
            color={canSend ? Colors.background : Colors.textMuted}
            size={18}
            strokeWidth={2}
          />
        )}
      </Pressable>
    </View>
  );
}