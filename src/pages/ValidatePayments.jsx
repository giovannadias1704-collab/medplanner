import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircleIcon, XCircleIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

export default function ValidatePayments() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      const usersRef = collection(db, 'users');
      
      // Buscar usuários com comprovante pendente
      const q = query(usersRef, where('paymentProofStatus', '==', 'pending'));
      const snapshot = await getDocs(q);
      
      const pending = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.paymentProofURL) {
          pending.push({ id: doc.id, ...data });
        }
      });
      
      setPendingPayments(pending);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
      setLoading(false);
    }
  };

  const handleApprovePayment = async (userId, userEmail, userPrice) => {
    if (!confirm(`Aprovar pagamento de ${userEmail}?`)) return;

    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionPlan: 'premium',
        paymentProofStatus: 'approved',
        paymentProofApprovedAt: new Date().toISOString(),
        paymentProofApprovedBy: 'admin',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: null
      });

      alert(`✅ Pagamento aprovado!\nUsuário: ${userEmail}\nValor: R$ ${userPrice?.toFixed(2) || '0.00'}`);
      loadPendingPayments();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('❌ Erro ao aprovar pagamento');
    }
  };

  const handleRejectPayment = async (userId, userEmail) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        paymentProofStatus: 'rejected',
        paymentProofRejectedAt: new Date().toISOString(),
        paymentProofRejectedBy: 'admin',
        paymentProofRejectionReason: reason
      });

      alert(`❌ Pagamento rejeitado!\nMotivo: ${reason}`);
      loadPendingPayments();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('❌ Erro ao rejeitar pagamento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader
        title="Validar Pagamentos"
        subtitle="Aprovar ou rejeitar comprovantes"
        emoji="📄"
        imageQuery="payment,verification,document"
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pendingPayments.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Comprovantes Pendentes */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📄 Comprovantes Pendentes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Valide os pagamentos e libere o acesso
            </p>
          </div>

          <div className="p-6">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">✅</span>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Nenhum comprovante pendente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {payment.displayName?.[0] || payment.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            {payment.displayName || 'Sem nome'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          R$ {payment.subscriptionPrice?.toFixed(2) || '0.00'}
                        </p>
                        {payment.subscriptionDiscount > 0 && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-bold">
                            {payment.subscriptionDiscount}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Enviado em:
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.paymentProofUploadedAt ? new Date(payment.paymentProofUploadedAt).toLocaleString('pt-BR') : 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Plano:
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.subscriptionPlan || 'Premium'}
                        </p>
                      </div>
                    </div>

                    {/* Visualizar Comprovante */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border-2 border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                        Comprovante:
                      </p>
                      
                      {payment.paymentProofURL && (
                        <div className="space-y-2">
                          <a
                            href={payment.paymentProofURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                          >
                            📄 Abrir Comprovante
                          </a>
                          
                          {payment.paymentProofURL.match(/\.(jpg|jpeg|png|gif)$/i) && (
                            <img
                              src={payment.paymentProofURL}
                              alt="Comprovante"
                              className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-700"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprovePayment(payment.id, payment.email, payment.subscriptionPrice)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        Aprovar Pagamento
                      </button>
                      <button
                        onClick={() => handleRejectPayment(payment.id, payment.email)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}