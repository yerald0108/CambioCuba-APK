/**
 * Notifications Service — Push tokens y notificaciones in-app
 *
 * Operaciones:
 * - Registrar/actualizar el token de push del dispositivo en Supabase
 * - Obtener notificaciones no leídas del usuario
 * - Marcar notificaciones como leídas
 * - Marcar todas como leídas
 *
 * Las notificaciones push se envían desde Supabase Edge Functions
 * en los eventos clave de la orden. Este servicio solo maneja
 * el lado del cliente (registro del token y lectura del historial).
 */

import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@lib/supabase';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AppNotificationRecord {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'order' | 'kyc' | 'chat' | 'system';
  data: Record<string, string> | null;   // e.g. { order_id: '...' }
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResult<T = void> {
  data: T | null;
  error: string | null;
}

// ─── REGISTRO DE PUSH TOKEN ───────────────────────────────────────────────────

/**
 * Solicita permisos de notificación y registra el token del dispositivo
 * en la tabla push_tokens de Supabase.
 *
 * Debe llamarse después de que el usuario inicia sesión.
 * En Android se necesita el canal de notificaciones configurado.
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    // En Expo Go las push notifications no funcionan desde SDK 53.
    // Salimos silenciosamente — no es un error de la app.
    const isExpoGo = typeof __DEV__ !== 'undefined' && !process.env.EXPO_PUBLIC_PROJECT_ID;
    if (isExpoGo) {
      console.log('[Notifications] Expo Go detectado — push tokens omitidos en desarrollo.');
      return;
    }

    // Configurar canal en Android (requerido para Android 8+)
    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name: 'CambioCuba',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });
    }

    // Solicitar permisos
    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permiso de notificaciones denegado');
      return;
    }

    // Obtener el token de Expo Push
    const tokenData = await ExpoNotifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    const token = tokenData.data;

    // Guardar/actualizar el token en Supabase
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id:  userId,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      console.error('[Notifications] Error guardando token:', error);
    } else {
      console.log('[Notifications] Token registrado:', token.slice(-8));
    }
  } catch (err) {
    // No es crítico — la app funciona sin push notifications
    console.error('[Notifications] Error registrando token:', err);
  }
}

// ─── ELIMINAR TOKEN AL CERRAR SESIÓN ─────────────────────────────────────────

/**
 * Elimina el token del dispositivo al hacer logout.
 * Evita que el usuario reciba notificaciones después de cerrar sesión.
 */
export async function removePushToken(userId: string): Promise<void> {
  try {
    const tokenData = await ExpoNotifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', tokenData.data);
  } catch (err) {
    console.error('[Notifications] Error eliminando token:', err);
  }
}

// ─── OBTENER NOTIFICACIONES ───────────────────────────────────────────────────

/**
 * Obtiene las últimas 50 notificaciones del usuario.
 * Ordenadas por fecha descendente (más recientes primero).
 */
export async function fetchNotifications(
  userId: string
): Promise<NotificationsResult<AppNotificationRecord[]>> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Notifications] Error cargando:', error);
    return { data: null, error: 'No se pudieron cargar las notificaciones.' };
  }

  return { data: data as AppNotificationRecord[], error: null };
}

// ─── CONTAR NO LEÍDAS ─────────────────────────────────────────────────────────

/**
 * Retorna el número de notificaciones no leídas.
 * Se usa para el badge en la tab bar.
 */
export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[Notifications] Error contando no leídas:', error);
    return 0;
  }

  return count ?? 0;
}

// ─── MARCAR COMO LEÍDA ────────────────────────────────────────────────────────

export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

// ─── MARCAR TODAS COMO LEÍDAS ─────────────────────────────────────────────────

export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}