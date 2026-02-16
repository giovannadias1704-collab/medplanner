import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function Wellness() {
  const { wellnessEntries, addWellnessEntry } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('registro'); // 'registro' ou 'historico'
  
  // Estado do formulário
  const [mood, setMood] = useState('');
  const [feeling, setFeeling] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [notes, setNotes] = useState('');
  const [waterIntake, setWaterIntake] = useState(0);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);

  const moods = [
    { value: 'excelente', emoji: '😄', label: 'Excelente', color: 'green' },
    { value: 'bom', emoji: '🙂', label: 'Bom', color: 'blue' },
    { value: 'neutro', emoji: '😐', label: 'Neutro', color: 'gray' },
    { value: 'ruim', emoji: '😔', label: 'Ruim', color: 'orange' },
    { value: 'pessimo', emoji: '😢', label: 'Péssimo', color: 'red' },
  ];

  const feelings = [
    { value: 'motivado', emoji: '💪', label: 'Motivado' },
    { value: 'cansado', emoji: '😴', label: 'Cansado' },
    { value: 'ansioso', emoji: '😰', label: 'Ansioso' },
    { value: 'estressado', emoji: '😤', label: 'Estressado' },
    { value: 'feliz', emoji: '😊', label: 'Feliz' },
    { value: 'triste', emoji: '😢', label: 'Triste' },
    { value: 'focado', emoji: '🎯', label: 'Focado' },
    { value: 'disperso', emoji: '🌀', label: 'Disperso' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!mood || !sleepHours) {
      alert('Por favor, preencha pelo menos o humor e horas de sono!');
      return;
    }

    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      feeling,
      sleepHours: parseFloat(sleepHours),
      waterIntake,
      exerciseMinutes,
      notes,
    };

    addWellnessEntry(entry);
    
    // Limpar formulário
    setMood('');
    setFeeling('');
    setSleepHours('');
    setNotes('');
    setWaterIntake(0);
    setExerciseMinutes(0);
    
    alert('✅ Registro salvo com sucesso!');
    setActiveTab('historico');
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodColor = (moodValue) => {
    const moodObj = moods.find(m => m.value === moodValue);
    return moodObj?.color || 'gray';
  };

  const getMoodEmoji = (moodValue) => {
    const moodObj = moods.find(m => m.value === moodValue);
    return moodObj?.emoji || '😐';
  };

  const getFeelingEmoji = (feelingValue) => {
    const feelingObj = feelings.find(f => f.value === feelingValue);
    return feelingObj?.emoji || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💚 Bem-estar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe sua saúde física e mental diariamente
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('registro')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'registro'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              📝 Novo Registro
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'historico'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              📊 Registros Salvos ({wellnessEntries?.length || 0})
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="p-6">
            
            {/* TAB: NOVO REGISTRO */}
            {activeTab === 'registro' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Como está seu humor? */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                    😊 Como está seu humor hoje? *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {moods.map((moodOption) => (
                      <button
                        key={moodOption.value}
                        type="button"
                        onClick={() => setMood(moodOption.value)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                          mood === moodOption.value
                            ? `border-${moodOption.color}-500 bg-${moodOption.color}-50 dark:bg-${moodOption.color}-900/30 scale-105`
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-4xl">{moodOption.emoji}</span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {moodOption.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Como está se sentindo? */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                    💭 Como está se sentindo?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {feelings.map((feelingOption) => (
                      <button
                        key={feelingOption.value}
                        type="button"
                        onClick={() => setFeeling(feelingOption.value)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          feeling === feelingOption.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 scale-105'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{feelingOption.emoji}</span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {feelingOption.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horas de sono */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                    😴 Quantas horas você dormiu? *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="Ex: 7.5"
                    className="w-full md:w-1/2 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                  />
                  {sleepHours && (
                    <p className={`mt-2 text-sm font-semibold ${
                      parseFloat(sleepHours) >= 7 && parseFloat(sleepHours) <= 9
                        ? 'text-green-600 dark:text-green-400'
                        : parseFloat(sleepHours) >= 6
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {parseFloat(sleepHours) >= 7 && parseFloat(sleepHours) <= 9
                        ? '✅ Excelente! Sono ideal para estudantes de medicina.'
                        : parseFloat(sleepHours) >= 6
                        ? '⚠️ Razoável, mas tente dormir mais.'
                        : '❌ Sono insuficiente! Isso pode afetar seus estudos.'}
                    </p>
                  )}
                </div>

                {/* Hidratação */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                    💧 Quantos litros de água você bebeu?
                  </label>
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={waterIntake}
                      onChange={(e) => setWaterIntake(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 2.5"
                      className="flex-1 md:flex-none md:w-48 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                    />
                    <span className="text-gray-600 dark:text-gray-400">litros</span>
                  </div>
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2, 2.5].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setWaterIntake(amount)}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold transition-all"
                      >
                        {amount}L
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercícios */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                    💪 Quantos minutos de exercício você fez?
                  </label>
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      step="5"
                      value={exerciseMinutes}
                      onChange={(e) => setExerciseMinutes(parseInt(e.target.value) || 0)}
                      placeholder="Ex: 30"
                      className="flex-1 md:flex-none md:w-48 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                    />
                    <span className="text-gray-600 dark:text-gray-400">minutos</span>
                  </div>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setExerciseMinutes(mins)}
                        className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-semibold transition-all"
                      >
                        {mins}min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Espaço para anotações */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                    📝 Quer anotar algo sobre seu dia?
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Como foi seu dia? Algo que você gostaria de lembrar? Preocupações? Conquistas?"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                {/* Botão de salvar */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    💾 Salvar Registro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMood('');
                      setFeeling('');
                      setSleepHours('');
                      setNotes('');
                      setWaterIntake(0);
                      setExerciseMinutes(0);
                    }}
                    className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all"
                  >
                    🗑️ Limpar
                  </button>
                </div>

              </form>
            )}

            {/* TAB: HISTÓRICO */}
            {activeTab === 'historico' && (
              <div>
                {!wellnessEntries || wellnessEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📊</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Nenhum registro ainda
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Comece a registrar seu bem-estar para acompanhar sua evolução!
                    </p>
                    <button
                      onClick={() => setActiveTab('registro')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Criar Primeiro Registro
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...wellnessEntries].reverse().map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{getMoodEmoji(entry.mood)}</span>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white capitalize">
                                {entry.mood}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(entry.date)}
                              </p>
                            </div>
                          </div>
                          {entry.feeling && (
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-600 px-3 py-2 rounded-lg">
                              <span className="text-xl">{getFeelingEmoji(entry.feeling)}</span>
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                                {entry.feeling}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white dark:bg-gray-600 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sono</p>
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {entry.sleepHours}h
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-600 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Água</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {entry.waterIntake}L
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-600 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Exercício</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              {entry.exerciseMinutes}min
                            </p>
                          </div>
                          <div className={`bg-white dark:bg-gray-600 rounded-lg p-3 ${
                            entry.sleepHours >= 7 && entry.sleepHours <= 9 && entry.waterIntake >= 2 && entry.exerciseMinutes >= 30
                              ? 'ring-2 ring-green-500'
                              : ''
                          }`}>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {entry.sleepHours >= 7 && entry.sleepHours <= 9 && entry.waterIntake >= 2 && entry.exerciseMinutes >= 30
                                ? '🎉 Ótimo'
                                : '💪 Bom'}
                            </p>
                          </div>
                        </div>

                        {entry.notes && (
                          <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              📝 Anotações:
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                              {entry.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
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