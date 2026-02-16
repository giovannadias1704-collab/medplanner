import { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { FaceSmileIcon, BoltIcon, MoonIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Wellness() {
  const { wellBeingEntries, addWellBeingEntry, getWellBeingHistory, getWellBeingStats } = useContext(AppContext);
  
  const [activeTab, setActiveTab] = useState('registrar'); // registrar, historico, analise
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [sleep, setSleep] = useState('');
  const [notes, setNotes] = useState('');

  const moods = [
    { value: 1, emoji: '😔', label: 'Triste', color: 'from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 border-red-300 dark:border-red-700' },
    { value: 2, emoji: '😐', label: 'Neutro', color: 'from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 border-gray-300 dark:border-gray-600' },
    { value: 3, emoji: '🙂', label: 'Bem', color: 'from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-300 dark:border-blue-700' },
    { value: 4, emoji: '😊', label: 'Muito Bem', color: 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700' },
    { value: 5, emoji: '😄', label: 'Ótimo', color: 'from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-300 dark:border-yellow-700' }
  ];

  const energyLevels = [
    { value: 1, label: 'Exausto', bars: 1, color: 'bg-red-500' },
    { value: 2, label: 'Cansado', bars: 2, color: 'bg-orange-500' },
    { value: 3, label: 'Normal', bars: 3, color: 'bg-yellow-500' },
    { value: 4, label: 'Energizado', bars: 4, color: 'bg-green-500' },
    { value: 5, label: 'Muito Energizado', bars: 5, color: 'bg-emerald-500' }
  ];

  const handleSaveEntry = async () => {
    if (!mood || !energy || !sleep) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await addWellBeingEntry({
        mood,
        energy,
        sleep: parseFloat(sleep),
        notes,
        date: new Date().toISOString().split('T')[0]
      });

      // Reset form
      setMood(null);
      setEnergy(null);
      setSleep('');
      setNotes('');

      alert('Registro salvo com sucesso! ✅');
      setActiveTab('historico');
    } catch (error) {
      alert('Erro ao salvar registro');
    }
  };

  const history = useMemo(() => getWellBeingHistory(), [wellBeingEntries]);
  const stats7Days = useMemo(() => getWellBeingStats(7), [wellBeingEntries]);
  const stats30Days = useMemo(() => getWellBeingStats(30), [wellBeingEntries]);

  const getMoodEmoji = (moodValue) => {
    const moodItem = moods.find(m => m.value === moodValue);
    return moodItem ? moodItem.emoji : '😐';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  const getTrendText = (trend) => {
    if (trend === 'improving') return 'Melhorando!';
    if (trend === 'declining') return 'Em declínio';
    return 'Estável';
  };

  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'text-green-600 dark:text-green-400';
    if (trend === 'declining') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Bem-estar"
        subtitle="Cuide da sua saúde mental e emocional"
        emoji="✨"
        imageQuery="wellness,meditation,peace,mental health"
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {[
              { id: 'registrar', label: 'Registrar', icon: FaceSmileIcon, emoji: '😊' },
              { id: 'historico', label: 'Histórico', icon: ClockIcon, emoji: '📅' },
              { id: 'analise', label: 'Análise', icon: ChartBarIcon, emoji: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 scale-105'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="text-lg">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab: Registrar */}
        {activeTab === 'registrar' && (
          <div className="space-y-6">
            {/* Humor */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaceSmileIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Como você está se sentindo hoje?
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecione seu humor
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {moods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`p-5 rounded-2xl border-2 transition-all hover-lift ${
                      mood === m.value
                        ? `bg-gradient-to-br ${m.color} shadow-lg scale-105`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="text-4xl mb-2">{m.emoji}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {m.label}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Energia */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BoltIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nível de Energia
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Como está sua disposição?
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {energyLevels.map((level, index) => (
                  <button
                    key={level.value}
                    onClick={() => setEnergy(level.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left hover-lift animate-slide-in ${
                      energy === level.value
                        ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                    style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-6 rounded-sm transition-all ${
                              i < level.value ? level.color : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {level.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Sono */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MoonIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Sono
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quantas horas você dormiu?
                  </p>
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder="Ex: 7.5"
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl font-bold focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  💡 Recomendado: 7-9 horas
                </p>
              </div>
            </section>

            {/* Observações */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Observações
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Opcional
                  </p>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Como foi seu dia? Algo importante aconteceu?"
                rows="4"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 transition-all"
              ></textarea>
            </section>

            <button 
              onClick={handleSaveEntry}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold text-lg shadow-xl hover-lift animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              Salvar Registro ✅
            </button>
          </div>
        )}

        {/* Tab: Histórico */}
        {activeTab === 'historico' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Histórico de Registros
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {history.length} registro(s)
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum Registro Ainda
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece a registrar seu bem-estar!
                </p>
                <button
                  onClick={() => setActiveTab('registrar')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Fazer Primeiro Registro
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => {
                  const moodData = moods.find(m => m.value === entry.mood);
                  const energyData = energyLevels.find(e => e.value === entry.energy);
                  
                  return (
                    <div
                      key={entry.id}
                      className={`bg-gradient-to-br ${moodData?.color || 'from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800'} rounded-2xl p-6 shadow-lg border-2 hover-lift animate-slide-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-5xl">{getMoodEmoji(entry.mood)}</div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                              {moodData?.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              📅 {new Date(entry.date).toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                            ⚡ Energia
                          </p>
                          <div className="flex gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-5 rounded-sm ${
                                  i < entry.energy ? energyData?.color || 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              ></div>
                            ))}
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {energyData?.label}
                          </p>
                        </div>

                        <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                            😴 Sono
                          </p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {entry.sleep}h
                          </p>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="pt-4 border-t-2 border-white/30 dark:border-black/30">
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            💭 {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Análise */}
        {activeTab === 'analise' && (
          <div className="space-y-6">
            {wellBeingEntries.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Sem Dados Suficientes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Você precisa de pelo menos um registro para ver sua análise.
                </p>
                <button
                  onClick={() => setActiveTab('registrar')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Fazer Primeiro Registro
                </button>
              </div>
            ) : (
              <>
                {/* Últimos 7 Dias */}
                <section className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 shadow-xl border-2 border-blue-200 dark:border-blue-800 animate-fade-in">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Últimos 7 Dias
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stats7Days.totalEntries} registro(s)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                      <div className="text-4xl mb-2">{getMoodEmoji(Math.round(stats7Days.avgMood))}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Humor</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats7Days.avgMood.toFixed(1)}<span className="text-sm text-gray-500">/5</span>
                      </p>
                    </div>

                    <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                      <div className="text-4xl mb-2">⚡</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Energia</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats7Days.avgEnergy.toFixed(1)}<span className="text-sm text-gray-500">/5</span>
                      </p>
                    </div>

                    <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                      <div className="text-4xl mb-2">😴</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Sono</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats7Days.avgSleep.toFixed(1)}<span className="text-sm text-gray-500">h</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl">{getTrendIcon(stats7Days.moodTrend)}</span>
                      <span className={`font-bold text-lg ${getTrendColor(stats7Days.moodTrend)}`}>
                        Tendência: {getTrendText(stats7Days.moodTrend)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Últimos 30 Dias */}
                {stats30Days.totalEntries > 0 && (
                  <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 shadow-xl border-2 border-purple-200 dark:border-purple-800 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Últimos 30 Dias
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stats30Days.totalEntries} registro(s)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                        <div className="text-4xl mb-2">{getMoodEmoji(Math.round(stats30Days.avgMood))}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Humor</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats30Days.avgMood.toFixed(1)}<span className="text-sm text-gray-500">/5</span>
                        </p>
                      </div>

                      <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                        <div className="text-4xl mb-2">⚡</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Energia</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats30Days.avgEnergy.toFixed(1)}<span className="text-sm text-gray-500">/5</span>
                        </p>
                      </div>

                      <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                        <div className="text-4xl mb-2">😴</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Sono</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats30Days.avgSleep.toFixed(1)}<span className="text-sm text-gray-500">h</span>
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Insights */}
                {stats7Days.insights && stats7Days.insights.length > 0 && (
                  <section className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-800 shadow-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💡</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Insights Personalizados
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Recomendações baseadas nos seus dados
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {stats7Days.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md animate-slide-in"
                          style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                        >
                          <p className="text-gray-800 dark:text-gray-200 font-medium">
                            ✨ {insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}