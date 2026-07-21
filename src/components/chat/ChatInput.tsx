/**
 * ChatInput — Barra de entrada de mensajes
 *
 * Características:
 * - TextInput multiline que crece hasta 4 líneas
 * - Botón enviar deshabilitado si no hay texto o está enviando
 * - Botón de comprobante (cámara) visible solo para el comprador
 *   cuando la orden está en 'both_confirmed'
 * - Se deshabilita completo si la orden ya no está activa
 */

import { useState } from 'react';
import {
  View, TextInput, Pressable, ActivityIndicator, Platform, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SendHorizontal, Camera } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius } from '@constants/theme';

interface ChatInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
  // Comprobante de pago
  showProofButton?: boolean;      // true solo para el comprador en both_confirmed
  onSendProof?: (uri: string) => void;
  isUploadingProof?: boolean;
}

export function ChatInput({
  onSend,
  isSending,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
  showProofButton = false,
  onSendProof,
  isUploadingProof = false,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const canSend = text.trim().length > 0 && !isSending && !disabled && !isUploadingProof;

  function handleSend() {
    if (!canSend) return;
    const content = text.trim();
    setText('');
    onSend(content);
  }

  async function handlePickProof() {
    if (!onSendProof || isUploadingProof) return;

    Alert.alert(
      'Subir comprobante de pago',
      'Selecciona cómo quieres adjuntar el comprobante',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar foto',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]) {
              onSendProof(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Elegir de galería',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]) {
              onSendProof(result.assets[0].uri);
            }
          },
        },
      ]
    );
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

      {/* Botón de comprobante — solo visible para el comprador en both_confirmed */}
      {showProofButton && (
        <Pressable
          onPress={handlePickProof}
          disabled={isUploadingProof || disabled}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: Colors.accentMuted,
            borderWidth: 1,
            borderColor: Colors.accent + '66',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {isUploadingProof ? (
            <ActivityIndicator color={Colors.accent} size="small" />
          ) : (
            <Camera color={Colors.accent} size={18} strokeWidth={2} />
          )}
        </Pressable>
      )}

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
          maxHeight: 100,
          minHeight: 42,
        }}
        placeholder={disabled ? 'El chat está cerrado' : placeholder}
        placeholderTextColor={Colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        editable={!disabled && !isUploadingProof}
        returnKeyType="default"
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
          <ActivityIndicator color={Colors.background} size="small" />
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