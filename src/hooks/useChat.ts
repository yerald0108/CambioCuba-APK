/**
 * useChat — Hook de mensajería en tiempo real para una orden
 *
 * Maneja:
 * - Carga inicial de mensajes con TanStack Query
 * - Suscripción Realtime: nuevos mensajes aparecen al instante
 *   en ambos dispositivos sin polling
 * - Envío de mensajes de texto
 * - Scroll automático al último mensaje
 */

import { useEffect, useRef, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@lib/supabase';
import { QueryKeys } from '@lib/queryClient';
import { useAuthStore } from '@stores/auth.store';
import { notify } from '@stores/notifications.store';
import {
  fetchMessages,
  sendMessage,
} from '@services/chat.service';
import type { ChatMessage } from '@/types/chat.types';

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────

export function useChat(orderId: string) {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Ref al FlatList para hacer scroll automático al recibir mensajes
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.chat.messages(orderId),
    queryFn:  () => fetchMessages(orderId).then((r) => r.data ?? []),
    enabled:  !!orderId,
    staleTime: 0,   // Siempre refrescar al montar — el Realtime cubre el resto
  });

  // ── Scroll al último mensaje cuando cambia la lista ────────────────────────
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Pequeño delay para que el FlatList termine de renderizar
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  // ── Suscripción Realtime ───────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`chat:${orderId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `order_id=eq.${orderId}`,
        },
        async (payload) => {
          // El payload del INSERT no incluye el JOIN con profiles,
          // así que hacemos un fetch del mensaje completo por su ID
          const newMessage = payload.new as ChatMessage;

          // Obtenemos el mensaje con el sender incluido
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', newMessage.id)
            .single();

          if (!data) return;

          // Añadimos el nuevo mensaje a la caché sin refetch completo
          queryClient.setQueryData(
            QueryKeys.chat.messages(orderId),
            (prev: ChatMessage[] | undefined) => {
              if (!prev) return [data as unknown as ChatMessage];
              // Evitar duplicados (puede llegar del Realtime y del mutate)
              const exists = prev.some((m) => m.id === data.id);
              if (exists) return prev;
              return [...prev, data as unknown as ChatMessage];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      sendMessage(user!.id, { order_id: orderId, content }),

    // Optimistic update: el mensaje aparece al instante en la UI,
    // antes de que Supabase confirme el INSERT
    onMutate: async (content: string) => {
      // Cancelar cualquier refetch en curso
      await queryClient.cancelQueries({ queryKey: QueryKeys.chat.messages(orderId) });

      // Guardar estado anterior para rollback
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        QueryKeys.chat.messages(orderId)
      );

      // Mensaje temporal optimista
      const optimisticMessage: ChatMessage = {
        id:               `optimistic-${Date.now()}`,
        order_id:         orderId,
        sender_id:        user!.id,
        type:             'text',
        content:          content.trim(),
        is_payment_proof: false,
        created_at:       new Date().toISOString(),
        sender: {
          id:         user!.id,
          full_name:  user!.full_name,
          avatar_url: user!.avatar_url,
        },
      };

      // Insertamos el mensaje optimista en la caché
      queryClient.setQueryData(
        QueryKeys.chat.messages(orderId),
        (prev: ChatMessage[] | undefined) => [...(prev ?? []), optimisticMessage]
      );

      return { previousMessages };
    },

    onError: (_error, _content, context) => {
      // Rollback al estado anterior si falla
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(
          QueryKeys.chat.messages(orderId),
          context.previousMessages
        );
      }
      notify.error('Error', 'No se pudo enviar el mensaje.');
    },

    onSuccess: ({ data, error }) => {
      if (error) {
        notify.error('Error', error);
        return;
      }
      // El Realtime ya habrá actualizado la caché con el mensaje real.
      // Si no llegó (edge case), invalidamos para refrescar.
      if (data) {
        queryClient.setQueryData(
          QueryKeys.chat.messages(orderId),
          (prev: ChatMessage[] | undefined) => {
            if (!prev) return [data];
            // Reemplazar el mensaje optimista con el real
            const filtered = prev.filter((m) => !m.id.startsWith('optimistic-'));
            const exists = filtered.some((m) => m.id === data.id);
            return exists ? filtered : [...filtered, data];
          }
        );
      }
    },
  });

  // ── Helpers de UI ─────────────────────────────────────────────────────────

  /** Si un mensaje fue enviado por el usuario actual */
  const isOwnMessage = useCallback(
    (message: ChatMessage) => message.sender_id === user?.id,
    [user?.id]
  );

  return {
    // Datos
    messages:    messages ?? [],
    isLoading,
    isError,
    refetch,
    // Envío
    sendMessage: sendMutation.mutate,
    isSending:   sendMutation.isPending,
    // Helpers
    isOwnMessage,
    currentUserId: user?.id,
    // Ref para scroll
    listRef,
  };
}