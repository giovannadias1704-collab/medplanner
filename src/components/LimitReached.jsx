import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function LimitReached({ 
  title = 'Limite Atingido',
  message, 
  currentUsage, 
  limit,
  feature 
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border-2 border-yellow-300 dark:border-yellow-700 shadow-xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {currentUsage}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Usado</div>
            </div>
            <div className="text-2xl text-gray-400">/</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {limit}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Limite</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          🚀 Fazer Upgrade do Plano
        </button>
      </div>
    </div>
  );
}