import { INotification } from "@nexuschat/shared";
import { create } from "zustand";

interface NotificationState {
  items: INotification[];
  unreadCount: number;
  setNotifications: (items: INotification[], unreadCount: number) => void;
  addNotification: (item: INotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setNotifications: (items, unreadCount) => set({ items, unreadCount }),
  addNotification: (item) => set((state) => ({ items: [item, ...state.items], unreadCount: state.unreadCount + 1 })),
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllRead: () => set((state) => ({ items: state.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 })),
}));
