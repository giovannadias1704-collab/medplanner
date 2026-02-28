// components/PageLayout.jsx
// Layout compartilhado — use em todas as páginas para herdar o mesmo sidebar, header e design system do Dashboard
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';
import AIChat from '../components/AIChat';
import {
  HeartIcon, BanknotesIcon, SparklesIcon, HomeIcon,
  ChartBarIcon, CogIcon, UserIcon, BellIcon,
  MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  FaceSmileIcon, CreditCardIcon, WrenchScrewdriverIcon,
  MapIcon, CalendarIcon,
} from '@heroicons/react/24/outline';

const ADMIN_EMAIL = 'medplanner17@gmail.com';

// ─── Design System (igual ao Dashboard) ───────────────────────────────────────
export const T = {
  bg:       '#F4EFE6',
  card:     '#FFFCF7',
  border:   '#E8DFD3',
  input:    '#FAF6EF',
  badge:    '#EFE6D8',
  text:     '#3E3A36',
  textSec:  '#6B5E53',
  shadow:   '0 4px 12px rgba(120,100,80,0.07)',
  shadowMd: '0 8px 24px rgba(120,100,80,0.12)',

  strategy:  { p: '#D9A27E', h: '#C48E6B', bg: '#F3E4D8' },
  finance:   { p: '#8FA889', h: '#7C9776', bg: '#EAF1E8' },
  health:    { p: '#A8BFA3', h: '#95AD90', bg: '#EEF4EC' },
  wellness:  { p: '#B7A8B8', h: '#A392A4', bg: '#F1EBF2' },
  analytics: { p: '#8CA3A3', h: '#7B9393', bg: '#E9F0F0' },
  home:      { p: '#CBBBA3', h: '#B8A88F', bg: '#F2ECE2' },
};

// ─── Mapa de cores por rota ────────────────────────────────────────────────────
export const PAGE_COLORS = {
  '/dashboard':  null,
  '/analytics':  T.analytics,
  '/estrategia': T.strategy,
  '/calendar':   T.analytics,
  '/casa':       T.home,
  '/finances':   T.finance,
  '/health':     T.health,
  '/wellness':   T.wellness,
  '/pricing':    null,
  '/settings':   null,
  '/admin':      T.strategy,
};

// ─── Sidebar groups ────────────────────────────────────────────────────────────
const GROUPS = [
  {
    label: 'PRINCIPAL',
    items: [
      { id: 'dashboard',  route: '/dashboard',  label: 'Home',       Icon: HomeIcon,      color: null },
      { id: 'analytics',  route: '/analytics',  label: 'Visão 360°', Icon: ChartBarIcon,  color: T.analytics },
      { id: 'strategy',   route: '/estrategia', label: 'Estratégia', Icon: MapIcon,       color: T.strategy },
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
      { id: 'pricing',  route: '/pricing',  label: 'Planos',        Icon: CreditCardIcon,       color: null },
      { id: 'settings', route: '/settings', label: 'Configurações', Icon: CogIcon,              color: null },
    ],
  },
];
const ADMIN_ITEM = { id: 'admin', route: '/admin', label: 'ADM', Icon: WrenchScrewdriverIcon, color: T.strategy };

// ─── NavItem ──────────────────────────────────────────────────────────────────
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

// ─── PageLayout ───────────────────────────────────────────────────────────────
/**
 * @param {Object} props
 * @param {React.ReactNode} props.children    - Conteúdo da página
 * @param {string}          props.title       - Título da página (ex: "Finanças")
 * @param {string}          props.subtitle    - Subtítulo opcional
 * @param {string}          props.emoji       - Emoji do header (ex: "💰")
 * @param {React.ReactNode} props.headerRight - Botões/ações no canto direito do header
 * @param {number[]}        props.urgentCount - Qtd de itens urgentes para o sino
 */
export default function PageLayout({ children, title, subtitle, emoji, headerRight, urgentCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { onboardingData } = useOnboarding();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const activeRoute = location.pathname;
  const pageColor = PAGE_COLORS[activeRoute] || null;
  const name = onboardingData?.name;

  const [collapsed,    setCollapsed]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [searchFocus,  setSearchFocus]  = useState(false);
  const [showAIChat,   setShowAIChat]   = useState(false);

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
          boxShadow: '2px 0 8px rgba(120,100,80,0.04)', zIndex: 30, flexShrink: 0,
        }}>
          {/* Logo */}
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
                  background: 'linear-gradient(135deg, #B8D4B2, #8FA889)',
                  boxShadow: '0 2px 8px rgba(143,168,137,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>⚕️</div>
                <span style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15,
                  color: '#5C7A57', letterSpacing: '-0.3px',
                }}>MedPlanner</span>
              </button>
            ) : (
              <button onClick={() => navigate('/dashboard')} style={{
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
                  <NavItem key={item.id} item={item}
                    active={activeRoute === item.route}
                    collapsed={collapsed}
                    onClick={(i) => navigate(i.route)}
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
              />
            )}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* ── TOP HEADER ── */}
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
              border: `1px solid ${searchFocus ? (pageColor?.p || T.strategy.p) : T.border}`,
              borderRadius: 10, padding: '7px 13px',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 150ms ease',
              boxShadow: searchFocus ? `0 0 0 3px ${pageColor?.bg || T.strategy.bg}` : 'none',
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

            {/* Ações customizadas da página */}
            {headerRight}

            {/* Sino */}
            <button style={{
              background: T.input, border: `1px solid ${T.border}`,
              borderRadius: 10, width: 37, height: 37,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textSec, position: 'relative',
            }}>
              <BellIcon style={{ width: 17, height: 17 }} />
              {urgentCount > 0 && (
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
          </header>

          {/* ── PAGE HEADER (título da página) ── */}
          {(title || emoji) && (
            <div style={{
              padding: '20px 26px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {emoji && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 13, fontSize: 22,
                    background: pageColor?.bg || T.badge,
                    border: `1.5px solid ${pageColor?.p || T.border}`,
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
            </div>
          )}

          {/* ── CONTEÚDO DA PÁGINA ── */}
          <main className="page-fade" style={{
            flex: 1, padding: '22px 26px 96px',
            overflowY: 'auto',
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