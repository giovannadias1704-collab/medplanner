import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { CheckCircleIcon, PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { homeTasks, addHomeTask, toggleHomeTask, deleteHomeTask } = useContext(AppContext);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [newTask, setNewTask] = useState({
    text: '',
    category: 'Cozinha'
  });

  const categories = ['Cozinha', 'Lavanderia', 'Banheiro', 'Limpeza', 'Quarto', 'Outro'];

  const categoryEmojis = {
    'Cozinha': '🍳',
    'Lavanderia': '👕',
    'Banheiro': '🚿',
    'Limpeza': '🧹',
    'Quarto': '🛏️',
    'Outro': '📦'
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addHomeTask(newTask);
      setNewTask({ text: '', category: 'Cozinha' });
      setShowTaskModal(false);
    } catch (error) {
      alert('Erro ao adicionar tarefa');
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      await toggleHomeTask(taskId, currentStatus);
    } catch (error) {
      alert('Erro ao marcar tarefa');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteHomeTask(taskId);
      } catch (error) {
        alert('Erro ao excluir tarefa');
      }
    }
  };

  // Filtrar tarefas
  const filteredTasks = homeTasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = homeTasks.filter(t => t.completed).length;
  const progress = homeTasks.length > 0 ? (completedCount / homeTasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Casa"
        subtitle="Organize suas tarefas domésticas"
        emoji="🏠"
        imageQuery="home,interior,cozy,house"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Progresso */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 shadow-xl border-2 border-purple-200 dark:border-purple-800 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Progresso de Hoje
              </h2>
            </div>
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {completedCount}/{homeTasks.length}
            </span>
          </div>

          <div className="w-full bg-white dark:bg-gray-800 rounded-full h-4 mb-4 shadow-inner overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-4 rounded-full transition-all duration-500 shadow-lg relative"
              style={{ width: `${progress}%` }}
            >
              {progress >= 10 && (
                <span className="absolute right-2 top-0.5 text-xs font-bold text-white">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          </div>

          {homeTasks.length > 0 && completedCount === homeTasks.length && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
              <p className="text-green-800 dark:text-green-200 font-bold">
                🎉 Todas as tarefas concluídas!
              </p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all shadow-sm hover-lift ${
              filter === 'all'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700'
            }`}
          >
            📋 Todas ({homeTasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all shadow-sm hover-lift ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700'
            }`}
          >
            ⏳ Pendentes ({homeTasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all shadow-sm hover-lift ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700'
            }`}
          >
            ✅ Concluídas ({completedCount})
          </button>
        </div>

        {/* Checklist */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Checklist Doméstico
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organize suas tarefas
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              Adicionar
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-7xl mb-4">
                {filter === 'completed' && homeTasks.length > 0 ? '📭' : 
                 filter === 'pending' && homeTasks.length > 0 ? '🎉' : '🏠'}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {filter === 'completed' && homeTasks.length > 0 ? 'Nenhuma Tarefa Concluída' :
                 filter === 'pending' && homeTasks.length > 0 ? 'Tudo Feito!' :
                 'Nenhuma Tarefa Cadastrada'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {filter === 'completed' && homeTasks.length > 0
                  ? 'Nenhuma tarefa concluída ainda.'
                  : filter === 'pending' && homeTasks.length > 0
                  ? 'Todas as tarefas foram concluídas!'
                  : 'Adicione sua primeira tarefa doméstica!'}
              </p>
              {filter === 'all' && homeTasks.length === 0 && (
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Adicionar Primeira Tarefa
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`rounded-2xl p-5 shadow-lg border-2 flex items-center gap-4 hover-lift animate-slide-in ${
                    task.completed
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <button
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className={`flex-shrink-0 transition-all hover-scale ${
                      task.completed
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    <CheckCircleIcon className="h-8 w-8" />
                  </button>

                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${
                      task.completed 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                      {categoryEmojis[task.category] || '📦'}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-bold text-lg ${
                          task.completed
                            ? 'line-through text-gray-500 dark:text-gray-500'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {task.text}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
                        {task.category}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal Nova Tarefa */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <PlusIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Nova Tarefa Doméstica
              </h3>
              <button 
                onClick={() => setShowTaskModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição da Tarefa
                </label>
                <input
                  type="text"
                  required
                  value={newTask.text}
                  onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Lavar louça"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {categoryEmojis[cat]} {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
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