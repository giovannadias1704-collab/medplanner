import { XCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';

export default function PaymentBlockedScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 max-w-2xl w-full shadow-2xl border-2 border-red-200 dark:border-red-800 text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircleIcon className="h-16 w-16 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          ⚠️ Acesso Bloqueado
        </h1>

        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Seu plano expirou ou o pagamento está pendente.
        </p>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-2">
            <CreditCardIcon className="h-6 w-6 text-yellow-600" />
            O que aconteceu?
          </h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 text-left max-w-md mx-auto">
            <li>✓ Seu pagamento mensal venceu há mais de 3 dias</li>
            <li>✓ Seus dados estão salvos e seguros</li>
            <li>✓ Regularize para voltar a usar</li>
          </ul>
        </div>

        <div className="space-y-3">
          <a
            href="/pricing"
            className="block w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold text-lg shadow-xl transition-all hover-lift"
          >
            💳 Renovar Assinatura
          </a>

          <a
            href="https://wa.me/5511999999999?text=Olá!%20Preciso%20regularizar%20meu%20pagamento%20do%20MedPlanner"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-8 py-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold transition-all"
          >
            💬 Falar no WhatsApp
          </a>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          Após o pagamento, seu acesso será liberado automaticamente em até 24h.
        </p>
      </div>
    </div>
  );
}