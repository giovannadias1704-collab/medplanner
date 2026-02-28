// components/PageLayout.jsx
// Layout compartilhado — sidebar + sistema de temas pastéis completo (sem top header)
import { useState, useContext, createContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';
import AIChat from '../components/AIChat';
import {
  HeartIcon, BanknotesIcon, SparklesIcon, HomeIcon,
  ChartBarIcon, CogIcon, UserIcon,
  FaceSmileIcon, CreditCardIcon, WrenchScrewdriverIcon,
  MapIcon, CalendarIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';

const ADMIN_EMAIL = 'medplanner17@gmail.com';

// ─── PALETAS PASTÉIS POR TEMA ─────────────────────────────────────────────────
export const THEME_PALETTES = {
  light: {
    bg:       '#F4EFE6',
    card:     '#FFFCF7',
    border:   '#E8DFD3',
    input:    '#FAF6EF',
    badge:    '#EFE6D8',
    text:     '#3E3A36',
    textSec:  '#6B5E53',
    shadow:   '0 4px 12px rgba(120,100,80,0.07)',
    shadowMd: '0 8px 24px rgba(120,100,80,0.12)',
    accent:   '#C48E6B',
    accentBg: '#F3E4D8',
  },
  dark: {
    bg:       '#1E1C1A',
    card:     '#2A2724',
    border:   '#3A3530',
    input:    '#252220',
    badge:    '#332E29',
    text:     '#EDE8E0',
    textSec:  '#A89880',
    shadow:   '0 4px 12px rgba(0,0,0,0.25)',
    shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
    accent:   '#C4A882',
    accentBg: '#3A3020',
  },
  purple: {
    bg:       '#F3EEFF',
    card:     '#FAF5FF',
    border:   '#E2D4F5',
    input:    '#F5EEFF',
    badge:    '#EBE0FA',
    text:     '#2D1F45',
    textSec:  '#7B5EA7',
    shadow:   '0 4px 12px rgba(147,51,234,0.07)',
    shadowMd: '0 8px 24px rgba(147,51,234,0.14)',
    accent:   '#9B6DD6',
    accentBg: '#EDE0FA',
  },
  green: {
    bg:       '#EDFAF2',
    card:     '#F5FDF8',
    border:   '#C8EDD8',
    input:    '#EDFAF2',
    badge:    '#D6F2E3',
    text:     '#1A3328',
    textSec:  '#4A7C60',
    shadow:   '0 4px 12px rgba(22,163,74,0.07)',
    shadowMd: '0 8px 24px rgba(22,163,74,0.14)',
    accent:   '#3A9E65',
    accentBg: '#CEEEDD',
  },
  rose: {
    bg:       '#FFF0F3',
    card:     '#FFF8F9',
    border:   '#F5D0D8',
    input:    '#FFF0F3',
    badge:    '#FAD6DE',
    text:     '#45151E',
    textSec:  '#AA5568',
    shadow:   '0 4px 12px rgba(225,29,72,0.07)',
    shadowMd: '0 8px 24px rgba(225,29,72,0.14)',
    accent:   '#D4607A',
    accentBg: '#FAD6DE',
  },
  ocean: {
    bg:       '#E8F8FC',
    card:     '#F2FCFE',
    border:   '#B8E8F5',
    input:    '#E8F8FC',
    badge:    '#C8EEF8',
    text:     '#0D2D38',
    textSec:  '#3A7A90',
    shadow:   '0 4px 12px rgba(8,145,178,0.07)',
    shadowMd: '0 8px 24px rgba(8,145,178,0.14)',
    accent:   '#2A9ABB',
    accentBg: '#BEE8F5',
  },
  sunset: {
    bg:       '#FFF4E8',
    card:     '#FFFAF4',
    border:   '#F5DCB8',
    input:    '#FFF4E8',
    badge:    '#FAE4C0',
    text:     '#3D1F05',
    textSec:  '#A0622A',
    shadow:   '0 4px 12px rgba(234,88,12,0.07)',
    shadowMd: '0 8px 24px rgba(234,88,12,0.14)',
    accent:   '#D4782A',
    accentBg: '#FAE0B8',
  },
  lavender: {
    bg:       '#EEEEFF',
    card:     '#F6F6FF',
    border:   '#D0D0F5',
    input:    '#EEEEFF',
    badge:    '#DCDCFA',
    text:     '#1E1A40',
    textSec:  '#5A56A0',
    shadow:   '0 4px 12px rgba(79,70,229,0.07)',
    shadowMd: '0 8px 24px rgba(79,70,229,0.14)',
    accent:   '#6B66C8',
    accentBg: '#DCDCFA',
  },
};

// ─── Theme Context ─────────────────────────────────────────────────────────────
export const ThemeContext = createContext({
  themeId: 'light',
  T: THEME_PALETTES.light,
  setThemeId: () => {},
});

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem('medplanner_theme') || 'light'; } catch { return 'light'; }
  });

  const setTheme = useCallback((id) => {
    setThemeId(id);
    try { localStorage.setItem('medplanner_theme', id); } catch {}
  }, []);

  const T = THEME_PALETTES[themeId] || THEME_PALETTES.light;

  return (
    <ThemeContext.Provider value={{ themeId, T, setThemeId: setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Sidebar groups ────────────────────────────────────────────────────────────
const GROUPS = [
  {
    label: 'PRINCIPAL',
    items: [
      { id: 'dashboard',  route: '/dashboard',  label: 'Home',       Icon: HomeIcon      },
      { id: 'analytics',  route: '/analytics',  label: 'Visão 360°', Icon: ChartBarIcon  },
      { id: 'strategy',   route: '/estrategia', label: 'Estratégia', Icon: MapIcon       },
    ],
  },
  {
    label: 'VIDA',
    items: [
      { id: 'calendar', route: '/calendar',  label: 'Calendário',       Icon: CalendarIcon  },
      { id: 'casa',     route: '/casa',      label: 'Casa',             Icon: HomeIcon      },
      { id: 'finances', route: '/finances',  label: 'Finanças',         Icon: BanknotesIcon },
      { id: 'health',   route: '/health',    label: 'Saúde Física',     Icon: HeartIcon     },
      { id: 'wellness', route: '/wellness',  label: 'Bem-Estar Mental', Icon: FaceSmileIcon },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { id: 'pricing',  route: '/pricing',  label: 'Planos',        Icon: CreditCardIcon },
      { id: 'settings', route: '/settings', label: 'Configurações', Icon: CogIcon        },
    ],
  },
];
const ADMIN_ITEM = { id: 'admin', route: '/admin', label: 'ADM', Icon: WrenchScrewdriverIcon };

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ item, active, collapsed, onClick, T }) {
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
        borderLeft: active && !collapsed
          ? `3px solid ${T.accent}`
          : '3px solid transparent',
        background: active ? T.accentBg : 'transparent',
        color: active ? T.accent : T.textSec,
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

// ─── PageLayout ───────────────────────────────────────────────────────────────
/**
 * @param {Object}          props
 * @param {React.ReactNode} props.children     - Conteúdo da página
 * @param {string}          props.title        - Título da página
 * @param {string}          props.subtitle     - Subtítulo opcional
 * @param {string}          props.emoji        - Emoji do header
 * @param {React.ReactNode} props.headerRight  - Botões extras no canto superior direito do conteúdo
 * @param {number}          props.urgentCount  - Mantido por compatibilidade (não exibido sem top bar)
 */
export default function PageLayout({ children, title, subtitle, emoji, headerRight, urgentCount = 0 }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, signOut } = useAuth();
  const { onboardingData } = useOnboarding();
  const { T } = useTheme();

  const isAdmin     = user?.email === ADMIN_EMAIL;
  const activeRoute = location.pathname;
  const name        = onboardingData?.name;

  const [collapsed,   setCollapsed]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAIChat,  setShowAIChat]  = useState(false);

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
        .nav-hover:hover{background:${T.badge}!important}
        @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .page-fade{animation:fi .4s ease both}
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
          boxShadow: `2px 0 8px rgba(0,0,0,0.04)`, zIndex: 30, flexShrink: 0,
        }}>

          {/* ── Logo + colapsar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', marginBottom: 26,
            justifyContent: collapsed ? 'center' : 'space-between',
          }}>
            {!collapsed ? (
              <button onClick={() => navigate('/dashboard')} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, fontSize: 16, flexShrink: 0,
                  background: `linear-gradient(135deg,${T.accentBg},${T.accent})`,
                  boxShadow: `0 2px 8px ${T.accent}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>⚕️</div>
                <span style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15,
                  color: T.accent, letterSpacing: '-0.3px',
                }}>MedPlanner</span>
              </button>
            ) : (
              <button onClick={() => navigate('/dashboard')} style={{
                width: 32, height: 32, borderRadius: 10, fontSize: 16,
                background: `linear-gradient(135deg,${T.accentBg},${T.accent})`,
                boxShadow: `0 2px 8px ${T.accent}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
              }}>⚕️</button>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: T.badge, border: `1px solid ${T.border}`,
                borderRadius: 8, width: 28, height: 28, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: T.textSec,
              }}
            >
              {collapsed
                ? <ChevronRightIcon style={{ width: 14, height: 14 }} />
                : <ChevronLeftIcon  style={{ width: 14, height: 14 }} />}
            </button>
          </div>

          {/* ── Nav ── */}
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
                  <NavItem key={item.id} item={item}
                    active={activeRoute === item.route}
                    collapsed={collapsed}
                    onClick={(i) => navigate(i.route)}
                    T={T}
                  />
                ))}
                <div style={{ borderTop: `1px solid ${T.border}`, margin: '8px 0' }} />
              </div>
            ))}
            {isAdmin && (
              <NavItem item={ADMIN_ITEM}
                active={activeRoute === ADMIN_ITEM.route}
                collapsed={collapsed}
                onClick={(i) => navigate(i.route)}
                T={T}
              />
            )}
          </div>

          {/* ── Avatar no rodapé da sidebar ── */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 8, position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="nav-hover"
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%', padding: collapsed ? '8px 0' : '8px 10px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: 10,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg,${T.accent},${T.textSec})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
              }}>
                {name ? name[0].toUpperCase() : <UserIcon style={{ width: 16, height: 16 }} />}
              </div>
              {!collapsed && (
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: T.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{name || 'Usuário'}</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec }}>
                    Ver perfil
                  </div>
                </div>
              )}
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute', bottom: 56,
                left: collapsed ? 70 : 0,
                width: 174, background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12, boxShadow: T.shadowMd,
                overflow: 'hidden', zIndex: 100,
              }}>
                {[
                  { ico: '👤', lbl: 'Meu Perfil',    action: () => navigate('/settings') },
                  { ico: '⚙️', lbl: 'Configurações', action: () => navigate('/settings') },
                  ...(isAdmin ? [{ ico: '🛠', lbl: 'ADM', action: () => navigate('/admin') }] : []),
                  { ico: '🚪', lbl: 'Sair',          action: () => signOut?.() },
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
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* ── Cabeçalho da página (título + ações) ── */}
          {(title || emoji || headerRight) && (
            <div style={{
              padding: '22px 26px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {emoji && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 13, fontSize: 22,
                    background: T.accentBg,
                    border: `1.5px solid ${T.accent}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: T.shadow, flexShrink: 0,
                  }}>{emoji}</div>
                )}
                <div>
                  {title && (
                    <h1 style={{
                      fontFamily: "'Poppins',sans-serif", fontWeight: 700,
                      fontSize: 20, color: T.text, margin: 0,
                    }}>{title}</h1>
                  )}
                  {subtitle && (
                    <p style={{
                      fontFamily: "'Poppins',sans-serif", fontSize: 12.5,
                      color: T.textSec, margin: '2px 0 0',
                    }}>{subtitle}</p>
                  )}
                </div>
              </div>
              {headerRight && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {headerRight}
                </div>
              )}
            </div>
          )}

          {/* ── Conteúdo ── */}
          <main className="page-fade" style={{
            flex: 1, padding: '22px 26px 96px', overflowY: 'auto',
          }}>
            {children}
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
          background: `linear-gradient(135deg,${T.accent},${T.textSec})`,
          boxShadow: `0 8px 24px ${T.accent}55`,
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