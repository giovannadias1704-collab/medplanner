import { useState } from 'react';
import { TicketIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useCoupon } from '../context/CouponContext';
import { useAuth } from '../hooks/useAuth';

export default function CouponInput({ planName, planPrice }) {
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { appliedCoupon, applyCoupon, removeCoupon, calculateDiscount, calculateFinalPrice } = useCoupon();
  const { user } = useAuth();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage('❌ Digite um código de cupom!');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const result = await applyCoupon(couponCode, planName, planPrice, user?.email);
    
    setMessage(result.message);
    setIsLoading(false);

    if (result.success) {
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setMessage('');
    setCouponCode('');
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <TicketIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
          🎉 Tem um cupom de desconto?
        </h3>
      </div>

      {!appliedCoupon ? (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código do cupom"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳' : 'Aplicar'}
            </button>
          </div>

          {message && (
            <p className={`text-sm font-semibold ${
              message.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {message}
            </p>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-green-500 dark:border-green-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="font-bold text-gray-900 dark:text-white">
                {appliedCoupon.code}
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold">
                {appliedCoupon.label}
              </span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Preço original:</span>
              <span className="font-semibold text-gray-900 dark:text-white line-through">
                R$ {planPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">Desconto:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                -R$ {calculateDiscount(planPrice).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between text-lg border-t-2 border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-bold text-gray-900 dark:text-white">Preço final:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                R$ {calculateFinalPrice(planPrice).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-400 font-semibold">
              ⏳ Aguardando aprovação por email (até 24h)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}