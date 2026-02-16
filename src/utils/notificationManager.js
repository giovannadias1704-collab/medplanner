/**
 * Gerenciador de Notificações - MedPlanner
 */

export const NOTIFICATION_TYPES = {
  EVENT: 'event',
  TASK: 'task',
  BILL: 'bill',
  WATER: 'water',
  STUDY: 'study',
  INFO: 'info'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Solicitar permissão de notificações do navegador
 */
export const requestBrowserPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return 'denied';
  }
};

/**
 * Enviar notificação do navegador
 */
export const sendBrowserNotification = (title, message, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('Notificações não suportadas');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Permissão de notificação não concedida');
    return;
  }

  try {
    const notification = new Notification(title, {
      body: message,
      icon: options.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: options.tag || `medplanner-${Date.now()}`,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      vibrate: options.vibrate || [200, 100, 200]
    });

    // Auto-close após 5 segundos
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    // Click handler
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) {
        options.onClick();
      }
    };

    return notification;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};

/**
 * Verificar se deve notificar baseado em configurações
 */
export const shouldNotify = (type, settings) => {
  if (!settings?.notifications) return false;
  if (!settings?.notificationTypes) return true;
  return settings.notificationTypes[type] !== false;
};

/**
 * Calcular dias até data
 */
export const daysUntil = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Formatar data para notificação
 */
export const formatNotificationDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'amanhã';
  if (diffDays === -1) return 'ontem';
  if (diffDays > 0) return `em ${diffDays} dia(s)`;
  if (diffDays < 0) return `há ${Math.abs(diffDays)} dia(s)`;
};

/**
 * Obter emoji baseado no tipo
 */
export const getNotificationEmoji = (type) => {
  const emojis = {
    event: '📅',
    task: '✅',
    bill: '💰',
    water: '💧',
    study: '📚',
    info: 'ℹ️'
  };
  return emojis[type] || '🔔';
};

/**
 * Criar som de notificação (opcional)
 */
export const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(err => console.log('Não foi possível reproduzir som'));
  } catch (error) {
    console.log('Som de notificação não disponível');
  }
};