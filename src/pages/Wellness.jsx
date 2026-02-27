import { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import {
  XMarkIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon,
  SparklesIcon, HeartIcon, FireIcon, CheckCircleIcon,
  ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  FaceSmileIcon, BoltIcon, ClockIcon
} from '@heroicons/react/24/outline';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayStr = () => new Date().toISOString().split('T')[0];
const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtShort = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const MOODS = [
  { value: 5, emoji: '😄', label: 'Excelente', color: 'green' },
  { value: 4, emoji: '🙂', label: 'Bom', color: 'blue' },
  { value: 3, emoji: '😐', label: 'Neutro', color: 'yellow' },
  { value: 2, emoji: '😔', label: 'Ruim', color: 'orange' },
  { value: 1, emoji: '😢', label: 'Péssimo', color: 'red' },
];

const FEELINGS = [
  { value: 'motivado', emoji: '💪', label: 'Motivado' },
  { value: 'cansado', emoji: '😴', label: 'Cansado' },
  { value: 'ansioso', emoji: '😰', label: 'Ansioso' },
  { value: 'estressado', emoji: '😤', label: 'Estressado' },
  { value: 'feliz', emoji: '😊', label: 'Feliz' },
  { value: 'triste', emoji: '😢', label: 'Triste' },
  { value: 'focado', emoji: '🎯', label: 'Focado' },
  { value: 'disperso', emoji: '🌀', label: 'Disperso' },
  { value: 'grato', emoji: '🙏', label: 'Grato' },
  { value: 'sobrecarregado', emoji: '🏋️', label: 'Sobrecarregado' },
];

const TRIGGERS = [
  { value: 'sono_ruim', emoji: '😴', label: 'Sono ruim' },
  { value: 'sono_bom', emoji: '✨', label: 'Sono bom' },
  { value: 'discussao', emoji: '💬', label: 'Discussão' },
  { value: 'exercicio', emoji: '🏋️', label: 'Exercício' },
  { value: 'problema_financeiro', emoji: '💸', label: 'Prob. financeiro' },
  { value: 'boa_noticia', emoji: '🎉', label: 'Boa notícia' },
  { value: 'trabalho', emoji: '💼', label: 'Trabalho intenso' },
  { value: 'alimentacao', emoji: '🍎', label: 'Alimentação' },
  { value: 'relacionamento', emoji: '❤️', label: 'Relacionamento' },
  { value: 'tempo_livre', emoji: '🌿', label: 'Tempo livre' },
];

const EVENT_CATS = ['Trabalho', 'Família', 'Relacionamento', 'Saúde', 'Estudos', 'Finanças', 'Lazer', 'Outro'];
const EVENT_IMPACTS = [
  { value: -2, label: 'Muito negativo', emoji: '😞', color: 'red' },
  { value: -1, label: 'Negativo', emoji: '😕', color: 'orange' },
  { value: 0, label: 'Neutro', emoji: '😐', color: 'gray' },
  { value: 1, label: 'Positivo', emoji: '🙂', color: 'blue' },
  { value: 2, label: 'Muito positivo', emoji: '😄', color: 'green' },
];

const GOALS = [
  { id: 'checkin_5x', label: 'Check-in 5x/semana', icon: '📝', target: 5, unit: 'dias' },
  { id: 'stress_baixo', label: 'Estresse médio ≤ 3', icon: '🧘', target: 3, unit: '/5' },
  { id: 'humor_alto', label: 'Humor médio ≥ 4', icon: '😊', target: 4, unit: '/5' },
  { id: 'gratidao_3x', label: 'Gratidão 3x/semana', icon: '🙏', target: 3, unit: 'dias' },
];

const MOTIVATIONAL = {
  5: ['Você está radiante hoje! Continue assim! 🌟', 'Que energia incrível! Aproveite cada momento! ✨', 'Sua positividade é contagiante! 🎉'],
  4: ['Bom dia foi esse! Cada passo conta. 💚', 'Você está no caminho certo. Siga em frente! 🚀', 'Consistência é o segredo. Você está indo bem! 👏'],
  3: ['Dias neutros também fazem parte. Amanhã pode ser melhor! 🌱', 'Está tudo bem não estar sempre no pico. Cuide-se! 🤗', 'Um passo de cada vez. Você tem força! 💪'],
  2: ['Dias difíceis passam. Você é mais forte do que imagina. 🦋', 'Reconhecer como se sente já é um passo enorme. 💛', 'Não desista. Cada amanhecer é uma nova chance. 🌅'],
  1: ['Você não está sozinho(a). Esse momento vai passar. ❤️', 'Buscar ajuda é sinal de coragem, não fraqueza. 🤝', 'Respire. Um momento de cada vez. Estamos com você. 🌿'],
};

function getMotivational(mood, stress) {
  const base = stress >= 4 ? Math.max(1, mood - 1) : mood;
  const arr = MOTIVATIONAL[base] || MOTIVATIONAL[3];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Scale Slider ─────────────────────────────────────────────────────────────
function Scale({ label, value, onChange, min = 1, max = 5, color = 'indigo', lowLabel, highLabel }) {
  const pct = ((value - min) / (max - min)) * 100;
  const colors = {
    indigo: 'bg-indigo-500', green: 'bg-green-500', red: 'bg-red-500',
    orange: 'bg-orange-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
  };
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value}/{max}</span>
      </div>
      <div className="flex items-center gap-3">
        {lowLabel && <span className="text-xs text-gray-400 w-12 text-right">{lowLabel}</span>}
        <div className="flex-1 relative">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div className={`${colors[color]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" />
        </div>
        {highLabel && <span className="text-xs text-gray-400 w-12">{highLabel}</span>}
      </div>
      <div className="flex justify-between mt-1">
        {Array.from({ length: max - min + 1 }, (_, i) => (
          <button key={i} type="button" onClick={() => onChange(i + min)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${value === i + min ? `${colors[color].replace('bg-', 'bg-')} text-white scale-110` : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {i + min}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Breathing Exercise ───────────────────────────────────────────────────────
function BreathingExercise({ onClose }) {
  const [phase, setPhase] = useState('idle'); // idle | inhale | hold | exhale | rest
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);
  const phases = [
    { name: 'inhale', label: 'Inspire', duration: 4, color: 'bg-blue-500', instruction: 'Respire fundo pelo nariz' },
    { name: 'hold', label: 'Segure', duration: 7, color: 'bg-purple-500', instruction: 'Segure o ar' },
    { name: 'exhale', label: 'Expire', duration: 8, color: 'bg-green-500', instruction: 'Solte devagar pela boca' },
  ];
  const [phaseIdx, setPhaseIdx] = useState(0);

  const start = () => { setRunning(true); setPhase('inhale'); setPhaseIdx(0); setCount(phases[0].duration); setCycle(0); };
  const stop = () => { setRunning(false); setPhase('idle'); clearInterval(timerRef.current); };

  useEffect(() => {
    if (!running) return;
    const current = phases[phaseIdx];
    setCount(current.duration);
    setPhase(current.name);
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          const next = (phaseIdx + 1) % phases.length;
          if (phaseIdx === phases.length - 1) setCycle(cy => cy + 1);
          setPhaseIdx(next);
          setPhase(phases[next].name);
          return phases[next].duration;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, phaseIdx]);

  const current = phases[phaseIdx];
  const progress = running ? ((current.duration - count) / current.duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2"><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">🧘 Respiração 4-7-8</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Técnica para reduzir ansiedade e estresse</p>

        {/* Circle */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8"
              className={running ? current.color.replace('bg-', 'stroke-') : 'stroke-gray-300'}
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {running ? (
              <>
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{count}</span>
                <span className="text-sm text-gray-500">{current.label}</span>
              </>
            ) : (
              <span className="text-4xl">🌬️</span>
            )}
          </div>
        </div>

        {running && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{current.instruction}</p>}
        {cycle > 0 && <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">{cycle} ciclo(s) completo(s)</p>}
        <div className="flex gap-3 justify-center">
          {!running ? (
            <button onClick={start} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700">▶ Iniciar</button>
          ) : (
            <button onClick={stop} className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600">⏹ Parar</button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-4">Faça 3–4 ciclos para melhor resultado</p>
      </div>
    </div>
  );
}

// ─── Gratitude Modal ──────────────────────────────────────────────────────────
function GratitudeModal({ onClose, onSave }) {
  const [items, setItems] = useState(['', '', '']);
  const set = (i, v) => setItems(arr => arr.map((a, idx) => idx === i ? v : a));
  const filled = items.filter(i => i.trim());
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">🙏 Checklist de Gratidão</h3>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Liste 3 coisas pelas quais você é grato(a) hoje.</p>
        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{'🌟✨💛'.split('')[i]}</span>
              <input value={item} onChange={e => set(i, e.target.value)} placeholder={`Gratidão ${i + 1}...`} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button onClick={() => { if (filled.length > 0) { onSave(filled); onClose(); } }} disabled={filled.length === 0} className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50">Salvar ({filled.length})</button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Pause Timer ─────────────────────────────────────────────────────────
function PauseTimer({ onClose }) {
  const [minutes, setMinutes] = useState(5);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      setRemaining(minutes * 60);
      ref.current = setInterval(() => setRemaining(r => { if (r <= 1) { clearInterval(ref.current); setRunning(false); return 0; } return r - 1; }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);
  const rem = remaining ?? minutes * 60;
  const m = Math.floor(rem / 60), s = rem % 60;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">⏸ Pausa Mental</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Afaste-se das telas por alguns minutos.</p>
        {!running ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Duração da pausa</p>
            <div className="flex gap-2 justify-center mb-6">
              {[3, 5, 10, 15].map(m => <button key={m} onClick={() => setMinutes(m)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${minutes === m ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{m}min</button>)}
            </div>
          </>
        ) : (
          <div className="text-7xl font-mono font-bold text-teal-600 dark:text-teal-400 mb-6">{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</div>
        )}
        {remaining === 0 && <p className="text-green-600 font-bold mb-4">✅ Pausa concluída! Como se sente?</p>}
        <div className="flex gap-3 justify-center">
          {!running && remaining !== 0 && <button onClick={() => setRunning(true)} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700">▶ Iniciar</button>}
          {running && <button onClick={() => setRunning(false)} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold">⏹ Parar</button>}
          <button onClick={onClose} className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function MoodHeatmap({ entries }) {
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().split('T')[0];
    const entry = entries.filter(e => e.date?.startsWith(ds)).slice(-1)[0];
    return { date: ds, mood: entry?.mood || null, day: d.getDate() };
  });
  const moodColors = { 5: 'bg-green-500', 4: 'bg-blue-400', 3: 'bg-yellow-400', 2: 'bg-orange-400', 1: 'bg-red-500' };
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {last30.map((d, i) => (
          <div key={i} title={`${d.date}${d.mood ? ': ' + MOODS.find(m => m.value === d.mood)?.label : ': sem registro'}`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold cursor-default transition-all hover:scale-110 ${d.mood ? moodColors[d.mood] + ' text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
            {d.day}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {MOODS.map(m => <span key={m.value} className="flex items-center gap-1 text-xs text-gray-500"><span className={`w-3 h-3 rounded ${moodColors[m.value]}`} />{m.label}</span>)}
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />Sem reg.</span>
      </div>
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
function MiniLineChart({ data, color = '#6366f1', label }) {
  if (!data || data.length < 2) return <div className="text-center text-sm text-gray-400 py-4">Poucos dados para gráfico</div>;
  const max = Math.max(...data.map(d => d.value)), min = 1;
  const W = 300, H = 80, pad = 10;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.value - min) / (max - min + 0.1)) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (W - pad * 2);
          const y = H - pad - ((d.value - min) / (max - min + 0.1)) * (H - pad * 2);
          return <circle key={i} cx={x} cy={y} r="4" fill={color} />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// ─── Balance Score ────────────────────────────────────────────────────────────
function BalanceScore({ entries }) {
  if (entries.length === 0) return null;
  const last7 = entries.slice(-7);
  const avgMood = last7.reduce((s, e) => s + (e.mood || 3), 0) / last7.length;
  const avgEnergy = last7.reduce((s, e) => s + (e.energy || 3), 0) / last7.length;
  const avgStress = last7.reduce((s, e) => s + (e.stress || 3), 0) / last7.length;
  const avgAnx = last7.reduce((s, e) => s + (e.anxiety || 3), 0) / last7.length;
  const avgFocus = last7.reduce((s, e) => s + (e.focus || 3), 0) / last7.length;
  const freq = last7.length / 7;
  const score = Math.round((
    (avgMood / 5) * 25 +
    (avgEnergy / 5) * 15 +
    ((5 - avgStress) / 5) * 20 +
    ((5 - avgAnx) / 5) * 15 +
    (avgFocus / 5) * 10 +
    freq * 15
  ));
  const label = score >= 80 ? '🌟 Excelente' : score >= 60 ? '💚 Bom' : score >= 40 ? '💛 Regular' : '❤️ Precisa de atenção';
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';
  const ring = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-blue-500' : score >= 40 ? 'stroke-yellow-500' : 'stroke-red-500';
  const circ = 2 * Math.PI * 42;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">🧠 Índice de Equilíbrio Mental</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className={ring}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${color}`}>{score}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className={`font-bold ${color}`}>{label}</p>
          {[
            { l: 'Humor', v: avgMood, max: 5, c: 'bg-green-500' },
            { l: 'Energia', v: avgEnergy, max: 5, c: 'bg-blue-500' },
            { l: 'Baixo Estresse', v: 5 - avgStress, max: 5, c: 'bg-purple-500' },
            { l: 'Foco', v: avgFocus, max: 5, c: 'bg-orange-500' },
          ].map(item => (
            <div key={item.l} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">{item.l}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className={`${item.c} h-1.5 rounded-full`} style={{ width: `${(item.v / item.max) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500">{item.v.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">* Baseado nos últimos 7 registros. Apenas para autoconhecimento.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Wellness() {
  const { wellnessEntries, addWellnessEntry } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('registro');
  const [showBreathing, setShowBreathing] = useState(false);
  const [showGratitude, setShowGratitude] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [gratitudeLogs, setGratitudeLogs] = useState(() => ls.get('gratitudeLogs', []));
  const [motivationalMsg, setMotivationalMsg] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  // Form state
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [anxiety, setAnxiety] = useState(3);
  const [motivation, setMotivation] = useState(3);
  const [focus, setFocus] = useState(3);
  const [feeling, setFeeling] = useState('');
  const [triggers, setTriggers] = useState([]);
  const [sleepHours, setSleepHours] = useState('');
  const [waterIntake, setWaterIntake] = useState(0);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  // Events
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ description: '', category: 'Trabalho', impact: 0 });
  // Journal
  const [journal, setJournal] = useState({ positive: '', improve: '', learned: '', worried: '' });
  const [notes, setNotes] = useState('');
  // Guided journal expand
  const [journalExpanded, setJournalExpanded] = useState(false);

  useEffect(() => { ls.set('gratitudeLogs', gratitudeLogs); }, [gratitudeLogs]);

  const toggleTrigger = (v) => setTriggers(t => t.includes(v) ? t.filter(x => x !== v) : [...t, v]);

  const addEvent = () => {
    if (!eventForm.description.trim()) return;
    setEvents(e => [...e, { ...eventForm, id: uid() }]);
    setEventForm({ description: '', category: 'Trabalho', impact: 0 });
    setShowEventForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sleepHours) { alert('Por favor, preencha as horas de sono!'); return; }
    const entry = {
      id: uid(),
      date: new Date().toISOString(),
      mood, energy, stress, anxiety, motivation, focus,
      feeling, triggers, sleepHours: parseFloat(sleepHours),
      waterIntake, exerciseMinutes, events, journal, notes,
    };
    addWellnessEntry(entry);
    const msg = getMotivational(mood, stress);
    setMotivationalMsg(msg);
    setSavedMsg(true);
    // Reset
    setMood(3); setEnergy(3); setStress(3); setAnxiety(3); setMotivation(3); setFocus(3);
    setFeeling(''); setTriggers([]); setSleepHours(''); setWaterIntake(0); setExerciseMinutes(0);
    setEvents([]); setJournal({ positive: '', improve: '', learned: '', worried: '' }); setNotes('');
    setJournalExpanded(false);
    setTimeout(() => { setSavedMsg(false); setActiveTab('historico'); }, 3000);
  };

  // Stats
  const entries = wellnessEntries || [];
  const last7 = entries.slice(-7);
  const thisWeekEntries = entries.filter(e => {
    const d = new Date(e.date);
    const now = new Date(); const ws = new Date(now); ws.setDate(ws.getDate() - ws.getDay());
    return d >= ws;
  });

  const weekStats = useMemo(() => {
    if (last7.length === 0) return null;
    const avg = (key) => (last7.reduce((s, e) => s + (e[key] || 3), 0) / last7.length).toFixed(1);
    const bestDay = last7.reduce((best, e) => (!best || e.mood > best.mood) ? e : best, null);
    const worstStress = last7.reduce((w, e) => (!w || e.stress > w.stress) ? e : w, null);
    const trend = last7.length >= 3 ?
      last7.slice(-3).reduce((s, e) => s + e.mood, 0) / 3 >
      last7.slice(0, 3).reduce((s, e) => s + e.mood, 0) / 3 ? 'up' : 'down'
      : null;
    return { avgMood: avg('mood'), avgStress: avg('stress'), avgEnergy: avg('energy'), avgFocus: avg('focus'), bestDay, worstStress, trend };
  }, [last7]);

  const chartData = last7.map(e => ({ value: e.mood, label: fmtShort(e.date) }));
  const stressData = last7.map(e => ({ value: e.stress, label: fmtShort(e.date) }));

  // Goals progress
  const goalsProgress = {
    checkin_5x: thisWeekEntries.length,
    stress_baixo: weekStats ? parseFloat(weekStats.avgStress) : 0,
    humor_alto: weekStats ? parseFloat(weekStats.avgMood) : 0,
    gratidao_3x: gratitudeLogs.filter(g => {
      const d = new Date(g.date); const now = new Date(); const ws = new Date(now); ws.setDate(ws.getDate() - ws.getDay());
      return d >= ws;
    }).length,
  };

  const tabs = [
    { id: 'registro', label: 'Check-in', icon: '📝' },
    { id: 'painel', label: 'Painel', icon: '📊' },
    { id: 'historico', label: 'Histórico', icon: '📋' },
    { id: 'ferramentas', label: 'Ferramentas', icon: '🧰' },
    { id: 'metas', label: 'Metas', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4 pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">💚 Bem-estar</h1>
          <p className="text-indigo-100 text-sm">Autoconhecimento e equilíbrio emocional</p>
        </div>
      </div>

      {/* Medical disclaimer */}
      <div className="max-w-6xl mx-auto px-4 -mt-2">
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-sm">
          <span className="text-2xl flex-shrink-0">⚕️</span>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">Aviso importante</p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">Este aplicativo é uma ferramenta de <strong>autoconhecimento e monitoramento pessoal</strong>. <strong>Não substitui</strong> acompanhamento médico, psicológico ou psiquiátrico profissional. Se estiver passando por dificuldades emocionais sérias, procure um profissional de saúde.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 py-3 px-4 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── REGISTRO ── */}
        {activeTab === 'registro' && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {savedMsg && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white text-center shadow-xl">
                <p className="text-lg font-bold mb-1">✅ Registro salvo!</p>
                <p className="text-green-100 text-sm">{motivationalMsg}</p>
              </div>
            )}

            {/* Mood selector */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">😊 Como está seu humor hoje? *</h3>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setMood(m.value)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${mood === m.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-105 shadow' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-750'}`}>
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emotional dimensions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">📊 Dimensões Emocionais</h3>
              <div className="space-y-6">
                <Scale label="⚡ Energia" value={energy} onChange={setEnergy} color="blue" lowLabel="Esgotado" highLabel="Cheio" />
                <Scale label="😤 Estresse" value={stress} onChange={setStress} color="red" lowLabel="Relaxado" highLabel="Tenso" />
                <Scale label="😰 Ansiedade" value={anxiety} onChange={setAnxiety} color="orange" lowLabel="Calmo" highLabel="Ansioso" />
                <Scale label="💪 Motivação" value={motivation} onChange={setMotivation} color="green" lowLabel="Desmotivado" highLabel="Motivado" />
                <Scale label="🎯 Foco" value={focus} onChange={setFocus} color="purple" lowLabel="Disperso" highLabel="Focado" />
              </div>
            </div>

            {/* Feelings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💭 Como está se sentindo?</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {FEELINGS.map(f => (
                  <button key={f.value} type="button" onClick={() => setFeeling(feeling === f.value ? '' : f.value)}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${feeling === f.value ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 bg-white dark:bg-gray-750'}`}>
                    <span className="text-xl">{f.emoji}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">⚡ O que influenciou seu humor hoje?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Selecione quantos quiser (opcional)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {TRIGGERS.map(t => (
                  <button key={t.value} type="button" onClick={() => toggleTrigger(t.value)}
                    className={`p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all text-sm ${triggers.includes(t.value) ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-teal-300 bg-white dark:bg-gray-750'}`}>
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">📌 Eventos do Dia</h3>
                <button type="button" onClick={() => setShowEventForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  <PlusIcon className="h-4 w-4" />Adicionar
                </button>
              </div>
              {showEventForm && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4 space-y-3">
                  <input value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o evento..." className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={eventForm.category} onChange={e => setEventForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none text-sm">
                      {EVENT_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={eventForm.impact} onChange={e => setEventForm(f => ({ ...f, impact: Number(e.target.value) }))} className="px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none text-sm">
                      {EVENT_IMPACTS.map(i => <option key={i.value} value={i.value}>{i.emoji} {i.label}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={addEvent} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700">Adicionar</button>
                    <button type="button" onClick={() => setShowEventForm(false)} className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-600">Cancelar</button>
                  </div>
                </div>
              )}
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map(ev => {
                    const imp = EVENT_IMPACTS.find(i => i.value === ev.impact);
                    return (
                      <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-xl">{imp?.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{ev.description}</p>
                          <p className="text-xs text-gray-500">{ev.category} • {imp?.label}</p>
                        </div>
                        <button type="button" onClick={() => setEvents(e => e.filter(x => x.id !== ev.id))} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-4 w-4" /></button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum evento adicionado. Registrar eventos ajuda a identificar padrões.</p>
              )}
            </div>

            {/* Physical */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🌡️ Dados Físicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">😴 Horas de sono *</label>
                  <input type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="Ex: 7.5" className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                  {sleepHours && <p className={`mt-1 text-xs font-semibold ${parseFloat(sleepHours) >= 7 ? 'text-green-600' : parseFloat(sleepHours) >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>{parseFloat(sleepHours) >= 7 ? '✅ Ótimo!' : parseFloat(sleepHours) >= 6 ? '⚠️ Razoável' : '❌ Insuficiente'}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">💧 Água (litros)</label>
                  <input type="number" min="0" max="10" step="0.1" value={waterIntake} onChange={e => setWaterIntake(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                  <div className="flex gap-1 mt-1">{[0.5,1,1.5,2,2.5].map(a => <button key={a} type="button" onClick={() => setWaterIntake(a)} className="flex-1 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold hover:bg-blue-100">{a}L</button>)}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">💪 Exercício (min)</label>
                  <input type="number" min="0" max="500" step="5" value={exerciseMinutes} onChange={e => setExerciseMinutes(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                  <div className="flex gap-1 mt-1">{[15,30,45,60].map(m => <button key={m} type="button" onClick={() => setExerciseMinutes(m)} className="flex-1 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded text-xs font-semibold hover:bg-orange-100">{m}m</button>)}</div>
                </div>
              </div>
            </div>

            {/* Guided Journal */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow">
              <button type="button" onClick={() => setJournalExpanded(v => !v)} className="w-full flex items-center justify-between p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">📔 Diário Guiado (opcional)</h3>
                {journalExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
              </button>
              {journalExpanded && (
                <div className="px-5 pb-5 space-y-4">
                  {[
                    { key: 'positive', label: '🌟 O que foi positivo hoje?', ph: 'Uma conquista, momento agradável, coisa boa...' },
                    { key: 'improve', label: '💡 O que poderia melhorar?', ph: 'Algo que gostaria de ter feito diferente...' },
                    { key: 'learned', label: '📚 Algo que você aprendeu?', ph: 'Um insight, lição, nova perspectiva...' },
                    { key: 'worried', label: '😟 Algo que te preocupou?', ph: 'Uma situação, sentimento ou pensamento...' },
                  ].map(({ key, label, ph }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <textarea value={journal[key]} onChange={e => setJournal(j => ({ ...j, [key]: e.target.value }))} rows="2" placeholder={ph} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none resize-none text-sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📝 Anotações Livres</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="4" placeholder="Algo mais que queira registrar sobre seu dia..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none resize-none" />
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all">
                💾 Salvar Registro
              </button>
              <button type="button" onClick={() => { setMood(3); setEnergy(3); setStress(3); setAnxiety(3); setMotivation(3); setFocus(3); setFeeling(''); setTriggers([]); setSleepHours(''); setNotes(''); setWaterIntake(0); setExerciseMinutes(0); setEvents([]); }} className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all">
                🗑️ Limpar
              </button>
            </div>

          </form>
        )}

        {/* ── PAINEL ── */}
        {activeTab === 'painel' && (
          <div className="space-y-5">
            {entries.length === 0 ? (
              <div className="text-center py-16"><span className="text-6xl block mb-4">📊</span><p className="text-gray-500">Faça seu primeiro check-in para ver o painel!</p><button onClick={() => setActiveTab('registro')} className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">Fazer Check-in</button></div>
            ) : (
              <>
                {/* Balance Score */}
                <BalanceScore entries={entries} />

                {/* Weekly stats */}
                {weekStats && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">📈 Resumo dos Últimos 7 Dias</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Humor Médio', value: weekStats.avgMood, icon: '😊', color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Energia Média', value: weekStats.avgEnergy, icon: '⚡', color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Estresse Médio', value: weekStats.avgStress, icon: '😤', color: 'text-red-600 dark:text-red-400' },
                        { label: 'Foco Médio', value: weekStats.avgFocus, icon: '🎯', color: 'text-purple-600 dark:text-purple-400' },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                          <div className="text-2xl mb-1">{s.icon}</div>
                          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tendência emocional:</span>
                      {weekStats.trend === 'up' ? (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><ArrowTrendingUpIcon className="h-4 w-4" />Subindo</span>
                      ) : weekStats.trend === 'down' ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-sm"><ArrowTrendingDownIcon className="h-4 w-4" />Caindo</span>
                      ) : <span className="text-gray-400 text-sm">Estável</span>}
                    </div>
                    {weekStats.bestDay && <p className="text-xs text-green-600 dark:text-green-400">🌟 Melhor dia: {fmtShort(weekStats.bestDay.date)}</p>}
                    {weekStats.worstStress && <p className="text-xs text-red-500 dark:text-red-400">⚠ Maior estresse: {fmtShort(weekStats.worstStress.date)}</p>}
                  </div>
                )}

                {/* Charts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">📉 Evolução Recente</h3>
                  <div className="space-y-5">
                    <MiniLineChart data={chartData} color="#6366f1" label="Humor (últimos 7 dias)" />
                    <MiniLineChart data={stressData} color="#ef4444" label="Estresse (últimos 7 dias)" />
                  </div>
                </div>

                {/* Heatmap */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">🗓️ Mapa de Humor (30 dias)</h3>
                  <MoodHeatmap entries={entries} />
                </div>

                {/* Trigger analysis */}
                {entries.some(e => e.triggers?.length > 0) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">⚡ Análise de Gatilhos</h3>
                    {(() => {
                      const tCount = {};
                      entries.forEach(e => (e.triggers || []).forEach(t => { tCount[t] = (tCount[t] || 0) + 1; }));
                      return Object.entries(tCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => {
                        const trig = TRIGGERS.find(t => t.value === k);
                        const max = Math.max(...Object.values(tCount));
                        return (
                          <div key={k} className="flex items-center gap-3 mb-2">
                            <span className="text-lg">{trig?.emoji || '⚡'}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 w-28">{trig?.label || k}</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(v / max) * 100}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{v}x</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Event category analysis */}
                {entries.some(e => e.events?.length > 0) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">📌 Impacto por Categoria</h3>
                    {(() => {
                      const catImpact = {};
                      entries.forEach(e => (e.events || []).forEach(ev => {
                        if (!catImpact[ev.category]) catImpact[ev.category] = { sum: 0, count: 0 };
                        catImpact[ev.category].sum += ev.impact;
                        catImpact[ev.category].count += 1;
                      }));
                      return Object.entries(catImpact).map(([cat, data]) => {
                        const avg = (data.sum / data.count).toFixed(1);
                        const positive = avg > 0;
                        return (
                          <div key={cat} className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">{cat}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${positive ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : avg < 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{avg > 0 ? '+' : ''}{avg}</span>
                            <span className="text-xs text-gray-400">{data.count} evento(s)</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── HISTÓRICO ── */}
        {activeTab === 'historico' && (
          <div>
            {entries.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-6xl block mb-4">📋</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum registro ainda</h3>
                <button onClick={() => setActiveTab('registro')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">Criar Primeiro Check-in</button>
              </div>
            ) : (
              <div className="space-y-4">
                {[...entries].reverse().map(entry => {
                  const moodObj = MOODS.find(m => m.value === entry.mood);
                  const feelObj = FEELINGS.find(f => f.value === entry.feeling);
                  return (
                    <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-4xl">{moodObj?.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-white">{moodObj?.label} {feelObj ? `• ${feelObj.emoji} ${feelObj.label}` : ''}</p>
                          <p className="text-xs text-gray-500">{fmtDate(entry.date)}</p>
                        </div>
                      </div>
                      {/* Scales */}
                      <div className="px-4 py-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { l: '⚡ Energia', v: entry.energy },
                          { l: '😤 Estresse', v: entry.stress },
                          { l: '😰 Ansied.', v: entry.anxiety },
                          { l: '💪 Motiv.', v: entry.motivation },
                          { l: '🎯 Foco', v: entry.focus },
                          { l: '😴 Sono', v: entry.sleepHours, suffix: 'h' },
                        ].map(s => (
                          <div key={s.l} className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                            <p className="text-xs text-gray-500 mb-0.5">{s.l}</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{s.v || '—'}{s.suffix || (s.v ? '/5' : '')}</p>
                          </div>
                        ))}
                      </div>
                      {/* Triggers */}
                      {entry.triggers?.length > 0 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1">
                          {entry.triggers.map(t => {
                            const tr = TRIGGERS.find(x => x.value === t);
                            return <span key={t} className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full">{tr?.emoji} {tr?.label}</span>;
                          })}
                        </div>
                      )}
                      {/* Events */}
                      {entry.events?.length > 0 && (
                        <div className="px-4 pb-3">
                          {entry.events.map((ev, i) => {
                            const imp = EVENT_IMPACTS.find(x => x.value === ev.impact);
                            return <span key={i} className="inline-flex items-center gap-1 mr-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">{imp?.emoji} {ev.description} ({ev.category})</span>;
                          })}
                        </div>
                      )}
                      {/* Journal snippets */}
                      {entry.journal?.positive && (
                        <div className="px-4 pb-3">
                          <p className="text-xs text-green-600 dark:text-green-400">🌟 {entry.journal.positive}</p>
                        </div>
                      )}
                      {entry.notes && (
                        <div className="px-4 pb-4">
                          <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FERRAMENTAS ── */}
        {activeTab === 'ferramentas' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">🧰 Ferramentas Ativas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pequenas intervenções para regular seu estado emocional.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '🌬️', title: 'Respiração 4-7-8', desc: 'Técnica comprovada para reduzir ansiedade e estresse rapidamente.', color: 'from-blue-600 to-indigo-600', action: () => setShowBreathing(true) },
                { icon: '🙏', title: 'Gratidão', desc: 'Registre 3 coisas pelas quais você é grato hoje.', color: 'from-yellow-500 to-orange-500', action: () => setShowGratitude(true) },
                { icon: '⏸', title: 'Pausa Mental', desc: 'Configure um timer para descansar das telas.', color: 'from-teal-600 to-cyan-600', action: () => setShowPause(true) },
                {
                  icon: '💭', title: 'Reestruturação Cognitiva',
                  desc: 'Técnica simples: identifique um pensamento negativo, questione sua evidência, reformule de forma mais equilibrada.',
                  color: 'from-purple-600 to-pink-600', action: null, content: true
                },
              ].map((tool, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
                  <div className={`bg-gradient-to-r ${tool.color} p-4 flex items-center gap-3`}>
                    <span className="text-3xl">{tool.icon}</span>
                    <h3 className="text-white font-bold text-lg">{tool.title}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tool.desc}</p>
                    {tool.content && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 mb-3 text-sm text-purple-800 dark:text-purple-200 space-y-1">
                        <p>1️⃣ <strong>Identifique:</strong> "Que pensamento me incomoda?"</p>
                        <p>2️⃣ <strong>Questione:</strong> "Tenho provas reais disso?"</p>
                        <p>3️⃣ <strong>Reformule:</strong> "Como pensaria de forma mais equilibrada?"</p>
                      </div>
                    )}
                    {tool.action && (
                      <button onClick={tool.action} className={`w-full py-2.5 bg-gradient-to-r ${tool.color} text-white rounded-xl font-bold hover:opacity-90 transition-opacity`}>
                        Abrir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Gratitude log */}
            {gratitudeLogs.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">🙏 Histórico de Gratidão</h3>
                <div className="space-y-3">
                  {[...gratitudeLogs].reverse().slice(0, 5).map((log, i) => (
                    <div key={i} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{fmtDate(log.date)}</p>
                      {log.items.map((item, j) => <p key={j} className="text-sm text-gray-700 dark:text-gray-300">{'🌟✨💛'.split('')[j]} {item}</p>)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── METAS ── */}
        {activeTab === 'metas' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎯 Metas de Bem-Estar</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe seu progresso semanal.</p>

            {GOALS.map(goal => {
              const prog = goalsProgress[goal.id] || 0;
              const isStress = goal.id === 'stress_baixo';
              const isHumor = goal.id === 'humor_alto';
              const achieved = isStress ? prog <= goal.target && entries.length > 0 : isHumor ? prog >= goal.target && entries.length > 0 : prog >= goal.target;
              const pct = isStress
                ? entries.length > 0 ? Math.min(((5 - prog) / (5 - goal.target)) * 100, 100) : 0
                : isHumor
                ? Math.min((prog / goal.target) * 100, 100)
                : Math.min((prog / goal.target) * 100, 100);
              return (
                <div key={goal.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border-2 transition-all ${achieved ? 'border-green-400 dark:border-green-600' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.icon}</span>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{goal.label}</p>
                        <p className="text-xs text-gray-500">Esta semana</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{isStress || isHumor ? (entries.length > 0 ? prog : '—') : prog}{isStress || isHumor ? goal.unit : `/${goal.target}`}</p>
                      {achieved && <span className="text-xs text-green-600 font-bold">✅ Meta atingida!</span>}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${achieved ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-2">💡 Como atingir suas metas</h3>
              <ul className="text-sm text-indigo-100 space-y-1">
                <li>• Faça check-in todos os dias, mesmo que breve</li>
                <li>• Use as ferramentas de respiração em momentos de estresse</li>
                <li>• Registre eventos para entender seus gatilhos</li>
                <li>• Pratique gratidão regularmente</li>
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
      {showGratitude && <GratitudeModal onClose={() => setShowGratitude(false)} onSave={items => setGratitudeLogs(l => [{ items, date: new Date().toISOString() }, ...l])} />}
      {showPause && <PauseTimer onClose={() => setShowPause(false)} />}
    </div>
  );
}