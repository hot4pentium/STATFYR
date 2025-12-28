import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { requestNotificationPermission, onForegroundMessage } from './firebase';
import { useUser } from './userContext';

interface NotificationContextType {
  notificationsEnabled: boolean;
  hasUnread: boolean;
  enableNotifications: () => Promise<boolean>;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;

    const unsubscribe = onForegroundMessage((payload) => {
      setHasUnread(true);
      
      if (payload.notification) {
        new Notification(payload.notification.title || 'New Message', {
          body: payload.notification.body,
          icon: '/logo.png',
        });
      }
    });

    return unsubscribe;
  }, [notificationsEnabled]);

  const enableNotifications = useCallback(async () => {
    if (!user) return false;
    
    const token = await requestNotificationPermission(user.id);
    if (token) {
      setNotificationsEnabled(true);
      return true;
    }
    return false;
  }, [user]);

  const clearUnread = useCallback(() => {
    setHasUnread(false);
  }, []);

  return (
    <NotificationContext.Provider value={{ notificationsEnabled, hasUnread, enableNotifications, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
