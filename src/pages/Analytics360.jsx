import { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useSubscription } from '../hooks/useSubscription';
import PremiumBlock from '../components/PremiumBlock';
import PageLayout, { useTheme } from '../components/PageLayout';

// ============================================================
// UTILS
// ============================================================

function normalize(value, min, max) {
  if (max === min) return 50;
  return Math.round(Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)));
}

function sleepScore(h) {
  if (h >= 7 && h <= 9) return 100;
  if (h >= 6 && h < 7) return 75;
  if (h >= 5 && h < 6) return 50;
  if (h > 9) return 85;
  return 30;
}

function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xs = x.slice(0, n), ys = y.slice(0, n);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, xi, i) => sum + (xi - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, xi) => s + (xi - mx) ** 2, 0) *
    ys.reduce((s, yi) => s + (yi - my) ** 2, 0)
  );
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { slope: 0, direction: 'estável' };
  const xs = values.map((_, i) => i);
  const ys = values;
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, xi, i) => s + (xi - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, xi) => s + (xi - mx) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  const direction = slope > 0.3 ? 'subindo' : slope < -0.3 ? 'caindo' : 'estável';
  return { slope: Math.round(slope * 100) / 100, direction };
}

function movingAverage(values, window = 3) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function moodToScore(mood) {
  const map = { excelente: 100, bom: 80, neutro: 60, ruim: 35, pessimo: 10 };
  return map[mood] ?? 60;
}

// ============================================================
// SUB-COMPONENTS (usam T do tema via props)
// ============================================================

function ScoreRing({ score, size = 80, strokeWidth = 8, color }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(0,0,0,0.08)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

function TrendBadge({ direction, T }) {
  const cfg = {
    subindo:  { icon: '↑', bg: T.accentBg, color: T.accent },
    caindo:   { icon: '↓', bg: '#fde8e8',  color: '#c0392b' },
    estável:  { icon: '→', bg: T.badge,    color: T.textSec },
  };
  const c = cfg[direction] || cfg['estável'];
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: c.bg, color: c.color,
    }}>{c.icon}</span>
  );
}

function Heatmap({ data, label, color, T }) {
  const weeks = [];
  const today = new Date();
  for (let w = 8; w >= 0; w--) {
    const week = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - w * 7 - d);
      const key = dt.toISOString().split('T')[0];
      const found = data.find(x => x.date?.startsWith(key));
      week.push({ date: key, value: found?.value ?? null });
    }
    weeks.push(week);
  }
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 16,
    }}>
      <div style={{
        fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 700,
        color: T.textSec, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 3, marginBottom: 6 }}>
        {weeks.map((week, wi) =>
          week.map((cell, di) => (
            <div
              key={`${wi}-${di}`}
              title={cell.date + (cell.value !== null ? `: ${cell.value}` : ': sem dado')}
              style={{
                aspectRatio: '1', borderRadius: 3,
                background: cell.value === null
                  ? T.border
                  : `${color}${Math.round((cell.value / 100) * 200 + 55).toString(16).padStart(2, '0')}`,
              }}
            />
          ))
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {['D','S','T','Q','Q','S','S'].map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: T.textSec, opacity: 0.6 }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function MiniSparkline({ values, color, width = 120, height = 36 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height * 0.9 - height * 0.05;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Analytics() {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const { hasFeature, isFree } = useSubscription();
  const { T } = useTheme();

  const {
    wellnessEntries = [],
    events = [],
    pblCases = [],
    tasks = [],
    healthRecords = [],
    studySessions = []
  } = context || {};

  const [activeTab, setActiveTab] = useState('visao360');
  const [timePeriod, setTimePeriod] = useState('30');
  const [influenceTarget, setInfluenceTarget] = useState('humor');

  // cores semânticas adaptadas ao tema
  const C = {
    blue:   T.accent,
    purple: T.accent,
    yellow: T.textSec,
    green:  T.accent,
    red:    '#c0392b',
    redBg:  '#fde8e8',
  };

  const filteredData = useMemo(() => {
    const days = parseInt(timePeriod);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const f = (items, field = 'date') =>
      (items || []).filter(item => {
        try { return new Date(item[field]) >= cutoff; } catch { return false; }
      });
    return {
      wellness: f(wellnessEntries),
      events: f(events),
      pbl: f(pblCases, 'createdAt'),
      tasks: f(tasks, 'createdAt'),
      health: f(healthRecords),
      study: f(studySessions),
    };
  }, [timePeriod, wellnessEntries, events, pblCases, tasks, healthRecords, studySessions]);

  const timeSeries = useMemo(() => {
    const sorted = [...filteredData.wellness].sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      dates:    sorted.map(e => e.date),
      sleep:    sorted.map(e => sleepScore(e.sleepHours || 0)),
      mood:     sorted.map(e => moodToScore(e.mood)),
      water:    sorted.map(e => normalize(e.waterIntake || 0, 0, 3.5)),
      exercise: sorted.map(e => normalize(e.exerciseMinutes || 0, 0, 90)),
    };
  }, [filteredData.wellness]);

  const scores = useMemo(() => {
    const w = filteredData.wellness;
    let physicalScore = 0;
    if (w.length > 0) {
      const avgSleep = w.reduce((s, e) => s + sleepScore(e.sleepHours || 0), 0) / w.length;
      const avgEx   = w.reduce((s, e) => s + normalize(e.exerciseMinutes || 0, 0, 90), 0) / w.length;
      const avgWater= w.reduce((s, e) => s + normalize(e.waterIntake || 0, 0, 3.5), 0) / w.length;
      physicalScore = Math.round(avgSleep * 0.5 + avgEx * 0.3 + avgWater * 0.2);
    }
    let mentalScore = w.length > 0
      ? Math.round(w.reduce((s, e) => s + moodToScore(e.mood), 0) / w.length)
      : 0;
    let prodScore = 0, prodCount = 0;
    if (filteredData.tasks.length > 0) { prodScore += (filteredData.tasks.filter(t => t.completed).length / filteredData.tasks.length) * 100; prodCount++; }
    if (filteredData.events.length > 0) { prodScore += (filteredData.events.filter(e => e.completed).length / filteredData.events.length) * 100; prodCount++; }
    if (filteredData.study.length > 0) {
      const hours = filteredData.study.reduce((s, x) => s + (x.duration || 0), 0) / 60;
      prodScore += Math.min(100, (hours / (parseInt(timePeriod) * 1.5)) * 100);
      prodCount++;
    }
    if (prodCount > 0) prodScore = Math.round(prodScore / prodCount);
    const global    = Math.round((physicalScore + mentalScore + prodScore) / 3);
    const sleepReg  = linearRegression(timeSeries.sleep);
    const moodReg   = linearRegression(timeSeries.mood);
    return { physical: physicalScore, mental: mentalScore, productivity: prodScore, global, sleepReg, moodReg };
  }, [filteredData, timeSeries, timePeriod]);

  const correlations = useMemo(() => {
    const { sleep, mood, water, exercise } = timeSeries;
    return [
      { label: 'Sono × Humor',         x: sleep,    y: mood,     impact: 'humor' },
      { label: 'Exercício × Humor',     x: exercise, y: mood,     impact: 'humor' },
      { label: 'Exercício × Energia',   x: exercise, y: sleep,    impact: 'energia' },
      { label: 'Hidratação × Humor',    x: water,    y: mood,     impact: 'humor' },
      { label: 'Sono × Produtividade',  x: sleep,    y: exercise, impact: 'produtividade' },
    ]
      .map(p => ({ ...p, r: pearsonCorrelation(p.x, p.y) }))
      .filter(p => Math.abs(p.r) >= 0.2)
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [timeSeries]);

  const alerts = useMemo(() => {
    const result = [];
    const w = [...filteredData.wellness].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (w.slice(0, 5).length === 5 && w.slice(0, 5).every(e => moodToScore(e.mood) < 50))
      result.push({ type: 'warning', msg: '5 dias consecutivos com humor abaixo do ideal. Considere uma pausa regenerativa.' });
    if (w.slice(0, 4).length === 4 && w.slice(0, 4).every(e => (e.sleepHours || 0) < 6))
      result.push({ type: 'danger', msg: 'Média de sono abaixo de 6h nos últimos 4 dias. Risco de burnout elevado.' });
    if (scores.sleepReg.direction === 'caindo')
      result.push({ type: 'info', msg: 'Qualidade do sono em tendência de queda. Revise sua rotina noturna.' });
    if (scores.moodReg.direction === 'caindo')
      result.push({ type: 'warning', msg: 'Humor apresenta tendência de queda no período selecionado.' });
    return result;
  }, [filteredData, scores]);

  const burnoutRisk = useMemo(() => {
    let risk = 0;
    if (scores.mental < 50) risk += 35;
    else if (scores.mental < 70) risk += 15;
    if (scores.physical < 50) risk += 30;
    if (scores.sleepReg.direction === 'caindo') risk += 20;
    if (scores.moodReg.direction === 'caindo') risk += 15;
    return Math.min(100, risk);
  }, [scores]);

  const heatmapData = useMemo(() => ({
    mood:  wellnessEntries.map(e => ({ date: e.date, value: moodToScore(e.mood) })),
    sleep: wellnessEntries.map(e => ({ date: e.date, value: sleepScore(e.sleepHours || 0) })),
    prod:  tasks.map(t => ({ date: t.createdAt, value: t.completed ? 100 : 20 })),
  }), [wellnessEntries, tasks]);

  const hasAnyData = wellnessEntries.length > 0 || events.length > 0 || tasks.length > 0 || studySessions.length > 0;
  const periodLabel = { '7': '7 dias', '30': '30 dias', '90': '90 dias' }[timePeriod];

  const scoreColor = (s) => s >= 80 ? T.accent : s >= 60 ? T.accent : s >= 40 ? T.textSec : C.red;

  // ── Estilos reutilizáveis baseados em T ───────────────────────────────────
  const card = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 18,
    padding: '20px 18px',
  };

  const sectionTitle = {
    fontFamily: "'Poppins',sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: T.text,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const tabBase = {
    flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
    fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
  };

  const periodBtnBase = {
    padding: '7px 20px', borderRadius: 20,
    border: `1px solid ${T.border}`,
    fontFamily: "'Poppins',sans-serif", fontSize: 13,
    cursor: 'pointer', transition: 'all 0.2s',
  };

  return (
    <PageLayout emoji="📊" title="Visão 360°" subtitle="Inteligência integrada de todas as suas dimensões de vida">

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4,
        background: T.input, borderRadius: 14, padding: 5,
        marginBottom: 24, border: `1px solid ${T.border}`,
      }}>
        {[
          { key: 'visao360',    label: '🔮 Visão 360°' },
          { key: 'diario',      label: '📅 Hoje' },
          { key: 'comparativo', label: '📈 Comparativo', premium: isFree() },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key === 'comparativo' && !hasFeature('advancedAnalytics')) { navigate('/pricing'); return; }
              setActiveTab(t.key);
            }}
            style={{
              ...tabBase,
              background: activeTab === t.key ? T.card : 'transparent',
              color: activeTab === t.key ? T.text : T.textSec,
              fontWeight: activeTab === t.key ? 700 : 400,
              boxShadow: activeTab === t.key ? `0 2px 8px rgba(0,0,0,0.06)` : 'none',
            }}
          >
            {t.label}
            {t.premium && (
              <span style={{
                fontSize: 10, background: T.accent, color: '#fff',
                padding: '2px 7px', borderRadius: 20, marginLeft: 6,
              }}>PRO</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: VISÃO 360° ══════════════ */}
      {activeTab === 'visao360' && (
        <div>
          {/* Filtro de período */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias']].map(([v, l]) => (
              <button key={v} onClick={() => setTimePeriod(v)} style={{
                ...periodBtnBase,
                background: timePeriod === v ? T.accentBg : 'transparent',
                color: timePeriod === v ? T.accent : T.textSec,
                borderColor: timePeriod === v ? T.accent : T.border,
                fontWeight: timePeriod === v ? 700 : 400,
              }}>{l}</button>
            ))}
          </div>

          {!hasAnyData ? (
            /* Empty state */
            <div style={{ ...card, textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔮</div>
              <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 20, color: T.text, marginBottom: 8 }}>
                Nenhum dado ainda
              </h3>
              <p style={{ color: T.textSec, marginBottom: 24, fontSize: 14 }}>
                Comece a registrar para ver sua inteligência integrada aqui.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/wellness" style={{
                  padding: '11px 22px', borderRadius: 12, background: T.accent,
                  color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 600,
                  fontSize: 14, border: 'none', textDecoration: 'none', display: 'inline-block',
                }}>Registrar Bem-estar</a>
              </div>
            </div>
          ) : (
            <>
              {/* Score Global */}
              <div style={{
                ...card,
                background: `linear-gradient(135deg, ${T.card} 0%, ${T.accentBg} 100%)`,
                display: 'flex', alignItems: 'center', gap: 28,
                marginBottom: 20, flexWrap: 'wrap',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ScoreRing score={scores.global} size={110} strokeWidth={10} color={scoreColor(scores.global)} />
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 30, fontWeight: 800, color: scoreColor(scores.global), lineHeight: 1 }}>
                      {scores.global}
                    </span>
                    <span style={{ fontSize: 11, color: T.textSec, letterSpacing: '0.06em' }}>/ 100</span>
                  </div>
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6 }}>
                    Score de Equilíbrio Global
                  </h2>
                  <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.5, marginBottom: 12 }}>
                    {scores.global >= 80 ? '🎉 Você está em excelente equilíbrio!' :
                     scores.global >= 60 ? '👍 Bom trabalho! Pequenos ajustes podem elevar seu nível.' :
                     scores.global >= 40 ? '📈 Existem áreas com bom potencial de melhora.' :
                     '💪 Algumas dimensões precisam de atenção. Comece pelo sono.'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: T.accentBg, color: T.accent, border: `1px solid ${T.accent}33` }}>
                      {scores.physical >= scores.mental && scores.physical >= scores.productivity ? '💪 Melhor: Saúde Física'
                       : scores.mental >= scores.physical && scores.mental >= scores.productivity ? '🧠 Melhor: Bem-Estar Mental'
                       : '🎯 Melhor: Produtividade'}
                    </span>
                    <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: C.redBg, color: C.red, border: `1px solid ${C.red}33` }}>
                      {scores.physical <= scores.mental && scores.physical <= scores.productivity ? '⚠️ Atenção: Saúde Física'
                       : scores.mental <= scores.physical && scores.mental <= scores.productivity ? '⚠️ Atenção: Bem-Estar Mental'
                       : '⚠️ Atenção: Produtividade'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12, marginBottom: 20,
              }}>
                {[
                  { icon: '🔵', label: 'Saúde Física',     score: scores.physical,    trend: scores.sleepReg.direction, insight: 'Sono, exercício e hidratação' },
                  { icon: '🟣', label: 'Bem-Estar Mental',  score: scores.mental,      trend: scores.moodReg.direction,  insight: 'Baseado nos registros de humor' },
                  { icon: '🟡', label: 'Produtividade',     score: scores.productivity,trend: 'estável',                  insight: 'Tarefas + horas de estudo' },
                  { icon: '🟢', label: 'Financeiro',        score: 0,                  trend: 'estável',                  insight: 'Conecte o módulo financeiro' },
                ].map(c => (
                  <div key={c.label} style={{ ...card }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textSec, marginBottom: 10 }}>
                      {c.icon} {c.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <ScoreRing score={c.score} size={52} strokeWidth={6} color={scoreColor(c.score)} />
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 32, fontWeight: 800, color: scoreColor(c.score) }}>{c.score}</span>
                      <TrendBadge direction={c.trend} T={T} />
                    </div>
                    <div style={{ fontSize: 12, color: T.textSec, borderTop: `1px solid ${T.border}`, paddingTop: 8, lineHeight: 1.4 }}>
                      {c.insight}
                    </div>
                  </div>
                ))}
              </div>

              {/* Burnout */}
              <div style={{ ...card, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textSec, marginBottom: 14 }}>
                  🔥 Risco de Burnout
                </div>
                <div style={{ height: 10, background: T.badge, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    height: '100%', borderRadius: 10, transition: 'width 1s ease',
                    width: `${burnoutRisk}%`,
                    background: burnoutRisk > 70 ? C.red : burnoutRisk > 40 ? T.textSec : T.accent,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: burnoutRisk > 70 ? C.red : burnoutRisk > 40 ? T.textSec : T.accent }}>
                    {burnoutRisk > 70 ? '⚠️ Alto' : burnoutRisk > 40 ? '📊 Moderado' : '✅ Baixo'}
                  </span>
                  <span style={{ color: T.textSec }}>{burnoutRisk}/100</span>
                </div>
              </div>

              {/* Alertas */}
              {alerts.length > 0 && (
                <div style={{ ...card, marginBottom: 20 }}>
                  <div style={sectionTitle}>🔔 Alertas Inteligentes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.map((a, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 16px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                        background: a.type === 'danger' ? C.redBg : a.type === 'warning' ? '#fff8e6' : T.accentBg,
                        border: `1px solid ${a.type === 'danger' ? C.red+'44' : a.type === 'warning' ? T.textSec+'44' : T.accent+'44'}`,
                        color: a.type === 'danger' ? C.red : a.type === 'warning' ? T.textSec : T.accent,
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>
                          {a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}
                        </span>
                        <span>{a.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tendências sparklines */}
              <div style={sectionTitle}>📉 Tendências — {periodLabel}</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12, marginBottom: 20,
              }}>
                {[
                  { name: 'Sono',       values: timeSeries.sleep,    color: T.accent  },
                  { name: 'Humor',      values: timeSeries.mood,     color: T.textSec },
                  { name: 'Exercício',  values: timeSeries.exercise, color: T.accent  },
                  { name: 'Hidratação', values: timeSeries.water,    color: T.accent  },
                ].map(s => {
                  const avg = s.values.length ? Math.round(s.values.reduce((a, b) => a + b, 0) / s.values.length) : 0;
                  const reg = linearRegression(s.values);
                  return (
                    <div key={s.name} style={card}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textSec, marginBottom: 6 }}>
                        {s.name}
                      </div>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 8 }}>
                        {avg}<span style={{ fontSize: 14, color: T.textSec }}>/100</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MiniSparkline values={movingAverage(s.values)} color={s.color} />
                        <TrendBadge direction={reg.direction} T={T} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Correlações */}
              {correlations.length > 0 && (
                <div style={{ ...card, marginBottom: 20 }}>
                  <div style={sectionTitle}>🔎 Correlações Detectadas</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Relação', 'Correlação', 'Força', 'Impacto'].map(h => (
                          <th key={h} style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textSec, fontWeight: 600, padding: '0 0 10px 0', textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlations.map((c, i) => {
                        const abs = Math.abs(c.r);
                        const strength = abs >= 0.6 ? 'Alto' : abs >= 0.4 ? 'Moderado' : 'Leve';
                        const color = abs >= 0.6 ? T.accent : abs >= 0.4 ? T.textSec : T.textSec;
                        return (
                          <tr key={i}>
                            <td style={{ padding: '10px 0', borderTop: `1px solid ${T.border}` }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{c.label}</div>
                              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                                {c.r > 0 ? 'Correlação positiva' : 'Correlação inversa'} — r = {c.r}
                              </div>
                            </td>
                            <td style={{ borderTop: `1px solid ${T.border}`, paddingRight: 16 }}>
                              <div style={{ width: 100, height: 6, background: T.badge, borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${abs * 100}%`, height: '100%', background: color, borderRadius: 6 }} />
                              </div>
                            </td>
                            <td style={{ fontSize: 13, color, fontWeight: 600, borderTop: `1px solid ${T.border}` }}>{strength}</td>
                            <td style={{ borderTop: `1px solid ${T.border}` }}>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: T.accentBg, color: T.accent, border: `1px solid ${T.accent}33` }}>
                                {c.impact}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mapa de Influências */}
              <div style={{ ...card, marginBottom: 20 }}>
                <div style={sectionTitle}>🗺️ Mapa de Influências</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {['humor', 'energia', 'produtividade'].map(t => (
                    <button key={t} onClick={() => setInfluenceTarget(t)} style={{
                      padding: '6px 16px', borderRadius: 20,
                      border: `1px solid ${influenceTarget === t ? T.accent : T.border}`,
                      background: influenceTarget === t ? T.accentBg : 'transparent',
                      color: influenceTarget === t ? T.accent : T.textSec,
                      fontSize: 13, cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                      fontWeight: influenceTarget === t ? 600 : 400,
                    }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {correlations.length === 0
                    ? <p style={{ color: T.textSec, fontSize: 13 }}>Registre mais dados para detectar correlações.</p>
                    : correlations.slice(0, 5).map((c, i) => {
                        const abs = Math.abs(c.r);
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 13, width: 160, color: T.textSec, flexShrink: 0 }}>{c.label}</span>
                            <div style={{ flex: 1, height: 8, background: T.badge, borderRadius: 8, overflow: 'hidden' }}>
                              <div style={{ width: `${abs * 100}%`, height: '100%', background: T.accent, borderRadius: 8 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, width: 40, textAlign: 'right', color: T.accent }}>
                              {c.r > 0 ? '+' : ''}{c.r}
                            </span>
                          </div>
                        );
                      })}
                </div>
              </div>

              {/* Heatmaps */}
              <div style={sectionTitle}>🗓️ Heatmaps de Padrões</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                <Heatmap data={heatmapData.mood}  label="Humor"         color={T.accent}  T={T} />
                <Heatmap data={heatmapData.sleep} label="Sono"          color={T.textSec} T={T} />
                <Heatmap data={heatmapData.prod}  label="Produtividade" color={T.accent}  T={T} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════ TAB: HOJE ══════════════ */}
      {activeTab === 'diario' && (() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayWell  = wellnessEntries.find(e => { const d = new Date(e.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });
        const todayEvts  = events.filter(e => { const d = new Date(e.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });
        const todayTasks = tasks.filter(t => { const d = new Date(t.dueDate||t.createdAt); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });
        const todayStudy = studySessions.filter(s => { const d = new Date(s.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });
        const moodMap = { excelente:'😄', bom:'🙂', neutro:'😐', ruim:'😔', pessimo:'😢' };
        return (
          <div>
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 48 }}>{todayWell ? moodMap[todayWell.mood]||'😐' : '📅'}</div>
              <div>
                <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4 }}>Resumo de Hoje</h2>
                <div style={{ fontSize: 13, color: T.textSec }}>
                  {todayEvts.length} evento(s) · {todayTasks.length} tarefa(s) · {todayStudy.length} sessão(ões) de estudo
                </div>
              </div>
            </div>
            {todayWell ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {[
                  { icon: '😴', label: 'Sono',      value: `${todayWell.sleepHours}h` },
                  { icon: '💧', label: 'Hidratação', value: `${todayWell.waterIntake}L` },
                  { icon: '💪', label: 'Exercício',  value: `${todayWell.exerciseMinutes}min` },
                  { icon: '🧠', label: 'Humor',      value: moodMap[todayWell.mood]||'—' },
                ].map(c => (
                  <div key={c.label} style={card}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textSec, marginBottom: 8 }}>{c.icon} {c.label}</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 28, fontWeight: 800, color: T.text }}>{c.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...card, textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 8 }}>Nenhuma atividade hoje</h3>
                <p style={{ color: T.textSec, fontSize: 13, marginBottom: 20 }}>Registre suas atividades para ver o resumo diário.</p>
                <a href="/wellness" style={{
                  padding: '10px 22px', borderRadius: 12, background: T.accent,
                  color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                }}>Registrar Bem-estar</a>
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════════════ TAB: COMPARATIVO ══════════════ */}
      {activeTab === 'comparativo' && (
        !hasFeature('advancedAnalytics') ? (
          <PremiumBlock
            feature="advancedAnalytics"
            requiredPlan="student"
            message="Analytics comparativo com filtros de período, score de produtividade e insights avançados estão disponíveis nos planos Estudante e superiores."
          />
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[['7', 'Última Semana'], ['30', 'Último Mês'], ['90', 'Últimos 90 dias']].map(([v, l]) => (
                <button key={v} onClick={() => setTimePeriod(v)} style={{
                  ...periodBtnBase,
                  background: timePeriod === v ? T.accentBg : 'transparent',
                  color: timePeriod === v ? T.accent : T.textSec,
                  borderColor: timePeriod === v ? T.accent : T.border,
                  fontWeight: timePeriod === v ? 700 : 400,
                }}>{l}</button>
              ))}
            </div>
          </div>
        )
      )}

    </PageLayout>
  );
}