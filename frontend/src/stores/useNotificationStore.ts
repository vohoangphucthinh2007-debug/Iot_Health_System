import { create } from 'zustand';

export type AlertType = 'fall' | 'hr_high' | 'hr_low' | 'spo2_low' | 'esp_claim';

export interface AppNotification {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string; // ISO
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  hasUnread: boolean;
  activeAlert: AppNotification | null; // cảnh báo đang hiện toàn màn hình
  addNotification: (n: Omit<AppNotification, 'read'>) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  setHasUnread: (value: boolean) => void; // giữ để tương thích code cũ
  dismissActiveAlert: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  hasUnread: false,
  activeAlert: null,
  addNotification: (n) =>
    set((s) => {
      if (s.notifications.some((x) => x.id === n.id)) return s;
      const item: AppNotification = { ...n, read: false };
      return {
        notifications: [item, ...s.notifications].slice(0, 50),
        hasUnread: true,
        activeAlert: item,
      };
    }),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })), hasUnread: false })),
  remove: (id) =>
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id);
      return { notifications, hasUnread: notifications.some((n) => !n.read) };
    }),
  clearAll: () => set({ notifications: [], hasUnread: false }),
  setHasUnread: (value) => set({ hasUnread: value }),
  dismissActiveAlert: () => set({ activeAlert: null }),
}));
