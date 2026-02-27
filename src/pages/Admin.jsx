import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircleIcon, XCircleIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

export default function Admin() {
  const [couponRequests, setCouponRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Carregar usuários
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(usersData);

      // Carregar pedidos de cupom
      const couponSnap = await getDocs(collection(db, 'couponRequests'));
      const coupons = couponSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCouponRequests(coupons);

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  // ========================
  // CUPONS - APROVAR
  // ========================
  const handleApproveCoupon = async (request) => {
    if (!confirm(`Aprovar ${request.requestedDiscount}% de desconto para ${request.email}?\nPlano: ${request.requestedPlan}\nValor final: R$ ${request.requestedPrice?.toFixed(2)}`)) return;

    try {
      // Atualizar o pedido de cupom
      await updateDoc(doc(db, 'couponRequests', request.id), {
        approvalStatus: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Atualizar o usuário com o novo plano
      await updateDoc(doc(db, 'users', request.uid), {
        subscriptionStatus: 'active',
        'subscription.plan': request.requestedPlanId,
        'subscription.status': 'active',
        'subscription.discount': request.requestedDiscount,
        'subscription.price': request.requestedPrice,
        'subscription.startDate': new Date(),
        'subscription.approvedAt': new Date().toISOString(),
        role: request.requestedPlanId === 'lifetime' ? 'lifetime' : 'subscriber'
      });

      alert(`✅ Plano ${request.requestedPlan} ativado para ${request.email}!`);
      loadAllData();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar. Tente novamente.');
    }
  };

  // ========================
  // CUPONS - REJEITAR
  // ========================
  const handleRejectCoupon = async (request) => {
    if (!confirm(`Rejeitar solicitação de ${request.email}?`)) return;

    try {
      await updateDoc(doc(db, 'couponRequests', request.id), {
        approvalStatus: 'rejected',
        rejectedAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', request.uid), {
        subscriptionStatus: 'active',
        'subscription.plan': 'free',
        'subscription.status': 'active'
      });

      alert(`❌ Solicitação de ${request.email} rejeitada.`);
      loadAllData();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    }
  };

  // ========================
  // CONTROLE MANUAL
  // ========================
  const updateUser = async (userId, data) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      alert('✅ Usuário atualizado!');
      loadAllData();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const setFree = (userId) => updateUser(userId, {
    'subscription.plan': 'free',
    'subscription.status': 'active',
    subscriptionStatus: 'active'
  });

  const setStudent = (userId) => updateUser(userId, {
    'subscription.plan': 'student',
    'subscription.status': 'active',
    subscriptionStatus: 'active'
  });

  const setPremium = (userId) => updateUser(userId, {
    'subscription.plan': 'premium',
    'subscription.status': 'active',
    subscriptionStatus: 'active'
  });

  const setLifetime = (userId) => updateUser(userId, {
    'subscription.plan': 'lifetime',
    'subscription.status': 'active',
    'subscription.lifetime': true,
    subscriptionStatus: 'active',
    lifetimeGrantedAt: new Date().toISOString()
  });

  const blockUser = (userId) => updateUser(userId, { accessBlocked: true });
  const unblockUser = (userId) => updateUser(userId, { accessBlocked: false });

  const filteredUsers = allUsers.filter(u =>
    u.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const pendingCoupons = couponRequests.filter(r => r.approvalStatus === 'waiting');
  const approvedCoupons = couponRequests.filter(r => r.approvalStatus === 'approved');
  const rejectedCoupons = couponRequests.filter(r => r.approvalStatus === 'rejected');

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
        title="Painel Administrativo"
        subtitle="Controle total do sistema"
        emoji="👑"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<ClockIcon className="w-6 h-6 text-yellow-600" />} label="Cupons Pendentes" value={pendingCoupons.length} color="yellow" />
          <StatCard icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />} label="Cupons Aprovados" value={approvedCoupons.length} color="green" />
          <StatCard icon={<XCircleIcon className="w-6 h-6 text-red-600" />} label="Cupons Rejeitados" value={rejectedCoupons.length} color="red" />
          <StatCard icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />} label="Total Usuários" value={allUsers.length} color="blue" />
        </div>

        {/* PEDIDOS DE CUPOM PENDENTES */}
        {pendingCoupons.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <ClockIcon className="w-7 h-7 text-yellow-500" />
              Pedidos de Cupom Pendentes ({pendingCoupons.length})
            </h2>

            <div className="space-y-4">
              {pendingCoupons.map(request => (
                <div key={request.id} className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{request.email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Plano: <strong>{request.requestedPlan}</strong> • 
                        Cupom: <strong>{request.requestedCoupon}</strong> • 
                        Desconto: <strong>{request.requestedDiscount}%</strong>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Valor final: <strong className="text-green-600">R$ {request.requestedPrice?.toFixed(2)}</strong>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Solicitado em: {request.createdAt?.toDate?.()?.toLocaleString('pt-BR') || new Date(request.createdAt?.seconds * 1000).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveCoupon(request)}
                        className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleRejectCoupon(request)}
                        className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HISTÓRICO DE CUPONS */}
        {(approvedCoupons.length > 0 || rejectedCoupons.length > 0) && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              📋 Histórico de Cupons
            </h2>
            <div className="space-y-3">
              {[...approvedCoupons, ...rejectedCoupons]
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .map(request => (
                <div key={request.id} className={`rounded-xl p-4 border-2 ${
                  request.approvalStatus === 'approved'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{request.email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.requestedPlan} • {request.requestedCoupon} • {request.requestedDiscount}% OFF • R$ {request.requestedPrice?.toFixed(2)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      request.approvalStatus === 'approved'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {request.approvalStatus === 'approved' ? '✅ Aprovado' : '❌ Rejeitado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GERENCIAMENTO MANUAL */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            🔧 Gerenciamento Manual de Usuários
          </h2>

          <input
            type="text"
            placeholder="Buscar por email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full mb-6 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Plano: <strong>{user.subscription?.plan || user.subscriptionPlan || 'free'}</strong> • 
                      Status: <strong>{user.subscription?.status || user.subscriptionStatus || 'active'}</strong>
                      {user.accessBlocked && <span className="ml-2 text-red-500 font-bold">🔒 BLOQUEADO</span>}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFree(user.id)} className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm font-semibold">Free</button>
                    <button onClick={() => setStudent(user.id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold">Estudante</button>
                    <button onClick={() => setPremium(user.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Premium</button>
                    <button onClick={() => setLifetime(user.id)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold">Vitalício</button>
                    {user.accessBlocked ? (
                      <button onClick={() => unblockUser(user.id)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold">Desbloquear</button>
                    ) : (
                      <button onClick={() => blockUser(user.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Bloquear</button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
    red: 'bg-red-100 dark:bg-red-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}