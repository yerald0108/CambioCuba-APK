/**
 * Notifications Store — Notificaciones in-app (toasts y banners)
 *
 * Las notificaciones push se manejan con expo-notifications.
 * Este store maneja las notificaciones dentro de la app (toasts).
 */

import { create } from 'zustand';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms — por defecto 3500
}

interface NotificationsStore {
  notifications: AppNotification[];
  show: (notification: Omit<AppNotification, 'id'>) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],

  show: (notification) => {
    const id = Math.random().toString(36).slice(2);
    const duration = notification.duration ?? 3500;

    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));

    // Auto-dismiss después del tiempo definido
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },

  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));

// ─── HELPER ───────────────────────────────────────────────────────────────────
// Función helper para mostrar notificaciones sin necesidad del hook.
// Útil dentro de servicios y stores que no son componentes React.

export const notify = {
  success: (title: string, message?: string) =>
    useNotificationsStore.getState().show({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useNotificationsStore.getState().show({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    useNotificationsStore.getState().show({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useNotificationsStore.getState().show({ type: 'info', title, message }),
};
