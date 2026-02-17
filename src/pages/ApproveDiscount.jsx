import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircleIcon, XCircleIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function ApproveDiscount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [action, setAction] = useState('approve');
  const [needsPaymentProof, setNeedsPaymentProof] = useState(false);

  useEffect(() => {
    const processRequest = async () => {
      const userId = searchParams.get('user');
      const coupon = searchParams.get('coupon');
      const token = searchParams.get('token');
      const actionParam = searchParams.get('action') || 'approve';

      setAction(actionParam);

      if (!userId || !coupon || !token) {
        setStatus('error');
        setMessage('Link inválido ou parâmetros faltando');
        return;
      }

      // Validar token
      const expectedToken = btoa(`${userId}-${coupon}-medplanner-secret-2024`);
      if (token !== expectedToken) {
        setStatus('error');
        setMessage('Token de segurança inválido');
        return;
      }

      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setStatus('error');
          setMessage('Usuário não encontrado');
          return;
        }

        const userData = userSnap.data();
        
        const validCoupons = {
          'MEDPLANNER30': { discount: 30, name: '30% OFF' },
          'MEDPLANNER50': { discount: 50, name: '50% OFF' },
          'MEDPLANNER100': { discount: 100, name: '100% OFF - Gratuito' }
        };

        const couponData = validCoupons[coupon];
        
        if (!couponData) {
          setStatus('error');
          setMessage(`Cupom "${coupon}" não é válido`);
          return;
        }

        const discount = couponData.discount;
        const basePrice = 29.90;
        const finalPrice = basePrice * (1 - discount / 100);

        // APROVAR ou REJEITAR
        if (actionParam === 'reject') {
          // ===== REJEITAR =====
          await updateDoc(userRef, {
            subscriptionStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'admin-link',
            rejectedCoupon: coupon,
            rejectionReason: 'Rejeitado via link pelo administrador'
          });

          setStatus('success');
          setUserInfo({
            name: userData.displayName || 'Sem nome',
            email: userData.email,
            coupon: coupon,
            discount: discount,
            action: 'rejected'
          });
          setMessage('Solicitação rejeitada com sucesso!');

        } else {
          // ===== APROVAR =====
          
          // LÓGICA: SE 100% OFF → LIBERA DIRETO
          if (discount === 100) {
            await updateDoc(userRef, {
              subscriptionStatus: 'active',
              subscriptionPlan: 'premium',
              subscriptionDiscount: discount,
              subscriptionPrice: 0,
              subscriptionStartDate: new Date().toISOString(),
              subscriptionEndDate: null,
              approvedAt: new Date().toISOString(),
              approvedBy: 'admin-link',
              couponCode: coupon,
              couponApplied: true,
              approvalMethod: 'magic-link',
              paymentProofRequired: false
            });

            setStatus('success');
            setUserInfo({
              name: userData.displayName || 'Sem nome',
              email: userData.email,
              coupon: coupon,
              discount: discount,
              oldPrice: basePrice.toFixed(2),
              newPrice: '0.00',
              action: 'approved',
              fullAccess: true
            });
            setMessage(`Cupom ${coupon} aprovado! Acesso liberado gratuitamente.`);

          } else {
            // SE 30% ou 50% OFF → AGUARDA COMPROVANTE
            await updateDoc(userRef, {
              subscriptionStatus: 'awaiting_payment',
              subscriptionPlan: 'premium',
              subscriptionDiscount: discount,
              subscriptionPrice: finalPrice,
              couponCode: coupon,
              couponApplied: true,
              couponApprovedAt: new Date().toISOString(),
              couponApprovedBy: 'admin-link',
              paymentProofRequired: true,
              paymentProofStatus: 'pending'
            });

            setStatus('success');
            setNeedsPaymentProof(true);
            setUserInfo({
              name: userData.displayName || 'Sem nome',
              email: userData.email,
              coupon: coupon,
              discount: discount,
              oldPrice: basePrice.toFixed(2),
              newPrice: finalPrice.toFixed(2),
              action: 'approved',
              fullAccess: false
            });
            setMessage(`Cupom ${coupon} aprovado! Aguardando comprovante de pagamento.`);
          }
        }

        // Redirecionar após 5 segundos
        setTimeout(() => {
          navigate('/admin');
        }, 5000);

      } catch (error) {
        console.error('Erro ao processar:', error);
        setStatus('error');
        setMessage(`Erro ao processar: ${error.message}`);
      }
    };

    processRequest();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border-2 border-gray-200 dark:border-gray-700">
        
        {/* PROCESSANDO */}
        {status === 'processing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {action === 'reject' ? 'Processando Rejeição...' : 'Processando Aprovação...'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {action === 'reject' ? 'Rejeitando solicitação' : 'Validando cupom e ativando acesso'}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* SUCESSO - APROVADO COM ACESSO TOTAL (100%) */}
        {status === 'success' && userInfo && userInfo.action === 'approved' && userInfo.fullAccess && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              ✅ Acesso Liberado!
            </h2>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6 border-2 border-green-200 dark:border-green-800">
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">👤 Usuário:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{userInfo.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">📧 Email:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{userInfo.email}</span>
                </div>
                <div className="border-t border-green-200 dark:border-green-800 pt-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">🎫 Cupom:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{userInfo.coupon}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">💸 Desconto:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{userInfo.discount}% OFF</span>
                </div>
                <div className="border-t border-green-200 dark:border-green-800 pt-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">✨ Valor Final:</span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    GRATUITO
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <p className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                🎉 Acesso premium ativado GRATUITAMENTE!
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                Nenhum pagamento necessário
              </p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecionando em 5s...
            </p>
            
            <button
              onClick={() => navigate('/admin')}
              className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Ir para Admin
            </button>
          </div>
        )}

        {/* SUCESSO - APROVADO AGUARDANDO COMPROVANTE (30% ou 50%) */}
        {status === 'success' && userInfo && userInfo.action === 'approved' && !userInfo.fullAccess && (
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <DocumentArrowUpIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              ⏳ Cupom Aprovado!
            </h2>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-6 border-2 border-yellow-200 dark:border-yellow-800">
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">👤 Usuário:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{userInfo.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">📧 Email:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{userInfo.email}</span>
                </div>
                <div className="border-t border-yellow-200 dark:border-yellow-800 pt-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">🎫 Cupom:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{userInfo.coupon}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">💸 Desconto:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{userInfo.discount}% OFF</span>
                </div>
                <div className="border-t border-yellow-200 dark:border-yellow-800 pt-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">💰 De:</span>
                  <span className="text-sm line-through text-gray-500">R$ {userInfo.oldPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">✨ Por:</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {userInfo.newPrice}<span className="text-sm">/mês</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-4">
              <p className="text-orange-700 dark:text-orange-300 font-bold text-sm">
                📄 Aguardando Comprovante de Pagamento
              </p>
              <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                Usuário deve enviar comprovante para liberar acesso
              </p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecionando em 5s...
            </p>
            
            <button
              onClick={() => navigate('/admin')}
              className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Ir para Admin
            </button>
          </div>
        )}

        {/* SUCESSO - REJEITADO */}
        {status === 'success' && userInfo && userInfo.action === 'rejected' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              ❌ Solicitação Rejeitada
            </h2>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-6 border-2 border-red-200 dark:border-red-800">
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">👤 Usuário:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{userInfo.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">📧 Email:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{userInfo.email}</span>
                </div>
                <div className="border-t border-red-200 dark:border-red-800 pt-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">🎫 Cupom:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{userInfo.coupon}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">📛 Status:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">REJEITADO</span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-2">
              O usuário foi notificado sobre a rejeição.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecionando em 5s...
            </p>
            
            <button
              onClick={() => navigate('/admin')}
              className="mt-6 w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-all shadow-lg"
            >
              Ir para Admin
            </button>
          </div>
        )}

        {/* ERRO */}
        {status === 'error' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              ⚠️ Erro no Processamento
            </h2>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 mb-6 border-2 border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400 font-medium">
                {message}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin')}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all"
              >
                Voltar ao Admin
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}