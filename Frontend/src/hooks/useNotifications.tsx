import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  dedupeKey?: string;
}

interface AddNotificationInput {
  title: string;
  message: string;
  dedupeKey?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: AddNotificationInput) => void;
  dismissNotifications: (ids: string[]) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback(({ title, message, dedupeKey }: AddNotificationInput) => {
    setNotifications((current) => {
      const hasDuplicate = dedupeKey
        ? current.some((notification) => notification.dedupeKey === dedupeKey)
        : false;

      if (hasDuplicate) {
        return current;
      }

      return [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          message,
          createdAt: Date.now(),
          dedupeKey,
        },
        ...current,
      ];
    });
  }, []);

  const dismissNotifications = useCallback((ids: string[]) => {
    setNotifications((current) => current.filter((notification) => !ids.includes(notification.id)));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.length,
      addNotification,
      dismissNotifications,
    }),
    [notifications, addNotification, dismissNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }

  return context;
}