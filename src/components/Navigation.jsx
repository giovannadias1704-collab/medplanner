import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  HomeIcon, 
  CalendarIcon, 
  HeartIcon, 
  CurrencyDollarIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  HomeModernIcon,
  ChartBarIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const ADMIN_EMAIL = 'medplanner17@gmail.com';

// Pastel Safari palette (same as Dashboard)
const S = {
  bg:      '#FFFCF7',
  border:  '#E8DFD3',
  text:    '#3E3A36',
  textSec: '#6B5E53',
  badge:   '#EFE6D8',
  active:  { text: '#8FA889', bg: '#EAF1E8' },   // verde oliva suave
  logo:    { icon: '#A8BFA3', text: '#5C7A57' },  // verde sálvia médio — destaca sem vibrar
  admin:   { text: '#C48E6B', bg: '#F3E4D8' },
};

// Páginas que têm sidebar própria — Navigation fica oculto
const SIDEBAR_PAGES = ['/dashboard'];

export default function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Não renderiza nada nas páginas com sidebar própria
  if (SIDEBAR_PAGES.includes(location.pathname)) return null;

  const navItems = [
    { path: '/dashboard', icon: HomeIcon,         label: 'Home' },
    { path: '/calendar',  icon: CalendarIcon,     label: 'Agenda' },
    { path: '/casa',      icon: HomeModernIcon,   label: 'Casa' },
    { path: '/study',     icon: BookOpenIcon,     label: 'Estudos' },
    { path: '/health',    icon: HeartIcon,        label: 'Saúde' },
    { path: '/finances',  icon: CurrencyDollarIcon, label: 'Finanças' },
    { path: '/wellness',  icon: HeartIcon,        label: 'Bem-estar' },
    { path: '/analytics', icon: ChartBarIcon,     label: 'Visão 360°' },
    { path: '/estrategia',icon: SparklesIcon,     label: 'Estratégia' },
    { path: '/pricing',   icon: SparklesIcon,     label: 'Planos' },
    { path: '/settings',  icon: Cog6ToothIcon,    label: 'Config' },
    ...(isAdmin ? [{ path: '/admin', icon: ShieldCheckIcon, label: 'Admin' }] : []),
  ];

  return (
    <>
      {/* ── Desktop ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: S.bg,
        borderBottom: `1px solid ${S.border}`,
        boxShadow: '0 2px 8px rgba(120,100,80,0.06)',
        zIndex: 9999,
        display: 'flex',
      }} className="hidden md:flex">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

            {/* Logo */}
            <Link
              to="/dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                textDecoration: 'none', flexShrink: 0,
              }}
            >
              {/* Ícone do logo */}
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: `linear-gradient(135deg, #B8D4B2, #8FA889)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(143,168,137,0.35)',
                fontSize: 17, flexShrink: 0,
              }}>⚕️</div>

              {/* Nome */}
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700, fontSize: 16,
                color: S.logo.text,
                letterSpacing: '-0.3px',
              }}>MedPlanner</span>
            </Link>

            {/* Nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                const isAdminLink = item.path === '/admin';
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 11px', borderRadius: 9,
                      textDecoration: 'none',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 13, whiteSpace: 'nowrap',
                      transition: 'all 150ms ease',
                      fontWeight: isActive ? 600 : 400,
                      background: isActive
                        ? (isAdminLink ? S.admin.bg : S.active.bg)
                        : 'transparent',
                      color: isActive
                        ? (isAdminLink ? S.admin.text : S.active.text)
                        : isAdminLink ? S.admin.text : S.textSec,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = S.badge;
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile ── */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: S.bg,
          borderTop: `1px solid ${S.border}`,
          boxShadow: '0 -2px 12px rgba(120,100,80,0.08)',
          zIndex: 9999,
        }}
      >
        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, 1fr)`, borderBottom: `1px solid ${S.border}` }}>
          {navItems.slice(0, 5).map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '10px 4px',
                  textDecoration: 'none',
                  color: isActive ? S.active.text : S.textSec,
                  background: isActive ? S.active.bg : 'transparent',
                  transition: 'all 150ms ease',
                }}
              >
                <Icon style={{ width: 22, height: 22, marginBottom: 3 }} />
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${navItems.slice(5).length}, 1fr)` }}>
          {navItems.slice(5).map(item => {
            const isActive = location.pathname === item.path;
            const isAdminLink = item.path === '/admin';
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '10px 4px',
                  textDecoration: 'none',
                  color: isAdminLink ? S.admin.text : isActive ? S.active.text : S.textSec,
                  background: isActive ? (isAdminLink ? S.admin.bg : S.active.bg) : 'transparent',
                  transition: 'all 150ms ease',
                }}
              >
                <Icon style={{ width: 22, height: 22, marginBottom: 3 }} />
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacers para outras páginas */}
      <div className="hidden md:block" style={{ height: 60 }} aria-hidden="true" />
      <div className="md:hidden" style={{ height: 130 }} aria-hidden="true" />
    </>
  );
}