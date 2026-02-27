import { useContext, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import QuickCaptureBar from '../components/QuickCaptureBar';
import EventCard from '../components/EventCard';
import InsightCard from '../components/InsightCard';
import AIChat from '../components/AIChat';
import { daysUntil } from '../utils/helpers';
import { calculateDashboardStats, calculateTaskStats } from '../utils/statsCalculator';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  HeartIcon,
  BanknotesIcon,
  SparklesIcon,
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FaceSmileIcon,
  CreditCardIcon,
  WrenchScrewdriverIcon,
  MapIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const ADMIN_EMAIL = 'medplanner17@gmail.com';

// ─── Pastel Safari Design System ──────────────────────────────────────────────
const T = {
  bg:            '#F4EFE6',
  card:          '#FFFCF7',
  border:        '#E8DFD3',
  input:         '#FAF6EF',
  badge:         '#EFE6D8',
  text:          '#3E3A36',
  textSec:       '#6B5E53',
  shadow:        '0 4px 12px rgba(120,100,80,0.07)',
  shadowMd:      '0 8px 24px rgba(120,100,80,0.12)',

  strategy:  { p: '#D9A27E', h: '#C48E6B', bg: '#F3E4D8' },
  finance:   { p: '#8FA889', h: '#7C9776', bg: '#EAF1E8' },
  health:    { p: '#A8BFA3', h: '#95AD90', bg: '#EEF4EC' },
  wellness:  { p: '#B7A8B8', h: '#A392A4', bg: '#F1EBF2' },
  analytics: { p: '#8CA3A3', h: '#7B9393', bg: '#E9F0F0' },
  home:      { p: '#CBBBA3', h: '#B8A88F', bg: '#F2ECE2' },
};

// ─── Sidebar groups ────────────────────────────────────────────────────────────
const GROUPS = [
  {
    label: 'PRINCIPAL',
    items: [
      { id: 'dashboard',  route: '/dashboard',  label: 'Home',        Icon: HomeIcon,       color: null },
      { id: 'analytics',  route: '/analytics',  label: 'Visão 360°',  Icon: ChartBarIcon,   color: T.analytics },
      { id: 'strategy',   route: '/estrategia', label: 'Estratégia',  Icon: MapIcon,        color: T.strategy },
    ],
  },
  {
    label: 'VIDA',
    items: [
      { id: 'calendar',   route: '/calendar',   label: 'Calendário',       Icon: CalendarIcon,  color: T.analytics },
      { id: 'casa',       route: '/casa',        label: 'Casa',             Icon: HomeIcon,      color: T.home },
      { id: 'finances',   route: '/finances',    label: 'Finanças',         Icon: BanknotesIcon, color: T.finance },
      { id: 'health',     route: '/health',      label: 'Saúde Física',     Icon: HeartIcon,     color: T.health },
      { id: 'wellness',   route: '/wellness',    label: 'Bem-Estar Mental', Icon: FaceSmileIcon, color: T.wellness },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { id: 'pricing',    route: '/pricing',     label: 'Planos',         Icon: CreditCardIcon, color: null },
      { id: 'settings',   route: '/settings',    label: 'Configurações',  Icon: CogIcon,        color: null },
    ],
  },
];
const ADMIN_ITEM = { id: 'admin', route: '/admin', label: 'ADM', Icon: WrenchScrewdriverIcon, color: T.strategy };

// ─── Small reusable pieces ─────────────────────────────────────────────────────
function NavItem({ item, active, collapsed, onClick }) {
  const c = item.color;
  return (
    <button
      onClick={() => onClick(item)}
      title={collapsed ? item.label : ''}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        width: '100%', padding: collapsed ? '10px 0' : '9px 12px',
        border: 'none', borderRadius: 10,
        borderLeft: active && !collapsed ? `3px solid ${c?.p || T.textSec}` : '3px solid transparent',
        background: active ? (c?.bg || T.badge) : 'transparent',
        color: active ? (c?.p || T.text) : T.textSec,
        fontFamily: "'Poppins',sans-serif", fontSize: 13.5,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'all 150ms ease',
        boxSizing: 'border-box',
      }}
    >
      <item.Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

function Pill({ icon, value, label, color }) {
  return (
    <div style={{
      background: color.bg, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: T.shadow,
    }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: color.p, fontFamily: "'Poppins',sans-serif", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: T.textSec, marginTop: 2, fontFamily: "'Poppins',sans-serif" }}>{label}</div>
      </div>
    </div>
  );
}

function SecHead({ emoji, title, subtitle, color = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: color.bg || T.badge, border: `1.5px solid ${color.p || T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 19, boxShadow: T.shadow,
      }}>{emoji}</div>
      <div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14.5, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11.5, color: T.textSec, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function StratBar({ goal, icon, progress, color }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${color.p}`,
      borderRadius: 13, padding: '14px 16px', boxShadow: T.shadow,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{goal}</span>
      </div>
      <div style={{ background: T.bg, borderRadius: 8, height: 7, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg,${color.p},${color.h})`,
          borderRadius: 8, transition: 'width 700ms ease',
        }} />
      </div>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 4, textAlign: 'right' }}>
        {progress}% concluído
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    events = [], tasks = [], bills = [],
    homeTasks = [], studySchedule = [],
    waterLogs = [], settings = {},
  } = useContext(AppContext);

  const { onboardingData } = useOnboarding();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const activeRoute = location.pathname;

  const [showAIChat, setShowAIChat]   = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const handleNav = (item) => navigate(item.route);

  const DS = useMemo(() =>
    calculateDashboardStats(events, tasks, homeTasks, bills, studySchedule, waterLogs, settings),
    [events, tasks, homeTasks, bills, studySchedule, waterLogs, settings]
  );
  const TS = useMemo(() => calculateTaskStats(tasks, homeTasks), [tasks, homeTasks]);

  const top3 = useMemo(() => (
    [...events.map(e => ({ ...e, source: 'event' })),
     ...tasks.map(t => ({ ...t, source: 'task' })),
     ...bills.map(b => ({ ...b, source: 'bill' }))]
      .filter(i => i.date && daysUntil(i.date) >= 0)
      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
      .slice(0, 3)
  ), [events, tasks, bills]);

  const upcoming = useMemo(() => {
    const today = new Date(), in3 = addDays(today, 3);
    return events.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d > today && d <= in3;
    });
  }, [events]);

  const urgent = useMemo(() => {
    const u = [];
    bills.forEach(b => { if (!b.date || b.paid) return; const d = daysUntil(b.date); if (d >= 0 && d <= 3) u.push({ ...b, type: 'bill', urgency: d }); });
    tasks.forEach(t => { if (!t.date || t.completed) return; const d = daysUntil(t.date); if (d < 0) u.push({ ...t, type: 'task', urgency: d }); });
    return u.sort((a, b) => a.urgency - b.urgency);
  }, [bills, tasks]);

  const stratItems = useMemo(() => {
    const items = [];
    if (onboardingData?.shortTermGoals)
      items.push({ goal: onboardingData.shortTermGoals.slice(0, 55), icon: '🎯', progress: Math.min(100, parseInt(TS.completionRate) || 0), color: T.strategy });
    if (onboardingData?.focusResidency === 'sim')
      items.push({ goal: `Residência${onboardingData.residencyArea ? ` — ${onboardingData.residencyArea}` : ''}`, icon: '🏥', progress: 35, color: T.analytics });
    if (onboardingData?.studyHoursPerDay)
      items.push({ goal: `Estudo diário: ${onboardingData.studyHoursPerDay}h`, icon: '📚', progress: 60, color: T.health });
    return items;
  }, [onboardingData, TS]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const name  = onboardingData?.name;
  const dateLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const SW = collapsed ? 64 : 222;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Poppins',sans-serif;background:${T.bg};color:${T.text}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}
        .hl:hover{background:${T.badge}!important;transition:background 120ms}
        @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .a1{animation:fi .4s ease both}
        .a2{animation:fi .5s .1s ease both}
        .a3{animation:fi .5s .2s ease both}
        .a4{animation:fi .5s .3s ease both}
        .lift:hover{transform:translateY(-2px);box-shadow:${T.shadowMd}!important;transition:all 150ms ease}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: SW, minWidth: SW, maxWidth: SW,
          background: T.card, borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
          padding: collapsed ? '20px 10px' : '20px 14px',
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden', transition: 'width 200ms ease, min-width 200ms ease',
          boxShadow: '2px 0 8px rgba(120,100,80,0.04)', zIndex: 30, flexShrink: 0,
        }}>
          {/* Logo row */}
          <div style={{
            display: 'flex', alignItems: 'center', marginBottom: 26,
            justifyContent: collapsed ? 'center' : 'space-between',
          }}>
            {!collapsed && (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10, fontSize: 16, flexShrink: 0,
                  background: 'linear-gradient(135deg, #B8D4B2, #8FA889)',
                  boxShadow: '0 2px 8px rgba(143,168,137,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>⚕️</div>
                <span style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15,
                  color: '#5C7A57', letterSpacing: '-0.3px',
                }}>MedPlanner</span>
              </button>
            )}
            {collapsed && (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  width: 32, height: 32, borderRadius: 10, fontSize: 16,
                  background: 'linear-gradient(135deg, #B8D4B2, #8FA889)',
                  boxShadow: '0 2px 8px rgba(143,168,137,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer',
                }}>⚕️</button>
            )}
            <button onClick={() => setCollapsed(!collapsed)} style={{
              background: T.badge, border: `1px solid ${T.border}`,
              borderRadius: 8, width: 28, height: 28, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textSec,
            }}>
              {collapsed
                ? <ChevronRightIcon style={{ width: 14, height: 14 }} />
                : <ChevronLeftIcon  style={{ width: 14, height: 14 }} />}
            </button>
          </div>

          {/* Nav */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {GROUPS.map(g => (
              <div key={g.label} style={{ marginBottom: 18 }}>
                {!collapsed && (
                  <div style={{
                    fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: 600,
                    color: T.textSec, letterSpacing: '.8px', padding: '0 4px',
                    marginBottom: 5, opacity: .65,
                  }}>{g.label}</div>
                )}
                {g.items.map(item => (
                  <NavItem key={item.id} item={item} active={activeRoute === item.route} collapsed={collapsed} onClick={handleNav} />
                ))}
                <div style={{ borderTop: `1px solid ${T.border}`, margin: '8px 0' }} />
              </div>
            ))}
            {isAdmin && (
              <NavItem item={ADMIN_ITEM} active={activeRoute === ADMIN_ITEM.route} collapsed={collapsed} onClick={handleNav} />
            )}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <header style={{
            height: 58, background: T.card,
            borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: 14,
            position: 'sticky', top: 0, zIndex: 20,
            boxShadow: '0 2px 8px rgba(120,100,80,0.04)',
          }}>
            {/* Search */}
            <div style={{
              flex: 1, maxWidth: 400,
              background: searchFocus ? T.card : T.input,
              border: `1px solid ${searchFocus ? T.strategy.p : T.border}`,
              borderRadius: 10, padding: '7px 13px',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 150ms ease',
              boxShadow: searchFocus ? `0 0 0 3px ${T.strategy.bg}` : 'none',
            }}>
              <MagnifyingGlassIcon style={{ width: 15, height: 15, color: T.textSec, flexShrink: 0 }} />
              <input
                placeholder="Busca global..."
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.text, width: '100%',
                }}
              />
            </div>
            <div style={{ flex: 1 }} />

            {/* Bell */}
            <button style={{
              background: T.input, border: `1px solid ${T.border}`,
              borderRadius: 10, width: 37, height: 37,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textSec, position: 'relative',
            }}>
              <BellIcon style={{ width: 17, height: 17 }} />
              {urgent.length > 0 && (
                <span style={{
                  position: 'absolute', top: 7, right: 7,
                  width: 7, height: 7, borderRadius: '50%',
                  background: T.strategy.p, border: `2px solid ${T.card}`,
                }} />
              )}
            </button>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `linear-gradient(135deg,${T.strategy.p},${T.wellness.p})`,
                  border: `2px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                }}
              >
                {name ? name[0].toUpperCase() : <UserIcon style={{ width: 17, height: 17 }} />}
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 44, right: 0, width: 174,
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 12, boxShadow: T.shadowMd, overflow: 'hidden', zIndex: 100,
                }}>
                  {[
                    { ico: '👤', lbl: 'Meu Perfil',      action: () => navigate('/settings') },
                    { ico: '⚙️', lbl: 'Configurações',   action: () => navigate('/settings') },
                    ...(isAdmin ? [{ ico: '🛠', lbl: 'ADM', action: () => navigate('/admin') }] : []),
                    { ico: '🚪', lbl: 'Sair',            action: () => signOut?.() },
                  ].map(({ ico, lbl, action }) => (
                    <button key={lbl} className="hl" onClick={() => { action(); setProfileOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '10px 14px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: T.text, fontFamily: "'Poppins',sans-serif", fontSize: 13,
                    }}><span>{ico}</span>{lbl}</button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* ── Page Content ── */}
          <main style={{ flex: 1, padding: '26px 26px 96px', overflowY: 'auto' }}>

            {/* Greeting banner */}
            <div className="a1" style={{ marginBottom: 24 }}>
              <div style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 15, padding: '18px 22px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: T.shadow,
              }}>
                <div>
                  <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 21, color: T.text }}>
                    {name ? `${greet}, ${name}! 👋` : `${greet}! 👋`}
                  </h1>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, color: T.textSec, marginTop: 3, textTransform: 'capitalize' }}>
                    {[onboardingData?.semester && `${onboardingData.semester}º Semestre`,
                      onboardingData?.university,
                      dateLabel].filter(Boolean).join(' • ')}
                  </p>
                </div>
                <div style={{
                  background: T.strategy.bg, borderRadius: 10,
                  padding: '7px 14px', border: `1px solid ${T.strategy.p}25`,
                }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.strategy.p, fontWeight: 600 }}>
                    Centro de Controle 🌿
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Capture */}
            <div className="a2" style={{ marginBottom: 24 }}>
              <QuickCaptureBar />
            </div>

            {/* Stats pills */}
            <div className="a2" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
              gap: 12, marginBottom: 26,
            }}>
              <Pill icon="📅" value={DS.eventsToday}                               label="Eventos hoje"     color={T.analytics} />
              <Pill icon="✅" value={DS.tasksToday}                                label="Tarefas pendentes" color={T.health} />
              <Pill icon="💰" value={DS.billsThisWeek}                             label="Contas (7 dias)"  color={T.finance} />
              <Pill icon="💧" value={`${DS.waterToday}L`} label={`Meta: ${DS.waterGoal}L`}
                color={DS.waterGoalPercentage >= 100 ? T.health : T.analytics} />
            </div>

            {/* 2-col: Estratégia + Prioridades */}
            <div className="a3" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 22, marginBottom: 26,
            }}>
              {/* Estratégia */}
              <section>
                <SecHead emoji="🎯" title="Estratégia" subtitle="Progresso dos seus objetivos" color={T.strategy} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {stratItems.length === 0 ? (
                    <div style={{
                      background: T.card, border: `1px solid ${T.border}`, borderRadius: 13,
                      padding: '22px', textAlign: 'center', boxShadow: T.shadow,
                      fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.textSec,
                    }}>🌱 Configure seus objetivos no onboarding</div>
                  ) : stratItems.map((s, i) => <StratBar key={i} {...s} />)}

                  {/* Global task progress */}
                  {TS.totalTasks > 0 && (
                    <div style={{
                      background: T.card, border: `1px solid ${T.border}`,
                      borderLeft: `4px solid ${T.finance.p}`,
                      borderRadius: 13, padding: '14px 16px', boxShadow: T.shadow,
                    }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 9 }}>
                        📊 Progresso Geral de Tarefas
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ flex: 1, background: T.bg, borderRadius: 8, height: 7, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${TS.completionRate}%`,
                            background: `linear-gradient(90deg,${T.finance.p},${T.health.p})`,
                            borderRadius: 8, transition: 'width 700ms ease',
                          }} />
                        </div>
                        <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, color: T.finance.p, minWidth: 34 }}>
                          {parseInt(TS.completionRate)}%
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 5 }}>
                        {TS.completedTasks} de {TS.totalTasks} tarefas concluídas
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Prioridades */}
              <section>
                <SecHead emoji="🔥" title="Prioridades de Hoje" subtitle="Foco no que importa" color={T.strategy} />
                {top3.length === 0 ? (
                  <div style={{
                    background: T.health.bg, border: `1px solid ${T.health.p}30`,
                    borderRadius: 13, padding: '30px', textAlign: 'center', boxShadow: T.shadow,
                  }}>
                    <div style={{ fontSize: 38, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: T.text }}>Dia Livre!</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec, marginTop: 3 }}>Nenhuma prioridade urgente.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {top3.map((item, i) => {
                      const colors = [T.strategy, T.analytics, T.health];
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                          <div style={{
                            width: 27, height: 27, flexShrink: 0, marginTop: 2,
                            background: colors[i].bg, border: `1.5px solid ${colors[i].p}`,
                            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12,
                            color: colors[i].p,
                          }}>{i + 1}</div>
                          <div style={{ flex: 1 }}><EventCard event={item} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Insights + Urgentes */}
            {(TS.insights?.length > 0 || urgent.length > 0) && (
              <div className="a4" style={{
                display: 'grid',
                gridTemplateColumns: TS.insights?.length > 0 && urgent.length > 0 ? '1fr 1fr' : '1fr',
                gap: 22, marginBottom: 26,
              }}>
                {TS.insights?.length > 0 && (
                  <section>
                    <SecHead emoji="💡" title="Insights do Dia" subtitle="Gerados automaticamente" color={T.analytics} />
                    <InsightCard title="" insights={TS.insights} />
                  </section>
                )}
                {urgent.length > 0 && (
                  <section>
                    <SecHead emoji="⚠️" title="Urgente" subtitle={`${urgent.length} item(ns) precisam de atenção`} color={T.strategy} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {urgent.map(item => (
                        <div key={item.id} style={{
                          background: T.card, border: `1px solid ${T.border}`,
                          borderLeft: `4px solid ${T.strategy.p}`,
                          borderRadius: 13, padding: '13px 15px', boxShadow: T.shadow,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                            <span style={{ fontSize: 17 }}>{item.type === 'bill' ? '💰' : '✅'}</span>
                            <span style={{
                              fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: 600,
                              padding: '2px 7px', borderRadius: 20,
                              background: T.strategy.bg, color: T.strategy.p,
                            }}>{item.type === 'bill' ? 'CONTA' : 'TAREFA'}</span>
                          </div>
                          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 3 }}>
                            {item.title}
                          </div>
                          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.strategy.p }}>
                            {item.urgency < 0
                              ? `⏰ Atrasado há ${Math.abs(item.urgency)} dia(s)`
                              : item.urgency === 0 ? '🔥 Vence HOJE' : `📌 Vence em ${item.urgency} dia(s)`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Próximos Eventos */}
            <section className="a4" style={{ marginBottom: 26 }}>
              <SecHead emoji="📅" title="Próximos Eventos" subtitle="Nos próximos 3 dias" color={T.analytics} />
              {upcoming.length === 0 ? (
                <div style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 13, padding: '26px', textAlign: 'center',
                  boxShadow: T.shadow, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.textSec,
                }}>
                  📭 Nenhum evento nos próximos 3 dias
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 11 }}>
                  {upcoming.map(e => <EventCard key={e.id} event={e} />)}
                </div>
              )}
            </section>

            {/* Personal KPIs */}
            {onboardingData && (
              <div className="a4" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(168px,1fr))',
                gap: 12, marginBottom: 26,
              }}>
                {onboardingData.studyHoursPerDay && (
                  <div style={{ background: T.analytics.bg, border: `1px solid ${T.analytics.p}30`, borderRadius: 13, padding: '16px', boxShadow: T.shadow }}>
                    <div style={{ fontSize: 24, marginBottom: 7 }}>📚</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11.5, color: T.textSec }}>Meta de Estudo</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 700, color: T.analytics.p }}>{onboardingData.studyHoursPerDay}h/dia</div>
                  </div>
                )}
                {onboardingData.exerciseFrequency && (
                  <div style={{ background: T.health.bg, border: `1px solid ${T.health.p}30`, borderRadius: 13, padding: '16px', boxShadow: T.shadow }}>
                    <div style={{ fontSize: 24, marginBottom: 7 }}>💪</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11.5, color: T.textSec }}>Exercícios</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 17, fontWeight: 700, color: T.health.p }}>{onboardingData.exerciseFrequency}</div>
                  </div>
                )}
                {onboardingData.waterGoal && (
                  <div style={{ background: T.analytics.bg, border: `1px solid ${T.analytics.p}30`, borderRadius: 13, padding: '16px', boxShadow: T.shadow }}>
                    <div style={{ fontSize: 24, marginBottom: 7 }}>💧</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11.5, color: T.textSec }}>Meta de Água</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 700, color: T.analytics.p }}>{onboardingData.waterGoal}L/dia</div>
                  </div>
                )}
                {onboardingData.focusResidency && (
                  <div style={{ background: T.wellness.bg, border: `1px solid ${T.wellness.p}30`, borderRadius: 13, padding: '16px', boxShadow: T.shadow }}>
                    <div style={{ fontSize: 24, marginBottom: 7 }}>🎯</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11.5, color: T.textSec }}>Objetivo</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16, fontWeight: 700, color: T.wellness.p }}>
                      {onboardingData.focusResidency === 'sim' ? 'Residência' : 'Graduação'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Motivational */}
            <div className="a4" style={{
              background: `linear-gradient(135deg,${T.strategy.p},${T.wellness.p})`,
              borderRadius: 15, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: `0 8px 24px ${T.strategy.p}40`,
            }}>
              <span style={{ fontSize: 42 }}>💪</span>
              <div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15.5, color: '#fff', marginBottom: 3 }}>
                  {name ? `Continue Focado, ${name}!` : 'Continue Focado!'}
                </div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, color: 'rgba(255,255,255,.87)' }}>
                  Cada tarefa concluída te aproxima dos seus objetivos 🌿
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* AI Chat FAB */}
      <button
        onClick={() => setShowAIChat(true)}
        className="lift"
        style={{
          position: 'fixed', bottom: 22, right: 22,
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: `linear-gradient(135deg,${T.strategy.p},${T.wellness.p})`,
          boxShadow: `0 8px 24px ${T.strategy.p}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 50,
        }}
        title="Assistente IA"
      >
        <SparklesIcon style={{ width: 25, height: 25, color: '#fff' }} />
      </button>

      <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
    </>
  );
}