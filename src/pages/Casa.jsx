import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { generateText } from '../services/gemini';
import PageHeader from '../components/PageHeader';
import { MicrophoneIcon, PlusIcon, CheckCircleIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Casa() {
  const { user } = useAuth();
  const [homeTasks, setHomeTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadHomeTasks();
    }
  }, [user]);

  const loadHomeTasks = async () => {
    try {
      const tasksRef = collection(db, 'homeTasks');
      const today = new Date().toISOString().split('T')[0];
      
      const q = query(
        tasksRef,
        where('userId', '==', user.uid),
        where('date', '==', today)
      );
      
      const snapshot = await getDocs(q);
      const tasks = [];
      
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      setHomeTasks(tasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const handleAITaskList = async () => {
    if (!aiInput.trim()) {
      alert('Por favor, digite as tarefas!');
      return;
    }

    setLoading(true);

    try {
      const prompt = `Você é um assistente de organização doméstica. O usuário vai falar várias tarefas de casa e você deve organizá-las.

ENTRADA DO USUÁRIO:
"${aiInput}"

IMPORTANTE: Retorne APENAS um array JSON válido, sem texto adicional, sem markdown, sem explicações.

FORMATO EXATO:
[
  {"title": "Lavar a louça", "category": "Cozinha", "priority": "alta"},
  {"title": "Limpar o banheiro", "category": "Limpeza", "priority": "média"}
]

REGRAS:
- Separe cada tarefa em um objeto
- Use títulos curtos e claros (máximo 50 caracteres)
- Categorias válidas: "Cozinha", "Limpeza", "Roupas", "Compras", "Organização", "Outros"
- Prioridades válidas: "alta", "média", "baixa"
- Capitalize a primeira letra de cada tarefa
- Remova tarefas duplicadas ou muito similares
- Se o usuário disser "e", "também", "ainda", separe em tarefas diferentes

Retorne SOMENTE o array JSON, nada mais.`;

      const result = await generateText(prompt);
      
      let cleanResult = result.trim();
      
      const backtickJson = '`' + '`' + '`' + 'json';
      const backtickOnly = '`' + '`' + '`';
      
      cleanResult = cleanResult.split(backtickJson).join('');
      cleanResult = cleanResult.split(backtickOnly).join('');
      cleanResult = cleanResult.trim();
      
      const startIndex = cleanResult.indexOf('[');
      const endIndex = cleanResult.lastIndexOf(']');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Resposta da IA inválida');
      }
      
      cleanResult = cleanResult.substring(startIndex, endIndex + 1);
      
      const tasksList = JSON.parse(cleanResult);
      
      if (!Array.isArray(tasksList) || tasksList.length === 0) {
        throw new Error('Nenhuma tarefa foi identificada');
      }

      const today = new Date().toISOString().split('T')[0];
      
      for (const task of tasksList) {
        await addDoc(collection(db, 'homeTasks'), {
          title: task.title,
          category: task.category || 'Outros',
          priority: task.priority || 'média',
          completed: false,
          date: today,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      await loadHomeTasks();
      
      setShowAIModal(false);
      setAiInput('');
      
      alert(`✅ ${tasksList.length} tarefa(s) adicionada(s) com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao processar com IA:', error);
      alert('❌ Erro ao processar tarefas com IA. Tente novamente ou use o modo manual.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      await addDoc(collection(db, 'homeTasks'), {
        title: newTask,
        category: 'Outros',
        priority: 'média',
        completed: false,
        date: today,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setNewTask('');
      setShowAddTask(false);
      loadHomeTasks();
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const toggleTask = async (taskId, completed) => {
    try {
      await updateDoc(doc(db, 'homeTasks', taskId), {
        completed: !completed
      });
      
      loadHomeTasks();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Deseja realmente excluir esta tarefa?')) return;

    try {
      await deleteDoc(doc(db, 'homeTasks', taskId));
      loadHomeTasks();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Cozinha': '🍳',
      'Limpeza': '🧹',
      'Roupas': '👕',
      'Compras': '🛒',
      'Organização': '📦',
      'Outros': '📌'
    };
    return emojis[category] || '📌';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'alta': 'text-red-600 dark:text-red-400',
      'média': 'text-yellow-600 dark:text-yellow-400',
      'baixa': 'text-green-600 dark:text-green-400'
    };
    return colors[priority] || colors['média'];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Casa"
        subtitle="Gerencie suas tarefas domésticas"
        emoji="🏠"
        imageQuery="home,house,cleaning,organization"
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📋 Tarefas de Hoje
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowAIModal(true)}
                disabled={loading}
                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
              >
                <MicrophoneIcon className="h-5 w-5" />
                Adicionar com IA
              </button>
              
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
              >
                <PlusIcon className="h-5 w-5" />
                Manual
              </button>
            </div>
          </div>

          {showAddTask && (
            <div className="mt-6 flex gap-3 animate-fade-in">
              <input
                type="text"
                placeholder="Digite a tarefa..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
              />
              <button
                onClick={handleAddTask}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
              >
                Adicionar
              </button>
            </div>
          )}
        </div>

        {showAIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">🤖</span>
                  Adicionar Tarefas com IA
                </h3>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Descreva suas tarefas de casa de forma natural. A IA vai organizar tudo automaticamente!
              </p>

              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Exemplo: Preciso lavar a louça, limpar o banheiro, passar roupa, fazer compras no mercado e organizar o armário"
                rows="6"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAITaskList}
                  disabled={loading || !aiInput.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <MicrophoneIcon className="h-5 w-5" />
                      Organizar com IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{homeTasks.length}</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Concluídas</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {homeTasks.filter(t => t.completed).length}
              </p>
            </div>
          </div>

          {homeTasks.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">✨</span>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Nenhuma tarefa para hoje
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Adicione tarefas usando IA ou manualmente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {homeTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    task.completed
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-green-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-400 dark:border-gray-500'
                      }`}>
                        {task.completed && <CheckCircleIcon className="h-5 w-5 text-white" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryEmoji(task.category)}</span>
                          <span className={`font-medium ${
                            task.completed 
                              ? 'line-through text-gray-500 dark:text-gray-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {task.category}
                          </span>
                          <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                            • {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mt-6 text-white">
          <div className="flex items-center gap-4">
            <span className="text-4xl">💡</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Dica de IA:</h3>
              <p className="text-sm text-purple-100">
                Quanto mais detalhes você fornecer, melhor a IA vai organizar suas tarefas!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}