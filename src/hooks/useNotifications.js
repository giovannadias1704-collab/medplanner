import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';

export function useNotifications() {
  const { 
    notifications, 
    settings,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getUnreadNotifications
  } = useContext(AppContext);

  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);

  useEffect(() => {
    const unread = getUnreadNotifications();
    setUnreadCount(unread.length);

    if (unread.length > 0) {
      setLatestNotification(unread[0]);
    }
  }, [notifications]);

  const dismissNotification = async (notificationId) => {
    await markNotificationAsRead(notificationId);
  };

  const removeNotification = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const dismissAll = async () => {
    await markAllNotificationsAsRead();
  };

  return {
    notifications,
    unreadCount,
    latestNotification,
    dismissNotification,
    removeNotification,
    dismissAll,
    notificationsEnabled: settings?.notifications || false
  };
}