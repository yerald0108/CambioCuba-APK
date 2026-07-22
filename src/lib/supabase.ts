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

const CHUNK_SIZE = 1800; // Bytes seguros por debajo del límite de 2048

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Intentar leer el valor directamente
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;

      // Si no existe, puede estar fragmentado — buscar chunks
      const chunks: string[] = [];
      let i = 0;
      while (true) {
        const chunk = await SecureStore.getItemAsync(`${key}.chunk_${i}`);
        if (chunk === null) break;
        chunks.push(chunk);
        i++;
      }
      return chunks.length > 0 ? chunks.join('') : null;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        // Valor pequeño — guardar directamente y limpiar chunks anteriores
        await SecureStore.setItemAsync(key, value);
        // Limpiar chunks viejos si existían
        let i = 0;
        while ((await SecureStore.getItemAsync(`${key}.chunk_${i}`)) !== null) {
          await SecureStore.deleteItemAsync(`${key}.chunk_${i}`);
          i++;
        }
      } else {
        // Valor grande — fragmentar en chunks
        await SecureStore.deleteItemAsync(key); // Limpiar el valor simple si existía
        const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`${key}.chunk_${i}`, chunk);
        }
      }
    } catch {
      console.warn(`[SecureStore] No se pudo guardar la clave: ${key}`);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
      // Limpiar chunks si existían
      let i = 0;
      while (true) {
        const exists = await SecureStore.getItemAsync(`${key}.chunk_${i}`);
        if (exists === null) break;
        await SecureStore.deleteItemAsync(`${key}.chunk_${i}`);
        i++;
      }
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