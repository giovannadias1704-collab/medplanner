import { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';

export default function Analytics() {
  const context = useContext(AppContext);
  
  // Destructure com fallbacks seguros
  const {
    wellnessEntries = [],
    events = [],
    pblCases = [],
    tasks = [],
    healthRecords = [],
    studySessions = []
  } = context || {};

  const [activeTab, setActiveTab] = useState('comparativo');
  const [timePeriod, setTimePeriod] = useState('semanal');

  // ========== FUNÇÕES DE FILTRAGEM POR PERÍODO ==========

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timePeriod) {
      case 'semanal':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'mensal':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'anual':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    return { startDate, endDate: now };
  };

  const filterByPeriod = (items, dateField = 'date') => {
    if (!items || items.length === 0) return [];
    const { startDate } = getDateRange();
    return items.filter(item => {
      try {
        return new Date(item[dateField]) >= startDate;
      } catch {
        return false;
      }
    });
  };

  // ========== DADOS FILTRADOS ==========

  const filteredData = useMemo(() => {
    return {
      wellness: filterByPeriod(wellnessEntries),
      events: filterByPeriod(events),
      pbl: filterByPeriod(pblCases, 'createdAt'),
      tasks: filterByPeriod(tasks, 'createdAt'),
      health: filterByPeriod(healthRecords),
      study: filterByPeriod(studySessions)
    };
  }, [timePeriod, wellnessEntries, events, pblCases, tasks, healthRecords, studySessions]);

  // ========== ESTATÍSTICAS CONSOLIDADAS ==========

  const consolidatedStats = useMemo(() => {
    // BEM-ESTAR
    const wellness = filteredData.wellness;
    const wellnessStats = wellness.length > 0 ? {
      totalRecords: wellness.length,
      avgSleep: (wellness.reduce((sum, e) => sum + (e.sleepHours || 0), 0) / wellness.length).toFixed(1),
      avgWater: (wellness.reduce((sum, e) => sum + (e.waterIntake || 0), 0) / wellness.length).toFixed(1),
      avgExercise: Math.round(wellness.reduce((sum, e) => sum + (e.exerciseMinutes || 0), 0) / wellness.length),
      daysWithGoals: wellness.filter(e => 
        e.sleepHours >= 7 && e.sleepHours <= 9 &&
        e.waterIntake >= 2 &&
        e.exerciseMinutes >= 30
      ).length,
      moodDistribution: wellness.reduce((acc, e) => {
        acc[e.mood] = (acc[e.mood] || 0) + 1;
        return acc;
      }, {})
    } : null;

    // AGENDA/CALENDÁRIO
    const calendarStats = filteredData.events.length > 0 ? {
      totalEvents: filteredData.events.length,
      completedEvents: filteredData.events.filter(e => e.completed).length,
      upcomingEvents: filteredData.events.filter(e => new Date(e.date) > new Date() && !e.completed).length,
      eventsByType: filteredData.events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      completionRate: ((filteredData.events.filter(e => e.completed).length / filteredData.events.length) * 100).toFixed(0)
    } : null;

    // PBL
    const pblStats = filteredData.pbl.length > 0 ? {
      totalCases: filteredData.pbl.length,
      completedCases: filteredData.pbl.filter(c => c.status === 'completed').length,
      inProgressCases: filteredData.pbl.filter(c => c.status === 'in_progress').length,
      avgCompletionTime: filteredData.pbl.filter(c => c.completedAt).length > 0
        ? Math.round(
            filteredData.pbl
              .filter(c => c.completedAt)
              .reduce((sum, c) => {
                const start = new Date(c.createdAt);
                const end = new Date(c.completedAt);
                return sum + (end - start) / (1000 * 60 * 60 * 24);
              }, 0) / filteredData.pbl.filter(c => c.completedAt).length
          )
        : 0,
      completionRate: ((filteredData.pbl.filter(c => c.status === 'completed').length / filteredData.pbl.length) * 100).toFixed(0)
    } : null;

    // TAREFAS/ESTUDOS
    const taskStats = filteredData.tasks.length > 0 ? {
      totalTasks: filteredData.tasks.length,
      completedTasks: filteredData.tasks.filter(t => t.completed).length,
      pendingTasks: filteredData.tasks.filter(t => !t.completed).length,
      tasksByPriority: filteredData.tasks.reduce((acc, t) => {
        acc[t.priority || 'normal'] = (acc[t.priority || 'normal'] || 0) + 1;
        return acc;
      }, {}),
      completionRate: ((filteredData.tasks.filter(t => t.completed).length / filteredData.tasks.length) * 100).toFixed(0)
    } : null;

    // SAÚDE
    const healthStats = filteredData.health.length > 0 ? {
      totalRecords: filteredData.health.length,
      recordsByType: filteredData.health.reduce((acc, h) => {
        acc[h.type] = (acc[h.type] || 0) + 1;
        return acc;
      }, {}),
      urgentRecords: filteredData.health.filter(h => h.priority === 'urgent').length
    } : null;

    // SESSÕES DE ESTUDO
    const studyStats = filteredData.study.length > 0 ? {
      totalSessions: filteredData.study.length,
      totalHours: (filteredData.study.reduce((sum, s) => sum + (s.duration || 0), 0) / 60).toFixed(1),
      avgSessionDuration: Math.round(
        filteredData.study.reduce((sum, s) => sum + (s.duration || 0), 0) / filteredData.study.length
      ),
      subjectDistribution: filteredData.study.reduce((acc, s) => {
        acc[s.subject] = (acc[s.subject] || 0) + 1;
        return acc;
      }, {})
    } : null;

    return {
      wellness: wellnessStats,
      calendar: calendarStats,
      pbl: pblStats,
      tasks: taskStats,
      health: healthStats,
      study: studyStats
    };
  }, [filteredData]);

  // ========== DADOS DO DIA ATUAL ==========

  const getTodayData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      wellness: wellnessEntries?.filter(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      })?.[0] || null,
      events: events?.filter(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }) || [],
      tasks: tasks?.filter(t => {
        const d = new Date(t.dueDate || t.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }) || [],
      study: studySessions?.filter(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }) || []
    };
  };

  const todayData = getTodayData();

  // ========== HELPERS ==========

  const getMoodEmoji = (mood) => {
    const moods = {
      excelente: '😄',
      bom: '🙂',
      neutro: '😐',
      ruim: '😔',
      pessimo: '😢'
    };
    return moods[mood] || '😐';
  };

  const getPeriodLabel = () => {
    const labels = {
      semanal: 'Última Semana',
      mensal: 'Último Mês',
      anual: 'Último Ano'
    };
    return labels[timePeriod];
  };

  const getProductivityScore = () => {
    let score = 0;
    let maxScore = 0;

    if (consolidatedStats.wellness) {
      maxScore += 25;
      const goalRate = parseFloat(consolidatedStats.wellness.daysWithGoals / consolidatedStats.wellness.totalRecords);
      score += goalRate * 25;
    }

    if (consolidatedStats.calendar) {
      maxScore += 20;
      score += (parseFloat(consolidatedStats.calendar.completionRate) / 100) * 20;
    }

    if (consolidatedStats.pbl) {
      maxScore += 20;
      score += (parseFloat(consolidatedStats.pbl.completionRate) / 100) * 20;
    }

    if (consolidatedStats.tasks) {
      maxScore += 20;
      score += (parseFloat(consolidatedStats.tasks.completionRate) / 100) * 20;
    }

    if (consolidatedStats.study) {
      maxScore += 15;
      const hoursScore = Math.min(parseFloat(consolidatedStats.study.totalHours) / 20, 1);
      score += hoursScore * 15;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  };

  const productivityScore = getProductivityScore();

  const hasAnyData = 
    wellnessEntries.length > 0 ||
    events.length > 0 ||
    pblCases.length > 0 ||
    tasks.length > 0 ||
    healthRecords.length > 0 ||
    studySessions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Analytics Completo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análise integrada de todas as suas atividades
          </p>
        </div>

        {!hasAnyData ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Nenhum dado ainda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comece a usar o MedPlanner para ver suas análises aqui!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="/wellness" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium">
                Registrar Bem-estar
              </a>
              <a href="/calendar" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium">
                Adicionar Evento
              </a>
              <a href="/study" className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-medium">
                Registrar Estudo
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('diario')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === 'diario'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📅 Análise Diária
              </button>
              <button
                onClick={() => setActiveTab('comparativo')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === 'comparativo'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📈 Análise Comparativa
              </button>
            </div>

            <div className="p-6">
              
              {/* TAB: ANÁLISE DIÁRIA */}
              {activeTab === 'diario' && (
                <div className="space-y-6">
                  
                  {/* Resumo do Dia */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      📅 Resumo de Hoje
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Eventos</p>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{todayData.events.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tarefas</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{todayData.tasks.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sessões de Estudo</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{todayData.study.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Humor</p>
                        <p className="text-3xl">{todayData.wellness ? getMoodEmoji(todayData.wellness.mood) : '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bem-estar do Dia */}
                  {todayData.wellness && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          😴 Sono
                        </h3>
                        <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                          {todayData.wellness.sleepHours}h
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          💧 Hidratação
                        </h3>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          {todayData.wellness.waterIntake}L
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          💪 Exercícios
                        </h3>
                        <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                          {todayData.wellness.exerciseMinutes}min
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mensagem se não há dados hoje */}
                  {!todayData.wellness && todayData.events.length === 0 && todayData.tasks.length === 0 && todayData.study.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <span className="text-6xl mb-4 block">📅</span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Nenhuma atividade hoje
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Registre suas atividades para ver o resumo diário!
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* TAB: ANÁLISE COMPARATIVA */}
              {activeTab === 'comparativo' && (
                <div>
                  
                  {/* Filtros de Período */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Período de Análise:
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: 'semanal', label: 'Última Semana', emoji: '📅' },
                        { value: 'mensal', label: 'Último Mês', emoji: '📆' },
                        { value: 'anual', label: 'Último Ano', emoji: '🗓️' }
                      ].map((period) => (
                        <button
                          key={period.value}
                          onClick={() => setTimePeriod(period.value)}
                          className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold transition-all ${
                            timePeriod === period.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-xl">{period.emoji}</span>
                          <span className="hidden md:inline">{period.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    
                    {/* Score Geral de Produtividade */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🎯 Score de Produtividade: {getPeriodLabel()}
                      </h2>
                      <div className="flex items-center gap-6">
                        <div className="flex-shrink-0">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-gray-200 dark:text-gray-700"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - productivityScore / 100)}`}
                                className={`${
                                  productivityScore >= 80 ? 'text-green-500' :
                                  productivityScore >= 60 ? 'text-blue-500' :
                                  productivityScore >= 40 ? 'text-yellow-500' :
                                  'text-red-500'
                                }`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                {productivityScore}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                            {productivityScore >= 80 ? '🎉 Excelente desempenho!' :
                             productivityScore >= 60 ? '👍 Bom trabalho!' :
                             productivityScore >= 40 ? '📈 Continue melhorando!' :
                             '💪 Vamos dar o nosso melhor!'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Score calculado com base em bem-estar, conclusão de tarefas, eventos, PBLs e horas de estudo.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Grid de Estatísticas por Área */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      
                      {/* BEM-ESTAR */}
                      {consolidatedStats.wellness && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-indigo-200 dark:border-indigo-700">
                          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                            💪 Bem-estar
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Registros:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.wellness.totalRecords}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Sono médio:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.wellness.avgSleep}h</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Hidratação:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.wellness.avgWater}L</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Exercício:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.wellness.avgExercise}min</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Dias com metas:</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {consolidatedStats.wellness.daysWithGoals}/{consolidatedStats.wellness.totalRecords}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AGENDA/CALENDÁRIO */}
                      {consolidatedStats.calendar && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-blue-200 dark:border-blue-700">
                          <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                            📅 Calendário
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total de eventos:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.calendar.totalEvents}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Concluídos:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">{consolidatedStats.calendar.completedEvents}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Próximos:</span>
                              <span className="font-bold text-yellow-600 dark:text-yellow-400">{consolidatedStats.calendar.upcomingEvents}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de conclusão:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{consolidatedStats.calendar.completionRate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PBL */}
                      {consolidatedStats.pbl && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-700">
                          <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                            🧠 PBL
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total de casos:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.pbl.totalCases}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Concluídos:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">{consolidatedStats.pbl.completedCases}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Em progresso:</span>
                              <span className="font-bold text-yellow-600 dark:text-yellow-400">{consolidatedStats.pbl.inProgressCases}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de conclusão:</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">{consolidatedStats.pbl.completionRate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAREFAS */}
                      {consolidatedStats.tasks && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-green-200 dark:border-green-700">
                          <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                            ✅ Tarefas
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total de tarefas:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.tasks.totalTasks}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Concluídas:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">{consolidatedStats.tasks.completedTasks}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Pendentes:</span>
                              <span className="font-bold text-yellow-600 dark:text-yellow-400">{consolidatedStats.tasks.pendingTasks}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de conclusão:</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{consolidatedStats.tasks.completionRate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SAÚDE */}
                      {consolidatedStats.health && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-red-200 dark:border-red-700">
                          <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            🩺 Saúde
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total de registros:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.health.totalRecords}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Registros urgentes:</span>
                              <span className="font-bold text-red-600 dark:text-red-400">{consolidatedStats.health.urgentRecords}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Acompanhamento de consultas, exames e medicamentos
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ESTUDOS */}
                      {consolidatedStats.study && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-orange-200 dark:border-orange-700">
                          <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                            📚 Estudos
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total de sessões:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.study.totalSessions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Horas totais:</span>
                              <span className="font-bold text-orange-600 dark:text-orange-400">{consolidatedStats.study.totalHours}h</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Duração média:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{consolidatedStats.study.avgSessionDuration}min</span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}