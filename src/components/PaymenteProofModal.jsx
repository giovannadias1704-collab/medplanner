import { useState } from 'react';
import { XMarkIcon, CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useSubscription } from '../context/SubscriptionContext';

export default function PaymentProofModal() {
  const { subscription, submitPaymentProof, setShowPaymentModal } = useSubscription();
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!proofPreview) {
      alert('❌ Adicione o comprovante primeiro!');
      return;
    }

    // Salvar comprovante (em produção, enviar para servidor)
    submitPaymentProof(proofPreview);
  };

  const getPlanLabel = () => {
    const plans = {
      student: 'Estudante (R$ 7,90/mês)',
      premium: 'Premium (R$ 15,90/mês)',
      lifetime: 'Vitalício (R$ 250 à vista ou 5x R$ 60)'
    };
    return plans[subscription.plan] || subscription.plan;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              💳 Enviar Comprovante
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Plano: <strong>{getPlanLabel()}</strong>
            </p>
          </div>
          <button 
            onClick={() => setShowPaymentModal(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              Instruções de Pagamento
            </h4>
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal list-inside">
              <li>Faça o pagamento via <strong>Pix</strong> ou <strong>Cartão</strong></li>
              <li>Tire um print do comprovante</li>
              <li>Envie abaixo para aprovação</li>
              <li>Aguarde até <strong>24h</strong> para liberação</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📸 Upload do Comprovante
            </label>
            
            {!proofPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Clique para selecionar
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG até 5MB
                </p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img 
                  src={proofPreview} 
                  alt="Comprovante" 
                  className="w-full h-64 object-contain rounded-xl border-2 border-green-200 dark:border-green-800"
                />
                <button
                  onClick={() => {
                    setProofImage(null);
                    setProofPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!proofPreview}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar Comprovante
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            🔒 Seu comprovante é seguro e será verificado em até 24 horas
          </p>
        </div>
      </div>
    </div>
  );
}