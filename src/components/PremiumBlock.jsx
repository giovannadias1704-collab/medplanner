import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function PremiumBlock({ feature, requiredPlan = 'premium', message }) {
  const navigate = useNavigate();

  const planNames = {
    student: 'Estudante',
    premium: 'Premium',
    lifetime: 'Vitalício'
  };

  const defaultMessages = {
    ai: 'A IA integrada está disponível apenas para assinantes.',
    pdfUpload: 'Upload de PDF está disponível apenas para assinantes.',
    advancedAnalytics: 'Analytics avançado está disponível apenas para assinantes.',
    exportPdf: 'Exportação em PDF está disponível apenas para planos Premium.',
    questionsGeneration: 'Geração de questões está disponível apenas para assinantes.',
    autoAdjustments: 'Ajustes automáticos estão disponíveis apenas para planos Premium.'
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-800 shadow-xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
          <LockClosedIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
          <SparklesIcon className="h-6 w-6 text-purple-600" />
          Recurso Premium
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || defaultMessages[feature] || 'Este recurso está disponível apenas para assinantes.'}
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
            📦 Necessário: Plano <span className="text-purple-600 dark:text-purple-400">{planNames[requiredPlan]}</span> ou superior
          </p>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          ⭐ Ver Planos e Assinar
        </button>
      </div>
    </div>
  );
}