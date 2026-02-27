import { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ProgressChart from '../components/ProgressChart';
import InsightCard from '../components/InsightCard';
import { calculateHealthStats } from '../utils/statsCalculator';
import { generateText } from '../services/gemini';
import {
  HeartIcon, FireIcon, ScaleIcon, BeakerIcon, XMarkIcon, PlusIcon,
  CheckCircleIcon, MoonIcon, SunIcon, DocumentIcon, CameraIcon,
  SparklesIcon, ClipboardDocumentListIcon, ChartBarIcon,
  BellIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

// ─── Storage helpers (localStorage fallback for new data types) ──────────────
const ls = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const fmt = (d) => new Date(d).toLocaleDateString('pt-BR');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function timeDiff(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 1440;
  return diff; // minutes
}

function formatDuration(minutes) {
  if (!minutes) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

const SLEEP_QUALITY_LABELS = ['', '😴 Péssimo', '😕 Ruim', '😐 Regular', '😊 Bom', '🌟 Excelente'];
const MEAL_QUALITY = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

// ─── AI Chat Component ────────────────────────────────────────────────────────
function AIAssistant({ healthData, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Olá! Sou seu assistente de saúde. Posso analisar seus dados e responder perguntas como:\n• "Estou dormindo pouco?"\n• "Meu peso está mudando?"\n• "Meu treino está equilibrado?"' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const ctx = JSON.stringify(healthData, null, 2);
      const prompt = `Você é um assistente de saúde pessoal gentil e encorajador. Analise os dados do usuário e responda de forma clara, positiva e sem alarmismo. NÃO faça diagnósticos médicos. Sempre sugira consultar um profissional para questões médicas.

DADOS DO USUÁRIO:
${ctx}

PERGUNTA: ${userMsg}

Responda em português, de forma concisa (máximo 4 parágrafos), use emojis ocasionalmente, e seja encorajador.`;
      const resp = await generateText(prompt);
      setMessages(m => [...m, { role: 'assistant', text: resp }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: '❌ Não consegui processar sua pergunta. Tente novamente.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col h-[85vh] sm:h-[600px]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Assistente de Saúde</h3>
              <p className="text-xs text-gray-500">Powered by IA • Não substitui médico</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><XMarkIcon className="h-5 w-5 text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
              }`}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 rounded-bl-sm">
                <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()}
              placeholder="Pergunte sobre sua saúde..." className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none text-sm" />
            <button onClick={send} disabled={loading || !input.trim()} className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50 hover:from-violet-700 hover:to-purple-700">
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Medication Modal ─────────────────────────────────────────────────────────
function MedModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'diária', times: ['08:00'], type: 'medicamento', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">💊 Novo Medicamento</h3>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Vitamina D" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Dosagem</label>
              <input value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="Ex: 2000 UI" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none">
                <option value="medicamento">💊 Medicamento</option>
                <option value="suplemento">🧴 Suplemento</option>
                <option value="vitamina">🍊 Vitamina</option>
              </select></div>
          </div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Frequência</label>
            <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none">
              {['diária','2x ao dia','3x ao dia','semanal','quando necessário'].map(f => <option key={f}>{f}</option>)}
            </select></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Horário</label>
            <input type="time" value={form.times[0]} onChange={e => set('times', [e.target.value])} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Tomar com água, após refeição..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={() => form.name.trim() && onSave({ ...form, id: uid(), createdAt: today(), adherence: [] })} disabled={!form.name.trim()} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50">Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Exam Upload Modal ────────────────────────────────────────────────────────
function ExamModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', date: today(), nextDate: '', notes: '', fileName: '' });
  const [file, setFile] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); set('fileName', f.name); }
  };

  const save = () => {
    if (!form.name.trim()) return;
    // Store file name + base64 in localStorage for demo (real app would upload to storage)
    const reader = new FileReader();
    if (file) {
      reader.onload = () => onSave({ ...form, id: uid(), fileData: reader.result, createdAt: today() });
      reader.readAsDataURL(file);
    } else {
      onSave({ ...form, id: uid(), createdAt: today() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">📄 Novo Exame</h3>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome do Exame *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Hemograma completo" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Data do Exame</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Repetir em</label>
              <input type="date" value={form.nextDate} onChange={e => set('nextDate', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none" /></div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Anexar PDF</label>
            <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-teal-400 transition-colors">
              <DocumentIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{form.fileName || 'Clique para selecionar PDF'}</span>
              <input type="file" accept=".pdf,image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows="2" placeholder="Resultados relevantes, observações do médico..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none resize-none text-sm" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={save} disabled={!form.name.trim()} className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold disabled:opacity-50">Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sleep Modal ──────────────────────────────────────────────────────────────
function SleepModal({ onClose, onSave }) {
  const [form, setForm] = useState({ date: today(), bedTime: '22:30', wakeTime: '06:30', quality: 3, notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const duration = timeDiff(form.bedTime, form.wakeTime);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">😴 Registrar Sono</h3>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Data</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">🌙 Dormi às</label>
              <input type="time" value={form.bedTime} onChange={e => set('bedTime', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">☀️ Acordei às</label>
              <input type="time" value={form.wakeTime} onChange={e => set('wakeTime', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" /></div>
          </div>
          {duration && (
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatDuration(duration)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">de sono</span>
              {duration < 360 && <p className="text-xs text-red-500 mt-1">⚠ Abaixo de 6h recomendadas</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Qualidade ({SLEEP_QUALITY_LABELS[form.quality]})</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => set('quality', n)} className={`flex-1 py-2 rounded-xl text-lg font-bold border-2 transition-all ${form.quality === n ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Acordei várias vezes, pesadelo..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none text-sm" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={() => onSave({ ...form, id: uid(), duration })} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold">Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Vitals Modal ─────────────────────────────────────────────────────────────
function VitalsModal({ onClose, onSave }) {
  const [form, setForm] = useState({ date: today(), bp_systolic: '', bp_diastolic: '', heartRate: '', glucose: '', saturation: '', waist: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">❤️ Indicadores de Saúde</h3>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800">⚠️ Todos os campos são opcionais. Estes dados são apenas para seu controle pessoal e não substituem avaliação médica.</p>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Data</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" /></div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">🫀 Pressão Arterial (mmHg)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={form.bp_systolic} onChange={e => set('bp_systolic', e.target.value)} placeholder="120" className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" />
              <span className="text-gray-400 font-bold">/</span>
              <input type="number" value={form.bp_diastolic} onChange={e => set('bp_diastolic', e.target.value)} placeholder="80" className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">💓 FC Repouso (bpm)</label>
              <input type="number" value={form.heartRate} onChange={e => set('heartRate', e.target.value)} placeholder="70" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">🩸 Glicemia (mg/dL)</label>
              <input type="number" value={form.glucose} onChange={e => set('glucose', e.target.value)} placeholder="90" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">🫁 Saturação (%)</label>
              <input type="number" value={form.saturation} onChange={e => set('saturation', e.target.value)} placeholder="98" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📏 Cintura (cm)</label>
              <input type="number" value={form.waist} onChange={e => set('waist', e.target.value)} placeholder="80" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Como você se sentia neste momento..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none text-sm" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={() => onSave({ ...form, id: uid() })} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold">Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Health() {
  const {
    workouts, meals, weights, waterLogs, settings,
    addWorkout, addMeal, addWeight, logWater, getWaterIntakeToday
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [waterIntake, setWaterIntake] = useState(0);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [mealPhotoMode, setMealPhotoMode] = useState(false);

  // Local state for new data types
  const [sleepLogs, setSleepLogs] = useState(() => ls.get('sleepLogs'));
  const [vitalsLogs, setVitalsLogs] = useState(() => ls.get('vitalsLogs'));
  const [medications, setMedications] = useState(() => ls.get('medications'));
  const [exams, setExams] = useState(() => ls.get('exams'));

  const healthStats = useMemo(() => calculateHealthStats(waterLogs, workouts, weights, settings), [waterLogs, workouts, weights, settings]);

  const [newWorkout, setNewWorkout] = useState({ title: '', type: 'A', date: today(), completed: false, duration: '', muscleGroup: '' });
  const [newMeal, setNewMeal] = useState({ title: '', type: 'cafe', date: today(), calories: '', quality: 3, photo: '' });
  const [newWeight, setNewWeight] = useState({ weight: '', date: today() });

  useEffect(() => { setWaterIntake(getWaterIntakeToday()); }, [waterLogs]);

  // Persist local data
  useEffect(() => { ls.set('sleepLogs', sleepLogs); }, [sleepLogs]);
  useEffect(() => { ls.set('vitalsLogs', vitalsLogs); }, [vitalsLogs]);
  useEffect(() => { ls.set('medications', medications); }, [medications]);
  useEffect(() => { ls.set('exams', exams); }, [exams]);

  const waterGoal = settings.waterGoal || 2.0;
  const waterPercentage = (waterIntake / waterGoal) * 100;

  const addWater = async (amount) => {
    try { await logWater(amount); setWaterIntake(prev => Math.min(prev + amount, 10)); } catch { alert('Erro ao registrar água'); }
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    try { await addWorkout(newWorkout); setNewWorkout({ title: '', type: 'A', date: today(), completed: false, duration: '', muscleGroup: '' }); setShowWorkoutModal(false); } catch { alert('Erro ao adicionar treino'); }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      await addMeal({ ...newMeal, calories: newMeal.calories ? parseInt(newMeal.calories) : null });
      setNewMeal({ title: '', type: 'cafe', date: today(), calories: '', quality: 3, photo: '' });
      setShowMealModal(false); setMealPhotoMode(false);
    } catch { alert('Erro ao adicionar refeição'); }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    try { await addWeight({ ...newWeight, weight: parseFloat(newWeight.weight) }); setNewWeight({ weight: '', date: today() }); setShowWeightModal(false); } catch { alert('Erro ao registrar peso'); }
  };

  const handleMealPhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setNewMeal(m => ({ ...m, photo: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  // Computed stats for sleep
  const recentSleep = sleepLogs.slice(-7);
  const avgSleep = recentSleep.length > 0 ? Math.round(recentSleep.reduce((s, l) => s + (l.duration || 0), 0) / recentSleep.length) : 0;
  const avgSleepQuality = recentSleep.length > 0 ? (recentSleep.reduce((s, l) => s + l.quality, 0) / recentSleep.length).toFixed(1) : '—';
  const lastSleep = sleepLogs.slice(-1)[0];
  const sleepDeprivation = recentSleep.filter(l => l.duration < 360).length;

  // Computed: IMC
  const lastWeight = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const heightM = (settings.height || 170) / 100;
  const bmi = lastWeight ? (lastWeight.weight / (heightM * heightM)).toFixed(1) : null;
  const bmiLabel = !bmi ? '' : bmi < 18.5 ? 'Abaixo do peso' : bmi < 25 ? 'Peso normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidade';

  // Weekly workout stats
  const thisWeekWorkouts = workouts.filter(w => {
    const d = new Date(w.date);
    const now = new Date();
    const ws = new Date(now.setDate(now.getDate() - now.getDay()));
    return d >= ws;
  });
  const completedWorkouts = thisWeekWorkouts.filter(w => w.completed).length;

  // Sorted
  const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedSleep = [...sleepLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  // AI health context
  const aiHealthData = {
    sono: { ultimosRegistros: recentSleep, mediaHoras: formatDuration(avgSleep), qualidadeMedia: avgSleepQuality, noitesAbaixo6h: sleepDeprivation },
    agua: { hoje: waterIntake + 'L', meta: waterGoal + 'L', mediaUltimos7dias: healthStats.avgWaterPerDay + 'L' },
    treinos: { semanaAtual: completedWorkouts, ultimasSemanas: healthStats.workoutsThisWeek },
    peso: { atual: lastWeight?.weight, imc: bmi, classificacao: bmiLabel },
    alimentacao: { totalRefeicoes: meals.length, ultimasRefeicoes: meals.slice(-5).map(m => m.title) },
    medicamentos: medications.map(m => ({ nome: m.name, frequencia: m.frequency })),
  };

  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: '📊' },
    { id: 'treino', label: 'Treino', icon: '🔥' },
    { id: 'alimentacao', label: 'Alimentação', icon: '🍎' },
    { id: 'agua', label: 'Água', icon: '💧' },
    { id: 'peso', label: 'Peso', icon: '⚖️' },
    { id: 'sono', label: 'Sono', icon: '😴' },
    { id: 'vitais', label: 'Sinais Vitais', icon: '❤️' },
    { id: 'medicamentos', label: 'Remédios', icon: '💊' },
    { id: 'exames', label: 'Exames', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader title="Saúde" subtitle="Monitore seu bem-estar físico" emoji="💪" imageQuery="fitness,gym,health,workout" />

      {/* AI Button floating */}
      <button onClick={() => setShowAI(true)} className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all">
        <SparklesIcon className="h-7 w-7 text-white" />
      </button>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard title="Água Hoje" value={`${healthStats.waterToday}L`} subtitle={`Meta: ${healthStats.waterGoal}L`} icon="💧" color={healthStats.waterGoalPercentage >= 100 ? 'green' : 'blue'} trend={healthStats.waterGoalPercentage >= 100 ? { direction: 'up', value: '100%' } : { direction: 'down', value: `${healthStats.waterGoalPercentage}%` }} />
          <StatsCard title="Treinos (7d)" value={healthStats.workoutsThisWeek} subtitle={`${healthStats.totalWorkoutMinutes} min total`} icon="🔥" color="orange" trend={healthStats.workoutsThisWeek >= 3 ? { direction: 'up', value: 'Ótimo!' } : { direction: 'down', value: 'Baixo' }} />
          <StatsCard title="Sono Médio" value={formatDuration(avgSleep)} subtitle={`Qualidade: ${avgSleepQuality}/5`} icon="😴" color={avgSleep >= 420 ? 'green' : avgSleep >= 360 ? 'yellow' : 'red'} />
          <StatsCard title="IMC" value={bmi || '—'} subtitle={bmiLabel} icon="⚖️" color="purple" />
        </section>

        <section className="mb-6">
          <ProgressChart title="📈 Progresso Semanal" color="green" data={[{ label: 'Treinos', value: healthStats.workoutsThisWeek, unit: 'treinos' }, { label: 'Minutos Ativos', value: healthStats.totalWorkoutMinutes, unit: 'min' }, { label: 'Água/Dia', value: parseFloat(healthStats.avgWaterPerDay), unit: 'L' }]} />
        </section>

        {healthStats.insights?.length > 0 && (
          <section className="mb-6">
            <InsightCard title="💡 Insights de Saúde" insights={healthStats.insights} />
          </section>
        )}

        {/* Sleep deprivation alert */}
        {sleepDeprivation >= 3 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200">Atenção ao sono</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Você dormiu menos de 6h em {sleepDeprivation} das últimas 7 noites. Isso pode afetar seu bem-estar.</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 py-3 px-3 font-semibold text-xs border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                <span>{tab.icon}</span><span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Integrated overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">🏥 Visão Integrada</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Água hoje', value: `${waterIntake.toFixed(1)}L`, icon: '💧', ok: waterPercentage >= 80 },
                  { label: 'Sono ontem', value: lastSleep ? formatDuration(lastSleep.duration) : '—', icon: '😴', ok: lastSleep && lastSleep.duration >= 420 },
                  { label: 'Treinos/sem', value: completedWorkouts, icon: '🔥', ok: completedWorkouts >= 3 },
                  { label: 'Peso atual', value: lastWeight ? `${lastWeight.weight}kg` : '—', icon: '⚖️', ok: true },
                  { label: 'IMC', value: bmi || '—', icon: '📊', ok: bmi && bmi >= 18.5 && bmi < 25 },
                  { label: 'Medicamentos', value: medications.length, icon: '💊', ok: true },
                ].map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border-2 ${item.ok ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'}`}>
                    <div className="flex items-center gap-2 mb-1"><span>{item.icon}</span><span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span></div>
                    <div className="font-bold text-gray-900 dark:text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Correlation insight */}
            {sleepLogs.length >= 3 && weights.length >= 2 && (
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white">
                <h3 className="font-bold mb-2 flex items-center gap-2"><SparklesIcon className="h-5 w-5" /> Correlações Detectadas</h3>
                <p className="text-sm text-violet-100">Seus dados sugerem padrões entre sono, treino e peso. Use o Assistente IA para uma análise personalizada! 🤖</p>
                <button onClick={() => setShowAI(true)} className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all">Analisar com IA →</button>
              </div>
            )}

            {/* Quick adds */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">⚡ Registro Rápido</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sono', icon: '😴', action: () => setShowSleepModal(true) },
                  { label: 'Refeição', icon: '🍎', action: () => setShowMealModal(true) },
                  { label: 'Treino', icon: '🔥', action: () => setShowWorkoutModal(true) },
                  { label: 'Água 300ml', icon: '💧', action: () => addWater(0.3) },
                  { label: 'Peso', icon: '⚖️', action: () => setShowWeightModal(true) },
                  { label: 'Vitais', icon: '❤️', action: () => setShowVitalsModal(true) },
                ].map((item, i) => (
                  <button key={i} onClick={item.action} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming meds */}
            {medications.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">💊 Medicamentos de Hoje</h3>
                <div className="space-y-2">
                  {medications.map(med => (
                    <div key={med.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <span className="text-xl">{med.type === 'vitamina' ? '🍊' : med.type === 'suplemento' ? '🧴' : '💊'}</span>
                      <div className="flex-1"><p className="font-semibold text-sm text-gray-900 dark:text-white">{med.name}</p><p className="text-xs text-gray-500">{med.dosage} • {med.frequency} • {med.times[0]}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TREINO ── */}
        {activeTab === 'treino' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><FireIcon className="h-6 w-6 text-white" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Planejamento de Treinos</h2><p className="text-sm text-gray-600 dark:text-gray-400">Organize sua rotina</p></div>
              </div>
              <button onClick={() => setShowWorkoutModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg font-semibold">
                <PlusIcon className="h-5 w-5" />Adicionar
              </button>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 shadow-lg border-2 border-orange-200 dark:border-orange-800 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3"><span className="text-4xl">🎯</span><h3 className="font-bold text-lg text-gray-900 dark:text-white">Meta Semanal</h3></div>
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{completedWorkouts}/5</span>
              </div>
              <div className="w-full bg-white dark:bg-gray-800 rounded-full h-4 mb-4 shadow-inner">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 h-4 rounded-full transition-all duration-500" style={{ width: `${(completedWorkouts / 5) * 100}%` }} />
              </div>

              {/* Muscle group distribution */}
              {workouts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Grupos musculares (últimos 30 dias):</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(workouts.filter(w => {
                      const d = new Date(w.date);
                      const month = new Date(); month.setDate(month.getDate() - 30);
                      return d >= month;
                    }).reduce((acc, w) => { const g = w.muscleGroup || w.type; acc[g] = (acc[g] || 0) + 1; return acc; }, {})).map(([g, c]) => (
                      <span key={g} className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">{g}: {c}x</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {workouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">🏋️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum Treino Cadastrado</h3>
                <button onClick={() => setShowWorkoutModal(true)} className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg">Adicionar Primeiro Treino</button>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map((treino, index) => (
                  <div key={treino.id} className={`rounded-2xl p-5 shadow-lg border-2 ${treino.completed ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${treino.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>{treino.completed ? '✅' : '🏋️'}</div>
                        <div>
                          <h4 className="text-gray-900 dark:text-white font-bold text-lg">{treino.title} - Treino {treino.type}</h4>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">📅 {fmt(treino.date)}</span>
                            {treino.duration && <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded">⏱ {treino.duration}min</span>}
                            {treino.muscleGroup && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">💪 {treino.muscleGroup}</span>}
                          </div>
                        </div>
                      </div>
                      {treino.completed && <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ALIMENTAÇÃO ── */}
        {activeTab === 'alimentacao' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-2xl">🍎</span></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Registro de Refeições</h2><p className="text-sm text-gray-600 dark:text-gray-400">Acompanhe sua alimentação</p></div>
              </div>
              <button onClick={() => setShowMealModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg font-semibold">
                <PlusIcon className="h-5 w-5" />Adicionar
              </button>
            </div>

            {/* Meal quality summary */}
            {meals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Qualidade da alimentação (últimas refeições)</p>
                <div className="flex gap-1">
                  {meals.slice(-7).map((m, i) => {
                    const q = m.quality || 3;
                    const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'];
                    return <div key={i} title={`${m.title}: ${MEAL_QUALITY[q-1]}`} className={`flex-1 h-8 ${colors[q]} rounded-lg opacity-80`} />;
                  })}
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400"><span>← mais antigas</span><span>mais recentes →</span></div>
              </div>
            )}

            {meals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">🍽️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma Refeição Registrada</h3>
                <button onClick={() => setShowMealModal(true)} className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg">Registrar Primeira Refeição</button>
              </div>
            ) : (
              <div className="space-y-4">
                {meals.map((meal, index) => {
                  const emojis = { cafe: '☕', lanche: '🍪', almoco: '🍽️', janta: '🌙' };
                  const labels = { cafe: 'Café da Manhã', lanche: 'Lanche', almoco: 'Almoço', janta: 'Janta' };
                  return (
                    <div key={meal.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-4">
                        {meal.photo ? (
                          <img src={meal.photo} alt="refeição" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{emojis[meal.type] || '🍴'}</div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{meal.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs text-gray-500">{labels[meal.type]} • {fmt(meal.date)}</span>
                            {meal.quality && <span className="text-xs">{SLEEP_QUALITY_LABELS[meal.quality]}</span>}
                          </div>
                        </div>
                        {meal.calories && <div className="text-right flex-shrink-0"><div className="text-lg font-bold text-primary-600 dark:text-primary-400">{meal.calories}</div><div className="text-xs text-gray-500">kcal</div></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ÁGUA ── */}
        {activeTab === 'agua' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-2xl">💧</span></div>
              <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Consumo de Água Hoje</h2><p className="text-sm text-gray-600 dark:text-gray-400">Mantenha-se hidratado</p></div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 shadow-xl border-2 border-blue-200 dark:border-blue-800 mb-6">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-3">{waterIntake.toFixed(1)}L</div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">de {waterGoal}L (meta diária)</p>
              </div>
              <div className="w-full bg-white dark:bg-gray-800 rounded-full h-5 mb-6 shadow-inner overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-5 rounded-full transition-all duration-500 relative" style={{ width: `${Math.min(waterPercentage, 100)}%` }}>
                  {waterPercentage >= 10 && <span className="absolute right-2 top-0.5 text-xs font-bold text-white">{Math.round(waterPercentage)}%</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['💧', '+ 200ml', 0.2], ['🥤', '+ 300ml', 0.3], ['🍶', '+ 500ml', 0.5]].map(([icon, label, amt]) => (
                  <button key={label} onClick={() => addWater(amt)} className="py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 font-bold shadow-md transition-all">
                    <div className="text-2xl mb-1">{icon}</div>{label}
                  </button>
                ))}
              </div>
            </div>
            {waterPercentage >= 100 && <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg"><div className="text-6xl mb-3">🎉</div><p className="text-green-800 dark:text-green-200 font-bold text-lg">Meta de água atingida!</p></div>}
          </div>
        )}

        {/* ── PESO ── */}
        {activeTab === 'peso' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><ScaleIcon className="h-6 w-6 text-white" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Acompanhamento de Peso</h2></div>
              </div>
              <button onClick={() => setShowWeightModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg"><PlusIcon className="h-5 w-5" />Registrar</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Peso Atual</p>
                <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{sortedWeights[0]?.weight || '—'}kg</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">IMC</p>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{bmi || '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{bmiLabel}</p>
              </div>
            </div>

            {sortedWeights.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">⚖️</div>
                <button onClick={() => setShowWeightModal(true)} className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg">Primeiro Registro</button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedWeights.map((entry, index) => {
                  const prev = sortedWeights[index + 1];
                  const diff = prev ? (entry.weight - prev.weight).toFixed(1) : null;
                  return (
                    <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><span className="text-xl">⚖️</span></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{fmt(entry.date)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {diff && <span className={`text-sm font-bold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-gray-400'}`}>{diff > 0 ? '+' : ''}{diff}kg</span>}
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{entry.weight}kg</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SONO ── */}
        {activeTab === 'sono' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><MoonIcon className="h-6 w-6 text-white" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Controle de Sono</h2><p className="text-sm text-gray-600 dark:text-gray-400">Monitore seu descanso</p></div>
              </div>
              <button onClick={() => setShowSleepModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg"><PlusIcon className="h-5 w-5" />Registrar</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Média (7d)</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{formatDuration(avgSleep)}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-800 text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Qualidade</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{avgSleepQuality}/5</p>
              </div>
              <div className={`rounded-2xl p-4 border-2 text-center ${sleepDeprivation > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                <p className={`text-xs font-semibold ${sleepDeprivation > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>Noites &lt;6h</p>
                <p className={`text-2xl font-bold ${sleepDeprivation > 0 ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>{sleepDeprivation}</p>
              </div>
            </div>

            {/* Sleep history bar chart */}
            {recentSleep.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Últimas noites</p>
                <div className="flex items-end gap-2 h-24">
                  {recentSleep.map((s, i) => {
                    const pct = Math.min((s.duration / 480) * 100, 100);
                    const color = s.duration >= 420 ? 'bg-green-500' : s.duration >= 360 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-400">{formatDuration(s.duration)}</span>
                        <div className="w-full flex items-end" style={{ height: '60px' }}>
                          <div className={`w-full ${color} rounded-t-lg transition-all`} style={{ height: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{new Date(s.date).getDate()}/{new Date(s.date).getMonth()+1}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" />≥7h</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" />6-7h</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" />&lt;6h</span>
                </div>
              </div>
            )}

            {sortedSleep.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">😴</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum Registro de Sono</h3>
                <button onClick={() => setShowSleepModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg">Registrar Sono</button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedSleep.map(entry => (
                  <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-xl">😴</div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{fmt(entry.date)}</p>
                          <p className="text-xs text-gray-500">{entry.bedTime} → {entry.wakeTime} • Qualidade: {SLEEP_QUALITY_LABELS[entry.quality]}</p>
                          {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${entry.duration >= 420 ? 'text-green-600' : entry.duration >= 360 ? 'text-yellow-600' : 'text-red-600'}`}>{formatDuration(entry.duration)}</p>
                        <button onClick={() => setSleepLogs(l => l.filter(s => s.id !== entry.id))} className="text-xs text-red-400 hover:text-red-600 mt-1">excluir</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VITAIS ── */}
        {activeTab === 'vitais' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg"><HeartIcon className="h-6 w-6 text-white" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Sinais Vitais</h2><p className="text-sm text-gray-600 dark:text-gray-400">Monitoramento preventivo</p></div>
              </div>
              <button onClick={() => setShowVitalsModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg"><PlusIcon className="h-5 w-5" />Registrar</button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 mb-5">
              <p className="text-sm text-amber-700 dark:text-amber-300">⚕️ Estes dados são apenas para seu acompanhamento pessoal. Sempre consulte um médico para interpretação clínica.</p>
            </div>

            {vitalsLogs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">❤️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum Registro</h3>
                <button onClick={() => setShowVitalsModal(true)} className="px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold shadow-lg">Primeiro Registro</button>
              </div>
            ) : (
              <div className="space-y-3">
                {[...vitalsLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).map(v => (
                  <div key={v.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{fmt(v.date)}</p>
                      <button onClick={() => setVitalsLogs(l => l.filter(x => x.id !== v.id))} className="text-xs text-red-400 hover:text-red-600">excluir</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {v.bp_systolic && <div className="text-center p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl"><p className="text-xs text-rose-600 dark:text-rose-400">Pressão</p><p className="font-bold text-sm text-gray-900 dark:text-white">{v.bp_systolic}/{v.bp_diastolic}</p></div>}
                      {v.heartRate && <div className="text-center p-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl"><p className="text-xs text-pink-600 dark:text-pink-400">FC Repouso</p><p className="font-bold text-sm text-gray-900 dark:text-white">{v.heartRate} bpm</p></div>}
                      {v.glucose && <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl"><p className="text-xs text-orange-600 dark:text-orange-400">Glicemia</p><p className="font-bold text-sm text-gray-900 dark:text-white">{v.glucose} mg/dL</p></div>}
                      {v.saturation && <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-xs text-blue-600 dark:text-blue-400">Saturação</p><p className="font-bold text-sm text-gray-900 dark:text-white">{v.saturation}%</p></div>}
                      {v.waist && <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl"><p className="text-xs text-purple-600 dark:text-purple-400">Cintura</p><p className="font-bold text-sm text-gray-900 dark:text-white">{v.waist} cm</p></div>}
                    </div>
                    {v.notes && <p className="text-xs text-gray-500 mt-2">{v.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MEDICAMENTOS ── */}
        {activeTab === 'medicamentos' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-2xl">💊</span></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Medicamentos & Suplementos</h2></div>
              </div>
              <button onClick={() => setShowMedModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg"><PlusIcon className="h-5 w-5" />Adicionar</button>
            </div>

            {medications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">💊</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum Medicamento Cadastrado</h3>
                <button onClick={() => setShowMedModal(true)} className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-semibold shadow-lg">Adicionar</button>
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map(med => {
                  const todayDone = med.adherence?.includes(today());
                  return (
                    <div key={med.id} className={`rounded-2xl p-5 shadow border-2 transition-all ${todayDone ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-3xl">
                          {med.type === 'vitamina' ? '🍊' : med.type === 'suplemento' ? '🧴' : '💊'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">{med.name}</h4>
                            {todayDone && <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">✅ Tomado hoje</span>}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{med.dosage} • {med.frequency} • {med.times[0]}</p>
                          {med.notes && <p className="text-xs text-gray-400 mt-1">{med.notes}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setMedications(meds => meds.map(m => m.id === med.id ? { ...m, adherence: todayDone ? m.adherence.filter(d => d !== today()) : [...(m.adherence || []), today()] } : m))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${todayDone ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100'}`}
                          >{todayDone ? '✓ Tomado' : 'Marcar'}</button>
                          <button onClick={() => setMedications(m => m.filter(x => x.id !== med.id))} className="px-3 py-1.5 rounded-xl text-xs bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100">Excluir</button>
                        </div>
                      </div>
                      {/* Adherence last 7 days */}
                      {med.adherence?.length > 0 && (
                        <div className="mt-3 flex gap-1">
                          {Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(); d.setDate(d.getDate() - (6 - i));
                            const ds = d.toISOString().split('T')[0];
                            const done = med.adherence.includes(ds);
                            return <div key={i} title={ds} className={`flex-1 h-2 rounded-full ${done ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── EXAMES ── */}
        {activeTab === 'exames' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg"><DocumentIcon className="h-6 w-6 text-white" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Exames & Check-ups</h2></div>
              </div>
              <button onClick={() => setShowExamModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg"><PlusIcon className="h-5 w-5" />Adicionar</button>
            </div>

            {/* Upcoming alerts */}
            {exams.filter(e => e.nextDate && e.nextDate <= today()).length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 mb-4">
                <p className="font-bold text-amber-800 dark:text-amber-200 mb-2">🔔 Exames a Repetir</p>
                {exams.filter(e => e.nextDate && e.nextDate <= today()).map(e => (
                  <p key={e.id} className="text-sm text-amber-700 dark:text-amber-300">• {e.name} (previsto para {fmt(e.nextDate)})</p>
                ))}
              </div>
            )}

            {exams.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum Exame Registrado</h3>
                <button onClick={() => setShowExamModal(true)} className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold shadow-lg">Adicionar Exame</button>
              </div>
            ) : (
              <div className="space-y-3">
                {[...exams].sort((a, b) => new Date(b.date) - new Date(a.date)).map(exam => (
                  <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📄</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">{exam.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs text-gray-500">Realizado: {fmt(exam.date)}</span>
                          {exam.nextDate && <span className={`text-xs px-2 py-0.5 rounded ${exam.nextDate <= today() ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-600'}`}>Repetir: {fmt(exam.nextDate)}</span>}
                        </div>
                        {exam.notes && <p className="text-xs text-gray-500 mt-1">{exam.notes}</p>}
                        {exam.fileName && <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">📎 {exam.fileName}</p>}
                        {exam.fileData && <a href={exam.fileData} download={exam.fileName} className="text-xs text-blue-600 hover:underline mt-1 block">⬇ Baixar arquivo</a>}
                      </div>
                      <button onClick={() => setExams(e => e.filter(x => x.id !== exam.id))} className="text-red-400 hover:text-red-600 p-1.5"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {showAI && <AIAssistant healthData={aiHealthData} onClose={() => setShowAI(false)} />}
      {showSleepModal && <SleepModal onClose={() => setShowSleepModal(false)} onSave={s => { setSleepLogs(l => [s, ...l]); setShowSleepModal(false); }} />}
      {showVitalsModal && <VitalsModal onClose={() => setShowVitalsModal(false)} onSave={v => { setVitalsLogs(l => [v, ...l]); setShowVitalsModal(false); }} />}
      {showMedModal && <MedModal onClose={() => setShowMedModal(false)} onSave={m => { setMedications(meds => [...meds, m]); setShowMedModal(false); }} />}
      {showExamModal && <ExamModal onClose={() => setShowExamModal(false)} onSave={e => { setExams(ex => [...ex, e]); setShowExamModal(false); }} />}

      {/* Workout Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center"><FireIcon className="h-5 w-5 text-orange-600" /></div>Novo Treino</h3>
              <button onClick={() => setShowWorkoutModal(false)}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddWorkout} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Título</label><input type="text" required value={newWorkout.title} onChange={e => setNewWorkout({ ...newWorkout, title: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Treino de Peito" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo</label><select value={newWorkout.type} onChange={e => setNewWorkout({ ...newWorkout, type: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white">{['A','B','C','D','E'].map(t => <option key={t}>Treino {t}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duração (min)</label><input type="number" value={newWorkout.duration} onChange={e => setNewWorkout({ ...newWorkout, duration: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" placeholder="60" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grupo Muscular</label><input value={newWorkout.muscleGroup} onChange={e => setNewWorkout({ ...newWorkout, muscleGroup: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Peito + Tríceps" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Data</label><input type="date" required value={newWorkout.date} onChange={e => setNewWorkout({ ...newWorkout, date: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" /></div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <input type="checkbox" id="completed" checked={newWorkout.completed} onChange={e => setNewWorkout({ ...newWorkout, completed: e.target.checked })} className="w-5 h-5 text-primary-600 border-gray-300 rounded" />
                <label htmlFor="completed" className="text-sm text-gray-700 dark:text-gray-300 font-medium">✅ Marcar como concluído</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWorkoutModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Modal */}
      {showMealModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">🍎</div>Nova Refeição</h3>
              <button onClick={() => { setShowMealModal(false); setMealPhotoMode(false); }}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddMeal} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">O que você comeu?</label><input type="text" required value={newMeal.title} onChange={e => setNewMeal({ ...newMeal, title: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Frango com batata doce" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo</label><select value={newMeal.type} onChange={e => setNewMeal({ ...newMeal, type: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"><option value="cafe">☕ Café</option><option value="lanche">🍪 Lanche</option><option value="almoco">🍽️ Almoço</option><option value="janta">🌙 Janta</option></select></div>
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Calorias (kcal)</label><input type="number" value={newMeal.calories} onChange={e => setNewMeal({ ...newMeal, calories: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" placeholder="450" /></div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Qualidade ({MEAL_QUALITY[newMeal.quality - 1]})</label>
                <div className="flex gap-2">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setNewMeal(m => ({ ...m, quality: n }))} className={`flex-1 py-2 rounded-xl font-bold border-2 transition-all ${newMeal.quality === n ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-green-300'}`}>{n}</button>)}</div>
              </div>
              {/* Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📷 Foto da Refeição (opcional)</label>
                {newMeal.photo ? (
                  <div className="relative">
                    <img src={newMeal.photo} alt="preview" className="w-full h-32 object-cover rounded-xl" />
                    <button type="button" onClick={() => setNewMeal(m => ({ ...m, photo: '' }))} className="absolute top-2 right-2 bg-black/50 text-white rounded-lg p-1"><XMarkIcon className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-green-400 transition-colors">
                    <CameraIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tirar foto ou galeria</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleMealPhoto} className="hidden" />
                  </label>
                )}
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Data</label><input type="date" required value={newMeal.date} onChange={e => setNewMeal({ ...newMeal, date: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMealModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><ScaleIcon className="h-5 w-5 text-purple-600" /></div>Registrar Peso</h3>
              <button onClick={() => setShowWeightModal(false)}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddWeight} className="space-y-5">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Peso (kg)</label><input type="number" step="0.1" required value={newWeight.weight} onChange={e => setNewWeight({ ...newWeight, weight: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" placeholder="65.5" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Data</label><input type="date" required value={newWeight.date} onChange={e => setNewWeight({ ...newWeight, date: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWeightModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}