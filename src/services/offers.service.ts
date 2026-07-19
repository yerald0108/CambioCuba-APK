/**
 * Offers Service — Gestión de ofertas del marketplace
 *
 * Maneja:
 * - Listado de ofertas activas con filtros
 * - Detalle de una oferta con perfil del Trapichero
 * - Crear, pausar, reactivar y eliminar ofertas (solo Trapichero)
 */

import { supabase } from '@lib/supabase';
import type { Offer, OfferFilters, CreateOfferForm } from '@/types/offer.types';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface OffersResult<T = void> {
  data: T | null;
  error: string | null;
}

// ─── MARKETPLACE — LISTAR OFERTAS ────────────────────────────────────────────

/**
 * Obtiene las ofertas activas del marketplace con filtros opcionales.
 * Incluye el perfil básico del Trapichero para mostrar reputación.
 */
export async function fetchOffers(
  filters?: OfferFilters
): Promise<OffersResult<Offer[]>> {
  let query = supabase
    .from('offers')
    .select(`
      *,
      trapichero:profiles!trapichero_id (
        id,
        full_name,
        avatar_url,
        total_trades,
        successful_trades
      )
    `)
    .in('status', ['active', 'in_order'])
    .order('created_at', { ascending: false });

  // ── Aplicar filtros ──────────────────────────────────────────────────────
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.payment_method) {
    // Buscar en el array de métodos de pago
    query = query.contains('payment_methods', [filters.payment_method]);
  }

  if (filters?.min_rate) {
    query = query.gte('exchange_rate', filters.min_rate);
  }

  if (filters?.max_rate) {
    query = query.lte('exchange_rate', filters.max_rate);
  }

  if (filters?.min_amount) {
    // El usuario quiere operar al menos X USDT — la oferta debe tener max >= X
    query = query.gte('max_order_usdt', filters.min_amount);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Offers] Error fetching:', error);
    return { data: null, error: 'No se pudieron cargar las ofertas.' };
  }

  return { data: data as Offer[], error: null };
}

// ─── DETALLE DE OFERTA ────────────────────────────────────────────────────────

/**
 * Obtiene el detalle completo de una oferta por su ID.
 */
export async function fetchOfferById(
  offerId: string
): Promise<OffersResult<Offer>> {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      trapichero:profiles!trapichero_id (
        id,
        full_name,
        avatar_url,
        total_trades,
        successful_trades
      )
    `)
    .eq('id', offerId)
    .single();

  if (error) {
    return { data: null, error: 'No se pudo cargar la oferta.' };
  }

  return { data: data as Offer, error: null };
}

// ─── MIS OFERTAS (TRAPICHERO) ─────────────────────────────────────────────────

/**
 * Obtiene todas las ofertas del Trapichero autenticado.
 * Incluye todos los estados (activas, pausadas, canceladas).
 */
export async function fetchMyOffers(
  trapicheroId: string
): Promise<OffersResult<Offer[]>> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('trapichero_id', trapicheroId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: 'No se pudieron cargar tus ofertas.' };
  }

  return { data: data as Offer[], error: null };
}

// ─── CREAR OFERTA ─────────────────────────────────────────────────────────────

/**
 * Crea una nueva oferta en el marketplace.
 * Solo disponible para Trapicheros con KYC avanzado aprobado.
 */
export async function createOffer(
  trapicheroId: string,
  form: CreateOfferForm
): Promise<OffersResult<Offer>> {
  const { data, error } = await supabase
    .from('offers')
    .insert({
      trapichero_id:          trapicheroId,
      type:                   form.type,
      amount_usdt:            form.amount_usdt,
      amount_usdt_remaining:  form.amount_usdt,  // Al crear, remaining = total
      exchange_rate:          form.exchange_rate,
      min_order_usdt:         form.min_order_usdt,
      max_order_usdt:         form.max_order_usdt,
      payment_methods:        form.payment_methods,
      notes:                  form.notes ?? null,
      status:                 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('[Offers] Error creating:', error);
    return { data: null, error: 'No se pudo crear la oferta. Intenta de nuevo.' };
  }

  return { data: data as Offer, error: null };
}

// ─── PAUSAR / REACTIVAR OFERTA ────────────────────────────────────────────────

/**
 * Pausa una oferta activa o la reactiva si estaba pausada.
 */
export async function toggleOfferPause(
  offerId: string,
  currentStatus: 'active' | 'paused'
): Promise<OffersResult<Offer>> {
  const newStatus = currentStatus === 'active' ? 'paused' : 'active';

  const { data, error } = await supabase
    .from('offers')
    .update({ status: newStatus })
    .eq('id', offerId)
    .select()
    .single();

  if (error) {
    return { data: null, error: 'No se pudo actualizar la oferta.' };
  }

  return { data: data as Offer, error: null };
}

// ─── ELIMINAR OFERTA ──────────────────────────────────────────────────────────

/**
 * Cancela (elimina lógicamente) una oferta.
 * No se eliminan físicamente para mantener el historial.
 */
export async function cancelOffer(
  offerId: string
): Promise<OffersResult> {
  const { error } = await supabase
    .from('offers')
    .update({ status: 'cancelled' })
    .eq('id', offerId);

  if (error) {
    return { data: null, error: 'No se pudo eliminar la oferta.' };
  }

  return { data: null, error: null };
}
