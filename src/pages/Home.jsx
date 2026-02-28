import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AppContext } from '../context/AppContext';
import { generateText } from '../services/gemini';
import PageLayout from '../components/PageLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

const GREETINGS = [
  (name) => `Bom dia, ${name}.`,
  (name) => `Olá, ${name}.`,
  (name) => `Bem-vindo de volta, ${name}.`,
];

const STRATEGIC_PHRASES = [
  'Organização é ritmo, não excesso.',
  'Hoje é dia de constância.',
  'Pequenos passos constroem grandes resultados.',
  'Foco no processo, não na perfeição.',
  'Clareza cria espaço para o que importa.',
  'Uma coisa de cada vez.',
  'A disciplina é a ponte entre metas e conquistas.',
  'Feito é melhor que perfeito.',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getPhrase() {
  return STRATEGIC_PHRASES[Math.floor(Math.random() * STRATEGIC_PHRASES.length)];
}

function formatDateFull() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── 360° Wheel ───────────────────────────────────────────────────────────────
function Wheel360({ scores }) {
  // scores: { casa, estudos, financas, calendario, saudeFisica, saudeMental }
  // each 0–1
  const size = 180;
  const cx = size / 2, cy = size / 2;
  const r = 68, innerR = 28;

  const sectors = [
    { key: 'casa',         label: 'Casa',         emoji: '🏠', color: '#a7f3d0' },
    { key: 'estudos',      label: 'Estudos',      emoji: '📚', color: '#bfdbfe' },
    { key: 'financas',     label: 'Finanças',     emoji: '💰', color: '#fde68a' },
    { key: 'calendario',   label: 'Agenda',       emoji: '📅', color: '#e9d5ff' },
    { key: 'saudeFisica',  label: 'Saúde Física', emoji: '💪', color: '#fbcfe8' },
    { key: 'saudeMental',  label: 'Saúde Mental', emoji: '🧠', color: '#fed7aa' },
  ];

  const n = sectors.length;
  const angleStep = (2 * Math.PI) / n;

  const polarToCart = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const describeArc = (startAngle, endAngle, outerR, innerRad) => {
    const gap = 0.06;
    const s = startAngle + gap;
    const e = endAngle - gap;
    const o1 = polarToCart(s, outerR);
    const o2 = polarToCart(e, outerR);
    const i1 = polarToCart(e, innerRad);
    const i2 = polarToCart(s, innerRad);
    return `M${o1.x},${o1.y} A${outerR},${outerR} 0 0,1 ${o2.x},${o2.y} L${i1.x},${i1.y} A${innerRad},${innerRad} 0 0,0 ${i2.x},${i2.y} Z`;
  };

  // lowest score = sector to highlight
  const minKey = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0];
  const minSector = sectors.find(s => s.key === minKey);

  const startOffset = -Math.PI / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        {sectors.map((sec, i) => {
          const startAngle = startOffset + i * angleStep;
          const endAngle = startOffset + (i + 1) * angleStep;
          const score = scores[sec.key] ?? 0.7;
          const arcR = innerR + (r - innerR) * score;
          return (
            <g key={sec.key}>
              {/* Background track */}
              <path
                d={describeArc(startAngle, endAngle, r, innerR)}
                fill="#f3f4f6"
                className="dark:fill-gray-700"
              />
              {/* Filled arc */}
              <path
                d={describeArc(startAngle, endAngle, arcR, innerR)}
                fill={sec.color}
                opacity="0.85"
                style={{ transition: 'all 0.8s ease' }}
              />
            </g>
          );
        })}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={innerR - 4} fill="white" className="dark:fill-gray-800" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" className="select-none">🌿</text>
      </svg>

      {/* Status text */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-[200px] leading-snug">
        {minSector
          ? <><span className="font-semibold text-gray-700 dark:text-gray-300">Atenção maior em:</span> {minSector.emoji} {minSector.label}</>
          : 'Sua vida está estável esta semana.'}
      </p>
    </div>
  );
}

// ─── Nav Portal Card ──────────────────────────────────────────────────────────
function PortalCard({ emoji, label, to, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all hover:scale-105 hover:shadow-md active:scale-95"
      style={{ borderColor: accent + '55', background: accent + '18' }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{label}</span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { wellnessEntries } = useContext(AppContext);

  const [homeTasks, setHomeTasks] = useState([]);
  const [topPriority, setTopPriority] = useState(null);
  const [phrase] = useState(getPhrase);

  // Derive 360 scores from available data
  const [scores, setScores] = useState({
    casa: 0.7,
    estudos: 0.7,
    financas: 0.7,
    calendario: 0.7,
    saudeFisica: 0.7,
    saudeMental: 0.7,
  });

  useEffect(() => {
    if (user) {
      loadHomeTasks();
    }
  }, [user]);

  // Derive scores
  useEffect(() => {
    const last7Wellness = (wellnessEntries || []).slice(-7);

    // Mental health from wellness
    const avgMood = last7Wellness.length
      ? last7Wellness.reduce((s, e) => s + (e.mood || 3), 0) / last7Wellness.length / 5
      : 0.6;
    const avgStress = last7Wellness.length
      ? 1 - (last7Wellness.reduce((s, e) => s + (e.stress || 3), 0) / last7Wellness.length / 5)
      : 0.6;
    const avgEnergy = last7Wellness.length
      ? last7Wellness.reduce((s, e) => s + (e.energy || 3), 0) / last7Wellness.length / 5
      : 0.6;

    // Casa: from completed tasks ratio
    const completedRatio = homeTasks.length > 0
      ? homeTasks.filter(t => t.completed).length / homeTasks.length
      : 0.6;

    setScores({
      casa: completedRatio,
      estudos: 0.65,        // placeholder — could wire to study sessions
      financas: 0.7,        // placeholder — could wire to financial data
      calendario: 0.72,     // placeholder
      saudeFisica: avgEnergy,
      saudeMental: (avgMood + avgStress) / 2,
    });
  }, [wellnessEntries, homeTasks]);

  const loadHomeTasks = async () => {
    try {
      const today = todayStr();
      const q = query(
        collection(db, 'homeTasks'),
        where('userId', '==', user.uid),
        where('date', '==', today)
      );
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHomeTasks(tasks);

      // top priority = first incomplete
      const first = tasks.find(t => !t.completed);
      setTopPriority(first?.title || null);
    } catch (e) {
      console.error(e);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || 'você';
  const greeting = getGreeting();

  const portals = [
    { emoji: '✅', label: 'Tarefas',    accent: '#a7f3d0', path: '/tasks' },
    { emoji: '📅', label: 'Calendário', accent: '#bfdbfe', path: '/calendar' },
    { emoji: '💰', label: 'Finanças',   accent: '#fde68a', path: '/financeiro' },
    { emoji: '💚', label: 'Saúde',      accent: '#fbcfe8', path: '/wellness' },
    { emoji: '📚', label: 'Estudos',    accent: '#e9d5ff', path: '/study' },
    { emoji: '🌐', label: 'Visão 360°', accent: '#fed7aa', path: '/dashboard' },
  ];

  return (
    <PageLayout showHeader={false}>
      <div className="min-h-screen pb-32">

        {/* ── Saudação ─────────────────────────────────────────────────────── */}
        <div className="pt-10 pb-6 px-2 text-center">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            {formatDateFull()}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 italic">
            "{phrase}"
          </p>
        </div>

        {/* ── Wheel 360 + Status ───────────────────────────────────────────── */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 px-8 py-6 flex flex-col items-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Equilíbrio Semanal</p>
            <Wheel360 scores={scores} />
          </div>
        </div>

        {/* ── Prioridade do Dia ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-2 border-violet-200 dark:border-violet-700 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-3xl mt-0.5">🎯</span>
            <div>
              <p className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-1">Prioridade de hoje</p>
              {topPriority ? (
                <p className="text-base font-bold text-gray-900 dark:text-white">{topPriority}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma tarefa pendente. Bom trabalho! 🎉</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Portais de Navegação ─────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Para onde ir agora</p>
          <div className="grid grid-cols-3 gap-3">
            {portals.map(p => (
              <PortalCard
                key={p.path}
                emoji={p.emoji}
                label={p.label}
                accent={p.accent}
                onClick={() => navigate(p.path)}
              />
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}