import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { generateText } from '../services/gemini';
import { MicrophoneIcon, PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { user } = useAuth();
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [homeTasks, setHomeTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [stats, setStats] = useState({
    studyGoal: '6h/dia',
    objective: 'Graduação',
    exercise: '3-4x',
    budget: '2600'
  });

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
      
      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      
      setHomeTasks(tasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const handleVoiceInput = async () => {
    if (!voiceInput.trim()) return;

    try {
      // Usar Gemini para processar a entrada de voz
      const prompt = `
Você é um assistente que converte frases naturais em eventos de calendário.

Frase do usuário: "${voiceInput}"

Extraia:
- Título do evento
- Data (formato: YYYY-MM-DD, considere hoje como ${new Date().toISOString().split('T')[0]})
- Horário (se mencionado)
- Local (se mencionado)

Responda APENAS em formato JSON válido:
{
  "title": "título",
  "date": "YYYY-MM-DD",
  "time": "HH:MM ou vazio",
  "location": "local ou vazio"
}
`;

      const result = await generateText(prompt);
      const eventData = JSON.parse(result);

      // Adicionar ao Firestore
      await addDoc(collection(db, 'events'), {
        ...eventData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        description: voiceInput
      });

      alert('✅ Evento adicionado ao calendário!');
      setVoiceInput('');
    } catch (error) {
      console.error('Erro ao processar voz:', error);
      alert('❌ Erro ao processar. Tente novamente.');
    }
  };

  const handleVoiceTaskList = async () => {
    const input = prompt('Digite todas as tarefas de casa separadas por vírgula:');
    
    if (!input) return;

    try {
      const prompt = `
Você é um assistente que organiza tarefas domésticas.

Lista: "${input}"

Separe cada tarefa e retorne em formato JSON:
{
  "tasks": ["tarefa 1", "tarefa 2", "tarefa 3"]
}
`;

      const result = await generateText(prompt);
      const data = JSON.parse(result);

      const today = new Date().toISOString().split('T')[0];

      for (const task of data.tasks) {
        await addDoc(collection(db, 'homeTasks'), {
          title: task,
          completed: false,
          date: today,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      loadHomeTasks();
      alert('✅ Tarefas adicionadas!');
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao adicionar tarefas');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      await addDoc(collection(db, 'homeTasks'), {
        title: newTask,
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
    try {
      await deleteDoc(doc(db, 'homeTasks', taskId));
      loadHomeTasks();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-32">
      
      {/* Header com Saudação */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 p-8">
        <h1 className="text-4xl font-bold">Boa noite, {user?.displayName?.split(' ')[0]}! 👋</h1>
        <p className="text-green-100 mt-2">3º Semestre • uesc • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6">
            <div className="text-blue-100 text-sm mb-2">Meta de Estudo</div>
            <div className="text-4xl font-bold">{stats.studyGoal}</div>
            <div className="text-blue-100 text-sm mt-2">Período: Noite</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6">
            <div className="text-purple-100 text-sm mb-2">Objetivo</div>
            <div className="text-4xl font-bold">{stats.objective}</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-2xl p-6">
            <div className="text-green-100 text-sm mb-2">Exercícios</div>
            <div className="text-4xl font-bold">{stats.exercise}</div>
            <div className="text-green-100 text-sm mt-2">Água: 4L/dia</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6">
            <div className="text-orange-100 text-sm mb-2">Orçamento</div>
            <div className="text-4xl font-bold">Definido</div>
            <div className="text-orange-100 text-sm mt-2">{stats.budget}</div>
          </div>
        </div>

        {/* Input de Voz */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Digite como você fala... ex: tenho prova dia 20"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVoiceInput()}
              className="flex-1 px-6 py-4 rounded-xl bg-gray-700 text-white border-2 border-gray-600 focus:border-green-500 focus:outline-none"
            />
            <button
              onClick={handleVoiceInput}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all"
            >
              ➤
            </button>
          </div>
        </div>

        {/* Atividades de Casa */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🏠 ATIVIDADES DE CASA</h2>
            
            <div className="flex gap-3">
              <button
                onClick={handleVoiceTaskList}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <MicrophoneIcon className="h-5 w-5" />
                IA
              </button>
              
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Manual
              </button>
            </div>
          </div>

          {showAddTask && (
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                placeholder="Nova tarefa..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-700 text-white border-2 border-gray-600 focus:border-green-500 focus:outline-none"
              />
              <button
                onClick={handleAddTask}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold"
              >
                Adicionar
              </button>
            </div>
          )}

          <div className="space-y-3">
            {homeTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-6xl mb-4 block">📋</span>
                <p>Nenhuma tarefa para hoje</p>
              </div>
            ) : (
              homeTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    task.completed
                      ? 'bg-green-900/30 border-2 border-green-600'
                      : 'bg-gray-700 border-2 border-gray-600 hover:border-green-500'
                  }`}
                  style={task.completed ? {
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(34, 197, 94, 0.1) 10px, rgba(34, 197, 94, 0.1) 20px)'
                  } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                        task.completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-500'
                      }`}>
                        {task.completed && <CheckCircleIcon className="h-5 w-5 text-white" />}
                      </div>
                      <span className={task.completed ? 'line-through text-gray-400' : ''}>
                        {task.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Banner Motivacional */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">💪</span>
            <div>
              <h3 className="text-2xl font-bold">Continue Focado, {user?.displayName?.split(' ')[0]}!</h3>
              <p className="text-purple-100 mt-1">Cada tarefa concluída te aproxima dos seus objetivos</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}