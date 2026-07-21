/**
 * Chat Service — Mensajería en tiempo real vinculada a una orden
 *
 * Operaciones:
 * - Cargar historial de mensajes de una orden
 * - Enviar mensaje de texto
 * - Insertar mensaje del sistema (cambio de estado, timer, etc.)
 *
 * El Realtime se gestiona en el hook useChat, no aquí.
 */

import { supabase, PAYMENT_PROOFS_BUCKET } from '@lib/supabase';
import type { ChatMessage, SendMessageForm } from '@/types/chat.types';

// ─── TIPO DE RETORNO ESTÁNDAR ─────────────────────────────────────────────────

export interface ChatResult<T = void> {
  data: T | null;
  error: string | null;
}

// ─── CARGAR MENSAJES ──────────────────────────────────────────────────────────

/**
 * Obtiene todos los mensajes de una orden, ordenados cronológicamente.
 * Incluye el perfil básico del remitente para mostrar el nombre.
 */
export async function fetchMessages(
  orderId: string
): Promise<ChatResult<ChatMessage[]>> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Chat] Error cargando mensajes:', error);
    return { data: null, error: 'No se pudieron cargar los mensajes.' };
  }

  return { data: data as unknown as ChatMessage[], error: null };
}

// ─── ENVIAR MENSAJE DE TEXTO ──────────────────────────────────────────────────

/**
 * Inserta un nuevo mensaje de texto en la orden.
 * El sender_id debe ser el usuario autenticado.
 */
export async function sendMessage(
  senderId: string,
  form: SendMessageForm
): Promise<ChatResult<ChatMessage>> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      order_id:         form.order_id,
      sender_id:        senderId,
      type:             'text',
      content:          form.content.trim(),
      is_payment_proof: false,
    })
    .select(`
      *,
      sender:profiles!sender_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('[Chat] Error enviando mensaje:', error);
    return { data: null, error: 'No se pudo enviar el mensaje. Intenta de nuevo.' };
  }

  return { data: data as unknown as ChatMessage, error: null };
}

// ─── MENSAJE DEL SISTEMA ──────────────────────────────────────────────────────

/**
 * Inserta un mensaje automático del sistema.
 * sender_id es null para mensajes del sistema.
 * Se usa al cambiar el estado de la orden, cuando expira el timer, etc.
 */
export async function insertSystemMessage(
  orderId: string,
  content: string
): Promise<ChatResult<ChatMessage>> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      order_id:         orderId,
      sender_id:        null,
      type:             'system',
      content,
      is_payment_proof: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Chat] Error insertando mensaje de sistema:', error);
    return { data: null, error: 'Error al registrar el evento.' };
  }

  return { data: data as ChatMessage, error: null };
}

// ─── ENVIAR COMPROBANTE DE PAGO ───────────────────────────────────────────────

/**
 * Sube la imagen del comprobante a Storage y luego inserta el mensaje
 * con is_payment_proof: true en la tabla messages.
 *
 * Flujo:
 * 1. Sube la imagen a payment-proofs/{orderId}/{timestamp}.{ext}
 * 2. Obtiene la URL pública
 * 3. Inserta el mensaje de tipo 'image' con is_payment_proof: true
 *
 * El trigger de Supabase escucha este INSERT y cambia el estado de la
 * orden a 'buyer_paid' automáticamente.
 */
export async function sendPaymentProof(
  senderId: string,
  orderId: string,
  imageUri: string
): Promise<ChatResult<ChatMessage>> {
  // ── Paso 1: subir imagen ───────────────────────────────────────────────────
  const uriParts = imageUri.split('.');
  const fileExt  = (uriParts[uriParts.length - 1]?.toLowerCase() ?? 'jpg').split('?')[0];
  const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${orderId}/${fileName}`;

  const formData = new FormData();
  formData.append('file', {
    uri:  imageUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(filePath, formData, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error('[Chat] Error subiendo comprobante:', uploadError);
    return { data: null, error: 'No se pudo subir el comprobante. Intenta de nuevo.' };
  }

  // ── Paso 2: obtener URL pública ────────────────────────────────────────────
  const { data: urlData } = supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .getPublicUrl(filePath);

  const imageUrl = urlData.publicUrl;

  // ── Paso 3: insertar mensaje ───────────────────────────────────────────────
  const { data, error } = await supabase
    .from('messages')
    .insert({
      order_id:         orderId,
      sender_id:        senderId,
      type:             'image',
      content:          imageUrl,
      is_payment_proof: true,
    })
    .select(`
      *,
      sender:profiles!sender_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('[Chat] Error insertando mensaje de comprobante:', error);
    return { data: null, error: 'Imagen subida pero no se pudo registrar el mensaje.' };
  }

  return { data: data as unknown as ChatMessage, error: null };
}