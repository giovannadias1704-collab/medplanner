import { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';

export default function Analytics() {
  const { wellnessEntries } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('diario'); // 'diario' ou 'comparativo'
  const [timePeriod, setTimePeriod] = useState('semanal'); // 'semanal', 'mensal', 'anual'

  // Função para obter dados do dia atual
  const getTodayData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return wellnessEntries?.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    }) || [];
  };

  // Função para calcular estatísticas por período
  const getStatsByPeriod = () => {
    if (!wellnessEntries || wellnessEntries.length === 0) return null;

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

    const filteredEntries = wellnessEntries.filter(entry => 
      new Date(entry.date) >= startDate
    );

    if (filteredEntries.length === 0) return null;

    // Calcular médias
    const avgSleep = filteredEntries.reduce((sum, e) => sum + (e.sleepHours || 0), 0) / filteredEntries.length;
    const avgWater = filteredEntries.reduce((sum, e) => sum + (e.waterIntake || 0), 0) / filteredEntries.length;
    const avgExercise = filteredEntries.reduce((sum, e) => sum + (e.exerciseMinutes || 0), 0) / filteredEntries.length;

    // Contar humores
    const moodCounts = {
      excelente: 0,
      bom: 0,
      neutro: 0,
      ruim: 0,
      pessimo: 0,
    };

    filteredEntries.forEach(entry => {
      if (entry.mood && moodCounts.hasOwnProperty(entry.mood)) {
        moodCounts[entry.mood]++;
      }
    });

    const mostFrequentMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b
    );

    // Calcular dias com metas atingidas
    const daysWithGoals = filteredEntries.filter(e => 
      e.sleepHours >= 7 && e.sleepHours <= 9 &&
      e.waterIntake >= 2 &&
      e.exerciseMinutes >= 30
    ).length;

    const goalPercentage = (daysWithGoals / filteredEntries.length) * 100;

    return {
      totalEntries: filteredEntries.length,
      avgSleep: avgSleep.toFixed(1),
      avgWater: avgWater.toFixed(1),
      avgExercise: Math.round(avgExercise),
      moodCounts,
      mostFrequentMood,
      daysWithGoals,
      goalPercentage: goalPercentage.toFixed(0),
      entries: filteredEntries,
    };
  };

  const todayEntries = getTodayData();
  const todayEntry = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;
  const stats = getStatsByPeriod();

  const getMoodEmoji = (mood) => {
    const moods = {
      excelente: '😄',
      bom: '🙂',
      neutro: '😐',
      ruim: '😔',
      pessimo: '😢',
    };
    return moods[mood] || '😐';
  };

  const getMoodLabel = (mood) => {
    const labels = {
      excelente: 'Excelente',
      bom: 'Bom',
      neutro: 'Neutro',
      ruim: 'Ruim',
      pessimo: 'Péssimo',
    };
    return labels[mood] || 'N/A';
  };

  const getPeriodLabel = () => {
    const labels = {
      semanal: 'Última Semana',
      mensal: 'Último Mês',
      anual: 'Último Ano',
    };
    return labels[timePeriod];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Análises de Bem-estar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize suas estatísticas e evolução
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
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
              <div>
                {!todayEntry ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📅</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Nenhum registro hoje
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Registre seu bem-estar de hoje para ver as análises!
                    </p>
                    <a
                      href="/wellness"
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Fazer Registro de Hoje
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Resumo do Dia */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Resumo de Hoje
                        </h2>
                        <span className="text-5xl">{getMoodEmoji(todayEntry.mood)}</span>
                      </div>
                      <p className="text-lg text-gray-700 dark:text-gray-300">
                        Humor: <strong className="capitalize">{getMoodLabel(todayEntry.mood)}</strong>
                      </p>
                      {todayEntry.feeling && (
                        <p className="text-lg text-gray-700 dark:text-gray-300">
                          Sentimento: <strong className="capitalize">{todayEntry.feeling}</strong>
                        </p>
                      )}
                    </div>

                    {/* Cards de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Sono */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            😴 Sono
                          </h3>
                          <span className={`text-2xl ${
                            todayEntry.sleepHours >= 7 && todayEntry.sleepHours <= 9
                              ? '✅'
                              : todayEntry.sleepHours >= 6
                              ? '⚠️'
                              : '❌'
                          }`}></span>
                        </div>
                        <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                          {todayEntry.sleepHours}h
                        </p>
                        <p className={`text-sm font-semibold ${
                          todayEntry.sleepHours >= 7 && todayEntry.sleepHours <= 9
                            ? 'text-green-600 dark:text-green-400'
                            : todayEntry.sleepHours >= 6
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {todayEntry.sleepHours >= 7 && todayEntry.sleepHours <= 9
                            ? 'Sono ideal!'
                            : todayEntry.sleepHours >= 6
                            ? 'Sono razoável'
                            : 'Sono insuficiente'}
                        </p>
                        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              todayEntry.sleepHours >= 7 && todayEntry.sleepHours <= 9
                                ? 'bg-green-500'
                                : todayEntry.sleepHours >= 6
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((todayEntry.sleepHours / 9) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Hidratação */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            💧 Hidratação
                          </h3>
                          <span className={`text-2xl ${todayEntry.waterIntake >= 2 ? '✅' : '⚠️'}`}></span>
                        </div>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {todayEntry.waterIntake}L
                        </p>
                        <p className={`text-sm font-semibold ${
                          todayEntry.waterIntake >= 2
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {todayEntry.waterIntake >= 2 ? 'Meta atingida!' : 'Beba mais água'}
                        </p>
                        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              todayEntry.waterIntake >= 2 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min((todayEntry.waterIntake / 2.5) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Exercícios */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            💪 Exercícios
                          </h3>
                          <span className={`text-2xl ${todayEntry.exerciseMinutes >= 30 ? '✅' : '⚠️'}`}></span>
                        </div>
                        <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                          {todayEntry.exerciseMinutes}min
                        </p>
                        <p className={`text-sm font-semibold ${
                          todayEntry.exerciseMinutes >= 30
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {todayEntry.exerciseMinutes >= 30 ? 'Meta atingida!' : 'Continue assim!'}
                        </p>
                        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              todayEntry.exerciseMinutes >= 30 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min((todayEntry.exerciseMinutes / 60) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                    </div>

                    {/* Anotações do Dia */}
                    {todayEntry.notes && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          📝 Anotações do Dia
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {todayEntry.notes}
                        </p>
                      </div>
                    )}

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
                      { value: 'anual', label: 'Último Ano', emoji: '🗓️' },
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
                        <span>{period.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {!stats ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📈</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Dados insuficientes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Registre seu bem-estar por alguns dias para ver as análises comparativas!
                    </p>
                    <a
                      href="/wellness"
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Fazer Registro
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Resumo do Período */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📊 Resumo: {getPeriodLabel()}
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Registros</p>
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalEntries}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dias com Metas</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.daysWithGoals}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taxa de Sucesso</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.goalPercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Humor Predominante</p>
                          <p className="text-3xl font-bold">{getMoodEmoji(stats.mostFrequentMood)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Médias */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          😴 Média de Sono
                        </h3>
                        <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                          {stats.avgSleep}h
                        </p>
                        <p className={`text-sm font-semibold ${
                          parseFloat(stats.avgSleep) >= 7 && parseFloat(stats.avgSleep) <= 9
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {parseFloat(stats.avgSleep) >= 7 && parseFloat(stats.avgSleep) <= 9
                            ? '✅ Dentro do ideal'
                            : '⚠️ Tente melhorar'}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          💧 Média de Hidratação
                        </h3>
                        <p className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {stats.avgWater}L
                        </p>
                        <p className={`text-sm font-semibold ${
                          parseFloat(stats.avgWater) >= 2
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {parseFloat(stats.avgWater) >= 2 ? '✅ Muito bom!' : '⚠️ Beba mais água'}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          💪 Média de Exercícios
                        </h3>
                        <p className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                          {stats.avgExercise}min
                        </p>
                        <p className={`text-sm font-semibold ${
                          stats.avgExercise >= 30
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {stats.avgExercise >= 30 ? '✅ Excelente!' : '⚠️ Aumente a frequência'}
                        </p>
                      </div>

                    </div>

                    {/* Distribuição de Humor */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        😊 Distribuição de Humor
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.moodCounts).map(([mood, count]) => {
                          const percentage = (count / stats.totalEntries) * 100;
                          return (
                            <div key={mood}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize flex items-center gap-2">
                                  <span className="text-xl">{getMoodEmoji(mood)}</span>
                                  {getMoodLabel(mood)}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {count} dias ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full ${
                                    mood === 'excelente' ? 'bg-green-500' :
                                    mood === 'bom' ? 'bg-blue-500' :
                                    mood === 'neutro' ? 'bg-gray-500' :
                                    mood === 'ruim' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Insights */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        💡 Insights e Recomendações
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {parseFloat(stats.avgSleep) < 7 && (
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">⚠️</span>
                            <span>Você está dormindo menos que o ideal. Tente dormir 7-9 horas por noite para melhor desempenho acadêmico.</span>
                          </li>
                        )}
                        {parseFloat(stats.avgWater) < 2 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">💧</span>
                            <span>Aumente sua hidratação! Meta: 2-3 litros por dia para melhor concentração.</span>
                          </li>
                        )}
                        {stats.avgExercise < 30 && (
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">💪</span>
                            <span>Tente fazer pelo menos 30 minutos de exercício por dia. Isso reduz estresse e melhora o humor!</span>
                          </li>
                        )}
                        {parseFloat(stats.goalPercentage) >= 70 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">🎉</span>
                            <span>Parabéns! Você está atingindo suas metas de bem-estar com frequência. Continue assim!</span>
                          </li>
                        )}
                        {stats.moodCounts.excelente + stats.moodCounts.bom > stats.totalEntries * 0.6 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">😊</span>
                            <span>Seu humor tem estado predominantemente positivo. Ótimo trabalho em cuidar da sua saúde mental!</span>
                          </li>
                        )}
                      </ul>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}