/**
 * Tipos de usuario, roles y KYC
 * Refleja exactamente la estructura de la base de datos Supabase.
 */

// ─── ROLES ────────────────────────────────────────────────────────────────────

/** Roles posibles en la aplicación */
export type UserRole = 'admin' | 'user' | 'trapichero';

// ─── ESTADO KYC ───────────────────────────────────────────────────────────────

/** Estado del proceso de verificación de identidad */
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

/** Nivel de KYC completado */
export type KycLevel = 'none' | 'basic' | 'advanced';

// ─── PERFIL DE USUARIO ────────────────────────────────────────────────────────

/** Perfil completo del usuario tal como viene de la DB */
export interface UserProfile {
  id: string;                        // UUID de Supabase Auth
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  kyc_level: KycLevel;
  kyc_status: KycStatus;
  kyc_rejection_reason: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  // Métricas de reputación (calculadas)
  total_trades: number;
  successful_trades: number;
  cancelled_trades: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

/** Reputación calculada del usuario para mostrar en perfil */
export interface UserReputation {
  success_rate: number;              // Porcentaje 0-100
  total_trades: number;
  successful_trades: number;
  cancelled_trades: number;
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

/** Documento de verificación KYC */
export interface KycDocument {
  id: string;
  user_id: string;
  level: 'basic' | 'advanced';
  status: KycStatus;
  // Fotos (URLs de Supabase Storage)
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  selfie_with_id_url: string | null;
  // KYC avanzado
  phone_verified: boolean;
  // Revisión del admin
  reviewed_by: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── ESTADO DE SESIÓN ─────────────────────────────────────────────────────────

/** Estado de autenticación en el store de Zustand */
export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
