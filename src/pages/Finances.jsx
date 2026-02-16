import { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ProgressChart from '../components/ProgressChart';
import InsightCard from '../components/InsightCard';
import { calculateFinanceStats } from '../utils/statsCalculator';
import { formatCurrency } from '../utils/helpers';
import { daysUntil } from '../utils/helpers';
import { PlusIcon, XMarkIcon, TrashIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Finances() {
  const { bills, addBill, toggleBillPaid, deleteBill } = useContext(AppContext);
  
  const [showBillModal, setShowBillModal] = useState(false);
  const [newBill, setNewBill] = useState({
    title: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    paid: false,
    recurring: false
  });

  // ========== NOVO: CALCULAR ESTATÍSTICAS ==========
  const financeStats = useMemo(() => 
    calculateFinanceStats(bills),
    [bills]
  );

  const upcomingBills = useMemo(() => {
    return bills
      .filter(bill => !bill.paid)
      .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
  }, [bills]);

  const totalDue = useMemo(() => {
    return bills
      .filter(bill => !bill.paid)
      .reduce((sum, bill) => sum + bill.amount, 0);
  }, [bills]);

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      await addBill({
        ...newBill,
        amount: parseFloat(newBill.amount)
      });
      setNewBill({
        title: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        paid: false,
        recurring: false
      });
      setShowBillModal(false);
    } catch (error) {
      alert('Erro ao adicionar conta');
    }
  };

  const handleTogglePaid = async (billId, currentPaidStatus) => {
    try {
      await toggleBillPaid(billId, currentPaidStatus);
    } catch (error) {
      alert('Erro ao marcar conta como paga');
    }
  };

  const handleDeleteBill = async (billId) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteBill(billId);
      } catch (error) {
        alert('Erro ao excluir conta');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Finanças"
        subtitle="Controle suas contas e despesas"
        emoji="💰"
        imageQuery="money,finance,budget,savings"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* ========== NOVO: ESTATÍSTICAS FINANCEIRAS ========== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <StatsCard
            title="Total do Mês"
            value={`R$ ${financeStats.totalBills}`}
            subtitle={`${financeStats.billsCount} conta(s)`}
            icon="💵"
            color="blue"
          />
          
          <StatsCard
            title="Pago"
            value={`R$ ${financeStats.totalPaid}`}
            subtitle={`${financeStats.paidCount} conta(s)`}
            icon="✅"
            color="green"
            trend={
              financeStats.paymentRate >= 80 
                ? { direction: 'up', value: `${financeStats.paymentRate}%` }
                : { direction: 'down', value: `${financeStats.paymentRate}%` }
            }
          />
          
          <StatsCard
            title="Pendente"
            value={`R$ ${financeStats.totalPending}`}
            subtitle={`${financeStats.pendingCount} conta(s)`}
            icon="⏳"
            color="orange"
          />
          
          <StatsCard
            title="Atrasadas"
            value={financeStats.overdueCount}
            subtitle={financeStats.upcomingCount > 0 ? `${financeStats.upcomingCount} vencendo` : 'Nenhuma'}
            icon="🚨"
            color={financeStats.overdueCount > 0 ? 'red' : 'green'}
            trend={
              financeStats.overdueCount > 0 
                ? { direction: 'down', value: 'Urgente!' }
                : { direction: 'up', value: 'Tudo ok' }
            }
          />
        </section>

        {/* ========== NOVO: GRÁFICO DE PROGRESSO ========== */}
        {financeStats.billsCount > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <ProgressChart
              title="📊 Progresso de Pagamentos do Mês"
              color="green"
              data={[
                { 
                  label: 'Contas Pagas', 
                  value: financeStats.paidCount, 
                  unit: `de ${financeStats.billsCount}` 
                },
                { 
                  label: 'Taxa de Pagamento', 
                  value: parseInt(financeStats.paymentRate), 
                  unit: '%' 
                }
              ]}
            />
          </section>
        )}

        {/* ========== NOVO: INSIGHTS AUTOMÁTICOS ========== */}
        {financeStats.insights && financeStats.insights.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <InsightCard 
              title="💡 Insights Financeiros"
              insights={financeStats.insights}
            />
          </section>
        )}

        {/* Resumo Total */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 shadow-xl text-white animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">💵</span>
                </div>
                <h2 className="text-sm font-semibold text-white/90">
                  Total a Pagar
                </h2>
              </div>
              <div className="text-4xl font-bold mb-2">
                {formatCurrency(totalDue)}
              </div>
              <p className="text-white/90 text-sm">
                {upcomingBills.length} conta{upcomingBills.length !== 1 ? 's' : ''} pendente{upcomingBills.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button 
              onClick={() => setShowBillModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-semibold shadow-lg hover-lift"
            >
              <PlusIcon className="h-5 w-5" />
              Nova Conta
            </button>
          </div>
        </div>

        {/* Próximas a Vencer */}
        <section className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Próximas a Vencer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Atenção aos prazos
              </p>
            </div>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-10 text-center border-2 border-green-200 dark:border-green-800 shadow-lg">
              <div className="text-7xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Tudo em Dia!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma conta pendente no momento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBills.map((bill, index) => {
                const days = daysUntil(bill.dueDate);
                const isUrgent = days <= 3 && days >= 0;
                const isLate = days < 0;

                return (
                  <div
                    key={bill.id}
                    className={`rounded-2xl p-6 shadow-lg border-2 hover-lift animate-slide-in ${
                      isLate
                        ? 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-300 dark:border-red-800'
                        : isUrgent
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-300 dark:border-yellow-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">
                            {isLate ? '🚨' : isUrgent ? '⚠️' : '💵'}
                          </span>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                              {bill.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Vencimento: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(bill.amount)}
                          </div>
                          {isLate && (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full font-bold mt-1">
                              🔥 Atrasado
                            </span>
                          )}
                          {isUrgent && !isLate && (
                            <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full font-bold mt-1">
                              ⏰ {days} dia{days !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleTogglePaid(bill.id, bill.paid)}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-bold shadow-lg flex items-center justify-center gap-2 hover-lift"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Marcar como Paga
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Contas Recorrentes */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Contas Recorrentes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pagamentos mensais
              </p>
            </div>
          </div>

          {bills.filter(b => b.recurring).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-3">📭</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Nenhuma conta recorrente cadastrada
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bills.filter(b => b.recurring).map((bill, index) => (
                <div
                  key={bill.id}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-5 shadow-lg border-2 border-purple-200 dark:border-purple-800 hover-lift animate-slide-in"
                  style={{ animationDelay: `${0.35 + index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔄</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {bill.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Mensal
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(bill.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contas Pagas */}
        {bills.filter(b => b.paid).length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Contas Pagas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pagamentos realizados
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {bills.filter(b => b.paid).map((bill, index) => (
                <div
                  key={bill.id}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 shadow-lg border-2 border-green-200 dark:border-green-800 opacity-75 hover:opacity-100 transition-opacity animate-slide-in"
                  style={{ animationDelay: `${0.45 + index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white line-through">
                          {bill.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pago em: {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '--'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(bill.amount)}
                      </div>
                      <button
                        onClick={() => handleTogglePaid(bill.id, bill.paid)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                      >
                        Desfazer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modal Nova Conta */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <PlusIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                Nova Conta
              </h3>
              <button 
                onClick={() => setShowBillModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddBill} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={newBill.title}
                  onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Aluguel"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: 800.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newBill.recurring}
                  onChange={(e) => setNewBill({ ...newBill, recurring: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  🔄 Conta recorrente (mensal)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}