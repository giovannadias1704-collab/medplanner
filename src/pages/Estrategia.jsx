import { useState, useEffect, useMemo, useRef } from 'react';
import {
  PlusIcon, XMarkIcon, TrashIcon, PencilIcon, ChevronDownIcon, ChevronUpIcon,
  SparklesIcon, CheckCircleIcon, FireIcon, ChartBarIcon, ClockIcon,
  StarIcon, ArrowTrendingUpIcon, LightBulbIcon
} from '@heroicons/react/24/outline';
import PageLayout from '../components/PageLayout';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayStr = () => new Date().toISOString().split('T')[0];
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const currentQuarter = () => Math.ceil((new Date().getMonth() + 1) / 3);
const currentYear = () => new Date().getFullYear();

const LIFE_AREAS = ['Saúde', 'Carreira', 'Finanças', 'Estudos', 'Relacionamentos', 'Lazer', 'Espiritualidade', 'Desenvolvimento Pessoal'];
const LIFE_AREA_ICONS = { 'Saúde': '💪', 'Carreira': '💼', 'Finanças': '💰', 'Estudos': '📚', 'Relacionamentos': '❤️', 'Lazer': '🎮', 'Espiritualidade': '🧘', 'Desenvolvimento Pessoal': '🌱' };
const LIFE_AREA_COLORS = { 'Saúde': 'emerald', 'Carreira': 'blue', 'Finanças': 'amber', 'Estudos': 'purple', 'Relacionamentos': 'rose', 'Lazer': 'orange', 'Espiritualidade': 'violet', 'Desenvolvimento Pessoal': 'teal' };
const QUADRANTS = [
  { id: 'urgent_important', label: 'Urgente & Importante', color: 'rose', icon: '🔴', desc: 'Fazer agora' },
  { id: 'not_urgent_important', label: 'Importante & Não Urgente', color: 'blue', icon: '🔵', desc: 'Agendar' },
  { id: 'urgent_not_important', label: 'Urgente & Não Importante', color: 'amber', icon: '🟡', desc: 'Delegar' },
  { id: 'not_urgent_not_important', label: 'Não Urgente & Não Importante', color: 'gray', icon: '⚪', desc: 'Eliminar' },
];
const REVIEW_QUESTIONS = {
  weekly: ['O que avancei esta semana?', 'O que me travou ou distraiu?', 'O que deveria ter feito e não fiz?', 'Meu foco esteve alinhado com minhas metas?'],
  monthly: ['Quais metas avançaram significativamente?', 'O que foi eliminado ou deveria ser?', 'Como está meu equilíbrio de vida?', 'Minhas metas ainda fazem sentido?'],
  quarterly: ['O que foi concluído neste trimestre?', 'Quais OKRs foram atingidos?', 'O que aprendi sobre mim mesmo?', 'O que muda no próximo trimestre?'],
};

function RadarChart({ scores }) {
  const areas = Object.keys(scores);
  const n = areas.length;
  if (n === 0) return null;
  const size = 220;
  const cx = size / 2, cy = size / 2, r = 80;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, val) => { const a = angle(i); const d = (val / 10) * r; return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d }; };
  const labelPt = (i) => { const a = angle(i); return { x: cx + Math.cos(a) * (r + 24), y: cy + Math.sin(a) * (r + 24) }; };
  const polygon = areas.map((_, i) => { const p = point(i, scores[areas[i]] || 0); return `${p.x},${p.y}`; }).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs mx-auto">
      {[2, 4, 6, 8, 10].map(v => <polygon key={v} points={areas.map((_, i) => { const p = point(i, v); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />)}
      {areas.map((_, i) => { const p = point(i, 10); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#d1d5db" strokeWidth="0.5" />; })}
      <polygon points={polygon} fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />
      {areas.map((area, i) => { const lp = labelPt(i); return <text key={area} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#6b7280">{LIFE_AREA_ICONS[area]} {area.length > 7 ? area.substring(0, 7) + '.' : area}</text>; })}
    </svg>
  );
}

function ScoreRing({ score, label, color = '#8b5cf6', size = 80 }) {
  const r = 30, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold text-center">{label}</span>
    </div>
  );
}

function AnnualGoalsSection({ userId }) {
  const key = `strategy_annualGoals_${userId}`;
  const [goals, setGoals] = useState(() => ls.get(key, []));
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', area: 'Carreira', indicator: '', deadline: '', why: '', progress: 0, status: 'Em andamento' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { ls.set(key, goals); }, [goals]);

  const save = () => {
    if (!form.title.trim()) return;
    if (editing) setGoals(g => g.map(x => x.id === editing ? { ...x, ...form } : x));
    else setGoals(g => [...g, { ...form, id: uid(), year: currentYear(), createdAt: todayStr() }]);
    setShowModal(false); setEditing(null);
    setForm({ title: '', area: 'Carreira', indicator: '', deadline: '', why: '', progress: 0, status: 'Em andamento' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">⭐ Metas Anuais {currentYear()}</h3>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow"><PlusIcon className="h-4 w-4" />Nova Meta</button>
      </div>
      {goals.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700"><div className="text-5xl mb-3">🎯</div><p className="text-gray-500 text-sm">Nenhuma meta anual ainda</p><button onClick={() => setShowModal(true)} className="mt-3 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700">Criar primeira meta</button></div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border-l-4 border border-gray-200 dark:border-gray-700" style={{ borderLeftColor: ['#8b5cf6','#3b82f6','#f59e0b','#a855f7','#f43f5e','#f97316','#7c3aed','#14b8a6'][LIFE_AREAS.indexOf(goal.area)] || '#8b5cf6' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{LIFE_AREA_ICONS[goal.area]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{goal.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold">{goal.area}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${goal.status === 'Concluída' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{goal.status}</span>
                  </div>
                  {goal.indicator && <p className="text-xs text-gray-500 mb-1">📏 {goal.indicator}</p>}
                  {goal.why && <p className="text-xs text-gray-400 italic mb-2">"{goal.why}"</p>}
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2"><div className="bg-violet-500 h-2 rounded-full" style={{ width: `${goal.progress || 0}%` }} /></div>
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{goal.progress || 0}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={goal.progress || 0} onChange={e => setGoals(g => g.map(x => x.id === goal.id ? { ...x, progress: parseInt(e.target.value) } : x))} className="w-full accent-violet-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(goal.id); setForm(goal); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => setGoals(g => g.filter(x => x.id !== goal.id))} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 my-4">
            <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-bold text-gray-900 dark:text-white">Meta Anual</h3><button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Objetivo *</label><input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Ex: Conquistar promoção no trabalho" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Área da vida</label><select value={form.area} onChange={e => setF('area', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none">{LIFE_AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label><select value={form.status} onChange={e => setF('status', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none">{['Em andamento', 'Concluída', 'Pausada', 'Abandonada'].map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📏 Indicador mensurável</label><input value={form.indicator} onChange={e => setF('indicator', e.target.value)} placeholder="Ex: Salário aumentar 30%" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📅 Prazo</label><input type="date" value={form.deadline} onChange={e => setF('deadline', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">💡 Por que isso importa?</label><textarea value={form.why} onChange={e => setF('why', e.target.value)} rows="2" placeholder="Sua motivação..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none resize-none text-sm" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Progresso: {form.progress}%</label><input type="range" min="0" max="100" value={form.progress} onChange={e => setF('progress', parseInt(e.target.value))} className="w-full accent-violet-600" /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button><button onClick={save} disabled={!form.title.trim()} className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50">Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function OKRSection({ userId }) {
  const key = `strategy_okr_${userId}`;
  const [okrs, setOkrs] = useState(() => ls.get(key, []));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ objective: '', quarter: `Q${currentQuarter()} ${currentYear()}`, linkedGoal: '', keyResults: [{ text: '', target: '', current: 0 }, { text: '', target: '', current: 0 }, { text: '', target: '', current: 0 }] });
  const annualGoals = ls.get(`strategy_annualGoals_${userId}`, []);
  useEffect(() => { ls.set(key, okrs); }, [okrs]);

  const save = () => {
    if (!form.objective.trim()) return;
    setOkrs(o => [...o, { ...form, id: uid(), createdAt: todayStr() }]);
    setShowModal(false);
    setForm({ objective: '', quarter: `Q${currentQuarter()} ${currentYear()}`, linkedGoal: '', keyResults: [{ text: '', target: '', current: 0 }, { text: '', target: '', current: 0 }, { text: '', target: '', current: 0 }] });
  };

  const okrProgress = (okr) => {
    const filled = okr.keyResults.filter(kr => kr.text);
    if (!filled.length) return 0;
    return Math.round(filled.reduce((s, kr) => s + Math.min((parseFloat(kr.current) || 0) / (parseFloat(kr.target) || 100), 1), 0) / filled.length * 100);
  };

  const quarters = [`Q1 ${currentYear()}`, `Q2 ${currentYear()}`, `Q3 ${currentYear()}`, `Q4 ${currentYear()}`];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">🎯 OKRs Trimestrais</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow"><PlusIcon className="h-4 w-4" />Novo OKR</button>
      </div>
      {okrs.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700"><div className="text-4xl mb-2">🎯</div><p className="text-gray-500 text-sm">Desdobre suas metas anuais em OKRs trimestrais</p></div>
      ) : (
        <div className="space-y-4">
          {okrs.map(okr => {
            const prog = okrProgress(okr);
            return (
              <div key={okr.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div><span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">{okr.quarter}</span><h4 className="font-bold text-gray-900 dark:text-white mt-1">{okr.objective}</h4>{okr.linkedGoal && <p className="text-xs text-gray-400">🔗 {okr.linkedGoal}</p>}</div>
                  <div className="flex items-center gap-2"><span className={`text-sm font-bold ${prog >= 70 ? 'text-emerald-600' : prog >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>{prog}%</span><button onClick={() => setOkrs(o => o.filter(x => x.id !== okr.id))} className="p-1.5 text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button></div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-4"><div className={`h-2 rounded-full ${prog >= 70 ? 'bg-emerald-500' : prog >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${prog}%` }} /></div>
                <div className="space-y-2">
                  {okr.keyResults.filter(kr => kr.text).map((kr, i) => {
                    const krProg = Math.min(((parseFloat(kr.current) || 0) / (parseFloat(kr.target) || 100)) * 100, 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-5">KR{i+1}</span>
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{kr.text}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <input type="number" value={kr.current} onChange={e => { const krs = okr.keyResults.map((k, j) => j === i ? { ...k, current: e.target.value } : k); setOkrs(o => o.map(x => x.id === okr.id ? { ...x, keyResults: krs } : x)); }} className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none" />
                          <span className="text-gray-400">/{kr.target}</span>
                          <span className={`font-bold ${krProg >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round(krProg)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 my-4">
            <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-bold text-gray-900 dark:text-white">Novo OKR</h3><button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Trimestre</label><select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none">{quarters.map(q => <option key={q}>{q}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Meta vinculada</label><select value={form.linkedGoal} onChange={e => setForm(f => ({ ...f, linkedGoal: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"><option value="">Nenhuma</option>{annualGoals.map(g => <option key={g.id} value={g.title}>{g.title}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Objetivo *</label><input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="Ex: Consolidar presença no mercado" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" /></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resultados-Chave</label>
                {form.keyResults.map((kr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={kr.text} onChange={e => { const k = [...form.keyResults]; k[i] = { ...k[i], text: e.target.value }; setForm(f => ({ ...f, keyResults: k })); }} placeholder={`KR${i+1}: O que mensurar?`} className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none text-sm" />
                    <input type="number" value={kr.target} onChange={e => { const k = [...form.keyResults]; k[i] = { ...k[i], target: e.target.value }; setForm(f => ({ ...f, keyResults: k })); }} placeholder="Meta" className="w-20 px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none text-sm" />
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, keyResults: [...f.keyResults, { text: '', target: '', current: 0 }] }))} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">+ Adicionar KR</button>
              </div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button><button onClick={save} disabled={!form.objective.trim()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">Criar OKR</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function EisenhowerSection({ userId }) {
  const key = `strategy_eisenhower_${userId}`;
  const [tasks, setTasks] = useState(() => ls.get(key, []));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', quadrant: 'urgent_important' });
  useEffect(() => { ls.set(key, tasks); }, [tasks]);
  const byQ = QUADRANTS.reduce((acc, q) => { acc[q.id] = tasks.filter(t => t.quadrant === q.id); return acc; }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">⚡ Matriz de Eisenhower</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow"><PlusIcon className="h-4 w-4" />Tarefa</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {QUADRANTS.map(q => (
          <div key={q.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 ${q.color === 'rose' ? 'border-rose-200 dark:border-rose-800' : q.color === 'blue' ? 'border-blue-200 dark:border-blue-800' : q.color === 'amber' ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-600'} min-h-32 shadow`}>
            <div className="flex items-center gap-1.5 mb-3"><span>{q.icon}</span><div><p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">{q.label}</p><p className="text-xs text-gray-400">{q.desc}</p></div></div>
            <div className="space-y-1.5">
              {byQ[q.id].map(task => (
                <div key={task.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 text-xs group">
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{task.title}</span>
                  <button onClick={() => setTasks(t => t.filter(x => x.id !== task.id))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><XMarkIcon className="h-3 w-3" /></button>
                </div>
              ))}
              {byQ[q.id].length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Vazio</p>}
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-bold text-gray-900 dark:text-white">Nova Tarefa</h3><button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tarefa *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Descreva a tarefa..." className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quadrante</label>
                <div className="grid grid-cols-2 gap-2">{QUADRANTS.map(q => <button key={q.id} type="button" onClick={() => setForm(f => ({ ...f, quadrant: q.id }))} className={`p-2.5 rounded-xl border-2 text-xs font-semibold text-left transition-all ${form.quadrant === q.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'border-gray-200 dark:border-gray-600'}`}>{q.icon} {q.label}</button>)}</div>
              </div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button><button onClick={() => { if (form.title.trim()) { setTasks(t => [...t, { ...form, id: uid(), createdAt: todayStr() }]); setShowModal(false); setForm({ title: '', quadrant: 'urgent_important' }); } }} disabled={!form.title.trim()} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 disabled:opacity-50">Adicionar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsSection({ userId }) {
  const key = `strategy_projects_${userId}`;
  const [projects, setProjects] = useState(() => ls.get(key, []));
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ name: '', area: 'Carreira', linkedGoal: '', status: 'Ativo', deadline: '', progress: 0 });
  const [taskInputs, setTaskInputs] = useState({});
  useEffect(() => { ls.set(key, projects); }, [projects]);

  const save = () => {
    if (!form.name.trim()) return;
    setProjects(p => [...p, { ...form, id: uid(), createdAt: todayStr(), tasks: [] }]);
    setShowModal(false);
    setForm({ name: '', area: 'Carreira', linkedGoal: '', status: 'Ativo', deadline: '', progress: 0 });
  };

  const addTask = (projId) => {
    const text = taskInputs[projId] || '';
    if (!text.trim()) return;
    setProjects(ps => ps.map(p => p.id === projId ? { ...p, tasks: [...(p.tasks || []), { id: uid(), text: text.trim(), done: false }] } : p));
    setTaskInputs(t => ({ ...t, [projId]: '' }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">🚀 Projetos Ativos</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow"><PlusIcon className="h-4 w-4" />Projeto</button>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700"><div className="text-4xl mb-2">🚀</div><p className="text-gray-500 text-sm">Nenhum projeto ativo</p></div>
      ) : (
        <div className="space-y-3">
          {projects.map(proj => (
            <div key={proj.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{LIFE_AREA_ICONS[proj.area] || '🚀'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 dark:text-white">{proj.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${proj.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : proj.status === 'Concluído' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{proj.status}</span>
                      </div>
                      {proj.linkedGoal && <p className="text-xs text-gray-400 mt-0.5">🔗 {proj.linkedGoal}</p>}
                      {proj.deadline && <p className="text-xs text-gray-400">📅 {fmt(proj.deadline)}</p>}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progresso</span><span>{proj.progress}%</span></div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${proj.progress}%` }} /></div>
                        <input type="range" min="0" max="100" value={proj.progress} onChange={e => setProjects(ps => ps.map(p => p.id === proj.id ? { ...p, progress: parseInt(e.target.value) } : p))} className="w-full mt-1 accent-emerald-600" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setExpanded(expanded === proj.id ? null : proj.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">{expanded === proj.id ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}</button>
                    <button onClick={() => setProjects(ps => ps.filter(p => p.id !== proj.id))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
              {expanded === proj.id && (
                <div className="border-t border-gray-200 dark:border-gray-600 px-5 py-4 space-y-2">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Tarefas</p>
                  {(proj.tasks || []).map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      <button onClick={() => setProjects(ps => ps.map(p => p.id === proj.id ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) } : p))} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.done ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 hover:border-emerald-500'}`}>{task.done && <CheckCircleIcon className="h-3.5 w-3.5 text-white" />}</button>
                      <span className={`text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{task.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input value={taskInputs[proj.id] || ''} onChange={e => setTaskInputs(t => ({ ...t, [proj.id]: e.target.value }))} onKeyPress={e => e.key === 'Enter' && addTask(proj.id)} placeholder="Nova tarefa..." className="flex-1 px-3 py-1.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-sm" />
                    <button onClick={() => addTask(proj.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">+</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-bold text-gray-900 dark:text-white">Novo Projeto</h3><button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Lançar produto X" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Área</label><select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none">{LIFE_AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none">{['Ativo','Pausado','Concluído','Cancelado'].map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Prazo</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none" /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button><button onClick={save} disabled={!form.name.trim()} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">Criar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function QualidadeVidaSection({ userId }) {
  const key = `strategy_qol_${userId}`;
  const [data, setData] = useState(() => ls.get(key, { hobbies: [], travels: [], cultural: [], workLifeLog: [] }));
  useEffect(() => { ls.set(key, data); }, [data]);
  const [activeQol, setActiveQol] = useState('hobbies');
  const [hobbyInput, setHobbyInput] = useState('');
  const [travelInput, setTravelInput] = useState({ dest: '', budget: '' });
  const [culturalInput, setCulturalInput] = useState({ title: '', type: 'Livro', status: 'Quero' });
  const [wh, setWh] = useState(''); const [ph, setPh] = useState('');

  const workPct = data.workLifeLog.length > 0 ? (() => {
    const last7 = data.workLifeLog.slice(-7);
    const total = last7.reduce((s, l) => s + l.work + l.personal, 0);
    const work = last7.reduce((s, l) => s + l.work, 0);
    return total > 0 ? Math.round((work / total) * 100) : 50;
  })() : null;

  const CICONS = { Livro: '📖', Filme: '🎬', Série: '📺', Curso: '🎓', Podcast: '🎙️' };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">🌿 Qualidade de Vida</h3>
      <div className="flex gap-2 flex-wrap">
        {[['hobbies','🎮 Hobbies'],['travels','✈️ Viagens'],['cultural','🎬 Cultura'],['balance','⚖️ Equilíbrio']].map(([id,label]) => (
          <button key={id} onClick={() => setActiveQol(id)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeQol === id ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>{label}</button>
        ))}
      </div>
      {activeQol === 'hobbies' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex gap-2"><input value={hobbyInput} onChange={e => setHobbyInput(e.target.value)} onKeyPress={e => { if (e.key === 'Enter' && hobbyInput.trim()) { setData(d => ({ ...d, hobbies: [...d.hobbies, { id: uid(), name: hobbyInput.trim(), frequency: 'Semanal' }] })); setHobbyInput(''); } }} placeholder="Adicionar hobby..." className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" /><button onClick={() => { if (hobbyInput.trim()) { setData(d => ({ ...d, hobbies: [...d.hobbies, { id: uid(), name: hobbyInput.trim(), frequency: 'Semanal' }] })); setHobbyInput(''); } }} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">+</button></div>
          {data.hobbies.map(h => <div key={h.id} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl"><span className="text-lg">🎮</span><span className="flex-1 font-semibold text-sm text-gray-800 dark:text-gray-200">{h.name}</span><select value={h.frequency} onChange={e => setData(d => ({ ...d, hobbies: d.hobbies.map(x => x.id === h.id ? { ...x, frequency: e.target.value } : x) }))} className="px-2 py-1 rounded-lg border border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none">{['Diário','Semanal','Quinzenal','Mensal'].map(f => <option key={f}>{f}</option>)}</select><button onClick={() => setData(d => ({ ...d, hobbies: d.hobbies.filter(x => x.id !== h.id) }))} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-4 w-4" /></button></div>)}
          {data.hobbies.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum hobby registrado</p>}
        </div>
      )}
      {activeQol === 'travels' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex gap-2"><input value={travelInput.dest} onChange={e => setTravelInput(t => ({ ...t, dest: e.target.value }))} placeholder="Destino..." className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" /><input value={travelInput.budget} onChange={e => setTravelInput(t => ({ ...t, budget: e.target.value }))} placeholder="Budget R$" className="w-28 px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" /><button onClick={() => { if (travelInput.dest.trim()) { setData(d => ({ ...d, travels: [...d.travels, { id: uid(), ...travelInput, done: false }] })); setTravelInput({ dest: '', budget: '' }); } }} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">+</button></div>
          {data.travels.map(t => <div key={t.id} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><span>✈️</span><span className="flex-1 font-semibold text-sm text-gray-800 dark:text-gray-200">{t.dest}</span>{t.budget && <span className="text-xs text-gray-500">R$ {t.budget}</span>}<button onClick={() => setData(d => ({ ...d, travels: d.travels.map(x => x.id === t.id ? { ...x, done: !x.done } : x) }))} className={`text-xs px-2 py-0.5 rounded-full font-bold ${t.done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{t.done ? '✓ Feita' : 'Wishlist'}</button><button onClick={() => setData(d => ({ ...d, travels: d.travels.filter(x => x.id !== t.id) }))} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-4 w-4" /></button></div>)}
          {data.travels.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhuma viagem na lista</p>}
        </div>
      )}
      {activeQol === 'cultural' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input value={culturalInput.title} onChange={e => setCulturalInput(c => ({ ...c, title: e.target.value }))} placeholder="Título..." className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none min-w-36" />
            <select value={culturalInput.type} onChange={e => setCulturalInput(c => ({ ...c, type: e.target.value }))} className="px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none">{Object.keys(CICONS).map(t => <option key={t}>{t}</option>)}</select>
            <select value={culturalInput.status} onChange={e => setCulturalInput(c => ({ ...c, status: e.target.value }))} className="px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none">{['Quero','Em andamento','Concluído'].map(s => <option key={s}>{s}</option>)}</select>
            <button onClick={() => { if (culturalInput.title.trim()) { setData(d => ({ ...d, cultural: [...d.cultural, { id: uid(), ...culturalInput }] })); setCulturalInput({ title: '', type: 'Livro', status: 'Quero' }); } }} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700">+</button>
          </div>
          {data.cultural.map(item => <div key={item.id} className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl"><span>{CICONS[item.type]}</span><span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</span><span className="text-xs text-gray-500">{item.type}</span><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Em andamento' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{item.status}</span><button onClick={() => setData(d => ({ ...d, cultural: d.cultural.filter(x => x.id !== item.id) }))} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-4 w-4" /></button></div>)}
          {data.cultural.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum item cultural</p>}
        </div>
      )}
      {activeQol === 'balance' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1"><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">💼 Trabalho (h)</label><input type="number" value={wh} onChange={e => setWh(e.target.value)} placeholder="8" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none text-sm" /></div>
            <div className="flex-1"><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">🌿 Pessoal (h)</label><input type="number" value={ph} onChange={e => setPh(e.target.value)} placeholder="4" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none text-sm" /></div>
            <button onClick={() => { if (wh && ph) { setData(d => ({ ...d, workLifeLog: [...d.workLifeLog, { date: todayStr(), work: parseFloat(wh), personal: parseFloat(ph) }] })); setWh(''); setPh(''); } }} className="self-end px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">+</button>
          </div>
          {workPct !== null ? (
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-blue-600 font-semibold">💼 Trabalho: {workPct}%</span><span className="text-emerald-600 font-semibold">🌿 Pessoal: {100-workPct}%</span></div>
              <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex"><div className="bg-blue-500 h-5" style={{ width: `${workPct}%` }} /><div className="bg-emerald-500 h-5 flex-1" /></div>
              {workPct > 75 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">⚠️ Mais de 75% do tempo em trabalho. Considere mais espaço pessoal.</p>}
              {workPct <= 50 && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">✅ Bom equilíbrio entre trabalho e vida pessoal!</p>}
              <p className="text-xs text-gray-400 mt-1">Baseado nos últimos {Math.min(data.workLifeLog.length, 7)} registros</p>
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-4">Registre suas horas para ver o equilíbrio</p>}
        </div>
      )}
    </div>
  );
}

function RevisaoSection({ userId }) {
  const key = `strategy_reviews_${userId}`;
  const [reviews, setReviews] = useState(() => ls.get(key, []));
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('weekly');
  const [answers, setAnswers] = useState({});
  useEffect(() => { ls.set(key, reviews); }, [reviews]);
  const TYPE_LABELS = { weekly: '🗓 Semanal', monthly: '📅 Mensal', quarterly: '📊 Trimestral' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">🔁 Revisão Estratégica</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow"><PlusIcon className="h-4 w-4" />Nova Revisão</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(TYPE_LABELS).map(([t, label]) => <div key={t} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700 text-center"><p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{reviews.filter(r => r.type === t).length}</p><p className="text-xs text-gray-500 mt-0.5">{label}</p></div>)}
      </div>
      {reviews.length > 0 && (
        <div className="space-y-3">
          {[...reviews].reverse().slice(0, 4).map(review => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-700 dark:text-gray-300">{TYPE_LABELS[review.type]}</span><span className="text-xs text-gray-400">{fmt(review.date)}</span></div><button onClick={() => setReviews(r => r.filter(x => x.id !== review.id))} className="text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button></div>
              {Object.entries(review.answers).filter(([,v]) => v).slice(0, 2).map(([q,a]) => <div key={q} className="mb-2"><p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{q}</p><p className="text-sm text-gray-700 dark:text-gray-300">{a}</p></div>)}
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 my-4">
            <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-bold text-gray-900 dark:text-white">Nova Revisão</h3><button onClick={() => setShowModal(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button></div>
            <div className="flex gap-2 mb-5">{Object.entries(TYPE_LABELS).map(([t,label]) => <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-xl text-sm font-bold ${type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{label}</button>)}</div>
            <div className="space-y-4">
              {REVIEW_QUESTIONS[type].map(q => <div key={q}><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{q}</label><textarea value={answers[q] || ''} onChange={e => setAnswers(a => ({ ...a, [q]: e.target.value }))} rows="2" placeholder="Sua reflexão..." className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none resize-none text-sm" /></div>)}
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">Cancelar</button><button onClick={() => { setReviews(r => [...r, { id: uid(), type, date: todayStr(), answers }]); setShowModal(false); setAnswers({}); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSection({ userId }) {
  const annualGoals = ls.get(`strategy_annualGoals_${userId}`, []);
  const okrs = ls.get(`strategy_okr_${userId}`, []);
  const projects = ls.get(`strategy_projects_${userId}`, []);
  const reviews = ls.get(`strategy_reviews_${userId}`, []);
  const qol = ls.get(`strategy_qol_${userId}`, { workLifeLog: [] });
  const wellnessEntries = (() => { try { return JSON.parse(localStorage.getItem('wellnessEntries') || '[]'); } catch { return []; } })();

  const radarScores = useMemo(() => {
    const scores = {};
    LIFE_AREAS.forEach(area => {
      const ag = annualGoals.filter(g => g.area === area);
      scores[area] = ag.length > 0 ? Math.round(ag.reduce((s, g) => s + (g.progress || 0), 0) / ag.length / 10) : 0;
    });
    const rw = wellnessEntries.slice(-7);
    if (rw.length > 0) { const avg = rw.reduce((s, e) => s + (e.mood || 3), 0) / rw.length; scores['Saúde'] = Math.round((avg / 5) * 10); }
    return scores;
  }, [annualGoals, wellnessEntries]);

  const completedGoals = annualGoals.filter(g => g.status === 'Concluída').length;
  const activeProjects = projects.filter(p => p.status === 'Ativo').length;
  const alignmentScore = Math.min(Math.round(
    (annualGoals.length > 0 ? (completedGoals / annualGoals.length) * 40 : 0) +
    (activeProjects > 0 ? Math.min(activeProjects / 5, 1) * 30 : 0) +
    (reviews.length > 0 ? Math.min(reviews.length / 10, 1) * 30 : 0)
  ), 100);

  const okrProg = okrs.length > 0 ? Math.round(okrs.reduce((s, o) => {
    const f = o.keyResults.filter(kr => kr.text);
    if (!f.length) return s;
    return s + f.reduce((ss, kr) => ss + Math.min((parseFloat(kr.current) || 0) / (parseFloat(kr.target) || 100), 1), 0) / f.length;
  }, 0) / okrs.length * 100) : 0;

  const balScore = Math.min(Math.round(Object.values(radarScores).reduce((s, v) => s + v, 0) / LIFE_AREAS.length * 10), 100);

  const insights = [];
  const wlLog = qol.workLifeLog?.slice(-7) || [];
  if (wlLog.length > 0) { const tot = wlLog.reduce((s, l) => s + l.work + l.personal, 0); const wk = wlLog.reduce((s, l) => s + l.work, 0); const wp = tot > 0 ? Math.round((wk / tot) * 100) : 50; if (wp > 75) insights.push(`💼 ${wp}% do seu tempo recente foi profissional. Que tal mais espaço pessoal?`); }
  const rw = wellnessEntries.slice(-5);
  if (rw.length >= 3) { const as = rw.reduce((s, e) => s + (e.stress || 3), 0) / rw.length; if (as >= 4) insights.push('🧘 Estresse elevado detectado. Suas metas podem estar sobrecarregando.'); }
  const overdue = projects.filter(p => p.status === 'Ativo' && p.deadline && p.deadline < todayStr()).length;
  if (overdue > 0) insights.push(`📅 ${overdue} projeto(s) com prazo vencido. Reavalie prioridades.`);
  if (reviews.length === 0) insights.push('🔁 Sem revisões estratégicas ainda. Comece com uma revisão semanal!');
  if (annualGoals.length === 0) insights.push('🎯 Sem metas anuais definidas — esse é o ponto de partida!');

  return (
    <div className="space-y-6">
      <div className="flex justify-around bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <ScoreRing score={alignmentScore} label="Alinhamento" color="#8b5cf6" />
        <ScoreRing score={okrProg} label="OKR Progress" color="#3b82f6" />
        <ScoreRing score={balScore} label="Equilíbrio" color="#10b981" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-center">🕸 Radar de Vida</h3>
        <RadarChart scores={radarScores} />
        <p className="text-xs text-gray-400 text-center mt-2">Baseado no progresso das suas metas por área da vida</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Metas anuais', value: annualGoals.length, sub: `${completedGoals} concluídas`, color: 'violet' },
          { label: 'OKRs', value: okrs.length, sub: 'este trimestre', color: 'blue' },
          { label: 'Projetos ativos', value: activeProjects, sub: `${projects.length} total`, color: 'emerald' },
          { label: 'Revisões', value: reviews.length, sub: 'no total', color: 'amber' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 font-semibold">{kpi.label}</p>
            <p className={`text-3xl font-bold text-${kpi.color}-600 dark:text-${kpi.color}-400`}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white">
          <h3 className="font-bold mb-3 flex items-center gap-2"><SparklesIcon className="h-5 w-5" />Análise Cruzada Inteligente</h3>
          <div className="space-y-2">{insights.map((ins, i) => <div key={i} className="bg-white/15 rounded-xl px-4 py-2.5 text-sm">{ins}</div>)}</div>
        </div>
      )}
    </div>
  );
}

export default function Estrategia() {
  const userId = 'user';
  const [activeTab, setActiveTab] = useState('dashboard');
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: '🧭' },
    { id: 'visao', label: 'Visão', icon: '⭐' },
    { id: 'okr', label: 'OKRs', icon: '🎯' },
    { id: 'projetos', label: 'Projetos', icon: '🚀' },
    { id: 'prioridades', label: 'Prioridades', icon: '⚡' },
    { id: 'qualidade', label: 'Qualidade de Vida', icon: '🌿' },
    { id: 'revisao', label: 'Revisão', icon: '🔁' },
  ];

  return (
    <PageLayout
      title="Estratégia"
      subtitle="Visão clara. Execução precisa. Vida equilibrada."
      emoji="🗺️"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 flex flex-col items-center gap-1 py-3 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <span className="text-xl">{tab.icon}</span><span className="whitespace-nowrap hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard'    && <DashboardSection userId={userId} />}
        {activeTab === 'visao'        && <AnnualGoalsSection userId={userId} />}
        {activeTab === 'okr'          && <OKRSection userId={userId} />}
        {activeTab === 'projetos'     && <ProjectsSection userId={userId} />}
        {activeTab === 'prioridades'  && <EisenhowerSection userId={userId} />}
        {activeTab === 'qualidade'    && <QualidadeVidaSection userId={userId} />}
        {activeTab === 'revisao'      && <RevisaoSection userId={userId} />}
      </div>
    </PageLayout>
  );
}