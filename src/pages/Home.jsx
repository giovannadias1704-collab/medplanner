import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../components/PageLayout';
import PageLayout from '../components/PageLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

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
function Wheel360({ scores, T }) {
  const size = 180;
  const cx = size / 2, cy = size / 2;
  const r = 68, innerR = 28;

  const sectors = [
    { key: 'casa',        label: 'Casa',         emoji: '🏠', color: '#a7f3d0' },
    { key: 'estudos',     label: 'Estudos',      emoji: '📚', color: '#bfdbfe' },
    { key: 'financas',    label: 'Finanças',     emoji: '💰', color: '#fde68a' },
    { key: 'calendario',  label: 'Agenda',       emoji: '📅', color: '#e9d5ff' },
    { key: 'saudeFisica', label: 'Saúde Física', emoji: '💪', color: '#fbcfe8' },
    { key: 'saudeMental', label: 'Saúde Mental', emoji: '🧠', color: '#fed7aa' },
  ];

  const n = sectors.length;
  const angleStep = (2 * Math.PI) / n;

  const polarToCart = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const describeArc = (startAngle, endAngle, outerR, innerRad) => {
    const gap = 0.06;
    const s = startAngle + gap, e = endAngle - gap;
    const o1 = polarToCart(s, outerR), o2 = polarToCart(e, outerR);
    const i1 = polarToCart(e, innerRad), i2 = polarToCart(s, innerRad);
    return `M${o1.x},${o1.y} A${outerR},${outerR} 0 0,1 ${o2.x},${o2.y} L${i1.x},${i1.y} A${innerRad},${innerRad} 0 0,0 ${i2.x},${i2.y} Z`;
  };

  const minKey = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0];
  const minSector = sectors.find(s => s.key === minKey);
  const startOffset = -Math.PI / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {sectors.map((sec, i) => {
          const startAngle = startOffset + i * angleStep;
          const endAngle   = startOffset + (i + 1) * angleStep;
          const score = scores[sec.key] ?? 0.7;
          const arcR  = innerR + (r - innerR) * score;
          return (
            <g key={sec.key}>
              <path d={describeArc(startAngle, endAngle, r, innerR)} fill={T.border} />
              <path d={describeArc(startAngle, endAngle, arcR, innerR)} fill={sec.color} opacity="0.85"
                style={{ transition: 'all 0.8s ease' }} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={innerR - 4} fill={T.card} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14">🌿</text>
      </svg>
      <p style={{
        textAlign: 'center', fontSize: 12, color: T.textSec, marginTop: 10,
        maxWidth: 200, lineHeight: 1.4, fontFamily: "'Poppins',sans-serif",
      }}>
        {minSector
          ? <><strong style={{ color: T.text }}>Atenção em:</strong> {minSector.emoji} {minSector.label}</>
          : 'Sua vida está equilibrada esta semana.'}
      </p>
    </div>
  );
}

// ─── Portal Card ──────────────────────────────────────────────────────────────
function PortalCard({ emoji, label, accent, onClick, T }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        borderRadius: 16, border: `2px solid ${accent}55`,
        background: accent + '18', padding: '16px 8px',
        cursor: 'pointer', transition: 'all 150ms ease',
        fontFamily: "'Poppins',sans-serif",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 4px 16px ${accent}44`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.text, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { T } = useTheme();
  const { wellBeingEntries } = useContext(AppContext);

  const [homeTasks,   setHomeTasks]   = useState([]);
  const [topPriority, setTopPriority] = useState(null);
  const [phrase] = useState(getPhrase);

  const [scores, setScores] = useState({
    casa: 0.7, estudos: 0.7, financas: 0.7,
    calendario: 0.7, saudeFisica: 0.7, saudeMental: 0.7,
  });

  useEffect(() => { if (user) loadHomeTasks(); }, [user]);

  useEffect(() => {
    const last7 = (wellBeingEntries || []).slice(-7);
    const avg = (arr, key) => arr.length
      ? arr.reduce((s, e) => s + (e[key] || 3), 0) / arr.length / 5
      : 0.6;
    const completedRatio = homeTasks.length > 0
      ? homeTasks.filter(t => t.completed).length / homeTasks.length
      : 0.6;
    setScores({
      casa:        completedRatio,
      estudos:     0.65,
      financas:    0.7,
      calendario:  0.72,
      saudeFisica: avg(last7, 'energy'),
      saudeMental: (avg(last7, 'mood') + (1 - avg(last7, 'stress'))) / 2,
    });
  }, [wellBeingEntries, homeTasks]);

  const loadHomeTasks = async () => {
    try {
      const q = query(
        collection(db, 'homeTasks'),
        where('userId', '==', user.uid),
        where('date', '==', todayStr())
      );
      const snap = await getDocs(q);
      const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHomeTasks(tasks);
      setTopPriority(tasks.find(t => !t.completed)?.title || null);
    } catch (e) { console.error(e); }
  };

  const firstName = user?.displayName?.split(' ')[0] || 'você';
  const greeting  = getGreeting();

  const portals = [
    { emoji: '✅', label: 'Tarefas',    accent: '#a7f3d0', path: '/tasks'     },
    { emoji: '📅', label: 'Calendário', accent: '#bfdbfe', path: '/calendar'  },
    { emoji: '💰', label: 'Finanças',   accent: '#fde68a', path: '/financeiro'},
    { emoji: '💚', label: 'Saúde',      accent: '#fbcfe8', path: '/wellness'  },
    { emoji: '📚', label: 'Estudos',    accent: '#c4b5fd', path: '/study'     },
    { emoji: '🌐', label: 'Visão 360°', accent: '#fed7aa', path: '/dashboard' },
  ];

  return (
    <PageLayout showHeader={false}>
      <div style={{ minHeight: '100vh', paddingBottom: 120 }}>

        {/* ── Saudação ── */}
        <div style={{ paddingTop: 40, paddingBottom: 24, textAlign: 'center' }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: T.textSec,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            fontFamily: "'Poppins',sans-serif",
          }}>
            {formatDateFull()}
          </p>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: T.text, margin: 0,
            fontFamily: "'Poppins',sans-serif", letterSpacing: '-0.5px',
          }}>
            {greeting}, {firstName}.
          </h1>
          <p style={{
            marginTop: 8, fontSize: 13, color: T.textSec, fontStyle: 'italic',
            fontFamily: "'Poppins',sans-serif",
          }}>
            "{phrase}"
          </p>
        </div>

        {/* ── Wheel 360 ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 24, boxShadow: T.shadow,
            padding: '20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: T.textSec,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
              fontFamily: "'Poppins',sans-serif",
            }}>Equilíbrio Semanal</p>
            <Wheel360 scores={scores} T={T} />
          </div>
        </div>

        {/* ── Prioridade do Dia ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            background: T.accentBg, border: `2px solid ${T.accent}44`,
            borderRadius: 18, padding: '18px 20px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 28, marginTop: 2 }}>🎯</span>
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, color: T.accent,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
                fontFamily: "'Poppins',sans-serif",
              }}>Prioridade de hoje</p>
              {topPriority
                ? <p style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: "'Poppins',sans-serif" }}>{topPriority}</p>
                : <p style={{ fontSize: 13, color: T.textSec, fontFamily: "'Poppins',sans-serif" }}>Nenhuma tarefa pendente. Bom trabalho! 🎉</p>
              }
            </div>
          </div>
        </div>

        {/* ── Portais ── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 10, fontWeight: 600, color: T.textSec,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
            fontFamily: "'Poppins',sans-serif",
          }}>Para onde ir agora</p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          }}>
            {portals.map(p => (
              <PortalCard
                key={p.path}
                emoji={p.emoji}
                label={p.label}
                accent={p.accent}
                T={T}
                onClick={() => navigate(p.path)}
              />
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}