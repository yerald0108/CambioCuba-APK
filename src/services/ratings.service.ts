/**
 * Ratings Service — Calificaciones mutuas al completar una orden
 *
 * Operaciones:
 * - Enviar calificación al contraparte
 * - Verificar si el usuario ya calificó en una orden
 * - Obtener calificaciones recibidas por un usuario
 */

import { supabase } from '@lib/supabase';
import type { OrderRating, RateOrderForm } from '@/types/order.types';

// ─── TIPO DE RETORNO ──────────────────────────────────────────────────────────

export interface RatingResult<T = void> {
  data: T | null;
  error: string | null;
}

// ─── ENVIAR CALIFICACIÓN ──────────────────────────────────────────────────────

/**
 * Envía la calificación del usuario al contraparte.
 * Simultáneamente marca el campo buyer_rated o seller_rated en la orden.
 *
 * El trigger de Supabase recalcula el avg_rating del perfil calificado
 * automáticamente al insertar en ratings.
 */
export async function submitRating(
  raterId: string,
  ratedId: string,
  orderId: string,
  role: 'buyer' | 'seller',
  form: RateOrderForm
): Promise<RatingResult<OrderRating>> {
  // Insertar la calificación
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      order_id:  orderId,
      rater_id:  raterId,
      rated_id:  ratedId,
      score:     form.score,
      comment:   form.comment?.trim() ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Ratings] Error enviando calificación:', error);
    // Código 23505 = unique violation (ya calificó)
    if (error.code === '23505') {
      return { data: null, error: 'Ya calificaste a este usuario en esta orden.' };
    }
    return { data: null, error: 'No se pudo enviar la calificación. Intenta de nuevo.' };
  }

  // Marcar la orden como calificada por este rol
  const field = role === 'buyer' ? 'buyer_rated' : 'seller_rated';
  await supabase
    .from('orders')
    .update({ [field]: true })
    .eq('id', orderId);

  return { data: data as OrderRating, error: null };
}

// ─── VERIFICAR SI YA CALIFICÓ ─────────────────────────────────────────────────

/**
 * Verifica si el usuario ya envió su calificación en una orden específica.
 */
export async function hasRated(
  raterId: string,
  orderId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('ratings')
    .select('id')
    .eq('order_id', orderId)
    .eq('rater_id', raterId)
    .maybeSingle();

  return !!data;
}

// ─── CALIFICACIONES RECIBIDAS POR UN USUARIO ─────────────────────────────────

/**
 * Obtiene las últimas calificaciones recibidas por un usuario.
 * Se usa en la pantalla de perfil del Trapichero.
 */
export async function fetchUserRatings(
  userId: string,
  limit = 10
): Promise<RatingResult<OrderRating[]>> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('rated_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Ratings] Error cargando calificaciones:', error);
    return { data: null, error: 'No se pudieron cargar las calificaciones.' };
  }

  return { data: data as OrderRating[], error: null };
}