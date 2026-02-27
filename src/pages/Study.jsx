import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import PremiumBlock from '../components/PremiumBlock';
import LimitReached from '../components/LimitReached';
import PageHeader from '../components/PageHeader';
import { generateText } from '../services/gemini';
import {
  AcademicCapIcon, ClockIcon, ChartBarIcon, BeakerIcon,
  QuestionMarkCircleIcon, BookOpenIcon, ClipboardDocumentCheckIcon,
  PlusIcon, XMarkIcon, TrashIcon, DocumentIcon, CameraIcon,
  CheckCircleIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon,
  PlayIcon, PauseIcon, StopIcon, ArrowPathIcon, FireIcon,
  LightBulbIcon, PencilIcon, StarIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import StudyQuestionnaire from '../components/study/StudyQuestionnaire';
import StudyPlanning from '../components/study/StudyPlanning';
import StudyPBL from '../components/study/StudyPBL';
import StudyTimer from '../components/study/StudyTimer';
import StudyProgress from '../components/study/StudyProgress';
import StudyQuestions from '../components/study/StudyQuestions';
import StudyReview from '../components/study/StudyReview';
import StudyWeeklyEval from '../components/study/StudyWeeklyEval';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayStr = () => new Date().toISOString().split('T')[0];
const ls = {
  get: (k, fb = []) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const fmt = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const addDays = (dateStr, n) => { const d = new Date(dateStr); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

const CONTENT_STATUS = ['Não estudado', 'Estudado', 'Revisão pendente', 'Consolidado'];
const STATUS_COLORS = {
  'Não estudado': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  'Estudado': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'Revisão pendente': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'Consolidado': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
};
const SPACINGS = [1, 7, 30]; // days
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const COGNITIVE_TECHNIQUES = ['Flashcard', 'Resumo', 'Fichamento', 'Feynman', 'Mapa Mental', 'Questões'];

// ─── PDF/Image AI Processor ───────────────────────────────────────────────────
async function processFileWithAI(fileData, fileType, context) {
  const isImage = fileType.startsWith('image/');
  const prompt = `Você é um assistente acadêmico especializado. Analise o conteúdo ${isImage ? 'da imagem' : 'do documento'} e extraia as informações relevantes para uso em um sistema de gestão de estudos.

CONTEXTO: ${context}

Por favor, retorne um JSON com as informações identificadas. Seja preciso e conciso.

Se for um plano de estudos/cronograma: extraia disciplinas, datas, carga horária.
Se for material de estudo: extraia tópicos, conceitos-chave, referências.
Se for uma prova/avaliação: extraia data, disciplina, conteúdos cobrados, questões/nota se disponível.
Se for um caso clínico: extraia queixa principal, histórico, dados, hipóteses diagnósticas.
Se for um horário: extraia disciplinas, professores, dias e horários.

Retorne APENAS JSON válido, sem markdown.`;

  try {
    const raw = await generateText(prompt);
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    if (s !== -1 && e !== -1) return JSON.parse(raw.substring(s, e + 1));
    return { raw: raw.substring(0, 500) };
  } catch { return null; }
}

// ─── File Upload Button ───────────────────────────────────────────────────────
function FileUploadButton({ onResult, context = 'material de estudo', label = 'Importar PDF/Foto', color = 'purple' }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = await processFileWithAI(ev.target.result, file.type, context);
        onResult(result, file.name, ev.target.result);
        setLoading(false);
      };
      if (file.type === 'application/pdf') reader.readAsDataURL(file);
      else reader.readAsDataURL(file);
    } catch { setLoading(false); }
    e.target.value = '';
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept=".pdf,image/*" onChange={handleFile} className="hidden" />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2.5 bg-${color}-600 hover:bg-${color}-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow`}
      >
        {loading ? <><ArrowPathIcon className="h-4 w-4 animate-spin" />Analisando...</> : <><SparklesIcon className="h-4 w-4" />{label}</>}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MODULE: DISCIPLINAS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function DisciplinasModule({ userId }) {
  const [disciplines, setDisciplines] = useState(() => ls.get(`disciplines_${userId}`));
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', professor: '', weeklyHours: '', weight: '', color: '#6366f1', difficulty: 3 });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { ls.set(`disciplines_${userId}`, disciplines); }, [disciplines]);

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setDisciplines(d => d.map(x => x.id === editing ? { ...x, ...form } : x));
    } else {
      setDisciplines(d => [...d, { ...form, id: uid(), createdAt: todayStr(), studyHours: 0, topics: [] }]);
    }
    setShowModal(false); setEditing(null);
    setForm({ name: '', professor: '', weeklyHours: '', weight: '', color: '#6366f1', difficulty: 3 });
  };

  const handleImport = (result, fileName) => {
    if (!result) return;
    const suggestions = [];
    if (result.disciplinas) result.disciplinas.forEach(d => suggestions.push({ name: d.nome || d, professor: d.professor || '', weeklyHours: d.cargaHoraria || d.horas || '' }));
    else if (result.horarios) result.horarios.forEach(h => suggestions.push({ name: h.disciplina, professor: h.professor || '', weeklyHours: h.horas || '' }));
    if (suggestions.length > 0) {
      suggestions.forEach(s => setDisciplines(d => [...d, { ...s, id: uid(), color: '#6366f1', weight: '', difficulty: 3, createdAt: todayStr(), studyHours: 0, topics: [] }]));
      alert(`✅ ${suggestions.length} disciplina(s) importada(s) de "${fileName}"`);
    } else {
      alert('📋 Não foi possível identificar disciplinas automaticamente. Verifique o arquivo.');
    }
  };

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">📚 Disciplinas / Módulos</h2>
        <div className="flex gap-2">
          <FileUploadButton onResult={handleImport} context="horário acadêmico ou grade curricular" label="Importar" color="indigo" />
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow">
            <PlusIcon className="h-4 w-4" />Adicionar
          </button>
        </div>
      </div>

      {disciplines.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhuma disciplina cadastrada</h3>
          <p className="text-gray-500 text-sm mb-5">Adicione suas matérias ou importe um horário (PDF/foto)</p>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">Adicionar Disciplina</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {disciplines.map(disc => (
            <div key={disc.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border-l-4 border border-gray-200 dark:border-gray-700" style={{ borderLeftColor: disc.color }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{disc.name}</h3>
                  {disc.professor && <p className="text-xs text-gray-500 mt-0.5">👤 {disc.professor}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(disc.id); setForm(disc); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => { if (window.confirm('Excluir?')) setDisciplines(d => d.filter(x => x.id !== disc.id)); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                  <p className="text-xs text-gray-500">Carga</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{disc.weeklyHours || '—'}h/sem</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                  <p className="text-xs text-gray-500">Peso</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{disc.weight || '—'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                  <p className="text-xs text-gray-500">Dific.</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{disc.difficulty}/5</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Editar' : 'Nova'} Disciplina</h3>
              <button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome *</label><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ex: Fisiologia" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Professor</label><input value={form.professor} onChange={e => setF('professor', e.target.value)} placeholder="Nome do professor" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Carga (h/sem)</label><input type="number" value={form.weeklyHours} onChange={e => setF('weeklyHours', e.target.value)} placeholder="4" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Peso na média</label><input type="number" step="0.5" value={form.weight} onChange={e => setF('weight', e.target.value)} placeholder="1.5" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dificuldade: {form.difficulty}/5</label><input type="range" min="1" max="5" value={form.difficulty} onChange={e => setF('difficulty', parseInt(e.target.value))} className="w-full" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cor</label><div className="flex gap-2">{COLORS.map(c => <button key={c} type="button" onClick={() => setF('color', c)} className={`w-8 h-8 rounded-full border-4 transition-all ${form.color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />)}</div></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={save} disabled={!form.name.trim()} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MODULE: PLANEJAMENTO SEMANAL + METAS ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function PlanejamentoModule({ userId, studyConfig }) {
  const [weekPlan, setWeekPlan] = useState(() => ls.get(`weekPlan_${userId}`, {}));
  const [goals, setGoals] = useState(() => ls.get(`studyGoals_${userId}`, { daily: 2, weekly: 12, byDiscipline: {} }));
  const [sessions, setSessions] = useState(() => ls.get(`studySessions_${userId}`));
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [blockForm, setBlockForm] = useState({ discipline: '', hours: 1, time: '08:00', technique: '' });

  useEffect(() => { ls.set(`weekPlan_${userId}`, weekPlan); }, [weekPlan]);
  useEffect(() => { ls.set(`studyGoals_${userId}`, goals); }, [goals]);

  const disciplines = ls.get(`disciplines_${userId}`);

  // Totals
  const totalPlanned = Object.values(weekPlan).flat().reduce((s, b) => s + (b.hours || 0), 0);
  const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; })();
  const realHoursThisWeek = sessions.filter(s => s.date >= weekStart).reduce((s, x) => s + (x.duration || 0) / 60, 0);
  const adherence = totalPlanned > 0 ? Math.min(Math.round((realHoursThisWeek / totalPlanned) * 100), 100) : 0;

  const addBlock = () => {
    const day = selectedDay;
    setWeekPlan(p => ({ ...p, [day]: [...(p[day] || []), { ...blockForm, id: uid() }] }));
    setShowBlockModal(false);
    setBlockForm({ discipline: '', hours: 1, time: '08:00', technique: '' });
  };

  const removeBlock = (day, blockId) => {
    setWeekPlan(p => ({ ...p, [day]: (p[day] || []).filter(b => b.id !== blockId) }));
  };

  const handleImport = (result, fileName) => {
    if (!result) return;
    const newPlan = { ...weekPlan };
    if (result.cronograma || result.planejamento || result.blocos) {
      const items = result.cronograma || result.planejamento || result.blocos || [];
      items.forEach(item => {
        const day = item.dia !== undefined ? item.dia : 1;
        const key = typeof day === 'string' ? DAYS_OF_WEEK.findIndex(d => d === day) : day;
        if (key >= 0) {
          newPlan[key] = [...(newPlan[key] || []), { id: uid(), discipline: item.disciplina || item.materia || '', hours: item.horas || 1, time: item.horario || '08:00', technique: '' }];
        }
      });
      setWeekPlan(newPlan);
      alert(`✅ Plano importado de "${fileName}"`);
    } else {
      alert('📋 Não foi possível identificar o cronograma. Tente com uma imagem mais clara.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Goals */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">🎯 Metas de Estudo</h3>
          <button onClick={() => setShowGoalModal(true)} className="text-sm text-purple-600 hover:text-purple-700 font-semibold">Editar</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400">Meta diária</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{goals.daily}h</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400">Meta semanal</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{goals.weekly}h</p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${adherence >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
            <p className={`text-xs ${adherence >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>Aderência</p>
            <p className={`text-2xl font-bold ${adherence >= 80 ? 'text-emerald-900 dark:text-emerald-100' : 'text-amber-900 dark:text-amber-100'}`}>{adherence}%</p>
          </div>
        </div>
        {/* Real vs planned */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Realizado: {realHoursThisWeek.toFixed(1)}h</span>
            <span>Planejado: {totalPlanned}h</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <div className={`h-2 rounded-full transition-all ${adherence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${adherence}%` }} />
          </div>
        </div>
      </div>

      {/* Weekly planner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">🗓️ Planejamento Semanal</h3>
          <FileUploadButton onResult={handleImport} context="cronograma ou plano de estudos semanal" label="Importar cronograma" color="purple" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day, idx) => (
            <div key={day} className="min-h-24">
              <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg">{day}</div>
              <div className="space-y-1">
                {(weekPlan[idx] || []).map(block => (
                  <div key={block.id} className="relative group bg-purple-100 dark:bg-purple-900/30 rounded-lg p-1.5 text-xs">
                    <p className="font-semibold text-purple-800 dark:text-purple-200 truncate">{block.discipline}</p>
                    <p className="text-purple-600 dark:text-purple-400">{block.time} • {block.hours}h</p>
                    <button onClick={() => removeBlock(idx, block.id)} className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => { setSelectedDay(idx); setShowBlockModal(true); }} className="w-full py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-all text-xs">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add block modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Bloco de Estudo — {DAYS_OF_WEEK[selectedDay]}</h3>
              <button onClick={() => setShowBlockModal(false)}><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Disciplina</label>
                <select value={blockForm.discipline} onChange={e => setBlockForm(f => ({ ...f, discipline: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm">
                  <option value="">Selecione...</option>
                  {disciplines.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  <option value="Revisão geral">Revisão geral</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Horário</label><input type="time" value={blockForm.time} onChange={e => setBlockForm(f => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Horas</label><input type="number" step="0.5" min="0.5" max="8" value={blockForm.hours} onChange={e => setBlockForm(f => ({ ...f, hours: parseFloat(e.target.value) }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Técnica</label>
                <select value={blockForm.technique} onChange={e => setBlockForm(f => ({ ...f, technique: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm">
                  <option value="">Livre</option>
                  {COGNITIVE_TECHNIQUES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBlockModal(false)} className="flex-1 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button>
              <button onClick={addBlock} className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Goals modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Editar Metas</h3>
              <button onClick={() => setShowGoalModal(false)}><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Meta diária (horas)</label><input type="number" step="0.5" value={goals.daily} onChange={e => setGoals(g => ({ ...g, daily: parseFloat(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Meta semanal (horas)</label><input type="number" step="0.5" value={goals.weekly} onChange={e => setGoals(g => ({ ...g, weekly: parseFloat(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowGoalModal(false)} className="flex-1 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button>
              <button onClick={() => setShowGoalModal(false)} className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MODULE: CONTEÚDOS + REVISÃO ESPAÇADA ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function ConteudosModule({ userId }) {
  const [topics, setTopics] = useState(() => ls.get(`studyTopics_${userId}`));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ discipline: '', title: '', status: 'Não estudado', notes: '', technique: '' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const disciplines = ls.get(`disciplines_${userId}`);
  const today = todayStr();

  useEffect(() => { ls.set(`studyTopics_${userId}`, topics); }, [topics]);

  const markStudied = (id) => {
    setTopics(t => t.map(x => x.id === id ? {
      ...x,
      status: 'Estudado',
      lastStudied: today,
      nextReviews: SPACINGS.map(d => addDays(today, d)),
      reviewsDone: [],
    } : x));
  };

  const markReview = (topicId, reviewIdx) => {
    setTopics(t => t.map(x => {
      if (x.id !== topicId) return x;
      const done = [...(x.reviewsDone || []), reviewIdx];
      const allDone = done.length >= SPACINGS.length;
      return { ...x, reviewsDone: done, status: allDone ? 'Consolidado' : 'Revisão pendente' };
    }));
  };

  const pendingReview = topics.filter(t => {
    if (!t.nextReviews) return false;
    const nextPending = t.nextReviews.find((d, i) => !(t.reviewsDone || []).includes(i) && d <= today);
    return !!nextPending;
  });

  const save = () => {
    if (!form.title.trim()) return;
    setTopics(t => [...t, { ...form, id: uid(), createdAt: today, lastStudied: null, nextReviews: null, reviewsDone: [] }]);
    setShowModal(false);
    setForm({ discipline: '', title: '', status: 'Não estudado', notes: '', technique: '' });
  };

  const handleImport = (result, fileName) => {
    if (!result) return;
    const items = result.topicos || result.conteudos || result.temas || [];
    if (items.length > 0) {
      items.forEach(item => setTopics(t => [...t, {
        id: uid(), discipline: item.disciplina || form.discipline || '',
        title: typeof item === 'string' ? item : (item.titulo || item.nome || item),
        status: 'Não estudado', notes: item.notas || '', technique: '',
        createdAt: today, lastStudied: null, nextReviews: null, reviewsDone: [],
      }]));
      alert(`✅ ${items.length} tópico(s) importado(s) de "${fileName}"`);
    } else {
      alert('📋 Nenhum tópico identificado. Tente uma lista mais clara de conteúdos.');
    }
  };

  const byStatus = CONTENT_STATUS.reduce((acc, s) => { acc[s] = topics.filter(t => t.status === s); return acc; }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">📋 Conteúdos & Revisão Espaçada</h2>
        <div className="flex gap-2">
          <FileUploadButton onResult={handleImport} context="lista de conteúdos ou ementa de disciplina" label="Importar conteúdos" color="blue" />
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow">
            <PlusIcon className="h-4 w-4" />Adicionar
          </button>
        </div>
      </div>

      {/* Pending reviews alert */}
      {pendingReview.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4">
          <p className="font-bold text-amber-800 dark:text-amber-200 mb-2">🔔 {pendingReview.length} revisão(ões) pendente(s) hoje!</p>
          <div className="space-y-1">
            {pendingReview.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700 dark:text-amber-300">{t.title}</span>
                <button onClick={() => markReview(t.id, (t.reviewsDone || []).length)} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600">Revisar ✓</button>
              </div>
            ))}
            {pendingReview.length > 3 && <p className="text-xs text-amber-600">+{pendingReview.length - 3} mais...</p>}
          </div>
        </div>
      )}

      {/* Status overview */}
      <div className="grid grid-cols-4 gap-2">
        {CONTENT_STATUS.map(s => (
          <div key={s} className={`${STATUS_COLORS[s]} rounded-xl p-3 text-center`}>
            <p className="text-xs font-semibold opacity-70">{s}</p>
            <p className="text-2xl font-bold">{byStatus[s]?.length || 0}</p>
          </div>
        ))}
      </div>

      {/* Topics list */}
      {topics.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Nenhum conteúdo cadastrado</h3>
          <p className="text-gray-500 text-sm">Adicione tópicos ou importe uma ementa</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map(topic => {
            const reviewsDone = topic.reviewsDone?.length || 0;
            const totalReviews = SPACINGS.length;
            return (
              <div key={topic.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">{topic.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[topic.status]}`}>{topic.status}</span>
                      {topic.discipline && <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{topic.discipline}</span>}
                    </div>
                    {topic.notes && <p className="text-xs text-gray-500 mb-2">{topic.notes}</p>}
                    {topic.lastStudied && (
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Estudado: {fmt(topic.lastStudied)}</span>
                        {topic.nextReviews && (
                          <div className="flex gap-1">
                            {SPACINGS.map((d, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded-full ${(topic.reviewsDone || []).includes(i) ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : topic.nextReviews[i] <= todayStr() ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                {d === 1 ? '1d' : d === 7 ? '7d' : '30d'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {topic.status === 'Não estudado' && (
                      <button onClick={() => markStudied(topic.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Estudei ✓</button>
                    )}
                    {topic.status === 'Revisão pendente' && (
                      <button onClick={() => markReview(topic.id, reviewsDone)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600">Revisei ✓</button>
                    )}
                    <button onClick={() => setTopics(t => t.filter(x => x.id !== topic.id))} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-xs hover:bg-red-100">Excluir</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Novo Conteúdo</h3>
              <button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tópico *</label><input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Ex: Fisiologia renal" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Disciplina</label>
                <select value={form.discipline} onChange={e => setF('discipline', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
                  <option value="">Selecionar...</option>
                  {disciplines.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Técnica de estudo</label>
                <select value={form.technique} onChange={e => setF('technique', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
                  <option value="">Livre</option>
                  {COGNITIVE_TECHNIQUES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notas</label><textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows="2" className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button>
              <button onClick={save} disabled={!form.title.trim()} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MODULE: PROVAS E AVALIAÇÕES ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function ProvasModule({ userId }) {
  const [exams, setExams] = useState(() => ls.get(`studyExams_${userId}`));
  const [showModal, setShowModal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(null);
  const [form, setForm] = useState({ discipline: '', date: todayStr(), grade: '', totalGrade: '', contents: '', mistakes: '', reasons: '', correctionPlan: '' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const disciplines = ls.get(`disciplines_${userId}`);

  useEffect(() => { ls.set(`studyExams_${userId}`, exams); }, [exams]);

  const handleImport = (result, fileName, fileData) => {
    if (!result) return;
    const newExam = {
      id: uid(),
      discipline: result.disciplina || result.materia || '',
      date: result.data || todayStr(),
      grade: result.nota || result.pontuacao || '',
      totalGrade: result.total || result.notaTotal || '10',
      contents: result.conteudos || result.topicos?.join(', ') || '',
      mistakes: result.erros || '',
      reasons: '',
      correctionPlan: '',
      fileName, fileData,
      createdAt: todayStr(),
    };
    setExams(e => [...e, newExam]);
    alert(`✅ Prova importada de "${fileName}"`);
  };

  const save = () => {
    if (!form.discipline.trim() || !form.date) return;
    setExams(e => [...e, { ...form, id: uid(), createdAt: todayStr() }]);
    setShowModal(false);
    setForm({ discipline: '', date: todayStr(), grade: '', totalGrade: '', contents: '', mistakes: '', reasons: '', correctionPlan: '' });
  };

  const avgGrade = exams.length > 0 ? (exams.filter(e => e.grade && e.totalGrade).reduce((s, e) => s + (parseFloat(e.grade) / parseFloat(e.totalGrade)) * 10, 0) / exams.filter(e => e.grade && e.totalGrade).length).toFixed(1) : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">📝 Provas & Avaliações</h2>
        <div className="flex gap-2">
          <FileUploadButton onResult={handleImport} context="prova, gabarito ou resultado de avaliação" label="Importar prova" color="rose" />
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow">
            <PlusIcon className="h-4 w-4" />Adicionar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500">Total de provas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{exams.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500">Média geral</p>
          <p className={`text-2xl font-bold ${parseFloat(avgGrade) >= 7 ? 'text-emerald-600' : parseFloat(avgGrade) >= 5 ? 'text-amber-600' : 'text-red-600'}`}>{avgGrade}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500">Com análise</p>
          <p className="text-2xl font-bold text-purple-600">{exams.filter(e => e.correctionPlan).length}</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-gray-500 text-sm">Nenhuma prova registrada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...exams].sort((a, b) => new Date(b.date) - new Date(a.date)).map(exam => {
            const pct = exam.grade && exam.totalGrade ? Math.round((parseFloat(exam.grade) / parseFloat(exam.totalGrade)) * 100) : null;
            return (
              <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0 ${!pct ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : pct >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : pct >= 50 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700'}`}>
                    {exam.grade ? `${exam.grade}` : '—'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 dark:text-white">{exam.discipline}</h4>
                      {pct !== null && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{pct}%</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">📅 {fmt(exam.date)}</p>
                    {exam.contents && <p className="text-xs text-gray-500 mt-1 truncate">📚 {exam.contents}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAnalysis(exam.id === showAnalysis ? null : exam.id)} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-semibold hover:bg-purple-100">
                      {showAnalysis === exam.id ? 'Fechar' : 'Analisar'}
                    </button>
                    <button onClick={() => setExams(e => e.filter(x => x.id !== exam.id))} className="p-1.5 text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>

                {showAnalysis === exam.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                    <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">📊 Análise Pós-Prova</h5>
                    {[
                      { label: '❌ Onde errei?', key: 'mistakes', ph: 'Tópicos ou questões onde houve erros...' },
                      { label: '🤔 Por quê?', key: 'reasons', ph: 'Falta de revisão? Conceito mal compreendido? Tempo?' },
                      { label: '📋 Plano de correção', key: 'correctionPlan', ph: 'O que farei para melhorar...' },
                    ].map(item => (
                      <div key={item.key}>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{item.label}</label>
                        <textarea value={exam[item.key] || ''} onChange={e => setExams(exs => exs.map(x => x.id === exam.id ? { ...x, [item.key]: e.target.value } : x))}
                          placeholder={item.ph} rows="2"
                          className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none text-xs" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nova Avaliação</h3>
              <button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Disciplina *</label>
                <select value={form.discipline} onChange={e => setF('discipline', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
                  <option value="">Selecionar...</option>
                  {disciplines.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  <option value="Outra">Outra</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Data</label><input type="date" value={form.date} onChange={e => setF('date', e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nota</label><input type="number" step="0.5" value={form.grade} onChange={e => setF('grade', e.target.value)} placeholder="8.5" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nota máx.</label><input type="number" step="0.5" value={form.totalGrade} onChange={e => setF('totalGrade', e.target.value)} placeholder="10" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none text-sm" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Conteúdos cobrados</label><textarea value={form.contents} onChange={e => setF('contents', e.target.value)} rows="2" placeholder="Tópicos da prova..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button>
              <button onClick={save} disabled={!form.discipline.trim()} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MODULE: PERFORMANCE ANALYTICS ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function PerformanceModule({ userId }) {
  const sessions = ls.get(`studySessions_${userId}`);
  const exams = ls.get(`studyExams_${userId}`);
  const topics = ls.get(`studyTopics_${userId}`);
  const disciplines = ls.get(`disciplines_${userId}`);
  const goals = ls.get(`studyGoals_${userId}`, { daily: 2, weekly: 12 });

  // Wellness data (from Wellness module)
  const wellnessEntries = ls.get('wellnessEntries_wellness', []);

  const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; })();
  const weekSessions = sessions.filter(s => s.date >= weekStart);
  const weekHours = weekSessions.reduce((s, x) => s + (x.duration || 0) / 60, 0);

  // Hours by discipline
  const hoursByDisc = sessions.reduce((acc, s) => { if (s.discipline) acc[s.discipline] = (acc[s.discipline] || 0) + (s.duration || 0) / 60; return acc; }, {});
  const sortedDiscs = Object.entries(hoursByDisc).sort((a, b) => b[1] - a[1]);
  const maxDiscHours = sortedDiscs[0]?.[1] || 1;

  // Most/least studied
  const mostStudied = sortedDiscs[0]?.[0] || '—';
  const leastStudied = disciplines.length > 0 ? disciplines.reduce((min, d) => (hoursByDisc[d.name] || 0) < (hoursByDisc[min?.name] || 0) ? d : min, disciplines[0])?.name : '—';

  // Avg grade
  const gradeEntries = exams.filter(e => e.grade && e.totalGrade);
  const avgGrade = gradeEntries.length > 0 ? (gradeEntries.reduce((s, e) => s + (parseFloat(e.grade) / parseFloat(e.totalGrade)) * 10, 0) / gradeEntries.length).toFixed(1) : null;

  // Consolidation rate
  const consolidatedPct = topics.length > 0 ? Math.round((topics.filter(t => t.status === 'Consolidado').length / topics.length) * 100) : 0;

  // Consistency: how many days studied in last 14
  const studyDays = new Set(sessions.map(s => s.date));
  const last14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0]; });
  const consistency = Math.round((last14.filter(d => studyDays.has(d)).length / 14) * 100);

  // Correlations: sleep vs performance
  const correlations = wellnessEntries.filter(e => e.sleepHours > 0).map(w => {
    const dayExam = exams.find(e => e.date === w.date?.split('T')[0]);
    const daySessions = sessions.filter(s => s.date === w.date?.split('T')[0]);
    return {
      date: w.date,
      sleep: w.sleepHours,
      mood: w.mood,
      studyHours: daySessions.reduce((s, x) => s + (x.duration || 0) / 60, 0),
    };
  }).filter(c => c.studyHours > 0);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">📊 Análise de Performance</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Horas esta semana', value: `${weekHours.toFixed(1)}h`, sub: `Meta: ${goals.weekly}h`, color: weekHours >= goals.weekly ? 'emerald' : 'amber' },
          { label: 'Consistência (14d)', value: `${consistency}%`, sub: 'dias com estudo', color: consistency >= 60 ? 'emerald' : 'rose' },
          { label: 'Taxa consolidação', value: `${consolidatedPct}%`, sub: `${topics.filter(t => t.status === 'Consolidado').length}/${topics.length} tópicos`, color: consolidatedPct >= 50 ? 'emerald' : 'amber' },
          { label: 'Média geral', value: avgGrade ? `${avgGrade}/10` : '—', sub: `${gradeEntries.length} provas`, color: !avgGrade || parseFloat(avgGrade) >= 7 ? 'emerald' : 'rose' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20 rounded-2xl p-4 border border-${kpi.color}-200 dark:border-${kpi.color}-800 text-center`}>
            <p className={`text-xs text-${kpi.color}-600 dark:text-${kpi.color}-400 font-semibold`}>{kpi.label}</p>
            <p className={`text-2xl font-bold text-${kpi.color}-900 dark:text-${kpi.color}-100`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Hours by discipline */}
      {sortedDiscs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">📚 Horas por Disciplina (total)</h3>
          <div className="space-y-3">
            {sortedDiscs.map(([name, hours]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-36 truncate">{name}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full transition-all" style={{ width: `${(hours / maxDiscHours) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">{hours.toFixed(1)}h</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3"><p className="text-xs text-emerald-600 font-semibold">Mais estudada</p><p className="font-bold text-emerald-900 dark:text-emerald-100">{mostStudied}</p></div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3"><p className="text-xs text-rose-600 font-semibold">Mais negligenciada</p><p className="font-bold text-rose-900 dark:text-rose-100">{leastStudied}</p></div>
          </div>
        </div>
      )}

      {/* Correlation panel */}
      {correlations.length >= 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">🔎 Correlações</h3>
          <p className="text-xs text-gray-500 mb-4">Baseado em {correlations.length} dias com dados de bem-estar + estudo</p>
          <div className="space-y-2">
            {(() => {
              const highSleep = correlations.filter(c => c.sleep >= 7);
              const lowSleep = correlations.filter(c => c.sleep < 7);
              const avgHoursHighSleep = highSleep.length > 0 ? (highSleep.reduce((s, c) => s + c.studyHours, 0) / highSleep.length).toFixed(1) : null;
              const avgHoursLowSleep = lowSleep.length > 0 ? (lowSleep.reduce((s, c) => s + c.studyHours, 0) / lowSleep.length).toFixed(1) : null;
              return (
                <>
                  {avgHoursHighSleep && <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm"><span className="text-blue-700 dark:text-blue-300">😴 Sono ≥7h → Estudo médio</span><span className="font-bold text-blue-900 dark:text-blue-100">{avgHoursHighSleep}h/dia</span></div>}
                  {avgHoursLowSleep && <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm"><span className="text-amber-700 dark:text-amber-300">😴 Sono &lt;7h → Estudo médio</span><span className="font-bold text-amber-900 dark:text-amber-100">{avgHoursLowSleep}h/dia</span></div>}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Study calendar last 21 days */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">📅 Calendário de Estudo (21 dias)</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 21 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (20 - i));
            const ds = d.toISOString().split('T')[0];
            const h = sessions.filter(s => s.date === ds).reduce((s, x) => s + (x.duration || 0) / 60, 0);
            const intensity = h === 0 ? 0 : h < 1 ? 1 : h < 2 ? 2 : h < 3 ? 3 : 4;
            const bg = ['bg-gray-100 dark:bg-gray-700', 'bg-purple-200 dark:bg-purple-900/40', 'bg-purple-400', 'bg-purple-600', 'bg-purple-800'][intensity];
            return <div key={i} title={`${ds}: ${h.toFixed(1)}h`} className={`aspect-square rounded-md ${bg} cursor-default`} />;
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          {['bg-gray-100 dark:bg-gray-700', 'bg-purple-200', 'bg-purple-400', 'bg-purple-600', 'bg-purple-800'].map((c, i) => (
            <span key={i} className="flex items-center gap-1"><span className={`w-3 h-3 ${c} rounded`} />{['0', '<1h', '1-2h', '2-3h', '>3h'][i]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MODULE: PBL AVANÇADO (Medicina anos 3+) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function PBLAdvancedModule({ userId }) {
  const [cases, setCases] = useState(() => ls.get(`pblCases_${userId}`));
  const [activeCase, setActiveCase] = useState(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const [caseForm, setCaseForm] = useState({
    title: '', specialty: '', chiefComplaint: '', history: '', labData: '', evolution: '',
    hypotheses: [], learningObjectives: [], research: [], integration: { finalDiagnosis: '', conduct: '', reasoning: '', initialErrors: '' },
  });
  const setF = (k, v) => setCaseForm(f => ({ ...f, [k]: v }));

  useEffect(() => { ls.set(`pblCases_${userId}`, cases); }, [cases]);

  const SPECIALTIES = ['Clínica Médica', 'Cardiologia', 'Neurologia', 'Pneumologia', 'Gastroenterologia', 'Nefrologia', 'Infectologia', 'Pediatria', 'Ginecologia', 'Cirurgia', 'Ortopedia', 'Psiquiatria', 'Outros'];
  const LEARNING_AREAS = ['Fisiologia', 'Fisiopatologia', 'Anatomia', 'Farmacologia', 'Diagnóstico Diferencial', 'Tratamento', 'Semiologia'];

  const saveCase = () => {
    if (!caseForm.title.trim()) return;
    setCases(c => [...c, { ...caseForm, id: uid(), createdAt: todayStr(), status: 'Em andamento' }]);
    setShowNewCase(false);
    setCaseForm({ title: '', specialty: '', chiefComplaint: '', history: '', labData: '', evolution: '', hypotheses: [], learningObjectives: [], research: [], integration: { finalDiagnosis: '', conduct: '', reasoning: '', initialErrors: '' } });
  };

  const updateCase = (id, updates) => {
    setCases(c => c.map(x => x.id === id ? { ...x, ...updates } : x));
    if (activeCase?.id === id) setActiveCase(c => ({ ...c, ...updates }));
  };

  const handleImport = (result, fileName) => {
    if (!result) return;
    const newCase = {
      id: uid(), createdAt: todayStr(), status: 'Em andamento',
      title: result.titulo || result.caso || fileName.replace(/\.[^/.]+$/, ''),
      specialty: result.especialidade || '',
      chiefComplaint: result.queixaPrincipal || result.queixa || '',
      history: result.historiaClinica || result.historia || '',
      labData: result.dadosLaboratoriais || result.laboratorio || '',
      evolution: result.evolucao || '',
      hypotheses: (result.hipoteses || []).map(h => typeof h === 'string' ? { text: h, probability: 'Moderada', justification: '' } : h),
      learningObjectives: [],
      research: [],
      integration: { finalDiagnosis: '', conduct: '', reasoning: '', initialErrors: '' },
    };
    setCases(c => [...c, newCase]);
    alert(`✅ Caso clínico importado de "${fileName}"`);
  };

  // Specialty stats
  const bySpecialty = cases.reduce((acc, c) => { acc[c.specialty || 'Outros'] = (acc[c.specialty || 'Outros'] || 0) + 1; return acc; }, {});

  const openCase = cases.find(c => c.id === activeCase);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">🩺 PBL Avançado — Casos Clínicos</h2>
        <div className="flex gap-2">
          <FileUploadButton onResult={handleImport} context="caso clínico médico com queixa, história e dados laboratoriais" label="Importar caso" color="teal" />
          <button onClick={() => setShowNewCase(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow">
            <PlusIcon className="h-4 w-4" />Novo Caso
          </button>
        </div>
      </div>

      {/* Case viewer */}
      {openCase && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border-2 border-teal-200 dark:border-teal-800">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{openCase.title}</h3>
            <button onClick={() => setActiveCase(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
          </div>

          {/* Clinical data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {[
              { label: '🏥 Queixa Principal', key: 'chiefComplaint' },
              { label: '📋 História Clínica', key: 'history' },
              { label: '🔬 Dados Laboratoriais', key: 'labData' },
              { label: '📈 Evolução', key: 'evolution' },
            ].map(item => (
              <div key={item.key}>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{item.label}</label>
                <textarea value={openCase[item.key] || ''} onChange={e => updateCase(openCase.id, { [item.key]: e.target.value })} rows="3"
                  placeholder="Digite aqui..." className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none resize-none text-sm" />
              </div>
            ))}
          </div>

          {/* Hypotheses */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-800 dark:text-gray-200">🧪 Hipóteses Diagnósticas</h4>
              <button onClick={() => updateCase(openCase.id, { hypotheses: [...(openCase.hypotheses || []), { text: '', probability: 'Moderada', justification: '' }] })} className="text-xs px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700">+ Hipótese</button>
            </div>
            <div className="space-y-2">
              {(openCase.hypotheses || []).map((hyp, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                  <input value={hyp.text} onChange={e => { const h = [...openCase.hypotheses]; h[i] = { ...h[i], text: e.target.value }; updateCase(openCase.id, { hypotheses: h }); }} placeholder="Hipótese diagnóstica..." className="flex-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none" />
                  <select value={hyp.probability} onChange={e => { const h = [...openCase.hypotheses]; h[i] = { ...h[i], probability: e.target.value }; updateCase(openCase.id, { hypotheses: h }); }} className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:border-teal-500 focus:outline-none">
                    {['Alta', 'Moderada', 'Baixa'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <button onClick={() => { const h = openCase.hypotheses.filter((_, j) => j !== i); updateCase(openCase.id, { hypotheses: h }); }} className="text-red-400 hover:text-red-600 p-1"><XMarkIcon className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Learning objectives */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-800 dark:text-gray-200">🎯 Objetivos de Aprendizagem</h4>
              <button onClick={() => updateCase(openCase.id, { learningObjectives: [...(openCase.learningObjectives || []), { area: 'Fisiologia', objective: '', research: '', references: '', keyPoints: '', doubts: '' }] })} className="text-xs px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700">+ Objetivo</button>
            </div>
            <div className="space-y-3">
              {(openCase.learningObjectives || []).map((obj, i) => (
                <div key={i} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <select value={obj.area} onChange={e => { const o = [...openCase.learningObjectives]; o[i] = { ...o[i], area: e.target.value }; updateCase(openCase.id, { learningObjectives: o }); }} className="px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none">
                      {LEARNING_AREAS.map(a => <option key={a}>{a}</option>)}
                    </select>
                    <input value={obj.objective} onChange={e => { const o = [...openCase.learningObjectives]; o[i] = { ...o[i], objective: e.target.value }; updateCase(openCase.id, { learningObjectives: o }); }} placeholder="Objetivo..." className="flex-1 px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none" />
                    <button onClick={() => { const o = openCase.learningObjectives.filter((_, j) => j !== i); updateCase(openCase.id, { learningObjectives: o }); }} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-4 w-4" /></button>
                  </div>
                  {[
                    { label: 'Resumo pesquisa', key: 'research', ph: 'O que você encontrou sobre este tema...' },
                    { label: 'Referências', key: 'references', ph: 'Livros, artigos, fontes...' },
                    { label: 'Pontos-chave', key: 'keyPoints', ph: 'Os 3 pontos mais importantes...' },
                    { label: 'Dúvidas', key: 'doubts', ph: 'O que ainda não ficou claro...' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-purple-600 dark:text-purple-400 font-semibold mb-0.5">{field.label}</label>
                      <textarea value={obj[field.key] || ''} onChange={e => { const o = [...openCase.learningObjectives]; o[i] = { ...o[i], [field.key]: e.target.value }; updateCase(openCase.id, { learningObjectives: o }); }} rows="2" placeholder={field.ph} className="w-full px-2 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-200 focus:outline-none resize-none" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Clinical integration */}
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3">🩺 Integração Clínica (Pós-Discussão)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: '✅ Diagnóstico Final', key: 'finalDiagnosis' },
                { label: '💊 Conduta', key: 'conduct' },
                { label: '🧠 Raciocínio Consolidado', key: 'reasoning' },
                { label: '❌ Erros Iniciais', key: 'initialErrors' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{field.label}</label>
                  <textarea value={openCase.integration?.[field.key] || ''} onChange={e => updateCase(openCase.id, { integration: { ...openCase.integration, [field.key]: e.target.value } })} rows="2" placeholder="Digite aqui..." className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none resize-none text-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cases list */}
      {!openCase && (
        <>
          {/* Specialty distribution */}
          {Object.keys(bySpecialty).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Distribuição por Especialidade</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(bySpecialty).map(([spec, count]) => (
                  <span key={spec} className="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-semibold">{spec}: {count}</span>
                ))}
              </div>
            </div>
          )}

          {cases.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4">🩺</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhum caso clínico</h3>
              <p className="text-gray-500 text-sm mb-5">Adicione um caso ou importe um PDF de caso clínico</p>
              <button onClick={() => setShowNewCase(true)} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700">Criar Primeiro Caso</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer" onClick={() => setActiveCase(c.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{c.title}</h4>
                      {c.specialty && <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">{c.specialty}</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm('Excluir caso?')) setCases(cs => cs.filter(x => x.id !== c.id)); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                  {c.chiefComplaint && <p className="text-sm text-gray-600 dark:text-gray-400 truncate">🏥 {c.chiefComplaint}</p>}
                  <div className="flex gap-2 mt-3 text-xs text-gray-400">
                    <span>Hipóteses: {c.hypotheses?.length || 0}</span>
                    <span>•</span>
                    <span>Objetivos: {c.learningObjectives?.length || 0}</span>
                    <span>•</span>
                    <span>{fmt(c.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showNewCase && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Novo Caso Clínico</h3>
              <button onClick={() => setShowNewCase(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título do Caso *</label><input value={caseForm.title} onChange={e => setF('title', e.target.value)} placeholder="Ex: Caso 1 - Dor torácica aguda" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Especialidade</label>
                <select value={caseForm.specialty} onChange={e => setF('specialty', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none">
                  <option value="">Selecionar...</option>
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Queixa Principal</label><textarea value={caseForm.chiefComplaint} onChange={e => setF('chiefComplaint', e.target.value)} rows="2" placeholder="Dor, febre, dispneia..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none resize-none text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewCase(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button>
              <button onClick={saveCase} disabled={!caseForm.title.trim()} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50">Criar Caso</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function Study() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userProfile } = useContext(AppContext);
  const { subscription, canGenerateQuestions, hasFeature, isFree, isStudent, isPremium } = useSubscription();

  const [activeTab, setActiveTab] = useState('disciplinas');
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);
  const [studyConfig, setStudyConfig] = useState(null);

  useEffect(() => {
    const config = localStorage.getItem(`studyConfig_${user?.uid}`);
    if (config) { setStudyConfig(JSON.parse(config)); setHasCompletedQuestionnaire(true); }
  }, [user]);

  const handleTabChange = (tabId) => {
    if (tabId === 'questoes' && !hasFeature('questionsGeneration')) {
      alert('⚠️ Geração de questões inteligentes está disponível apenas nos planos Estudante e superiores.');
      navigate('/pricing');
      return;
    }
    setActiveTab(tabId);
  };

  // Determine if advanced PBL (years 3+) or basic
  const isAdvancedPBL = studyConfig?.isPBL && studyConfig?.medYear >= 3;
  const isBasicPBL = studyConfig?.isPBL && (!studyConfig?.medYear || studyConfig?.medYear < 3);

  const tabs = [
    { id: 'disciplinas', label: 'Disciplinas', emoji: '📚' },
    { id: 'planejamento', label: 'Planejamento', emoji: '📅' },
    { id: 'conteudos', label: 'Conteúdos', emoji: '📋' },
    ...(isBasicPBL ? [{ id: 'pbl', label: 'PBL', emoji: '🧪' }] : []),
    ...(isAdvancedPBL ? [{ id: 'pbl_avancado', label: 'PBL Clínico', emoji: '🩺' }] : []),
    { id: 'timer', label: 'Timer', emoji: '⏱️' },
    { id: 'provas', label: 'Provas', emoji: '📝' },
    { id: 'questoes', label: 'Questões', emoji: '❓', premium: !hasFeature('questionsGeneration') },
    { id: 'revisao', label: 'Revisão', emoji: '📖' },
    { id: 'performance', label: 'Performance', emoji: '📊' },
    { id: 'avaliacao', label: 'Avaliação', emoji: '📈' },
  ];

  if (!hasCompletedQuestionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
        <PageHeader title="Configurar Estudos" subtitle="Vamos personalizar sua experiência de estudo" emoji="📚" />
        <StudyQuestionnaire onComplete={(config) => {
          localStorage.setItem(`studyConfig_${user.uid}`, JSON.stringify(config));
          setStudyConfig(config); setHasCompletedQuestionnaire(true);
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader title="Estudos" subtitle="Gerencie sua vida acadêmica" emoji="📚" imageQuery="study,books,university,academic" />

      {/* Plan banners */}
      {isFree() && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 flex items-start justify-between gap-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">📚 <strong>Plano Gratuito:</strong> Acesso ao planejamento básico. Faça upgrade para geração de questões e revisão inteligente!</p>
            <button onClick={() => navigate('/pricing')} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm whitespace-nowrap">⭐ Ver Planos</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 py-3.5 px-3 font-semibold text-xs border-b-2 transition-all whitespace-nowrap relative ${activeTab === tab.id ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.premium && <span className="ml-1 text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full">Pro</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'disciplinas' && <DisciplinasModule userId={user?.uid} />}
        {activeTab === 'planejamento' && <PlanejamentoModule userId={user?.uid} studyConfig={studyConfig} />}
        {activeTab === 'conteudos' && <ConteudosModule userId={user?.uid} />}
        {activeTab === 'pbl' && isBasicPBL && <StudyPBL studyConfig={studyConfig} />}
        {activeTab === 'pbl_avancado' && isAdvancedPBL && <PBLAdvancedModule userId={user?.uid} />}
        {activeTab === 'timer' && <StudyTimer studyConfig={studyConfig} />}
        {activeTab === 'provas' && <ProvasModule userId={user?.uid} />}
        {activeTab === 'questoes' && (
          !hasFeature('questionsGeneration') ? <PremiumBlock feature="questionsGeneration" requiredPlan="student" message="Geração de questões inteligentes disponível nos planos Estudante, Premium e Vitalício." />
          : !canGenerateQuestions() ? <LimitReached title="Limite de Questões" message="Você atingiu o limite mensal. Faça upgrade para questões ilimitadas!" currentUsage={subscription.questionsUsage || 0} limit={subscription.features.questionsLimit} feature="questionsGeneration" />
          : <StudyQuestions />
        )}
        {activeTab === 'revisao' && <StudyReview studyConfig={studyConfig} isPBL={studyConfig?.isPBL} />}
        {activeTab === 'performance' && <PerformanceModule userId={user?.uid} />}
        {activeTab === 'avaliacao' && <StudyWeeklyEval studyConfig={studyConfig} />}
      </div>

      {/* Reset questionnaire */}
      <div className="fixed bottom-24 right-6 z-50">
        <button onClick={() => { if (window.confirm('Refazer questionário? Isso resetará suas configurações.')) { localStorage.removeItem(`studyConfig_${user.uid}`); setHasCompletedQuestionnaire(false); setStudyConfig(null); } }}
          className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl shadow-lg font-semibold text-sm">🔄 Reconfigurar</button>
      </div>
    </div>
  );
}