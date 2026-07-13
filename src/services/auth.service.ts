/**
 * Auth Service — Operaciones de autenticación con Supabase
 *
 * Encapsula todas las llamadas a supabase.auth y supabase.from('profiles').
 * Los componentes y stores nunca llaman a Supabase directamente — usan este servicio.
 */

import { supabase } from '@lib/supabase';
import type { RegisterFormData, LoginFormData } from '@utils/validators';
import type { UserProfile } from '@/types/user.types';

// ─── TIPOS DE RESPUESTA ───────────────────────────────────────────────────────

export interface AuthResult<T = void> {
  data: T | null;
  error: string | null;
}

// ─── REGISTRO ─────────────────────────────────────────────────────────────────

/**
 * Registra un nuevo usuario en Supabase Auth.
 * El trigger on_auth_user_created crea automáticamente el perfil en public.profiles.
 */
export async function registerUser(
  formData: RegisterFormData
): Promise<AuthResult<UserProfile>> {
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      // Estos metadatos los lee el trigger handle_new_user() para crear el perfil
      data: {
        full_name: formData.full_name,
      },
    },
  });

  if (error) {
    return { data: null, error: translateAuthError(error.message) };
  }

  if (!data.user) {
    return { data: null, error: 'No se pudo crear la cuenta. Intenta de nuevo.' };
  }

  // Cargar el perfil recién creado por el trigger
  const profile = await fetchUserProfile(data.user.id);
  return profile;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

/**
 * Inicia sesión con email y contraseña.
 * Retorna el perfil completo del usuario.
 */
export async function loginUser(
  formData: LoginFormData
): Promise<AuthResult<UserProfile>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { data: null, error: translateAuthError(error.message) };
  }

  if (!data.user) {
    return { data: null, error: 'No se pudo iniciar sesión. Intenta de nuevo.' };
  }

  // Cargar perfil completo desde public.profiles
  const profile = await fetchUserProfile(data.user.id);
  return profile;
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

/**
 * Cierra la sesión y elimina el token de SecureStore.
 */
export async function logoutUser(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error: 'No se pudo cerrar sesión. Intenta de nuevo.' };
  }

  return { data: null, error: null };
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────

/**
 * Obtiene el perfil completo de un usuario desde public.profiles.
 * Usado internamente después del login/registro y en el root layout.
 */
export async function fetchUserProfile(
  userId: string
): Promise<AuthResult<UserProfile>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return {
      data: null,
      error: 'No se pudo cargar tu perfil. Intenta de nuevo.',
    };
  }

  return { data: data as UserProfile, error: null };
}

/**
 * Actualiza campos editables del perfil del usuario autenticado.
 * Los campos protegidos (role, kyc_status, etc.) solo los puede cambiar el admin.
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>
): Promise<AuthResult<UserProfile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: 'No se pudo actualizar el perfil.' };
  }

  return { data: data as UserProfile, error: null };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Traduce los mensajes de error de Supabase Auth a español.
 * Supabase devuelve errores en inglés por defecto.
 */
function translateAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials':
      'Correo o contraseña incorrectos.',
    'Email not confirmed':
      'Confirma tu correo electrónico antes de iniciar sesión.',
    'User already registered':
      'Ya existe una cuenta con este correo electrónico.',
    'Password should be at least 6 characters':
      'La contraseña debe tener al menos 8 caracteres.',
    'Email rate limit exceeded':
      'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.',
    'For security purposes, you can only request this once every 60 seconds':
      'Por seguridad, espera 60 segundos antes de intentar de nuevo.',
    'signup is disabled':
      'El registro está deshabilitado temporalmente.',
    'Email link is invalid or has expired':
      'El enlace expiró o ya fue usado.',
  };

  // Buscar coincidencia exacta o parcial
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Fallback genérico
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
