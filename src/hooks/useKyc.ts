/**
 * useKyc — Hook de verificación de identidad
 *
 * Combina TanStack Query (caché y estado del servidor) con
 * las mutaciones de envío de documentos.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@lib/queryClient';
import { fetchKycDocument, submitBasicKyc, type KycUploadData } from '@services/kyc.service';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────

export function useKyc() {
  const user       = useAuthStore((s) => s.user);
  const setUser    = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  // Estado del progreso de subida
  const [uploadProgress, setUploadProgress] = useState<{
    step: number;
    total: number;
    label: string;
  } | null>(null);

  // ─── Query: estado actual del KYC ────────────────────────────────────────
  const {
    data: kycDocument,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.kyc.document(user?.id ?? ''),
    queryFn:  () => fetchKycDocument(user!.id).then((r) => r.data),
    enabled:  !!user?.id,
    staleTime: 60 * 1000, // 1 minuto — el KYC no cambia tan seguido
  });

  // ─── Mutación: enviar KYC básico ──────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (uploadData: KycUploadData) =>
      submitBasicKyc(user!.id, uploadData, (step, total, label) => {
        setUploadProgress({ step, total, label });
      }),

    onSuccess: ({ data, error }) => {
      setUploadProgress(null);

      if (error) {
        notify.error('Error al enviar', error);
        return;
      }

      if (data) {
        // Actualizar caché de TanStack Query
        queryClient.setQueryData(
          QueryKeys.kyc.document(user!.id),
          data
        );

        // Actualizar el perfil en el store (kyc_status → pending)
        if (user) {
          setUser({ ...user, kyc_status: 'pending' });
        }

        notify.success(
          'Documentos enviados',
          'Un administrador revisará tu verificación en breve.'
        );
      }
    },

    onError: () => {
      setUploadProgress(null);
      notify.error('Error inesperado', 'No se pudieron enviar los documentos.');
    },
  });

  // ─── Helpers derivados ────────────────────────────────────────────────────

  const kycStatus = kycDocument?.status ?? user?.kyc_status ?? 'none';
  const isPending  = kycStatus === 'pending';
  const isApproved = kycStatus === 'approved';
  const isRejected = kycStatus === 'rejected';
  const hasSubmitted = kycStatus !== 'none';

  return {
    // Estado del documento KYC
    kycDocument,
    kycStatus,
    isPending,
    isApproved,
    isRejected,
    hasSubmitted,
    // Estado de la query
    isLoading,
    isError,
    refetch,
    // Subida
    submitKyc: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    uploadProgress,
  };
}
