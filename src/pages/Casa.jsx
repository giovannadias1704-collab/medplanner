import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import PageLayout from '../components/PageLayout';
import {
  MicrophoneIcon, PlusIcon, CheckCircleIcon, TrashIcon, XMarkIcon, StopIcon,
  ClockIcon, ChartBarIcon, BellIcon, UserGroupIcon, CalendarIcon,
  SparklesIcon, ArrowPathIcon, AdjustmentsHorizontalIcon, FunnelIcon,
  PlayIcon, PauseIcon, BookmarkIcon, HomeIcon, ExclamationTriangleIcon,
  CheckIcon, ChevronDownIcon, ChevronUpIcon, FireIcon
} from '@heroicons/react/24/outline';
import { generateText } from '../services/gemini';

// ─── Helpers ────────────────────────────────────────────────────────────────
const ENVIRONMENTS = ['Todos', 'Cozinha', 'Banheiro', 'Sala', 'Quartos', 'Área Externa', 'Lavanderia', 'Outros'];
const FREQUENCIES = ['diária', 'semanal', 'quinzenal', 'mensal', 'personalizada'];
const PRIORITIES = ['alta', 'média', 'baixa'];
const MEMBERS = ['Eu', 'Parceiro(a)', 'Filho(a) 1', 'Filho(a) 2', 'Outro'];

const ENV_EMOJIS = {
  Cozinha: '🍳', Banheiro: '🚿', Sala: '🛋️', Quartos: '🛏️',
  'Área Externa': '🌿', Lavanderia: '👕', Outros: '📌', Todos: '🏠'
};

const FREQ_DAYS = { diária: 1, semanal: 7, quinzenal: 15, mensal: 30 };

const SUBTASK_TEMPLATES = {
  'Limpar banheiro': ['Lavar vaso', 'Lavar pia', 'Limpar espelho', 'Trocar toalhas', 'Limpar chão'],
  'Limpeza cozinha': ['Limpar fogão', 'Limpar bancada', 'Limpar microondas', 'Organizar armários'],
  'Lavar roupa': ['Separar roupas', 'Colocar na máquina', 'Estender', 'Dobrar e guardar'],
};

const TEMPLATES = {
  'Limpeza Rápida': [
    { title: 'Varrer sala', environment: 'Sala', frequency: 'diária', estimatedTime: 10, priority: 'média' },
    { title: 'Limpar bancada cozinha', environment: 'Cozinha', frequency: 'diária', estimatedTime: 5, priority: 'alta' },
    { title: 'Recolher lixo', environment: 'Outros', frequency: 'diária', estimatedTime: 5, priority: 'média' },
  ],
  'Limpeza Semanal': [
    { title: 'Limpar banheiro', environment: 'Banheiro', frequency: 'semanal', estimatedTime: 30, priority: 'alta', subtasks: ['Lavar vaso', 'Lavar pia', 'Limpar espelho', 'Trocar toalhas'] },
    { title: 'Aspirar tapetes', environment: 'Sala', frequency: 'semanal', estimatedTime: 20, priority: 'média' },
    { title: 'Lavar roupa', environment: 'Lavanderia', frequency: 'semanal', estimatedTime: 60, priority: 'alta' },
    { title: 'Limpar geladeira', environment: 'Cozinha', frequency: 'semanal', estimatedTime: 20, priority: 'média' },
  ],
  'Limpeza Mensal': [
    { title: 'Limpar janelas', environment: 'Sala', frequency: 'mensal', estimatedTime: 45, priority: 'baixa' },
    { title: 'Organizar armários', environment: 'Quartos', frequency: 'mensal', estimatedTime: 60, priority: 'baixa' },
    { title: 'Limpar área externa', environment: 'Área Externa', frequency: 'mensal', estimatedTime: 90, priority: 'média' },
  ],
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getNextDueDate(task) {
  if (!task.lastCompleted) return new Date().toISOString().split('T')[0];
  const days = task.customInterval || FREQ_DAYS[task.frequency] || 7;
  const next = new Date(task.lastCompleted);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
}

function isOverdue(task) {
  if (task.completed) return false;
  const nextDue = getNextDueDate(task);
  return nextDue < new Date().toISOString().split('T')[0];
}

function isDueToday(task) {
  if (task.completed) return false;
  const nextDue = getNextDueDate(task);
  return nextDue <= new Date().toISOString().split('T')[0];
}

// ─── AI ─────────────────────────────────────────────────────────────────────
async function generateTasksWithGemini(userInput) {
  const prompt = `Você é um assistente de organização doméstica. O usuário vai falar várias tarefas de casa e você deve organizá-las.

ENTRADA DO USUÁRIO:
"${userInput}"

IMPORTANTE: Retorne APENAS um array JSON válido, sem texto adicional, sem markdown, sem explicações.

FORMATO EXATO:
[
  {"title": "Lavar a louça", "environment": "Cozinha", "priority": "alta", "frequency": "diária", "estimatedTime": 15},
  {"title": "Limpar o banheiro", "environment": "Banheiro", "priority": "média", "frequency": "semanal", "estimatedTime": 30}
]

REGRAS:
- Separe cada tarefa em um objeto
- Use títulos curtos e claros (máximo 50 caracteres)
- Environments válidos: "Cozinha", "Banheiro", "Sala", "Quartos", "Área Externa", "Lavanderia", "Outros"
- Prioridades válidas: "alta", "média", "baixa"
- Frequências válidas: "diária", "semanal", "quinzenal", "mensal"
- estimatedTime em minutos (número inteiro)
- Capitalize a primeira letra de cada tarefa
- Remova duplicadas

Retorne SOMENTE o array JSON, nada mais.`;

  const raw = await generateText(prompt);
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Resposta da IA inválida');
  return JSON.parse(raw.substring(start, end + 1));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl p-4 border-2 border-${color}-200 dark:border-${color}-800`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-sm text-${color}-600 dark:text-${color}-400 font-semibold`}>{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold text-${color}-900 dark:text-${color}-100`}>{value}</p>
    </div>
  );
}

function TimerModal({ task, onClose, onSave }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">⏱ Cronômetro</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">{task.title}</p>
        <div className="text-6xl font-mono font-bold text-purple-600 dark:text-purple-400 mb-2">{fmt(elapsed)}</div>
        <p className="text-xs text-gray-400 mb-6">Estimado: {task.estimatedTime || '?'} min</p>
        <div className="flex gap-3 justify-center mb-4">
          <button onClick={() => setRunning(r => !r)} className={`px-6 py-3 rounded-xl font-bold text-white ${running ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>
            {running ? '⏸ Pausar' : '▶ Iniciar'}
          </button>
          <button onClick={() => { setElapsed(0); setRunning(false); }} className="px-6 py-3 rounded-xl font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300">
            ↺ Reset
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border-2 border-gray-300 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Fechar</button>
          <button onClick={() => onSave(Math.round(elapsed / 60))} className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">
            Salvar {fmt(elapsed)}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onStartTimer, onEditSubtask, onAssign }) {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(task);
  const daysAgo = daysSince(task.lastCompleted);
  const nextDue = getNextDueDate(task);

  const priorityColors = { alta: 'text-red-600 dark:text-red-400', média: 'text-yellow-600 dark:text-yellow-400', baixa: 'text-green-600 dark:text-green-400' };
  const subtasksDone = (task.subtasks || []).filter(s => s.done).length;

  return (
    <div className={`rounded-xl border-2 transition-all ${
      task.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
      : overdue ? 'bg-red-50 dark:bg-red-900/20 border-red-400'
      : 'bg-white dark:bg-gray-750 border-gray-200 dark:border-gray-600 hover:border-purple-400'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={() => onToggle(task)} className={`mt-0.5 w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.completed ? 'bg-green-600 border-green-600' : 'border-gray-400 hover:border-green-500'}`}>
            {task.completed && <CheckIcon className="h-4 w-4 text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{ENV_EMOJIS[task.environment] || '📌'}</span>
              <span className={`font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</span>
              {overdue && !task.completed && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">⚠ Atrasada</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{task.environment}</span>
              <span className={`font-semibold ${priorityColors[task.priority]}`}>● {task.priority}</span>
              <span>🔁 {task.frequency}</span>
              {task.estimatedTime && <span>⏱ {task.estimatedTime}min</span>}
              {task.assignedTo && <span>👤 {task.assignedTo}</span>}
              {daysAgo !== null && <span>✅ há {daysAgo}d</span>}
              {!task.completed && <span className={`${overdue ? 'text-red-500 font-bold' : ''}`}>📅 {nextDue}</span>}
            </div>
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${(subtasksDone / task.subtasks.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{subtasksDone}/{task.subtasks.length}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onStartTimer(task)} title="Cronômetro" className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all">
              <ClockIcon className="h-4 w-4" />
            </button>
            {task.subtasks && task.subtasks.length > 0 && (
              <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
            )}
            <button onClick={() => onDelete(task.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {expanded && task.subtasks && (
        <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-3 space-y-2">
          {task.subtasks.map((sub, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => onEditSubtask(task, i)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${sub.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
                {sub.done && <CheckIcon className="h-3 w-3 text-white" />}
              </button>
              <span className={`text-sm ${sub.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{sub.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddTaskModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', environment: 'Outros', priority: 'média', frequency: 'semanal',
    estimatedTime: '', assignedTo: '', customInterval: '', subtasks: [], notes: ''
  });
  const [subtaskInput, setSubtaskInput] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    set('subtasks', [...form.subtasks, { title: subtaskInput.trim(), done: false }]);
    setSubtaskInput('');
  };

  const applyTemplate = (taskTitle) => {
    const subs = SUBTASK_TEMPLATES[taskTitle];
    if (subs) set('subtasks', subs.map(s => ({ title: s, done: false })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">➕ Nova Tarefa</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título *</label>
            <input value={form.title} onChange={e => { set('title', e.target.value); applyTemplate(e.target.value); }}
              placeholder="Ex: Limpar banheiro" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Ambiente</label>
              <select value={form.environment} onChange={e => set('environment', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
                {ENVIRONMENTS.filter(e => e !== 'Todos').map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Frequência</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tempo Estimado (min)</label>
              <input type="number" value={form.estimatedTime} onChange={e => set('estimatedTime', e.target.value)} placeholder="30" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
          {form.frequency === 'personalizada' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Repetir a cada (dias)</label>
              <input type="number" value={form.customInterval} onChange={e => set('customInterval', e.target.value)} placeholder="10" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Atribuir a (opcional)</label>
            <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
              <option value="">Não atribuída</option>
              {MEMBERS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Subtarefas</label>
            <div className="flex gap-2 mb-2">
              <input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSubtask()} placeholder="Ex: Lavar pia" className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm" />
              <button onClick={addSubtask} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700">+</button>
            </div>
            {form.subtasks.length > 0 && (
              <div className="space-y-1">
                {form.subtasks.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                    <span>•</span><span className="flex-1">{s.title}</span>
                    <button onClick={() => set('subtasks', form.subtasks.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={() => form.title.trim() && onSave(form)} disabled={!form.title.trim()} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50">Salvar Tarefa</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Casa() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeEnv, setActiveEnv] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const recognitionRef = useRef(null);
  const [timerTask, setTimerTask] = useState(null);

  useEffect(() => {
    if (user) loadTasks();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setRecordingSupported(!!SR);
  }, [user]);

  const loadTasks = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'homeTasks');
      const q = query(ref, where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setTasks(data);
    } catch (e) { console.error(e); }
  };

  const saveTask = async (form) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'users', user.uid, 'homeTasks'), {
        ...form,
        estimatedTime: Number(form.estimatedTime) || 0,
        customInterval: Number(form.customInterval) || 0,
        completed: false,
        lastCompleted: null,
        actualTime: null,
        executionHistory: [],
        date: today,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setShowAddModal(false);
      loadTasks();
    } catch (e) { console.error(e); }
  };

  const toggleTask = async (task) => {
    const nowCompleted = !task.completed;
    const today = new Date().toISOString().split('T')[0];
    const history = task.executionHistory || [];
    if (nowCompleted) history.push(today);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'homeTasks', task.id), {
        completed: nowCompleted,
        lastCompleted: nowCompleted ? today : task.lastCompleted,
        executionHistory: history,
      });
      loadTasks();
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Deseja excluir esta tarefa?')) return;
    try { await deleteDoc(doc(db, 'users', user.uid, 'homeTasks', id)); loadTasks(); } catch (e) { console.error(e); }
  };

  const toggleSubtask = async (task, subIndex) => {
    const subs = [...(task.subtasks || [])];
    subs[subIndex] = { ...subs[subIndex], done: !subs[subIndex].done };
    try { await updateDoc(doc(db, 'users', user.uid, 'homeTasks', task.id), { subtasks: subs }); loadTasks(); } catch (e) { console.error(e); }
  };

  const saveTimer = async (task, minutes) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'homeTasks', task.id), { actualTime: minutes });
      setTimerTask(null);
      loadTasks();
    } catch (e) { console.error(e); }
  };

  const applyTemplate = async (templateName) => {
    const taskList = TEMPLATES[templateName];
    if (!taskList) return;
    const today = new Date().toISOString().split('T')[0];
    for (const t of taskList) {
      await addDoc(collection(db, 'users', user.uid, 'homeTasks'), {
        ...t,
        subtasks: (t.subtasks || []).map(s => ({ title: s, done: false })),
        completed: false, lastCompleted: null, actualTime: null,
        executionHistory: [], date: today, userId: user.uid, createdAt: serverTimestamp(),
      });
    }
    setShowTemplateModal(false);
    loadTasks();
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Use o Chrome para reconhecimento de voz.'); return; }
    const r = new SR();
    r.lang = 'pt-BR'; r.continuous = true; r.interimResults = true;
    r.onresult = (e) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setAiInput(t); };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start(); setIsRecording(true);
  };
  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); };
  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  const handleAITaskList = async () => {
    if (!aiInput.trim()) { alert('Por favor, descreva as tarefas!'); return; }
    setLoading(true);
    try {
      const list = await generateTasksWithGemini(aiInput);
      const today = new Date().toISOString().split('T')[0];
      for (const t of list) {
        await addDoc(collection(db, 'users', user.uid, 'homeTasks'), {
          title: t.title, environment: t.environment || 'Outros', priority: t.priority || 'média',
          frequency: t.frequency || 'semanal', estimatedTime: t.estimatedTime || 0,
          subtasks: [], completed: false, lastCompleted: null, actualTime: null,
          executionHistory: [], date: today, userId: user.uid, createdAt: serverTimestamp(),
        });
      }
      await loadTasks();
      setShowAIModal(false); setAiInput('');
      alert(`✅ ${list.length} tarefa(s) adicionada(s)!`);
    } catch (e) { console.error(e); }
  };

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => isDueToday(t) || t.date === today);
  const overdueTasks = tasks.filter(t => isOverdue(t));
  const completedToday = tasks.filter(t => t.lastCompleted === today);
  const weekTasks = tasks.filter(t => {
    const due = getNextDueDate(t);
    const now = new Date();
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
    return due >= today && due <= weekEnd.toISOString().split('T')[0];
  });

  const maintenancePct = tasks.length > 0 ? Math.round(((tasks.length - overdueTasks.length) / tasks.length) * 100) : 100;

  const envOverdue = {};
  overdueTasks.forEach(t => { envOverdue[t.environment] = (envOverdue[t.environment] || 0) + 1; });
  const mostNeglected = Object.entries(envOverdue).sort((a, b) => b[1] - a[1])[0]?.[0];

  const suggestions = [];
  if (mostNeglected) suggestions.push(`${ENV_EMOJIS[mostNeglected]} Ambiente "${mostNeglected}" está mais negligenciado com ${envOverdue[mostNeglected]} tarefa(s) atrasada(s).`);
  tasks.forEach(t => {
    const days = daysSince(t.lastCompleted);
    if (days !== null && days > (t.customInterval || FREQ_DAYS[t.frequency] || 7) * 1.5) {
      suggestions.push(`⏰ Você está há ${days} dias sem "${t.title}".`);
    }
  });
  const todayLong = todayTasks.filter(t => (t.estimatedTime || 0) > 30);
  if (todayLong.length >= 2) suggestions.push(`📅 Hoje tem ${todayLong.length} tarefas longas. Considere redistribuir.`);

  const filtered = tasks.filter(t => {
    const envMatch = activeEnv === 'Todos' || t.environment === activeEnv;
    const priMatch = filterPriority === 'Todas' || t.priority === filterPriority;
    return envMatch && priMatch;
  });

  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: '📊' },
    { id: 'tasks', label: 'Tarefas', icon: '✅' },
    { id: 'history', label: 'Histórico', icon: '📈' },
    { id: 'members', label: 'Membros', icon: '👥' },
  ];

  return (
    <PageLayout
      title="Casa"
      subtitle="Gestão doméstica inteligente"
      emoji="🏠"
      urgentCount={overdueTasks.length}
    >
      <div className="space-y-6">

        {/* Top Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowAIModal(true)} className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg">
            <MicrophoneIcon className="h-5 w-5" /> IA + Voz
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg">
            <PlusIcon className="h-5 w-5" /> Manual
          </button>
          <button onClick={() => setShowTemplateModal(true)} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg">
            <BookmarkIcon className="h-5 w-5" /> Templates
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all ${activeTab === t.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Pendentes Hoje</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{todayTasks.filter(t => !t.completed).length}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">⚠ Atrasadas</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{overdueTasks.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Concluídas Hoje</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{completedToday.length}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Manutenção</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{maintenancePct}%</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">🏠 Saúde da Casa</h3>
                <span className={`text-sm font-bold ${maintenancePct >= 80 ? 'text-green-600' : maintenancePct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{maintenancePct}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div className={`h-3 rounded-full transition-all ${maintenancePct >= 80 ? 'bg-green-500' : maintenancePct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${maintenancePct}%` }} />
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {ENVIRONMENTS.filter(e => e !== 'Todos').map(env => {
                  const envTasks = tasks.filter(t => t.environment === env);
                  const envOverdueCount = envTasks.filter(t => isOverdue(t)).length;
                  const pct = envTasks.length > 0 ? Math.round(((envTasks.length - envOverdueCount) / envTasks.length) * 100) : 100;
                  return (
                    <div key={env} className="text-center">
                      <div className="text-2xl mb-1">{ENV_EMOJIS[env]}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{env}</div>
                      <div className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{envTasks.length > 0 ? `${pct}%` : '-'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 text-white">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><SparklesIcon className="h-5 w-5" /> Sugestões Inteligentes</h3>
                <div className="space-y-2">
                  {suggestions.slice(0, 4).map((s, i) => (
                    <div key={i} className="bg-white/20 rounded-xl px-4 py-2.5 text-sm">{s}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">📅 Próximos 7 Dias ({weekTasks.length})</h3>
              {weekTasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhuma tarefa programada</p>
              ) : (
                <div className="space-y-2">
                  {weekTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <span>{ENV_EMOJIS[t.environment]}</span>
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{t.title}</span>
                      <span className="text-xs text-gray-500">{getNextDueDate(t)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {ENVIRONMENTS.map(e => (
                  <button key={e} onClick={() => setActiveEnv(e)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${activeEnv === e ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100'}`}>
                    {ENV_EMOJIS[e]} {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {['Todas', ...PRIORITIES].map(p => (
                  <button key={p} onClick={() => setFilterPriority(p)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterPriority === p ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{p}</button>
                ))}
              </div>
            </div>

            {overdueTasks.filter(t => (activeEnv === 'Todos' || t.environment === activeEnv)).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2"><ExclamationTriangleIcon className="h-5 w-5" /> Atrasadas</h3>
                {overdueTasks.filter(t => activeEnv === 'Todos' || t.environment === activeEnv).map(t => (
                  <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onStartTimer={setTimerTask} onEditSubtask={toggleSubtask} />
                ))}
              </div>
            )}

            {todayTasks.filter(t => !t.completed && !isOverdue(t) && (activeEnv === 'Todos' || t.environment === activeEnv)).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-blue-600 dark:text-blue-400">📌 Para Hoje</h3>
                {todayTasks.filter(t => !t.completed && !isOverdue(t) && (activeEnv === 'Todos' || t.environment === activeEnv)).map(t => (
                  <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onStartTimer={setTimerTask} onEditSubtask={toggleSubtask} />
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-bold text-gray-700 dark:text-gray-300">Todas as Tarefas ({filtered.length})</h3>
              {filtered.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
                  <span className="text-5xl block mb-3">✨</span>
                  <p className="text-gray-500">Nenhuma tarefa encontrada</p>
                </div>
              ) : (
                filtered.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onStartTimer={setTimerTask} onEditSubtask={toggleSubtask} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">📈 Histórico de Execução</h3>
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma tarefa registrada ainda</p>
              ) : (
                <div className="space-y-3">
                  {tasks.filter(t => t.executionHistory && t.executionHistory.length > 0).map(t => (
                    <div key={t.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{ENV_EMOJIS[t.environment]} {t.title}</span>
                        <span className="text-xs text-gray-500">{t.executionHistory.length}x realizada</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.executionHistory.slice(-10).map((d, i) => (
                          <span key={i} className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">{d}</span>
                        ))}
                      </div>
                      {t.estimatedTime > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Estimado: {t.estimatedTime}min
                          {t.actualTime ? ` • Real: ${t.actualTime}min` : ''}
                          {t.actualTime && t.estimatedTime ? ` • Diferença: ${t.actualTime - t.estimatedTime > 0 ? '+' : ''}${t.actualTime - t.estimatedTime}min` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                  {tasks.filter(t => t.executionHistory && t.executionHistory.length > 0).length === 0 && (
                    <p className="text-gray-500 text-center py-8 text-sm">Conclua tarefas para ver o histórico aqui</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">⏱ Controle de Tempo</h3>
              <div className="space-y-3">
                {tasks.filter(t => t.estimatedTime > 0).map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{t.title}</span>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">Est: {t.estimatedTime}min</span>
                      {t.actualTime && <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded">Real: {t.actualTime}min</span>}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.estimatedTime > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-4 text-sm">Adicione tempo estimado às tarefas</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {MEMBERS.map(member => {
              const memberTasks = tasks.filter(t => t.assignedTo === member);
              const done = memberTasks.filter(t => t.completed).length;
              const overd = memberTasks.filter(t => isOverdue(t)).length;
              return (
                <div key={member} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">👤 {member}</h3>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">{memberTasks.length} tarefas</span>
                      {overd > 0 && <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-1 rounded">⚠ {overd} atrasada(s)</span>}
                      {done > 0 && <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-1 rounded">✅ {done} concluída(s)</span>}
                    </div>
                  </div>
                  {memberTasks.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma tarefa atribuída</p>
                  ) : (
                    <div className="space-y-2">
                      {memberTasks.map(t => (
                        <div key={t.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isOverdue(t) ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                          <span>{ENV_EMOJIS[t.environment]}</span>
                          <span className={`flex-1 ${t.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{t.title}</span>
                          {isOverdue(t) && <span className="text-red-500 text-xs">⚠ atrasada</span>}
                          {t.completed && <span className="text-green-500 text-xs">✅</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-2">💡 Divisão de Responsabilidades</h3>
              <p className="text-sm text-blue-100">Ao criar tarefas, use o campo "Atribuir a" para dividir responsabilidades entre os moradores. O histórico individual ajuda a identificar quem está mais sobrecarregado.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onSave={saveTask} />}

      {timerTask && <TimerModal task={timerTask} onClose={() => setTimerTask(null)} onSave={(mins) => saveTimer(timerTask, mins)} />}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">📋 Templates de Limpeza</h3>
              <button onClick={() => setShowTemplateModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {Object.entries(TEMPLATES).map(([name, list]) => (
                <button key={name} onClick={() => applyTemplate(name)} className="w-full p-4 bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl text-left border-2 border-transparent hover:border-purple-400 transition-all">
                  <div className="font-bold text-gray-900 dark:text-white mb-1">{name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{list.length} tarefas incluídas</div>
                  <div className="text-xs text-gray-400 mt-1">{list.map(t => t.title).join(', ')}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">🤖 Adicionar com IA</h3>
              <button onClick={() => { if (isRecording) stopRecording(); setShowAIModal(false); setAiInput(''); }}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Digite ou fale suas tarefas. A IA organiza automaticamente com ambiente, frequência e prioridade!</p>
            <div className="relative mb-4">
              <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Exemplo: Preciso lavar a louça todo dia, limpar o banheiro toda semana, passar roupa e fazer compras no mercado..." rows="5" className="w-full px-4 py-3 pr-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none" />
              {recordingSupported && (
                <button onClick={toggleRecording} className={`absolute bottom-3 right-3 p-3 rounded-xl transition-all shadow ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                  {isRecording ? <StopIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
                </button>
              )}
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-700 dark:text-red-300">Gravando... Fale suas tarefas</span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { if (isRecording) stopRecording(); setShowAIModal(false); setAiInput(''); }} className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={handleAITaskList} disabled={loading || !aiInput.trim()} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Processando...</> : <><SparklesIcon className="h-5 w-5" />Organizar com IA</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
