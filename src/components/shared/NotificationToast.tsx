/**
 * NotificationToast — Sistema de notificaciones in-app
 *
 * Se renderiza en el root layout sobre toda la UI.
 * Consume el store de notificaciones y muestra toasts animados.
 * Diseño "Vault Dark": borde lateral de color semántico.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable, Platform } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';

import {
  useNotificationsStore,
  type AppNotification,
  type NotificationType,
} from '@stores/notifications.store';
import { Colors } from '@constants/theme';

// ─── CONFIGURACIÓN POR TIPO ───────────────────────────────────────────────────

const CONFIG: Record<NotificationType, {
  icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
  color: string;
  bgColor: string;
}> = {
  success: {
    icon: CheckCircle,
    color: Colors.success,
    bgColor: Colors.successMuted,
  },
  error: {
    icon: XCircle,
    color: Colors.danger,
    bgColor: Colors.dangerMuted,
  },
  warning: {
    icon: AlertTriangle,
    color: Colors.warning,
    bgColor: Colors.warningMuted,
  },
  info: {
    icon: Info,
    color: Colors.info,
    bgColor: Colors.infoMuted,
  },
};

// ─── TOAST INDIVIDUAL ─────────────────────────────────────────────────────────

function Toast({ notification }: { notification: AppNotification }) {
  const { dismiss } = useNotificationsStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = CONFIG[notification.type];
  const Icon = config.icon;

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
        // Sombra del toast
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          borderLeftWidth: 3,
          borderLeftColor: config.color,
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: 12,
            gap: 10,
          }}
        >
          {/* Icono */}
          <View style={{ marginTop: 1 }}>
            <Icon color={config.color} size={18} strokeWidth={2} />
          </View>

          {/* Textos */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: Colors.textPrimary,
                fontSize: 14,
                fontWeight: '600',
                marginBottom: notification.message ? 2 : 0,
              }}
            >
              {notification.title}
            </Text>
            {notification.message && (
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {notification.message}
              </Text>
            )}
          </View>

          {/* Botón de cerrar */}
          <Pressable
            onPress={() => dismiss(notification.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X color={Colors.textMuted} size={16} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── CONTENEDOR DE TOASTS ─────────────────────────────────────────────────────

export function NotificationToast() {
  const { notifications } = useNotificationsStore();

  if (notifications.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 40,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </View>
  );
}
