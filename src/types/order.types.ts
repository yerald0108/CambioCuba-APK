/**
 * Tipos de órdenes P2P y su máquina de estados.
 *
 * State machine:
 *   pending → both_confirmed → buyer_paid → completed
 *                           ↘ disputed
 *   pending → cancelled
 *   both_confirmed → cancelled
 *   both_confirmed → expired (automático a los 20 min)
 */

import type { PaymentMethodId } from '@constants/theme';

// ─── ESTADO DE ORDEN ──────────────────────────────────────────────────────────

/** Estado del ciclo de vida de una orden */
export type OrderStatus =
  | 'pending'           // Creada, esperando confirmación de ambos
  | 'both_confirmed'    // Ambos confirmaron "listo" — inicia el timer
  | 'buyer_paid'        // Comprador subió comprobante de pago
  | 'completed'         // Vendedor confirmó recibo — orden exitosa
  | 'disputed'          // Hay una disputa activa — bloqueada para admin
  | 'cancelled'         // Cancelada por alguno de los dos
  | 'expired';          // Timer de 20 min expiró sin completarse

// ─── ORDEN ────────────────────────────────────────────────────────────────────

/** Orden P2P entre dos usuarios */
export interface Order {
  id: string;
  offer_id: string;
  // Partes involucradas
  buyer_id: string;                    // Quien compra USDT
  seller_id: string;                   // Quien vende USDT (el Trapichero)
  // Montos acordados
  amount_usdt: number;                 // Cantidad de USDT en esta orden
  exchange_rate: number;               // Tasa acordada al momento de crear
  amount_cup: number;                  // CUP a pagar = amount_usdt * exchange_rate
  payment_method: PaymentMethodId;     // Método elegido por el comprador
  // Estado
  status: OrderStatus;
  // Confirmaciones
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  // Comprobante de pago
  payment_proof_url: string | null;
  // Disputa
  disputed_by: string | null;          // ID del usuario que abrió la disputa
  dispute_reason: string | null;
  dispute_resolved_by: string | null;  // ID del admin que resolvió
  dispute_resolution: string | null;
  // Calificaciones
  buyer_rated: boolean;                // Si el comprador ya calificó
  seller_rated: boolean;               // Si el vendedor ya calificó
  // Cancelación
  cancelled_by: string | null;
  cancellation_reason: string | null;
  // Timestamps
  confirmed_at: string | null;         // Cuando ambos confirmaron
  expires_at: string | null;           // Cuando expira (confirmed_at + 20 min)
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── CALIFICACIÓN ─────────────────────────────────────────────────────────────

/** Calificación mutua al completar una orden */
export interface OrderRating {
  id: string;
  order_id: string;
  rater_id: string;    // Quien califica
  rated_id: string;    // Quien es calificado
  score: number;       // 1-5
  comment: string | null;
  created_at: string;
}

// ─── FORMULARIO ───────────────────────────────────────────────────────────────

/** Datos para iniciar una orden desde una oferta */
export interface CreateOrderForm {
  offer_id: string;
  amount_usdt: number;
  payment_method: PaymentMethodId;
}

/** Datos para calificar al contraparte */
export interface RateOrderForm {
  score: number;
  comment?: string;
}
