import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import { XMarkIcon, BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationCenter({ isOpen, onClose }) {
  const { 
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification 
  } = useContext(AppContext);

  const { unreadCount } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const filteredNotifications = notifications
    .filter(n => {
      if (filter === 'unread') return !n.read;
      if (filter === 'read') return n.read;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getNotificationIcon = (type) => {
    const icons = {
      event: '📅',
      task: '✅',
      bill: '💰',
      water: '💧',
      study: '📚',
      info: 'ℹ️'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Painel de Notificações */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 animate-slide-in overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BellIcon className="w-6 h-6" />
              Notificações
            </h2>
            <p className="text-sm text-white/80 mt-1">
              {unreadCount} não lida(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'all'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              Não Lidas ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Marcar Todas Como Lidas
            </button>
          )}
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">🔕</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border-l-4 transition-all hover-lift ${
                  notification.read 
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600' 
                    : getPriorityColor(notification.priority)
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Emoji */}
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm mb-1 ${
                      notification.read 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mb-2 ${
                      notification.read 
                        ? 'text-gray-500 dark:text-gray-500' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all"
                        title="Marcar como lida"
                      >
                        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      title="Remover"
                    >
                      <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}