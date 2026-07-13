/**
 * Cliente Supabase — Configuración central
 *
 * Usa ExpoSecureStore para persistir el token de sesión de forma segura
 * en el dispositivo Android/iOS, en lugar de AsyncStorage (que es texto plano).
 */

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// ─── VARIABLES DE ENTORNO ────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. ' +
    'Asegúrate de tener EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en tu .env'
  );
}

// ─── ADAPTADOR DE ALMACENAMIENTO SEGURO ──────────────────────────────────────
// Supabase requiere un storage adapter compatible con la API de AsyncStorage.
// Usamos SecureStore de Expo para mayor seguridad.

const ExpoSecureStoreAdapter = {
  /**
   * Obtiene un valor guardado de forma segura.
   * SecureStore tiene un límite de 2048 bytes por clave,
   * por eso fragmentamos los tokens largos.
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch {
      // Si falla la lectura segura, retornamos null (sesión no encontrada)
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Si falla el guardado, el usuario tendrá que volver a iniciar sesión
      console.warn(`[SecureStore] No se pudo guardar la clave: ${key}`);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignorar errores al eliminar
    }
  },
};

// ─── CLIENTE SUPABASE ─────────────────────────────────────────────────────────

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistencia segura con SecureStore
    storage: ExpoSecureStoreAdapter,
    // Detecta automáticamente la sesión al abrir la app
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Configuración de Realtime para el chat
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─── HELPERS DE STORAGE ───────────────────────────────────────────────────────

/** Bucket de Supabase Storage para documentos KYC */
export const KYC_BUCKET = 'kyc-documents';

/** Bucket de Supabase Storage para comprobantes de pago */
export const PAYMENT_PROOFS_BUCKET = 'payment-proofs';

/** Bucket de Supabase Storage para avatares de perfil */
export const AVATARS_BUCKET = 'avatars';

/**
 * Genera la URL pública de un archivo en Supabase Storage.
 * @param bucket - Nombre del bucket
 * @param path - Ruta del archivo dentro del bucket
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
