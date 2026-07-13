/**
 * Tipos de ofertas publicadas por los Trapicheros.
 */

import type { PaymentMethodId, OfferTypeId } from '@constants/theme';
import type { UserProfile } from './user.types';

// ─── ESTADO DE OFERTA ─────────────────────────────────────────────────────────

/** Estado del ciclo de vida de una oferta */
export type OfferStatus =
  | 'active'     // Visible y disponible en el marketplace
  | 'paused'     // Pausada temporalmente por el Trapichero
  | 'in_order'   // Tiene una orden activa en este momento
  | 'completed'  // Cantidad agotada
  | 'cancelled'; // Eliminada por el Trapichero o un Admin

// ─── OFERTA ───────────────────────────────────────────────────────────────────

/** Oferta de compra o venta publicada por un Trapichero */
export interface Offer {
  id: string;
  trapichero_id: string;
  type: OfferTypeId;                  // 'buy' | 'sell'
  // Monedas: siempre USDT ↔ CUP
  amount_usdt: number;                // Cantidad total de USDT en la oferta
  amount_usdt_remaining: number;      // Cantidad disponible aún
  exchange_rate: number;              // Tasa: cuántos CUP vale 1 USDT
  min_order_usdt: number;             // Mínimo por operación en USDT
  max_order_usdt: number;             // Máximo por operación en USDT
  payment_methods: PaymentMethodId[]; // Métodos de pago aceptados
  notes: string | null;              // Comentario adicional del Trapichero
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  // Relación — viene del JOIN con profiles
  trapichero?: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url' | 'total_trades' | 'successful_trades'>;
}

// ─── FILTROS DE BÚSQUEDA ──────────────────────────────────────────────────────

/** Filtros disponibles en el marketplace */
export interface OfferFilters {
  type?: OfferTypeId;
  payment_method?: PaymentMethodId;
  min_rate?: number;
  max_rate?: number;
  min_amount?: number;
}

// ─── FORMULARIO DE CREACIÓN ───────────────────────────────────────────────────

/** Datos del formulario para crear/editar una oferta */
export interface CreateOfferForm {
  type: OfferTypeId;
  amount_usdt: number;
  exchange_rate: number;
  min_order_usdt: number;
  max_order_usdt: number;
  payment_methods: PaymentMethodId[];
  notes?: string;
}
