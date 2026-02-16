import { useEffect, useState } from 'react';
import { XMarkIcon, BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function NotificationToast({ notification, onDismiss, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setVisible(true), 10);

    // Auto-close após 5 segundos
    if (notification.autoClose) {
      const duration = 5000;
      const interval = 50;
      const decrement = (interval / duration) * 100;

      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(timer);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onDismiss) onDismiss(notification.id);
    }, 300);
  };

  const handleRemove = () => {
    setVisible(false);
    setTimeout(() => {
      if (onRemove) onRemove(notification.id);
    }, 300);
  };

  const getColorClasses = () => {
    switch (notification.priority) {
      case 'high':
        return {
          bg: 'from-red-500 to-orange-500',
          icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        };
      case 'medium':
        return {
          bg: 'from-yellow-500 to-amber-500',
          icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
        };
      case 'low':
        return {
          bg: 'from-blue-500 to-cyan-500',
          icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        };
      default:
        return {
          bg: 'from-primary-500 to-primary-600',
          icon: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={`transform transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-sm">
        {/* Barra de progresso */}
        {notification.autoClose && (
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-50`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Ícone */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
              <BellIcon className="w-5 h-5" />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {new Date(notification.createdAt).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                title="Marcar como lida"
              >
                <CheckIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={handleRemove}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Remover"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}