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
    .maybeSingle();

  if (error) {
    return { data: null, error: 'No se pudo cargar el estado de verificación.' };
  }

  return { data: data as KycDocument | null, error: null };
}

// ─── SUBIR IMÁGENES ───────────────────────────────────────────────────────────

/**
 * Sube una imagen al bucket kyc-documents usando FormData.
 *
 * IMPORTANTE: En React Native no se puede usar fetch() sobre URIs locales
 * (file:// o content://) porque el fetch nativo no tiene acceso al sistema
 * de archivos. La solución es construir un FormData con el objeto de archivo
 * directamente — React Native sabe resolverlo correctamente.
 *
 * Ruta en Storage: kyc-documents/{userId}/{filename}.{ext}
 */
async function uploadKycImage(
  userId: string,
  imageUri: string,
  filename: string
): Promise<{ path: string | null; error: string | null }> {
  try {
    // Extraer la extensión de la URI. Fallback a 'jpg'.
    const uriParts = imageUri.split('.');
    const fileExt  = (uriParts[uriParts.length - 1]?.toLowerCase() ?? 'jpg')
      .split('?')[0];   // eliminar query params si los hay
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    const fullPath = `${userId}/${filename}.${fileExt}`;

    // FormData con el archivo como objeto — React Native lo resuelve nativamente
    const formData = new FormData();
    formData.append('file', {
      uri:  imageUri,
      name: `${filename}.${fileExt}`,
      type: mimeType,
    } as unknown as Blob);

    const { error: uploadError } = await supabase.storage
      .from(KYC_BUCKET)
      .upload(fullPath, formData, {
        contentType: mimeType,
        upsert: true,   // Sobreescribir si ya existe (para re-envíos)
      });

    if (uploadError) {
      console.error('[KYC] Error subiendo imagen:', uploadError);
      return { path: null, error: `Error subiendo ${filename}` };
    }

    // Retornamos el path en Storage para guardarlo en la BD
    return { path: fullPath, error: null };
  } catch (err) {
    console.error('[KYC] Error inesperado subiendo imagen:', err);
    return { path: null, error: 'Error al procesar la imagen. Intenta de nuevo.' };
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
    id_card_front_url:  front.path,
    id_card_back_url:   back.path,
    selfie_with_id_url: selfie.path,
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