import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { HeartIcon, FireIcon, ScaleIcon, BeakerIcon, XMarkIcon, PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Health() {
  const { 
    workouts,
    meals,
    weights,
    waterLogs,
    settings,
    addWorkout,
    addMeal,
    addWeight,
    logWater,
    getWaterIntakeToday
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('treino');
  const [waterIntake, setWaterIntake] = useState(0);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Forms state
  const [newWorkout, setNewWorkout] = useState({ 
    title: '', 
    type: 'A', 
    date: new Date().toISOString().split('T')[0], 
    completed: false 
  });
  
  const [newMeal, setNewMeal] = useState({ 
    title: '', 
    type: 'cafe', 
    date: new Date().toISOString().split('T')[0],
    calories: ''
  });
  
  const [newWeight, setNewWeight] = useState({ 
    weight: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  // Load water intake for today
  useEffect(() => {
    const todayIntake = getWaterIntakeToday();
    setWaterIntake(todayIntake);
  }, [waterLogs]);

  const waterGoal = settings.waterGoal || 2.0;

  const addWater = async (amount) => {
    try {
      await logWater(amount);
      setWaterIntake(prev => Math.min(prev + amount, 10));
    } catch (error) {
      alert('Erro ao registrar água');
    }
  };

  const waterPercentage = (waterIntake / waterGoal) * 100;

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    try {
      await addWorkout(newWorkout);
      setNewWorkout({ title: '', type: 'A', date: new Date().toISOString().split('T')[0], completed: false });
      setShowWorkoutModal(false);
    } catch (error) {
      alert('Erro ao adicionar treino');
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      await addMeal({
        ...newMeal,
        calories: newMeal.calories ? parseInt(newMeal.calories) : null
      });
      setNewMeal({ title: '', type: 'cafe', date: new Date().toISOString().split('T')[0], calories: '' });
      setShowMealModal(false);
    } catch (error) {
      alert('Erro ao adicionar refeição');
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    try {
      await addWeight({
        ...newWeight,
        weight: parseFloat(newWeight.weight)
      });
      setNewWeight({ weight: '', date: new Date().toISOString().split('T')[0] });
      setShowWeightModal(false);
    } catch (error) {
      alert('Erro ao registrar peso');
    }
  };

  // Get workouts for this week
  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    return workoutDate >= weekStart;
  });

  const completedWorkouts = thisWeekWorkouts.filter(w => w.completed).length;
  const totalWorkouts = 5; // Meta semanal

  // Sort weights by date
  const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Saúde"
        subtitle="Monitore seu bem-estar físico"
        emoji="💪"
        imageQuery="fitness,gym,health,workout"
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {[
              { id: 'treino', label: 'Treino', icon: FireIcon, emoji: '🔥' },
              { id: 'alimentacao', label: 'Alimentação', icon: HeartIcon, emoji: '🍎' },
              { id: 'agua', label: 'Água', icon: BeakerIcon, emoji: '💧' },
              { id: 'peso', label: 'Peso', icon: ScaleIcon, emoji: '⚖️' }
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
        {/* Treino */}
        {activeTab === 'treino' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FireIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Planejamento de Treinos
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organize sua rotina
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWorkoutModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Adicionar
              </button>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 shadow-lg border-2 border-orange-200 dark:border-orange-800 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🎯</span>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Meta Semanal
                  </h3>
                </div>
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {completedWorkouts}/{totalWorkouts}
                </span>
              </div>

              <div className="w-full bg-white dark:bg-gray-800 rounded-full h-4 mb-4 shadow-inner">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-4 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${(completedWorkouts / totalWorkouts) * 100}%` }}
                ></div>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {completedWorkouts === totalWorkouts 
                  ? '🎉 Parabéns! Meta semanal atingida!' 
                  : `💪 Faltam ${totalWorkouts - completedWorkouts} treino${totalWorkouts - completedWorkouts !== 1 ? 's' : ''} para completar sua meta!`}
              </p>
            </div>

            {workouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">🏋️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum Treino Cadastrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece adicionando seu primeiro treino!
                </p>
                <button
                  onClick={() => setShowWorkoutModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Adicionar Primeiro Treino
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map((treino, index) => (
                  <div
                    key={treino.id}
                    className={`rounded-2xl p-5 shadow-lg border-2 hover-lift animate-slide-in ${
                      treino.completed
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          treino.completed 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-orange-100 dark:bg-orange-900/30'
                        }`}>
                          {treino.completed ? '✅' : '🏋️'}
                        </div>
                        <div>
                          <h4 className="text-gray-900 dark:text-white font-bold text-lg">
                            {treino.title} - Treino {treino.type}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            📅 {new Date(treino.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {treino.completed && (
                        <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alimentação */}
        {activeTab === 'alimentacao' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🍎</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Registro de Refeições
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Acompanhe sua alimentação
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMealModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Adicionar
              </button>
            </div>

            {meals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">🍽️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhuma Refeição Registrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece a acompanhar sua alimentação!
                </p>
                <button
                  onClick={() => setShowMealModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Registrar Primeira Refeição
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {meals.map((meal, index) => {
                  const mealEmoji = {
                    'cafe': '☕',
                    'lanche': '🍪',
                    'almoco': '🍽️',
                    'janta': '🌙'
                  }[meal.type] || '🍴';

                  const mealLabel = {
                    'cafe': 'Café da Manhã',
                    'lanche': 'Lanche',
                    'almoco': 'Almoço',
                    'janta': 'Janta'
                  }[meal.type] || 'Refeição';

                  return (
                    <div
                      key={meal.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 hover-lift animate-slide-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">
                            {mealEmoji}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {meal.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {mealLabel} • {new Date(meal.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        {meal.calories && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                              {meal.calories}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              kcal
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Água */}
        {activeTab === 'agua' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💧</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Consumo de Água Hoje
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mantenha-se hidratado
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 shadow-xl border-2 border-blue-200 dark:border-blue-800 mb-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                  {waterIntake.toFixed(1)}L
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  de {waterGoal}L (meta diária)
                </p>
              </div>

              <div className="w-full bg-white dark:bg-gray-800 rounded-full h-5 mb-6 shadow-inner overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-5 rounded-full transition-all duration-500 shadow-lg relative"
                  style={{ width: `${Math.min(waterPercentage, 100)}%` }}
                >
                  {waterPercentage >= 10 && (
                    <span className="absolute right-2 top-0.5 text-xs font-bold text-white">
                      {Math.round(waterPercentage)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => addWater(0.2)}
                  className="py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold shadow-md hover-lift transition-all"
                >
                  <div className="text-2xl mb-1">💧</div>
                  + 200ml
                </button>
                <button
                  onClick={() => addWater(0.3)}
                  className="py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold shadow-md hover-lift transition-all"
                >
                  <div className="text-2xl mb-1">🥤</div>
                  + 300ml
                </button>
                <button
                  onClick={() => addWater(0.5)}
                  className="py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold shadow-md hover-lift transition-all"
                >
                  <div className="text-2xl mb-1">🍶</div>
                  + 500ml
                </button>
              </div>
            </div>

            {waterPercentage >= 100 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg animate-scale-in">
                <div className="text-6xl mb-3">🎉</div>
                <p className="text-green-800 dark:text-green-200 font-bold text-lg">
                  Parabéns! Meta de água atingida hoje!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Peso */}
        {activeTab === 'peso' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ScaleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Acompanhamento de Peso
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitore sua evolução
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Registrar
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-8 shadow-xl border-2 border-purple-200 dark:border-purple-800 mb-6 animate-fade-in">
              <div className="text-center">
                <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                  {sortedWeights[0]?.weight || '--'}kg
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {sortedWeights[0]?.date ? `Última medição: ${new Date(sortedWeights[0].date).toLocaleDateString('pt-BR')}` : 'Nenhum registro ainda'}
                </p>
              </div>
            </div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Histórico
            </h3>

            {sortedWeights.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">⚖️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum Registro de Peso
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece a acompanhar seu peso!
                </p>
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Primeiro Registro
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedWeights.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between hover-lift animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-xl">⚖️</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {entry.weight}kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Novo Treino */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <FireIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Novo Treino
              </h3>
              <button 
                onClick={() => setShowWorkoutModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddWorkout} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={newWorkout.title}
                  onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Treino de Peito"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={newWorkout.type}
                  onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="A">Treino A</option>
                  <option value="B">Treino B</option>
                  <option value="C">Treino C</option>
                  <option value="D">Treino D</option>
                  <option value="E">Treino E</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={newWorkout.date}
                  onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <input
                  type="checkbox"
                  id="completed"
                  checked={newWorkout.completed}
                  onChange={(e) => setNewWorkout({ ...newWorkout, completed: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="completed" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  ✅ Marcar como concluído
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
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

      {/* Modal Nova Refeição */}
      {showMealModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🍎</span>
                </div>
                Nova Refeição
              </h3>
              <button 
                onClick={() => setShowMealModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  O que você comeu?
                </label>
                <input
                  type="text"
                  required
                  value={newMeal.title}
                  onChange={(e) => setNewMeal({ ...newMeal, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Frango com batata doce"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Refeição
                </label>
                <select
                  value={newMeal.type}
                  onChange={(e) => setNewMeal({ ...newMeal, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="cafe">☕ Café da Manhã</option>
                  <option value="lanche">🍪 Lanche</option>
                  <option value="almoco">🍽️ Almoço</option>
                  <option value="janta">🌙 Janta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Calorias (opcional)
                </label>
                <input
                  type="number"
                  value={newMeal.calories}
                  onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: 450"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={newMeal.date}
                  onChange={(e) => setNewMeal({ ...newMeal, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
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

      {/* Modal Registrar Peso */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <ScaleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Registrar Peso
              </h3>
              <button 
                onClick={() => setShowWeightModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddWeight} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight.weight}
                  onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: 65.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={newWeight.date}
                  onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}