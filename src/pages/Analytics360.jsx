import { useState, useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useSubscription } from '../hooks/useSubscription';
import PremiumBlock from '../components/PremiumBlock';

// ============================================================
// UTILS: Normalização, Correlação de Pearson, Regressão Linear
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
// SUB-COMPONENTS
// ============================================================

function ScoreRing({ score, size = 80, strokeWidth = 8, color }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#1e293b" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

function TrendBadge({ direction }) {
  const cfg = {
    subindo: { icon: '↑', cls: 'trend-up' },
    caindo: { icon: '↓', cls: 'trend-down' },
    estável: { icon: '→', cls: 'trend-stable' },
  };
  const c = cfg[direction] || cfg['estável'];
  return <span className={`trend-badge ${c.cls}`}>{c.icon}</span>;
}

function Heatmap({ data, label, color }) {
  // data: array de { date, value (0-100) }
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
  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  return (
    <div className="heatmap-wrap">
      <div className="heatmap-label">{label}</div>
      <div className="heatmap-grid">
        {weeks.map((week, wi) =>
          week.map((cell, di) => (
            <div
              key={`${wi}-${di}`}
              className="heatmap-cell"
              title={cell.date + (cell.value !== null ? `: ${cell.value}` : ': sem dado')}
              style={{
                background: cell.value === null
                  ? '#1e293b'
                  : `${color}${Math.round((cell.value / 100) * 255).toString(16).padStart(2, '0')}`
              }}
            />
          ))
        )}
      </div>
      <div className="heatmap-days">
        {dayLabels.map((l, i) => <span key={i}>{l}</span>)}
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
  const { subscription, hasFeature, isFree } = useSubscription();

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

  // ============================================================
  // FILTERED DATA BY PERIOD
  // ============================================================
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
      study: f(studySessions)
    };
  }, [timePeriod, wellnessEntries, events, pblCases, tasks, healthRecords, studySessions]);

  // ============================================================
  // NORMALIZED TIME SERIES (sorted by date)
  // ============================================================
  const timeSeries = useMemo(() => {
    const sorted = [...filteredData.wellness].sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      dates: sorted.map(e => e.date),
      sleep: sorted.map(e => sleepScore(e.sleepHours || 0)),
      mood: sorted.map(e => moodToScore(e.mood)),
      water: sorted.map(e => normalize(e.waterIntake || 0, 0, 3.5)),
      exercise: sorted.map(e => normalize(e.exerciseMinutes || 0, 0, 90)),
    };
  }, [filteredData.wellness]);

  // ============================================================
  // DOMAIN SCORES
  // ============================================================
  const scores = useMemo(() => {
    const w = filteredData.wellness;
    const tasks = filteredData.tasks;
    const study = filteredData.study;
    const evts = filteredData.events;

    // SAÚDE FÍSICA (sono + exercício + hidratação)
    let physicalScore = 0;
    if (w.length > 0) {
      const avgSleep = w.reduce((s, e) => s + sleepScore(e.sleepHours || 0), 0) / w.length;
      const avgEx = w.reduce((s, e) => s + normalize(e.exerciseMinutes || 0, 0, 90), 0) / w.length;
      const avgWater = w.reduce((s, e) => s + normalize(e.waterIntake || 0, 0, 3.5), 0) / w.length;
      physicalScore = Math.round((avgSleep * 0.5 + avgEx * 0.3 + avgWater * 0.2));
    }

    // BEM-ESTAR MENTAL (humor)
    let mentalScore = 0;
    if (w.length > 0) {
      mentalScore = Math.round(w.reduce((s, e) => s + moodToScore(e.mood), 0) / w.length);
    }

    // PRODUTIVIDADE (tarefas + estudo + eventos)
    let prodScore = 0;
    let prodCount = 0;
    if (tasks.length > 0) {
      prodScore += (tasks.filter(t => t.completed).length / tasks.length) * 100;
      prodCount++;
    }
    if (evts.length > 0) {
      prodScore += (evts.filter(e => e.completed).length / evts.length) * 100;
      prodCount++;
    }
    if (study.length > 0) {
      const hours = study.reduce((s, x) => s + (x.duration || 0), 0) / 60;
      prodScore += Math.min(100, (hours / (parseInt(timePeriod) * 1.5)) * 100);
      prodCount++;
    }
    if (prodCount > 0) prodScore = Math.round(prodScore / prodCount);

    const global = Math.round((physicalScore + mentalScore + prodScore) / 3);

    // Trends
    const sleepReg = linearRegression(timeSeries.sleep);
    const moodReg = linearRegression(timeSeries.mood);

    return { physical: physicalScore, mental: mentalScore, productivity: prodScore, global, sleepReg, moodReg };
  }, [filteredData, timeSeries, timePeriod]);

  // ============================================================
  // CORRELATIONS
  // ============================================================
  const correlations = useMemo(() => {
    const { sleep, mood, water, exercise } = timeSeries;
    const pairs = [
      { label: 'Sono × Humor', x: sleep, y: mood, impact: 'humor' },
      { label: 'Exercício × Humor', x: exercise, y: mood, impact: 'humor' },
      { label: 'Exercício × Energia', x: exercise, y: sleep, impact: 'energia' },
      { label: 'Hidratação × Humor', x: water, y: mood, impact: 'humor' },
      { label: 'Sono × Produtividade', x: sleep, y: exercise, impact: 'produtividade' },
    ];
    return pairs
      .map(p => ({ ...p, r: pearsonCorrelation(p.x, p.y) }))
      .filter(p => Math.abs(p.r) >= 0.2)
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [timeSeries]);

  // ============================================================
  // ALERTS
  // ============================================================
  const alerts = useMemo(() => {
    const alerts = [];
    const w = [...filteredData.wellness].sort((a, b) => new Date(b.date) - new Date(a.date));

    // 5 dias consecutivos baixo humor
    const recent5 = w.slice(0, 5);
    if (recent5.length === 5 && recent5.every(e => moodToScore(e.mood) < 50)) {
      alerts.push({ type: 'warning', msg: '5 dias consecutivos com humor abaixo do ideal. Considere uma pausa regenerativa.' });
    }
    // Sono médio < 6h por 4+ dias
    const recent4 = w.slice(0, 4);
    if (recent4.length === 4 && recent4.every(e => (e.sleepHours || 0) < 6)) {
      alerts.push({ type: 'danger', msg: 'Média de sono abaixo de 6h nos últimos 4 dias. Risco de burnout elevado.' });
    }
    // Produtividade em queda
    if (scores.sleepReg.direction === 'caindo') {
      alerts.push({ type: 'info', msg: `Qualidade do sono em tendência de queda. Revise sua rotina noturna.` });
    }
    if (scores.moodReg.direction === 'caindo') {
      alerts.push({ type: 'warning', msg: 'Humor apresenta tendência de queda no período selecionado.' });
    }

    return alerts;
  }, [filteredData, scores]);

  // ============================================================
  // BURNOUT RISK
  // ============================================================
  const burnoutRisk = useMemo(() => {
    let risk = 0;
    if (scores.mental < 50) risk += 35;
    else if (scores.mental < 70) risk += 15;
    if (scores.physical < 50) risk += 30;
    if (scores.sleepReg.direction === 'caindo') risk += 20;
    if (scores.moodReg.direction === 'caindo') risk += 15;
    return Math.min(100, risk);
  }, [scores]);

  // ============================================================
  // HEATMAP DATA
  // ============================================================
  const heatmapData = useMemo(() => {
    const mood = wellnessEntries.map(e => ({ date: e.date, value: moodToScore(e.mood) }));
    const sleep = wellnessEntries.map(e => ({ date: e.date, value: sleepScore(e.sleepHours || 0) }));
    const prod = tasks.map(t => ({ date: t.createdAt, value: t.completed ? 100 : 20 }));
    return { mood, sleep, prod };
  }, [wellnessEntries, tasks]);

  // ============================================================
  // TAB HANDLER
  // ============================================================
  const handleTabChange = (tab) => {
    if (tab === 'comparativo' && !hasFeature('advancedAnalytics')) {
      navigate('/pricing');
      return;
    }
    setActiveTab(tab);
  };

  const hasAnyData = wellnessEntries.length > 0 || events.length > 0 || tasks.length > 0 || studySessions.length > 0;

  const scoreColor = (s) => s >= 80 ? '#22d3ee' : s >= 60 ? '#a78bfa' : s >= 40 ? '#fbbf24' : '#f87171';
  const periodLabel = { '7': '7 dias', '30': '30 dias', '90': '90 dias' }[timePeriod];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .v360-root {
          min-height: 100vh;
          background: #050d1a;
          padding: 24px 16px 100px;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
        }
        .v360-root * { box-sizing: border-box; }

        .v360-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; color: #f8fafc; letter-spacing: -0.03em; }
        .v360-subtitle { color: #64748b; font-size: 0.92rem; margin-top: 4px; }

        /* TABS */
        .v360-tabs { display: flex; gap: 4px; background: #0f172a; border-radius: 14px; padding: 5px; margin-bottom: 28px; border: 1px solid #1e293b; }
        .v360-tab { flex: 1; padding: 10px 14px; border-radius: 10px; border: none; background: transparent; color: #64748b; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .v360-tab.active { background: #1e293b; color: #e2e8f0; font-weight: 700; }
        .v360-tab:hover:not(.active) { color: #94a3b8; }
        .v360-tab .pill { font-size: 0.65rem; background: linear-gradient(135deg,#7c3aed,#a21caf); color: #fff; padding: 2px 7px; border-radius: 20px; margin-left: 6px; }

        /* PERIOD FILTER */
        .period-filter { display: flex; gap: 8px; margin-bottom: 28px; }
        .period-btn { padding: 7px 20px; border-radius: 20px; border: 1px solid #1e293b; background: transparent; color: #64748b; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; }
        .period-btn.active { background: #1e293b; color: #e2e8f0; border-color: #334155; }

        /* SCORE CARDS */
        .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        @media(min-width:768px) { .score-grid { grid-template-columns: repeat(4, 1fr); } }
        .score-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 22px 18px; position: relative; overflow: hidden; }
        .score-card::before { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; opacity: 0.08; }
        .score-card.physical::before { background: #22d3ee; }
        .score-card.mental::before { background: #a78bfa; }
        .score-card.productivity::before { background: #fbbf24; }
        .score-card.financial::before { background: #34d399; }
        .score-card .card-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #475569; margin-bottom: 10px; }
        .score-card .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .score-card .card-score-text { font-family: 'Syne', sans-serif; font-size: 2.4rem; font-weight: 800; line-height: 1; }
        .score-card .card-insight { font-size: 0.75rem; color: #64748b; line-height: 1.4; margin-top: 8px; border-top: 1px solid #1e293b; padding-top: 8px; }
        .trend-badge { font-size: 0.8rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
        .trend-up { background: #052e16; color: #34d399; }
        .trend-down { background: #2d0a0a; color: #f87171; }
        .trend-stable { background: #1e1f2e; color: #94a3b8; }

        /* GLOBAL SCORE */
        .global-score-card { background: linear-gradient(135deg, #0f172a 0%, #1a0533 100%); border: 1px solid #2d1b4e; border-radius: 24px; padding: 28px; margin-bottom: 24px; display: flex; align-items: center; gap: 28px; position: relative; overflow: hidden; }
        .global-score-card::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.08) 0%, transparent 70%); pointer-events: none; }
        .global-ring { position: relative; flex-shrink: 0; }
        .global-ring .ring-value { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .global-ring .ring-num { font-family: 'Syne', sans-serif; font-size: 2.4rem; font-weight: 800; color: #f8fafc; line-height: 1; }
        .global-ring .ring-sub { font-size: 0.65rem; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; }
        .global-info h2 { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; color: #f8fafc; margin-bottom: 6px; }
        .global-info .global-desc { font-size: 0.85rem; color: #64748b; line-height: 1.5; }
        .global-chips { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .global-chip { font-size: 0.72rem; padding: 4px 12px; border-radius: 20px; border: 1px solid #1e293b; }
        .chip-best { border-color: #034d2b; color: #34d399; background: #052e16; }
        .chip-worst { border-color: #4a0606; color: #f87171; background: #2d0a0a; }

        /* ALERTS */
        .alerts-section { margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px; }
        .alert-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 14px; font-size: 0.83rem; line-height: 1.5; }
        .alert-warning { background: #1c1202; border: 1px solid #4a2c06; color: #fbbf24; }
        .alert-danger { background: #1a0505; border: 1px solid #6b1c1c; color: #f87171; }
        .alert-info { background: #030d1c; border: 1px solid #0c2a4a; color: #7dd3fc; }
        .alert-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }

        /* BURNOUT */
        .burnout-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 22px; margin-bottom: 24px; }
        .burnout-title { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; margin-bottom: 14px; }
        .burnout-bar-wrap { height: 10px; background: #1e293b; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
        .burnout-bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease; }
        .burnout-meta { display: flex; justify-content: space-between; font-size: 0.78rem; color: #64748b; }
        .burnout-level { font-weight: 700; }

        /* CORRELATIONS */
        .corr-section { margin-bottom: 24px; }
        .section-title { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; color: #f8fafc; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .corr-table { width: 100%; border-collapse: collapse; }
        .corr-table th { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; font-weight: 600; padding: 0 0 10px 0; text-align: left; }
        .corr-table td { padding: 10px 0; border-top: 1px solid #1e293b; font-size: 0.83rem; vertical-align: middle; }
        .corr-bar-wrap { width: 120px; height: 6px; background: #1e293b; border-radius: 6px; overflow: hidden; }
        .corr-bar-fill { height: 100%; border-radius: 6px; }
        .corr-insight { font-size: 0.75rem; color: #475569; margin-top: 2px; }
        .impact-badge { font-size: 0.67rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
        .impact-alto { background: #1f0544; color: #c084fc; border: 1px solid #4c1d95; }
        .impact-moderado { background: #1c1202; color: #fbbf24; border: 1px solid #4a2c06; }
        .impact-leve { background: #030d1c; color: #7dd3fc; border: 1px solid #0c2a4a; }

        /* INFLUENCE MAP */
        .influence-filter { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .inf-btn { padding: 6px 16px; border-radius: 20px; border: 1px solid #1e293b; background: transparent; color: #64748b; font-size: 0.78rem; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .inf-btn.active { background: #1e293b; color: #e2e8f0; }
        .inf-items { display: flex; flex-direction: column; gap: 10px; }
        .inf-item { display: flex; align-items: center; gap: 14px; }
        .inf-label { font-size: 0.82rem; width: 160px; color: #94a3b8; flex-shrink: 0; }
        .inf-bar-outer { flex: 1; height: 8px; background: #1e293b; border-radius: 8px; overflow: hidden; }
        .inf-bar-inner { height: 100%; border-radius: 8px; }
        .inf-r { font-size: 0.75rem; font-weight: 700; width: 40px; text-align: right; }

        /* HEATMAPS */
        .heatmaps-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 24px; }
        @media(min-width:768px) { .heatmaps-grid { grid-template-columns: repeat(3, 1fr); } }
        .heatmap-wrap { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 16px; }
        .heatmap-label { font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 10px; letter-spacing: 0.05em; text-transform: uppercase; }
        .heatmap-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 3px; margin-bottom: 6px; }
        .heatmap-cell { aspect-ratio: 1; border-radius: 3px; }
        .heatmap-days { display: flex; justify-content: space-around; }
        .heatmap-days span { font-size: 0.6rem; color: #334155; }

        /* SPARKLINES */
        .sparkline-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        @media(min-width:768px) { .sparkline-grid { grid-template-columns: repeat(4, 1fr); } }
        .spark-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 16px; }
        .spark-name { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; margin-bottom: 6px; font-weight: 600; }
        .spark-value { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; margin-bottom: 8px; }
        .spark-chart { }

        /* TIMELINE */
        .timeline-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 22px; margin-bottom: 24px; overflow-x: auto; }
        .multi-chart-svg { width: 100%; min-width: 360px; }

        /* SECTION BOXES */
        .section-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 22px; margin-bottom: 24px; }

        /* EMPTY STATE */
        .empty-state { text-align: center; padding: 80px 20px; }
        .empty-state .empty-icon { font-size: 4rem; margin-bottom: 16px; display: block; }
        .empty-state h3 { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; color: #f8fafc; margin-bottom: 8px; }
        .empty-state p { color: #64748b; margin-bottom: 24px; }
        .empty-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { padding: 11px 22px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #a21caf); color: #fff; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.88rem; border: none; cursor: pointer; text-decoration: none; display: inline-block; }

        /* FREE PLAN BANNER */
        .free-banner { background: #030d1c; border: 1px solid #0c2a4a; border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
        .free-banner p { font-size: 0.82rem; color: #7dd3fc; margin: 0; }
        .btn-upgrade { padding: 8px 18px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #a21caf); color: #fff; font-weight: 700; font-size: 0.8rem; border: none; cursor: pointer; white-space: nowrap; }
      `}</style>

      <div className="v360-root">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* HEADER */}
          <div style={{ marginBottom: 24 }}>
            <h1 className="v360-title">VISÃO 360°</h1>
            <p className="v360-subtitle">Inteligência integrada de todas as suas dimensões de vida</p>
          </div>

          {/* FREE PLAN BANNER */}
          {isFree() && (
            <div className="free-banner">
              <p>⭐ <strong>Plano Gratuito:</strong> Análise básica disponível. Faça upgrade para correlações inteligentes, alertas avançados e relatório PDF.</p>
              <button className="btn-upgrade" onClick={() => navigate('/pricing')}>Ver Planos</button>
            </div>
          )}

          {/* TABS */}
          <div className="v360-tabs">
            {[
              { key: 'visao360', label: '🔮 Visão 360°' },
              { key: 'diario', label: '📅 Hoje' },
              { key: 'comparativo', label: '📈 Comparativo', premium: isFree() },
            ].map(t => (
              <button
                key={t.key}
                className={`v360-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => handleTabChange(t.key)}
              >
                {t.label}
                {t.premium && <span className="pill">PRO</span>}
              </button>
            ))}
          </div>

          {/* ============================================================
              TAB: VISÃO 360°
          ============================================================ */}
          {activeTab === 'visao360' && (
            <div>
              {/* PERIOD FILTER */}
              <div className="period-filter">
                {[['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias']].map(([v, l]) => (
                  <button key={v} className={`period-btn${timePeriod === v ? ' active' : ''}`} onClick={() => setTimePeriod(v)}>{l}</button>
                ))}
              </div>

              {!hasAnyData ? (
                <div className="empty-state">
                  <span className="empty-icon">🔮</span>
                  <h3>Nenhum dado ainda</h3>
                  <p>Comece a registrar para ver sua inteligência integrada aqui.</p>
                  <div className="empty-actions">
                    <a href="/wellness" className="btn-primary">Registrar Bem-estar</a>
                    <a href="/study" className="btn-primary" style={{ background: 'linear-gradient(135deg,#0369a1,#0ea5e9)' }}>Registrar Estudo</a>
                  </div>
                </div>
              ) : (
                <>
                  {/* GLOBAL SCORE */}
                  <div className="global-score-card">
                    <div className="global-ring">
                      <ScoreRing score={scores.global} size={110} strokeWidth={10} color={scoreColor(scores.global)} />
                      <div className="ring-value">
                        <span className="ring-num" style={{ color: scoreColor(scores.global) }}>{scores.global}</span>
                        <span className="ring-sub">/ 100</span>
                      </div>
                    </div>
                    <div className="global-info">
                      <h2>Score de Equilíbrio Global</h2>
                      <p className="global-desc">
                        {scores.global >= 80 ? '🎉 Você está em excelente equilíbrio! Mantenha a consistência.' :
                         scores.global >= 60 ? '👍 Bom trabalho! Pequenos ajustes podem elevar ainda mais seu nível.' :
                         scores.global >= 40 ? '📈 Existem áreas com bom potencial de melhora.' :
                         '💪 Algumas dimensões precisam de atenção. Comece pelo sono.'}
                      </p>
                      <div className="global-chips">
                        {scores.physical >= scores.mental && scores.physical >= scores.productivity
                          ? <span className="global-chip chip-best">💪 Melhor: Saúde Física</span>
                          : scores.mental >= scores.physical && scores.mental >= scores.productivity
                          ? <span className="global-chip chip-best">🧠 Melhor: Bem-Estar Mental</span>
                          : <span className="global-chip chip-best">🎯 Melhor: Produtividade</span>}
                        {scores.physical <= scores.mental && scores.physical <= scores.productivity
                          ? <span className="global-chip chip-worst">⚠️ Crítico: Saúde Física</span>
                          : scores.mental <= scores.physical && scores.mental <= scores.productivity
                          ? <span className="global-chip chip-worst">⚠️ Crítico: Bem-Estar Mental</span>
                          : <span className="global-chip chip-worst">⚠️ Crítico: Produtividade</span>}
                      </div>
                    </div>
                  </div>

                  {/* SCORE CARDS */}
                  <div className="score-grid">
                    {[
                      { key: 'physical', cls: 'physical', icon: '🔵', label: 'Saúde Física', score: scores.physical, trend: scores.sleepReg.direction, insight: 'Baseado em sono, exercício e hidratação' },
                      { key: 'mental', cls: 'mental', icon: '🟣', label: 'Bem-Estar Mental', score: scores.mental, trend: scores.moodReg.direction, insight: 'Baseado nos registros de humor' },
                      { key: 'productivity', cls: 'productivity', icon: '🟡', label: 'Produtividade', score: scores.productivity, trend: 'estável', insight: 'Tarefas concluídas + horas de estudo' },
                      { key: 'financial', cls: 'financial', icon: '🟢', label: 'Financeiro', score: 0, trend: 'estável', insight: 'Conecte o módulo financeiro para ver dados' },
                    ].map(c => (
                      <div key={c.key} className={`score-card ${c.cls}`}>
                        <div className="card-label">{c.icon} {c.label}</div>
                        <div className="card-top">
                          <ScoreRing score={c.score} size={56} strokeWidth={6} color={scoreColor(c.score)} />
                          <span className="card-score-text" style={{ color: scoreColor(c.score) }}>{c.score}</span>
                          <TrendBadge direction={c.trend} />
                        </div>
                        <div className="card-insight">{c.insight}</div>
                      </div>
                    ))}
                  </div>

                  {/* BURNOUT RISK */}
                  <div className="burnout-card">
                    <div className="burnout-title">🔥 Risco de Burnout</div>
                    <div className="burnout-bar-wrap">
                      <div className="burnout-bar-fill" style={{
                        width: `${burnoutRisk}%`,
                        background: burnoutRisk > 70 ? '#ef4444' : burnoutRisk > 40 ? '#f59e0b' : '#22d3ee'
                      }} />
                    </div>
                    <div className="burnout-meta">
                      <span className="burnout-level" style={{ color: burnoutRisk > 70 ? '#f87171' : burnoutRisk > 40 ? '#fbbf24' : '#34d399' }}>
                        {burnoutRisk > 70 ? '⚠️ Alto' : burnoutRisk > 40 ? '📊 Moderado' : '✅ Baixo'}
                      </span>
                      <span>{burnoutRisk}/100</span>
                    </div>
                  </div>

                  {/* ALERTS */}
                  {alerts.length > 0 && (
                    <div className="section-box">
                      <div className="section-title">🔔 Alertas Inteligentes</div>
                      <div className="alerts-section">
                        {alerts.map((a, i) => (
                          <div key={i} className={`alert-item alert-${a.type}`}>
                            <span className="alert-icon">
                              {a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}
                            </span>
                            <span>{a.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SPARKLINES — TENDÊNCIAS */}
                  <div className="section-title" style={{ marginTop: 8 }}>📉 Tendências — {periodLabel}</div>
                  <div className="sparkline-grid">
                    {[
                      { name: 'Sono', values: timeSeries.sleep, color: '#22d3ee', avg: timeSeries.sleep.length ? Math.round(timeSeries.sleep.reduce((a,b)=>a+b,0)/timeSeries.sleep.length) : 0 },
                      { name: 'Humor', values: timeSeries.mood, color: '#a78bfa', avg: timeSeries.mood.length ? Math.round(timeSeries.mood.reduce((a,b)=>a+b,0)/timeSeries.mood.length) : 0 },
                      { name: 'Exercício', values: timeSeries.exercise, color: '#fbbf24', avg: timeSeries.exercise.length ? Math.round(timeSeries.exercise.reduce((a,b)=>a+b,0)/timeSeries.exercise.length) : 0 },
                      { name: 'Hidratação', values: timeSeries.water, color: '#34d399', avg: timeSeries.water.length ? Math.round(timeSeries.water.reduce((a,b)=>a+b,0)/timeSeries.water.length) : 0 },
                    ].map(s => {
                      const reg = linearRegression(s.values);
                      return (
                        <div key={s.name} className="spark-card">
                          <div className="spark-name">{s.name}</div>
                          <div className="spark-value" style={{ color: s.color }}>
                            {s.avg}<span style={{ fontSize: '0.9rem', color: '#475569' }}>/100</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MiniSparkline values={movingAverage(s.values)} color={s.color} />
                            <TrendBadge direction={reg.direction} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CORRELATIONS */}
                  {correlations.length > 0 && (
                    <div className="section-box">
                      <div className="section-title">🔎 Correlações Detectadas</div>
                      <table className="corr-table">
                        <thead>
                          <tr>
                            <th>Relação</th>
                            <th>Correlação</th>
                            <th>Força</th>
                            <th>Impacto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {correlations.map((c, i) => {
                            const abs = Math.abs(c.r);
                            const pct = abs * 100;
                            const strength = abs >= 0.6 ? 'Alto' : abs >= 0.4 ? 'Moderado' : 'Leve';
                            const color = abs >= 0.6 ? '#c084fc' : abs >= 0.4 ? '#fbbf24' : '#7dd3fc';
                            return (
                              <tr key={i}>
                                <td>
                                  <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{c.label}</div>
                                  <div className="corr-insight">
                                    {c.r > 0 ? 'Correlação positiva' : 'Correlação inversa'} — r = {c.r}
                                  </div>
                                </td>
                                <td>
                                  <div className="corr-bar-wrap">
                                    <div className="corr-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                  </div>
                                </td>
                                <td style={{ color }}>{strength}</td>
                                <td>
                                  <span className={`impact-badge impact-${strength.toLowerCase()}`}>{c.impact}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {correlations[0] && (
                        <div style={{ marginTop: 16, padding: '12px 16px', background: '#050d1a', borderRadius: 12, border: '1px solid #1e293b', fontSize: '0.83rem', color: '#94a3b8' }}>
                          💡 <strong style={{ color: '#e2e8f0' }}>Insight:</strong> A relação mais forte detectada é <strong style={{ color: '#c084fc' }}>{correlations[0].label}</strong> (r = {correlations[0].r}). Dias com baixo desempenho em um desses fatores tendem a reduzir o outro.
                        </div>
                      )}
                    </div>
                  )}

                  {/* INFLUENCE MAP */}
                  <div className="section-box">
                    <div className="section-title">🗺️ Mapa de Influências</div>
                    <div className="influence-filter">
                      {['humor', 'energia', 'produtividade'].map(t => (
                        <button key={t} className={`inf-btn${influenceTarget === t ? ' active' : ''}`} onClick={() => setInfluenceTarget(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
                      ))}
                    </div>
                    <div className="inf-items">
                      {correlations
                        .filter(c => c.impact === influenceTarget || influenceTarget === 'energia')
                        .concat(correlations.filter(c => c.impact !== influenceTarget && influenceTarget !== 'energia'))
                        .slice(0, 5)
                        .map((c, i) => {
                          const abs = Math.abs(c.r);
                          const color = abs >= 0.6 ? '#c084fc' : abs >= 0.4 ? '#fbbf24' : '#7dd3fc';
                          return (
                            <div key={i} className="inf-item">
                              <span className="inf-label">{c.label}</span>
                              <div className="inf-bar-outer">
                                <div className="inf-bar-inner" style={{ width: `${abs*100}%`, background: color }} />
                              </div>
                              <span className="inf-r" style={{ color }}>{c.r > 0 ? '+' : ''}{c.r}</span>
                            </div>
                          );
                        })}
                      {correlations.length === 0 && (
                        <p style={{ color: '#475569', fontSize: '0.83rem' }}>Registre mais dados de bem-estar para detectar correlações.</p>
                      )}
                    </div>
                  </div>

                  {/* HEATMAPS */}
                  <div className="section-title">🗓️ Heatmaps de Padrões</div>
                  <div className="heatmaps-grid">
                    <Heatmap data={heatmapData.mood} label="Humor" color="#a78bfa" />
                    <Heatmap data={heatmapData.sleep} label="Sono" color="#22d3ee" />
                    <Heatmap data={heatmapData.prod} label="Produtividade" color="#fbbf24" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================
              TAB: HOJE
          ============================================================ */}
          {activeTab === 'diario' && (() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const todayWell = wellnessEntries.find(e => { const d = new Date(e.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
            const todayEvts = events.filter(e => { const d = new Date(e.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
            const todayTasks = tasks.filter(t => { const d = new Date(t.dueDate||t.createdAt); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
            const todayStudy = studySessions.filter(s => { const d = new Date(s.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
            const moodMap = { excelente:'😄', bom:'🙂', neutro:'😐', ruim:'😔', pessimo:'😢' };
            return (
              <div>
                <div className="global-score-card" style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '3rem' }}>{todayWell ? moodMap[todayWell.mood]||'😐' : '📅'}</div>
                  <div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Resumo de Hoje</h2>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {todayEvts.length} evento(s) · {todayTasks.length} tarefa(s) · {todayStudy.length} sessão(ões) de estudo
                    </div>
                  </div>
                </div>

                {todayWell ? (
                  <div className="score-grid">
                    {[
                      { icon: '😴', label: 'Sono', value: `${todayWell.sleepHours}h`, color: '#22d3ee' },
                      { icon: '💧', label: 'Hidratação', value: `${todayWell.waterIntake}L`, color: '#38bdf8' },
                      { icon: '💪', label: 'Exercício', value: `${todayWell.exerciseMinutes}min`, color: '#fbbf24' },
                      { icon: '🧠', label: 'Humor', value: moodMap[todayWell.mood]||'—', color: '#a78bfa' },
                    ].map(c => (
                      <div key={c.label} className="score-card" style={{ background: '#0f172a' }}>
                        <div className="card-label">{c.icon} {c.label}</div>
                        <div className="card-score-text" style={{ color: c.color, fontSize: '2rem', marginTop: 8 }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <h3>Nenhuma atividade hoje</h3>
                    <p>Registre suas atividades para ver o resumo diário.</p>
                    <div className="empty-actions">
                      <a href="/wellness" className="btn-primary">Registrar Bem-estar</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ============================================================
              TAB: COMPARATIVO
          ============================================================ */}
          {activeTab === 'comparativo' && (
            !hasFeature('advancedAnalytics') ? (
              <PremiumBlock
                feature="advancedAnalytics"
                requiredPlan="student"
                message="Analytics comparativo com filtros de período, score de produtividade e insights avançados estão disponíveis nos planos Estudante e superiores."
              />
            ) : (
              <div>
                <div className="period-filter">
                  {[['7', 'Última Semana'], ['30', 'Último Mês'], ['90', 'Últimos 90 dias']].map(([v, l]) => (
                    <button key={v} className={`period-btn${timePeriod === v ? ' active' : ''}`} onClick={() => setTimePeriod(v)}>{l}</button>
                  ))}
                </div>
                <div className="score-grid">
                  {[
                    { cls: 'physical', icon: '💪', label: 'Bem-estar', score: scores.physical, color: scoreColor(scores.physical),
                      items: [
                        { l: 'Registros', v: filteredData.wellness.length },
                        { l: 'Sono médio', v: filteredData.wellness.length ? (filteredData.wellness.reduce((s,e)=>s+(e.sleepHours||0),0)/filteredData.wellness.length).toFixed(1)+'h' : '—' },
                        { l: 'Dias com metas', v: filteredData.wellness.filter(e=>e.sleepHours>=7&&e.waterIntake>=2&&e.exerciseMinutes>=30).length+'/'+filteredData.wellness.length },
                      ]
                    },
                    { cls: 'mental', icon: '🧠', label: 'Tarefas', score: scores.productivity, color: scoreColor(scores.productivity),
                      items: [
                        { l: 'Total', v: filteredData.tasks.length },
                        { l: 'Concluídas', v: filteredData.tasks.filter(t=>t.completed).length },
                        { l: 'Taxa', v: filteredData.tasks.length ? ((filteredData.tasks.filter(t=>t.completed).length/filteredData.tasks.length)*100).toFixed(0)+'%' : '—' },
                      ]
                    },
                    { cls: 'productivity', icon: '📚', label: 'Estudos', score: 0, color: '#fbbf24',
                      items: [
                        { l: 'Sessões', v: filteredData.study.length },
                        { l: 'Horas totais', v: (filteredData.study.reduce((s,x)=>s+(x.duration||0),0)/60).toFixed(1)+'h' },
                        { l: 'Média/sessão', v: filteredData.study.length ? Math.round(filteredData.study.reduce((s,x)=>s+(x.duration||0),0)/filteredData.study.length)+'min' : '—' },
                      ]
                    },
                    { cls: 'financial', icon: '📅', label: 'Calendário', score: 0, color: '#34d399',
                      items: [
                        { l: 'Eventos', v: filteredData.events.length },
                        { l: 'Concluídos', v: filteredData.events.filter(e=>e.completed).length },
                        { l: 'Taxa', v: filteredData.events.length ? ((filteredData.events.filter(e=>e.completed).length/filteredData.events.length)*100).toFixed(0)+'%' : '—' },
                      ]
                    },
                  ].map(c => (
                    <div key={c.label} className={`score-card ${c.cls}`} style={{ gridColumn: 'span 1' }}>
                      <div className="card-label">{c.icon} {c.label}</div>
                      {c.items.map(it => (
                        <div key={it.l} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', padding:'5px 0', borderBottom:'1px solid #1e293b' }}>
                          <span style={{ color:'#64748b' }}>{it.l}</span>
                          <span style={{ color:c.color, fontWeight:700 }}>{it.v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

        </div>
      </div>
    </>
  );
}