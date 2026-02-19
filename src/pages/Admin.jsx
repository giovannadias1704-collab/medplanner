import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircleIcon, XCircleIcon, ClockIcon, TagIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

export default function Admin() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const usersRef = collection(db, 'users');

      const snapshotAll = await getDocs(usersRef);
      const usersData = [];
      snapshotAll.forEach((docu) => {
        usersData.push({ id: docu.id, ...docu.data() });
      });
      setAllUsers(usersData);

      const pending = usersData.filter(u => u.subscriptionStatus === 'pending_approval');
      const approved = usersData.filter(u => u.subscriptionStatus === 'active' && u.subscriptionDiscount > 0);
      const rejected = usersData.filter(u => u.subscriptionStatus === 'rejected');

      setPendingRequests(pending);
      setApprovedRequests(approved);
      setRejectedRequests(rejected);
      setLoading(false);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const updateUser = async (userId, data) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      loadAllData();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  // =========================
  // CUPONS
  // =========================

  const handleQuickApprove = async (userId, userEmail, couponCode) => {
    const validCoupons = {
      'MEDPLANNER30': 30,
      'MEDPLANNER50': 50,
      'MEDPLANNER100': 100
    };

    const discount = validCoupons[couponCode];
    if (!discount) return alert('Cupom inválido');

    if (!confirm(`Aprovar ${discount}% para ${userEmail}?`)) return;

    const basePrice = 29.90;
    const finalPrice = basePrice * (1 - discount / 100);

    updateUser(userId, {
      subscriptionStatus: 'active',
      subscriptionPlan: 'premium',
      subscriptionDiscount: discount,
      subscriptionPrice: finalPrice,
      approvedAt: new Date().toISOString(),
      approvedBy: 'admin'
    });
  };

  const handleReject = async (userId, userEmail) => {
    if (!confirm(`Rejeitar solicitação de ${userEmail}?`)) return;

    updateUser(userId, {
      subscriptionStatus: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'admin'
    });
  };

  // =========================
  // CONTROLE MANUAL
  // =========================

  const setFree = (userId) => {
    updateUser(userId, {
      subscriptionPlan: 'free',
      subscriptionStatus: 'inactive',
      subscriptionDiscount: 0,
      subscriptionPrice: 0
    });
  };

  const setPremium = (userId) => {
    updateUser(userId, {
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionDiscount: 0,
      subscriptionPrice: 29.90
    });
  };

  const setLifetime = (userId) => {
    updateUser(userId, {
      subscriptionPlan: 'lifetime',
      subscriptionStatus: 'active',
      subscriptionDiscount: 100,
      subscriptionPrice: 0,
      lifetimeGrantedAt: new Date().toISOString()
    });
  };

  const blockUser = (userId) => {
    updateUser(userId, { accessBlocked: true });
  };

  const unblockUser = (userId) => {
    updateUser(userId, { accessBlocked: false });
  };

  const filteredUsers = allUsers.filter(u =>
    u.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

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
        imageQuery="admin dashboard control"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* ===================== */}
        {/* ESTATÍSTICAS */}
        {/* ===================== */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<ClockIcon />} label="Pendentes" value={pendingRequests.length} color="yellow" />
          <StatCard icon={<CheckCircleIcon />} label="Aprovados" value={approvedRequests.length} color="green" />
          <StatCard icon={<XCircleIcon />} label="Rejeitados" value={rejectedRequests.length} color="red" />
          <StatCard icon={<UserGroupIcon />} label="Total Usuários" value={allUsers.length} color="blue" />
        </div>

        {/* ===================== */}
        {/* GERENCIAMENTO MANUAL */}
        {/* ===================== */}

        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            🔧 Gerenciamento Manual de Usuários
          </h2>

          <input
            type="text"
            placeholder="Buscar por email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full mb-6 p-3 rounded-xl border"
          />

          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-bold">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Plano: {user.subscriptionPlan || 'free'}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFree(user.id)} className="px-3 py-1 bg-gray-300 rounded">Free</button>
                    <button onClick={() => setPremium(user.id)} className="px-3 py-1 bg-blue-600 text-white rounded">Premium</button>
                    <button onClick={() => setLifetime(user.id)} className="px-3 py-1 bg-purple-600 text-white rounded">Vitalício</button>

                    {user.accessBlocked ? (
                      <button onClick={() => unblockUser(user.id)} className="px-3 py-1 bg-green-500 text-white rounded">Desbloquear</button>
                    ) : (
                      <button onClick={() => blockUser(user.id)} className="px-3 py-1 bg-red-600 text-white rounded">Bloquear</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
