/**
 * PhotoPicker — Selector de fotos para el flujo KYC
 *
 * Permite al usuario tomar una foto con la cámara o elegir de la galería.
 * Muestra preview de la imagen seleccionada.
 * Diseño "Vault Dark": borde dorado cuando hay imagen, borde punteado cuando está vacío.
 */

import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, X, CheckCircle } from 'lucide-react-native';
import { Colors, BorderRadius } from '@constants/theme';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface PhotoPickerProps {
  label: string;
  description?: string;
  value: string | null;         // URI de la imagen seleccionada
  onChange: (uri: string | null) => void;
  disabled?: boolean;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function PhotoPicker({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: PhotoPickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  // ─── Abrir selector ───────────────────────────────────────────────────────

  function showOptions() {
    if (disabled) return;

    Alert.alert(
      label,
      'Elige cómo quieres agregar la foto',
      [
        { text: 'Cámara',   onPress: () => pickImage('camera') },
        { text: 'Galería',  onPress: () => pickImage('gallery') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }

  async function pickImage(source: 'camera' | 'gallery') {
    setIsLoading(true);

    try {
      let result: ImagePicker.ImagePickerResult;

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: source === 'camera' ? [3, 4] : [4, 3],
        quality: 0.8,
      };

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'CambioCuba necesita acceso a la cámara para tomar la foto.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'CambioCuba necesita acceso a la galería para seleccionar la foto.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo obtener la imagen. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── UI: con imagen ───────────────────────────────────────────────────────

  if (value) {
    return (
      <View>
        <Text style={{
          color: Colors.textSecondary,
          fontSize: 13,
          fontWeight: '500',
          marginBottom: 8,
        }}>
          {label}
        </Text>

        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: value }}
            style={{
              width: '100%',
              height: 180,
              borderRadius: BorderRadius.xl,
              backgroundColor: Colors.surface,
            }}
            resizeMode="cover"
          />

          {/* Overlay con indicador de éxito */}
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: Colors.successMuted,
            borderRadius: 99,
            padding: 4,
            borderWidth: 1,
            borderColor: Colors.success,
          }}>
            <CheckCircle color={Colors.success} size={14} strokeWidth={2} />
          </View>

          {/* Botón de eliminar */}
          <Pressable
            onPress={() => onChange(null)}
            style={({ pressed }) => ({
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: Colors.dangerMuted,
              borderRadius: 99,
              padding: 6,
              borderWidth: 1,
              borderColor: Colors.danger,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <X color={Colors.danger} size={14} strokeWidth={2.5} />
          </Pressable>

          {/* Botón de cambiar */}
          <Pressable
            onPress={showOptions}
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: BorderRadius.md,
              paddingHorizontal: 10,
              paddingVertical: 5,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: Colors.textPrimary, fontSize: 11, fontWeight: '500' }}>
              Cambiar
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── UI: sin imagen (zona de carga) ──────────────────────────────────────

  return (
    <View>
      <Text style={{
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
      }}>
        {label}
      </Text>

      <Pressable
        onPress={showOptions}
        disabled={disabled || isLoading}
        style={({ pressed }) => ({
          width: '100%',
          height: 140,
          borderRadius: BorderRadius.xl,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: disabled ? Colors.border : Colors.borderStrong,
          backgroundColor: Colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.accent} size="small" />
        ) : (
          <>
            <View style={{
              flexDirection: 'row',
              gap: 16,
              alignItems: 'center',
            }}>
              <View style={{
                alignItems: 'center',
                gap: 4,
              }}>
                <Camera color={Colors.textMuted} size={22} strokeWidth={1.8} />
                <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Cámara</Text>
              </View>
              <Text style={{ color: Colors.border, fontSize: 18 }}>|</Text>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <ImageIcon color={Colors.textMuted} size={22} strokeWidth={1.8} />
                <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Galería</Text>
              </View>
            </View>

            {description && (
              <Text style={{
                color: Colors.textMuted,
                fontSize: 12,
                textAlign: 'center',
                paddingHorizontal: 16,
                lineHeight: 16,
              }}>
                {description}
              </Text>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}
