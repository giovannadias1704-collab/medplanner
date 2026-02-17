import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';
import PageHeader from '../components/PageHeader';
import QuickCaptureBar from '../components/QuickCaptureBar';
import EventCard from '../components/EventCard';
import StatsCard from '../components/StatsCard';
import ProgressChart from '../components/ProgressChart';
import InsightCard from '../components/InsightCard';
import AIChat from '../components/AIChat';
import TestGemini from '../components/TestGemini';
import { isToday, isTomorrow } from '../utils/dateParser';
import { daysUntil } from '../utils/helpers';
import { calculateDashboardStats, calculateTaskStats } from '../utils/statsCalculator';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AcademicCapIcon, 
  HeartIcon, 
  BanknotesIcon,
  SparklesIcon,
  FireIcon,
  CalendarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { 
    events, 
    tasks, 
    bills, 
    homeTasks, 
    studySchedule, 
    waterLogs, 
    settings 
  } = useContext(AppContext);
  
  const { onboardingData } = useOnboarding();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showTest, setShowTest] = useState(false);

  // ========== NOVO: CALCULAR ESTATÍSTICAS ==========
  const dashboardStats = useMemo(() => 
    calculateDashboardStats(events, tasks, homeTasks, bills, studySchedule, waterLogs, settings),
    [events, tasks, homeTasks, bills, studySchedule, waterLogs, settings]
  );

  const taskStats = useMemo(() => 
    calculateTaskStats(tasks, homeTasks),
    [tasks, homeTasks]
  );

  // Top 3 Prioridades
  const top3Priorities = useMemo(() => {
    const allItems = [
      ...events.map(e => ({ ...e, source: 'event' })),
      ...tasks.map(t => ({ ...t, source: 'task' })),
      ...bills.map(b => ({ ...b, source: 'bill' }))
    ];

    const futureItems = allItems.filter(item => {
      if (!item.date) return false;
      const days = daysUntil(item.date);
      return days >= 0;
    });

    return futureItems
      .sort((a, b) => {
        const daysA = daysUntil(a.date);
        const daysB = daysUntil(b.date);
        return daysA - daysB;
      })
      .slice(0, 3);
  }, [events, tasks, bills]);

  // Próximos eventos (24-72h)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const in3Days = addDays(today, 3);

    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date + 'T00:00:00');
      return eventDate > today && eventDate <= in3Days;
    });
  }, [events]);

  // Pendências urgentes
  const urgentItems = useMemo(() => {
    const urgent = [];

    bills.forEach(bill => {
      if (!bill.date || bill.paid) return;
      const days = daysUntil(bill.date);
      if (days >= 0 && days <= 3) {
        urgent.push({ ...bill, type: 'bill', urgency: days });
      }
    });

    tasks.forEach(task => {
      if (!task.date || task.completed) return;
      const days = daysUntil(task.date);
      if (days < 0) {
        urgent.push({ ...task, type: 'task', urgency: days });
      }
    });

    return urgent.sort((a, b) => a.urgency - b.urgency);
  }, [bills, tasks]);

  // Mensagem personalizada baseada no perfil
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Olá';
    
    if (hour >= 5 && hour < 12) timeGreeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
    else timeGreeting = 'Boa noite';

    if (onboardingData?.name) {
      return `${timeGreeting}, ${onboardingData.name}! 👋`;
    }
    return `${timeGreeting}! 👋`;
  };

  const getPersonalizedSubtitle = () => {
    const parts = [];
    
    if (onboardingData?.semester) {
      parts.push(`${onboardingData.semester}º Semestre`);
    }
    
    if (onboardingData?.university) {
      parts.push(onboardingData.university);
    }

    if (parts.length > 0) {
      return `${parts.join(' • ')} • ${format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}`;
    }

    return format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title={getPersonalizedGreeting()}
        subtitle={getPersonalizedSubtitle()}
        emoji="🏠"
        imageQuery="workspace,desk,morning,coffee"
      />

      <QuickCaptureBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* ========== NOVO: ESTATÍSTICAS DO DIA ========== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <StatsCard
            title="Eventos Hoje"
            value={dashboardStats.eventsToday}
            subtitle="No calendário"
            icon="📅"
            color="blue"
          />
          
          <StatsCard
            title="Tarefas Hoje"
            value={dashboardStats.tasksToday}
            subtitle="Pendentes"
            icon="✅"
            color="green"
          />
          
          <StatsCard
            title="Contas (7 dias)"
            value={dashboardStats.billsThisWeek}
            subtitle="A vencer"
            icon="💰"
            color="orange"
          />
          
          <StatsCard
            title="Hidratação"
            value={`${dashboardStats.waterToday}L`}
            subtitle={`Meta: ${dashboardStats.waterGoal}L`}
            icon="💧"
            color={dashboardStats.waterGoalPercentage >= 100 ? 'green' : 'blue'}
            trend={
              dashboardStats.waterGoalPercentage >= 100 
                ? { direction: 'up', value: '100%' }
                : { direction: 'down', value: `${dashboardStats.waterGoalPercentage}%` }
            }
          />
        </section>

        {/* ========== NOVO: PROGRESSO DE TAREFAS ========== */}
        {taskStats.totalTasks > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <ProgressChart
              title="📊 Progresso de Tarefas"
              color="green"
              data={[
                { 
                  label: 'Concluídas', 
                  value: taskStats.completedTasks, 
                  unit: `de ${taskStats.totalTasks}` 
                },
                { 
                  label: 'Taxa de Conclusão', 
                  value: parseInt(taskStats.completionRate), 
                  unit: '%' 
                }
              ]}
            />
          </section>
        )}

        {/* ========== NOVO: INSIGHTS AUTOMÁTICOS ========== */}
        {taskStats.insights && taskStats.insights.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <InsightCard 
              title="💡 Insights do Dia"
              insights={taskStats.insights}
            />
          </section>
        )}

        {/* Cards de Estatísticas Personalizadas */}
        {onboardingData && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Estudos */}
            {onboardingData.studyHoursPerDay && (
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl hover-lift transition-all">
                <div className="flex items-center justify-between mb-3">
                  <AcademicCapIcon className="w-8 h-8 opacity-80" />
                  <span className="text-2xl">📚</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Meta de Estudo</p>
                <p className="text-3xl font-bold">{onboardingData.studyHoursPerDay}h/dia</p>
                {onboardingData.studyTime && (
                  <p className="text-xs opacity-75 mt-2 capitalize">Período: {onboardingData.studyTime}</p>
                )}
              </div>
            )}

            {/* Objetivos */}
            {onboardingData.focusResidency && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white shadow-xl hover-lift transition-all">
                <div className="flex items-center justify-between mb-3">
                  <SparklesIcon className="w-8 h-8 opacity-80" />
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Objetivo</p>
                <p className="text-lg font-bold">
                  {onboardingData.focusResidency === 'sim' ? 'Residência' : 'Graduação'}
                </p>
                {onboardingData.residencyArea && (
                  <p className="text-xs opacity-75 mt-2">{onboardingData.residencyArea}</p>
                )}
              </div>
            )}

            {/* Saúde */}
            {onboardingData.exerciseFrequency && (
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl hover-lift transition-all">
                <div className="flex items-center justify-between mb-3">
                  <HeartIcon className="w-8 h-8 opacity-80" />
                  <span className="text-2xl">💪</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Exercícios</p>
                <p className="text-2xl font-bold">{onboardingData.exerciseFrequency}</p>
                {onboardingData.waterGoal && (
                  <p className="text-xs opacity-75 mt-2">Água: {onboardingData.waterGoal}L/dia</p>
                )}
              </div>
            )}

            {/* Finanças */}
            {onboardingData.monthlyBudget && (
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 text-white shadow-xl hover-lift transition-all">
                <div className="flex items-center justify-between mb-3">
                  <BanknotesIcon className="w-8 h-8 opacity-80" />
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Orçamento</p>
                <p className="text-lg font-bold capitalize">
                  {onboardingData.monthlyBudget === 'sim' ? 'Definido' : onboardingData.monthlyBudget === 'não' ? 'Não definido' : 'A definir'}
                </p>
                {onboardingData.budgetAmount && (
                  <p className="text-xs opacity-75 mt-2">{onboardingData.budgetAmount}</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Mensagem de Motivação Personalizada */}
        {onboardingData?.shortTermGoals && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-800 shadow-lg animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <FireIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  🎯 Suas Metas de Curto Prazo
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {onboardingData.shortTermGoals}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Prioridades */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Prioridades de Hoje
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Foco no que realmente importa
              </p>
            </div>
          </div>

          {top3Priorities.length === 0 ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 text-center border-2 border-green-200 dark:border-green-800 shadow-lg">
              <div className="text-6xl mb-3">🎉</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Dia Livre!
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma prioridade urgente. Aproveite o dia!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {top3Priorities.map((item, index) => (
                <div key={item.id} className="flex items-start gap-3 animate-slide-in" style={{ animationDelay: `${0.35 + index * 0.1}s` }}>
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <EventCard event={item} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximos Eventos (24-72h) */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Próximos Eventos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nos próximos 3 dias
              </p>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-3">📭</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Nenhum evento nos próximos 3 dias
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Tempo livre para focar em outras atividades
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <div key={event.id} className="animate-slide-in" style={{ animationDelay: `${0.45 + index * 0.1}s` }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pendências Urgentes */}
        {urgentItems.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Urgente
                </h2>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {urgentItems.length} item(ns) precisam de atenção
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {urgentItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 p-5 rounded-2xl shadow-lg hover-lift animate-slide-in"
                  style={{ animationDelay: `${0.55 + index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {item.type === 'bill' ? '💰' : '✅'}
                        </span>
                        <span className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full font-semibold">
                          {item.type === 'bill' ? 'CONTA' : 'TAREFA'}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {item.urgency < 0
                          ? `⏰ Atrasado há ${Math.abs(item.urgency)} dia(s)`
                          : item.urgency === 0
                          ? '🔥 Vence HOJE'
                          : `📌 Vence em ${item.urgency} dia(s)`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Card Motivacional */}
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-2xl animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-4">
            <div className="text-5xl">💪</div>
            <div>
              <h3 className="text-xl font-bold mb-1">
                {onboardingData?.name ? `Continue Focado, ${onboardingData.name}!` : 'Continue Focado!'}
              </h3>
              <p className="text-white/90 text-sm">
                Cada tarefa concluída te aproxima dos seus objetivos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Teste */}
      <button
        onClick={() => setShowTest(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-40"
        title="Testar Gemini"
      >
        🧪
      </button>

      {/* Botão Flutuante de IA */}
      <button
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-40"
        title="Assistente IA"
      >
        <SparklesIcon className="h-8 w-8" />
      </button>

      {/* Modal de Teste */}
      {showTest && <TestGemini />}

      {/* Modal do Chat IA */}
      <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
    </div>
  );
}