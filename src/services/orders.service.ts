/**
 * Orders Service — State machine completa de órdenes P2P
 *
 * Operaciones disponibles:
 * - Crear orden desde una oferta
 * - Confirmar "listo" (comprador y vendedor por separado)
 * - Cancelar orden (con motivo)
 * - Abrir disputa (con motivo)
 * - Obtener orden activa del usuario
 * - Obtener historial de órdenes
 *
 * La confirmación de pago y el cierre de orden se manejan en la Fase 8-9
 * (chat + comprobante).
 *
 * State machine:
 *   pending → both_confirmed → buyer_paid → completed
 *                            ↘ disputed
 *   pending → cancelled
 *   both_confirmed → cancelled
 *   both_confirmed → expired (automático vía trigger en Supabase)
 */

import { supabase } from '@lib/supabase';
import type { Order, CreateOrderForm } from '@/types/order.types';

// ─── TIPO DE RETORNO ESTÁNDAR ─────────────────────────────────────────────────

export interface OrderResult<T = void> {
  data: T | null;
  error: string | null;
}

// ─── CREAR ORDEN ──────────────────────────────────────────────────────────────

/**
 * Crea una nueva orden a partir de una oferta.
 * El usuario autenticado es siempre el comprador.
 * El vendedor es el Trapichero dueño de la oferta.
 *
 * Precondición: el usuario debe tener KYC básico aprobado (verificado
 * en la UI antes de llamar a esta función).
 */
export async function createOrder(
  buyerId: string,
  form: CreateOrderForm
): Promise<OrderResult<Order>> {
  // Primero obtenemos la oferta para calcular el monto en CUP y obtener seller_id
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('trapichero_id, exchange_rate')
    .eq('id', form.offer_id)
    .single();

  if (offerError || !offer) {
    return { data: null, error: 'No se pudo verificar la oferta. Intenta de nuevo.' };
  }

  const amountCup = form.amount_usdt * Number(offer.exchange_rate);

  const { data, error } = await supabase
    .from('orders')
    .insert({
      offer_id:        form.offer_id,
      buyer_id:        buyerId,
      seller_id:       offer.trapichero_id,
      amount_usdt:     form.amount_usdt,
      exchange_rate:   offer.exchange_rate,
      amount_cup:      amountCup,
      payment_method:  form.payment_method,
      status:          'pending',
      // Campos de confirmación — ambos en false al inicio
      buyer_confirmed:  false,
      seller_confirmed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Orders] Error creating:', error);
    // Mensaje amigable para el caso de orden activa existente
    if (error.code === '23505') {
      return { data: null, error: 'Ya tienes un intercambio activo. Complétalo antes de iniciar otro.' };
    }
    return { data: null, error: 'No se pudo crear el intercambio. Intenta de nuevo.' };
  }

  return { data: data as Order, error: null };
}

// ─── CONFIRMAR "LISTO" ────────────────────────────────────────────────────────

/**
 * El usuario confirma que está listo para proceder.
 * Cuando ambos confirman, el trigger de Supabase activa el timer de 20 min
 * y cambia el estado a 'both_confirmed'.
 */
export async function confirmReady(
  orderId: string,
  role: 'buyer' | 'seller'
): Promise<OrderResult<Order>> {
  const field = role === 'buyer' ? 'buyer_confirmed' : 'seller_confirmed';

  const { data, error } = await supabase
    .from('orders')
    .update({ [field]: true })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[Orders] Error confirming ready:', error);
    return { data: null, error: 'No se pudo confirmar. Intenta de nuevo.' };
  }

  return { data: data as Order, error: null };
}

// ─── CANCELAR ORDEN ───────────────────────────────────────────────────────────

/**
 * Cancela la orden. Solo posible en estados 'pending' o 'both_confirmed'.
 * El trigger de Supabase registra la cancelación en el historial del usuario.
 */
export async function cancelOrder(
  orderId: string,
  cancelledById: string,
  reason?: string
): Promise<OrderResult> {
  const { error } = await supabase
    .from('orders')
    .update({
      status:              'cancelled',
      cancelled_by:        cancelledById,
      cancellation_reason: reason ?? null,
    })
    .eq('id', orderId);

  if (error) {
    console.error('[Orders] Error cancelling:', error);
    return { data: null, error: 'No se pudo cancelar el intercambio. Intenta de nuevo.' };
  }

  return { data: null, error: null };
}

// ─── ABRIR DISPUTA ────────────────────────────────────────────────────────────

/**
 * Abre una disputa en la orden activa.
 * La orden queda bloqueada hasta que el Admin intervenga.
 * Solo se puede abrir en estado 'both_confirmed' o 'buyer_paid'.
 */
export async function openDispute(
  orderId: string,
  disputedById: string,
  reason: string
): Promise<OrderResult> {
  const { error } = await supabase
    .from('orders')
    .update({
      status:         'disputed',
      disputed_by:    disputedById,
      dispute_reason: reason,
    })
    .eq('id', orderId);

  if (error) {
    console.error('[Orders] Error opening dispute:', error);
    return { data: null, error: 'No se pudo abrir la disputa. Intenta de nuevo.' };
  }

  return { data: null, error: null };
}

// ─── OBTENER ORDEN POR ID ─────────────────────────────────────────────────────

/**
 * Obtiene el detalle completo de una orden por su ID.
 * Incluye los perfiles básicos de comprador y vendedor.
 */
export async function fetchOrderById(
  orderId: string
): Promise<OrderResult<Order>> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!buyer_id (
        id, full_name, avatar_url, total_trades, successful_trades
      ),
      seller:profiles!seller_id (
        id, full_name, avatar_url, total_trades, successful_trades
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('[Orders] Error fetching by ID:', error);
    return { data: null, error: 'No se pudo cargar el intercambio.' };
  }

  return { data: data as unknown as Order, error: null };
}

// ─── ORDEN ACTIVA DEL USUARIO ─────────────────────────────────────────────────

/**
 * Busca la orden activa del usuario (si existe).
 * Un usuario solo puede tener 1 orden activa a la vez.
 * Estados "activos": pending, both_confirmed, buyer_paid, disputed.
 */
export async function fetchActiveOrder(
  userId: string
): Promise<OrderResult<Order | null>> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!buyer_id (
        id, full_name, avatar_url, total_trades, successful_trades
      ),
      seller:profiles!seller_id (
        id, full_name, avatar_url, total_trades, successful_trades
      )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .in('status', ['pending', 'both_confirmed', 'buyer_paid', 'disputed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Orders] Error fetching active order:', error);
    return { data: null, error: 'No se pudo verificar si tienes un intercambio activo.' };
  }

  // maybeSingle() retorna null si no hay resultado (sin error)
  return { data: (data as unknown as Order) ?? null, error: null };
}

// ─── HISTORIAL DE ÓRDENES ─────────────────────────────────────────────────────

/**
 * Obtiene el historial de órdenes del usuario (activas + pasadas).
 * Ordenadas por fecha de creación descendente.
 */
export async function fetchOrderHistory(
  userId: string
): Promise<OrderResult<Order[]>> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!buyer_id (
        id, full_name, avatar_url
      ),
      seller:profiles!seller_id (
        id, full_name, avatar_url
      )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Orders] Error fetching history:', error);
    return { data: null, error: 'No se pudo cargar el historial.' };
  }

  return { data: data as unknown as Order[], error: null };
}