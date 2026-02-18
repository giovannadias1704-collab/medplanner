import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircleIcon, XCircleIcon, ClockIcon, TagIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

export default function Admin() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 30, 50, 100

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const usersRef = collection(db, 'users');
      
      // Pendentes
      const qPending = query(usersRef, where('subscriptionStatus', '==', 'pending_approval'));
      const snapshotPending = await getDocs(qPending);
      const pending = [];
      snapshotPending.forEach((doc) => {
        pending.push({ id: doc.id, ...doc.data() });
      });
      
      // Aprovados
      const qApproved = query(usersRef, where('subscriptionStatus', '==', 'active'));
      const snapshotApproved = await getDocs(qApproved);
      const approved = [];
      snapshotApproved.forEach((doc) => {
        const data = doc.data();
        if (data.subscriptionDiscount > 0) {
          approved.push({ id: doc.id, ...data });
        }
      });

      // Rejeitados
      const qRejected = query(usersRef, where('subscriptionStatus', '==', 'rejected'));
      const snapshotRejected = await getDocs(qRejected);
      const rejected = [];
      snapshotRejected.forEach((doc) => {
        rejected.push({ id: doc.id, ...doc.data() });
      });
      
      setPendingRequests(pending);
      setApprovedRequests(approved);
      setRejectedRequests(rejected);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      setLoading(false);
    }
  };

  const handleQuickApprove = async (userId, userEmail, couponCode) => {
    const validCoupons = {
      'MEDPLANNER30': { discount: 30, label: '30% OFF' },
      'MEDPLANNER50': { discount: 50, label: '50% OFF' },
      'MEDPLANNER100': { discount: 100, label: '100% OFF' }
    };
    
    const coupon = validCoupons[couponCode];
    
    if (!coupon) {
      alert('❌ Cupom inválido!');
      return;
    }

    if (!confirm(`Aprovar ${coupon.label} para ${userEmail}?`)) return;

    try {
      const userRef = doc(db, 'users', userId);
      const basePrice = 29.90;
      const finalPrice = basePrice * (1 - coupon.discount / 100);
      
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionPlan: 'premium',
        subscriptionDiscount: coupon.discount,
        subscriptionPrice: finalPrice,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: null,
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin',
        couponCode: couponCode,
        couponApplied: true
      });

      alert(`✅ ${coupon.label} aprovado!\nNovo preço: R$ ${finalPrice.toFixed(2)}/mês`);
      loadRequests();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('❌ Erro ao aprovar cupom');
    }
  };

  const handleReject = async (userId, userEmail) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    
    if (!confirm(`Rejeitar solicitação de ${userEmail}?`)) return;

    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        subscriptionStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: 'admin',
        rejectionReason: reason || 'Não especificado'
      });

      alert('❌ Solicitação rejeitada');
      loadRequests();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('❌ Erro ao rejeitar solicitação');
    }
  };

  const handleRevoke = async (userId, userEmail) => {
    if (!confirm(`Revogar acesso premium de ${userEmail}?`)) return;

    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        subscriptionStatus: 'inactive',
        subscriptionPlan: 'free',
        subscriptionDiscount: 0,
        subscriptionPrice: 0,
        revokedAt: new Date().toISOString(),
        revokedBy: 'admin'
      });

      alert('🚫 Acesso revogado');
      loadRequests();
    } catch (error) {
      console.error('Erro ao revogar:', error);
      alert('❌ Erro ao revogar acesso');
    }
  };

  const filteredPending = filter === 'all' 
    ? pendingRequests 
    : pendingRequests.filter(r => r.requestedDiscount === parseInt(filter));

  const filteredApproved = filter === 'all'
    ? approvedRequests
    : approvedRequests.filter(r => r.subscriptionDiscount === parseInt(filter));

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
        title="Painel Admin"
        subtitle="Gerenciar cupons e descontos"
        emoji="👨‍💼"
        imageQuery="admin,dashboard,management"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pendingRequests.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {approvedRequests.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprovados</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {rejectedRequests.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejeitados</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pendingRequests.length + approvedRequests.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <TagIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Filtrar por cupom:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('30')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '30'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                30% OFF
              </button>
              <button
                onClick={() => setFilter('50')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '50'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                50% OFF
              </button>
              <button
                onClick={() => setFilter('100')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === '100'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                100% OFF
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Solicitações Pendentes */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📋 Solicitações Pendentes ({filteredPending.length})
            </h2>
          </div>

          <div className="p-6">
            {filteredPending.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">✅</span>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Nenhuma solicitação pendente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPending.map((request) => {
                  const discount = request.requestedDiscount || 100;
                  const basePrice = 29.90;
                  const finalPrice = basePrice * (1 - discount / 100);
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            {request.displayName || 'Sem nome'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.email}
                          </p>
                        </div>
                        
                        <div className={`px-4 py-2 rounded-xl font-bold text-white ${
                          discount === 30 ? 'bg-orange-600' :
                          discount === 50 ? 'bg-blue-600' :
                          'bg-green-600'
                        }`}>
                          {discount}% OFF
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Desconto:</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{discount}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Preço final:</p>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            R$ {finalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleQuickApprove(request.id, request.email, request.requestedCoupon)}
                          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all"
                        >
                          ✅ Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request.email)}
                          className="flex-1 px-6 py-3 border-2 border-red-500 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
                        >
                          ❌ Rejeitar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}