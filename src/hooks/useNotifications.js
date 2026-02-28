import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';

// Mapeamento: tipo da notificação → chave no settings
const TYPE_TO_SETTING = {
  event:  'notifEvents',
  task:   'notifTasks',
  bill:   'notifBills',
  water:  'notifWater',
  study:  'notifStudy',
  health: 'notifHealth',
};

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

  // ─── Filtra notificações cujo tipo está habilitado nas settings ─────────────
  const isTypeEnabled = (notification) => {
    // Notificações manuais ou sem tipo mapeado sempre aparecem
    if (notification.manual) return true;
    const settingKey = TYPE_TO_SETTING[notification.type];
    if (!settingKey) return true;
    // Se a chave existir no settings, respeita o valor; se não existir, assume true
    return settings?.[settingKey] !== false;
  };

  const enabledNotifications = notifications.filter(isTypeEnabled);

  useEffect(() => {
    const unread = enabledNotifications.filter(n => !n.read);
    setUnreadCount(unread.length);
    // latestNotification = a não lida mais recente (entre as habilitadas)
    const latest = unread.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    setLatestNotification(latest || null);
  }, [notifications, settings]);

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
    notifications: enabledNotifications,   // Apenas as habilitadas
    allNotifications: notifications,        // Todas (para o NotificationCenter mostrar histórico)
    unreadCount,
    latestNotification,
    dismissNotification,
    removeNotification,
    dismissAll,
    notificationsEnabled: settings?.notifications !== false,
    isTypeEnabled,
  };
}