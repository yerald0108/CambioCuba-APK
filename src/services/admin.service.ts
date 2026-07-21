/**
 * Admin Service — Operaciones exclusivas del panel de administración
 *
 * Operaciones:
 * - Estadísticas del dashboard
 * - Gestión de KYC: aprobar, rechazar
 * - Gestión de disputas: resolver a favor del comprador o vendedor
 * - Gestión de usuarios: buscar, banear, desbanear
 * - Cancelar ofertas activas
 */

import { supabase } from '@lib/supabase';
import type { UserProfile } from '@/types/user.types';
import type { Order } from '@/types/order.types';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AdminResult<T = void> {
  data: T | null;
  error: string | null;
}

export interface DashboardStats {
  totalUsers:     number;
  activeOrders:   number;
  pendingKyc:     number;
  openDisputes:   number;
  volumeToday:    number;   // USDT intercambiados hoy
  completedToday: number;   // Órdenes completadas hoy
}

export interface KycReviewItem {
  id: string;
  user_id: string;
  level: 'basic' | 'advanced';
  status: string;
  id_card_front_url: string | null;
  id_card_back_url:  string | null;
  selfie_with_id_url: string | null;
  submitted_at: string | null;
  created_at: string;
  user: Pick<UserProfile, 'id' | 'full_name' | 'email' | 'phone'>;
}

export interface DisputeItem extends Order {
  buyer:  Pick<UserProfile, 'id' | 'full_name'>;
  seller: Pick<UserProfile, 'id' | 'full_name'>;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<AdminResult<DashboardStats>> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    // Ejecutar todas las queries en paralelo
    const [
      usersRes,
      activeOrdersRes,
      pendingKycRes,
      disputesRes,
      volumeRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'both_confirmed', 'buyer_paid']),
      supabase.from('kyc_documents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'disputed'),
      supabase.from('orders')
        .select('amount_usdt, status')
        .eq('status', 'completed')
        .gte('completed_at', todayIso),
    ]);

    const volumeToday    = (volumeRes.data ?? []).reduce((sum, o) => sum + Number(o.amount_usdt), 0);
    const completedToday = (volumeRes.data ?? []).length;

    return {
      data: {
        totalUsers:     usersRes.count         ?? 0,
        activeOrders:   activeOrdersRes.count  ?? 0,
        pendingKyc:     pendingKycRes.count     ?? 0,
        openDisputes:   disputesRes.count       ?? 0,
        volumeToday,
        completedToday,
      },
      error: null,
    };
  } catch (err) {
    console.error('[Admin] Error cargando estadísticas:', err);
    return { data: null, error: 'No se pudieron cargar las estadísticas.' };
  }
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export async function fetchPendingKyc(): Promise<AdminResult<KycReviewItem[]>> {
  const { data, error } = await supabase
    .from('kyc_documents')
    .select(`
      *,
      user:profiles!user_id (
        id, full_name, email, phone
      )
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  if (error) {
    console.error('[Admin] Error cargando KYC pendientes:', error);
    return { data: null, error: 'No se pudo cargar la lista de verificaciones.' };
  }

  return { data: data as unknown as KycReviewItem[], error: null };
}

export async function approveKyc(
  kycId: string,
  userId: string,
  adminId: string
): Promise<AdminResult> {
  // 1. Actualizar kyc_documents
  const { error: kycError } = await supabase
    .from('kyc_documents')
    .update({
      status:      'approved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', kycId);

  if (kycError) {
    return { data: null, error: 'No se pudo aprobar el KYC.' };
  }

  // 2. Actualizar el perfil del usuario
  await supabase
    .from('profiles')
    .update({
      kyc_status: 'approved',
      kyc_level:  'basic',
    })
    .eq('id', userId);

  // 3. Insertar notificación para el usuario
  await supabase.from('notifications').insert({
    user_id: userId,
    title:   '¡Verificación aprobada!',
    body:    'Tu identidad fue verificada. Ya puedes realizar intercambios en CambioCuba.',
    type:    'kyc',
    data:    null,
  });

  return { data: null, error: null };
}

export async function rejectKyc(
  kycId: string,
  userId: string,
  adminId: string,
  reason: string
): Promise<AdminResult> {
  const { error: kycError } = await supabase
    .from('kyc_documents')
    .update({
      status:           'rejected',
      reviewed_by:      adminId,
      reviewed_at:      new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', kycId);

  if (kycError) {
    return { data: null, error: 'No se pudo rechazar el KYC.' };
  }

  await supabase
    .from('profiles')
    .update({ kyc_status: 'rejected', kyc_rejection_reason: reason })
    .eq('id', userId);

  await supabase.from('notifications').insert({
    user_id: userId,
    title:   'Verificación rechazada',
    body:    `Tu solicitud fue rechazada: ${reason}. Puedes volver a intentarlo.`,
    type:    'kyc',
    data:    null,
  });

  return { data: null, error: null };
}

// ─── DISPUTAS ─────────────────────────────────────────────────────────────────

export async function fetchOpenDisputes(): Promise<AdminResult<DisputeItem[]>> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!buyer_id (id, full_name),
      seller:profiles!seller_id (id, full_name)
    `)
    .eq('status', 'disputed')
    .order('updated_at', { ascending: true });

  if (error) {
    console.error('[Admin] Error cargando disputas:', error);
    return { data: null, error: 'No se pudieron cargar las disputas.' };
  }

  return { data: data as unknown as DisputeItem[], error: null };
}

/**
 * Resolver disputa a favor del comprador → orden completada
 */
export async function resolveDisputeBuyer(
  orderId: string,
  adminId: string,
  resolution: string
): Promise<AdminResult> {
  const { error } = await supabase
    .from('orders')
    .update({
      status:                 'completed',
      dispute_resolved_by:    adminId,
      dispute_resolution:     resolution,
      completed_at:           new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) return { data: null, error: 'No se pudo resolver la disputa.' };
  return { data: null, error: null };
}

/**
 * Resolver disputa a favor del vendedor → orden cancelada
 */
export async function resolveDisputeSeller(
  orderId: string,
  adminId: string,
  resolution: string
): Promise<AdminResult> {
  const { error } = await supabase
    .from('orders')
    .update({
      status:              'cancelled',
      dispute_resolved_by: adminId,
      dispute_resolution:  resolution,
      cancelled_by:        adminId,
    })
    .eq('id', orderId);

  if (error) return { data: null, error: 'No se pudo resolver la disputa.' };
  return { data: null, error: null };
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<AdminResult<UserProfile[]>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return { data: null, error: 'Error buscando usuarios.' };
  return { data: data as UserProfile[], error: null };
}

export async function banUser(
  userId: string,
  reason: string
): Promise<AdminResult> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true, ban_reason: reason })
    .eq('id', userId);

  if (error) return { data: null, error: 'No se pudo banear al usuario.' };
  return { data: null, error: null };
}

export async function unbanUser(userId: string): Promise<AdminResult> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false, ban_reason: null })
    .eq('id', userId);

  if (error) return { data: null, error: 'No se pudo desbanear al usuario.' };
  return { data: null, error: null };
}