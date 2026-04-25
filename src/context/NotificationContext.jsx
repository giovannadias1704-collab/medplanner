import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      setIsSupported(true);
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setError(null);
    if (!isSupported) {
      throw new Error('Notificações não suportadas');
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        // Aqui você pode obter o token FCM se usar Firebase Cloud Messaging
        setToken('token_placeholder');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isSupported]);

  const value = {
    permission,
    token,
    isSupported,
    error,
    requestPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};