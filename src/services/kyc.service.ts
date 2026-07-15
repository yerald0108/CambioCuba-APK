/**
 * KYC Service — Verificación de identidad
 *
 * Maneja:
 * - Subida de imágenes a Supabase Storage (bucket kyc-documents)
 * - Creación y actualización de documentos KYC en la BD
 * - Consulta del estado actual del KYC del usuario
 */

import { supabase, KYC_BUCKET } from '@lib/supabase';
import type { KycDocument } from '@/types/user.types';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface KycResult<T = void> {
  data: T | null;
  error: string | null;
}

export interface KycUploadData {
  id_card_front_uri: string;   // URI local de la foto frontal del carnet
  id_card_back_uri:  string;   // URI local de la foto trasera del carnet
  selfie_uri:        string;   // URI local de la selfie con el carnet
}

// ─── CONSULTAR ESTADO KYC ─────────────────────────────────────────────────────

/**
 * Obtiene el documento KYC básico del usuario.
 * Retorna null si el usuario nunca ha enviado documentos.
 */
export async function fetchKycDocument(
  userId: string
): Promise<KycResult<KycDocument>> {
  const { data, error } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('level', 'basic')
    .maybeSingle();   // maybeSingle no falla si no existe (retorna null)

  if (error) {
    return { data: null, error: 'No se pudo cargar el estado de verificación.' };
  }

  return { data: data as KycDocument | null, error: null };
}

// ─── SUBIR IMÁGENES ───────────────────────────────────────────────────────────

/**
 * Sube una imagen al bucket kyc-documents y retorna la URL pública.
 * Ruta en Storage: kyc-documents/{userId}/{filename}
 */
async function uploadKycImage(
  userId: string,
  imageUri: string,
  filename: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Convertir URI local a Blob para subirlo
    const response = await fetch(imageUri);
    const blob     = await response.blob();

    const filePath = `${userId}/${filename}`;
    const fileExt  = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fullPath = `${filePath}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(KYC_BUCKET)
      .upload(fullPath, blob, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,   // Sobreescribir si ya existe (para re-envíos)
      });

    if (uploadError) {
      console.error('[KYC] Error subiendo imagen:', uploadError);
      return { url: null, error: `Error subiendo ${filename}` };
    }

    // Obtener URL firmada (privada — no pública)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(KYC_BUCKET)
      .createSignedUrl(fullPath, 60 * 60 * 24 * 7); // 7 días de validez

    if (signedError || !signedData?.signedUrl) {
      return { url: null, error: 'No se pudo obtener la URL de la imagen.' };
    }

    return { url: fullPath, error: null }; // Guardamos el path, no la URL firmada
  } catch (err) {
    console.error('[KYC] Error inesperado subiendo imagen:', err);
    return { url: null, error: 'Error al procesar la imagen. Intenta de nuevo.' };
  }
}

// ─── ENVIAR KYC BÁSICO ────────────────────────────────────────────────────────

/**
 * Sube las 3 fotos y crea/actualiza el documento KYC básico.
 * Flujo:
 * 1. Sube foto frontal del carnet
 * 2. Sube foto trasera del carnet
 * 3. Sube selfie sosteniendo el carnet
 * 4. Crea o actualiza el registro en kyc_documents
 */
export async function submitBasicKyc(
  userId: string,
  uploadData: KycUploadData,
  onProgress?: (step: number, total: number, label: string) => void
): Promise<KycResult<KycDocument>> {
  const total = 4;

  // ── Paso 1: Foto frontal ──────────────────────────────────────────────────
  onProgress?.(1, total, 'Subiendo cara frontal del carnet...');
  const front = await uploadKycImage(
    userId,
    uploadData.id_card_front_uri,
    'id_card_front'
  );
  if (front.error) return { data: null, error: front.error };

  // ── Paso 2: Foto trasera ──────────────────────────────────────────────────
  onProgress?.(2, total, 'Subiendo cara trasera del carnet...');
  const back = await uploadKycImage(
    userId,
    uploadData.id_card_back_uri,
    'id_card_back'
  );
  if (back.error) return { data: null, error: back.error };

  // ── Paso 3: Selfie ────────────────────────────────────────────────────────
  onProgress?.(3, total, 'Subiendo selfie con el carnet...');
  const selfie = await uploadKycImage(
    userId,
    uploadData.selfie_uri,
    'selfie_with_id'
  );
  if (selfie.error) return { data: null, error: selfie.error };

  // ── Paso 4: Guardar en BD ─────────────────────────────────────────────────
  onProgress?.(4, total, 'Registrando documentos...');

  const kycPayload = {
    user_id:            userId,
    level:              'basic' as const,
    status:             'pending' as const,
    id_card_front_url:  front.url,
    id_card_back_url:   back.url,
    selfie_with_id_url: selfie.url,
    submitted_at:       new Date().toISOString(),
  };

  // Upsert: crea si no existe, actualiza si ya existe
  const { data, error } = await supabase
    .from('kyc_documents')
    .upsert(kycPayload, { onConflict: 'user_id,level' })
    .select()
    .single();

  if (error) {
    console.error('[KYC] Error guardando documento:', error);
    return {
      data: null,
      error: 'Las fotos se subieron pero no se pudo registrar. Intenta de nuevo.',
    };
  }

  return { data: data as KycDocument, error: null };
}

// ─── OBTENER URL FIRMADA ──────────────────────────────────────────────────────

/**
 * Genera una URL firmada temporal para mostrar una imagen privada de KYC.
 * Válida por 1 hora.
 */
export async function getKycImageUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(KYC_BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 hora

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
