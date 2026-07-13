/**
 * Tipos del chat en tiempo real vinculado a una orden.
 */

// ─── TIPO DE MENSAJE ──────────────────────────────────────────────────────────

/** Tipos posibles de mensajes en el chat */
export type MessageType =
  | 'text'      // Mensaje de texto del usuario
  | 'image'     // Imagen (comprobante de pago u otras)
  | 'system';   // Mensaje automático del sistema (cambio de estado, timer, etc.)

// ─── MENSAJE ──────────────────────────────────────────────────────────────────

/** Mensaje individual en el chat de una orden */
export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string | null;           // null si es mensaje del sistema
  type: MessageType;
  content: string;                    // Texto o URL de imagen
  is_payment_proof: boolean;          // true si es el comprobante oficial
  created_at: string;
  // Relación — viene del JOIN con profiles
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

// ─── FORMULARIO ───────────────────────────────────────────────────────────────

/** Datos para enviar un mensaje de texto */
export interface SendMessageForm {
  order_id: string;
  content: string;
}
