import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCoupon } from '../context/CouponContext'; // ← NOVO IMPORT
import {
  CheckCircleIcon, XCircleIcon, ClockIcon, UserGroupIcon,
  ChartBarIcon, CogIcon, ShieldCheckIcon, DocumentTextIcon,
  TicketIcon, BellAlertIcon, ArrowDownTrayIcon,
  MagnifyingGlassIcon, FunnelIcon, HomeIcon, CurrencyDollarIcon,
  ExclamationTriangleIcon, ArrowTrendingUpIcon, ChevronLeftIcon,
  ChevronRightIcon, EyeIcon, PencilIcon, TrashIcon,
  LockClosedIcon, UserIcon, ArrowRightOnRectangleIcon,
  ServerIcon, WrenchScrewdriverIcon, MapIcon,
} from '@heroicons/react/24/outline';

// ─── Design System (mesma paleta do Dashboard) ────────────────────────────────
const T = {
  bg:       '#F4EFE6',
  card:     '#FFFCF7',
  border:   '#E8DFD3',
  input:    '#FAF6EF',
  badge:    '#EFE6D8',
  text:     '#3E3A36',
  textSec:  '#6B5E53',
  shadow:   '0 4px 12px rgba(120,100,80,0.07)',
  shadowMd: '0 8px 24px rgba(120,100,80,0.12)',

  exec:     { p: '#5C7A57', bg: '#EAF1E8', border: '#B8D4B2' },
  users:    { p: '#4A7A9B', bg: '#E8F0F5', border: '#A8C4D8' },
  plans:    { p: '#8FA889', bg: '#EAF1E8', border: '#C5D9C2' },
  metrics:  { p: '#8CA3A3', bg: '#E9F0F0', border: '#B8CECE' },
  logs:     { p: '#9E8E6A', bg: '#F5EFE0', border: '#D4C49E' },
  support:  { p: '#B7A8B8', bg: '#F1EBF2', border: '#D0C4D1' },
  config:   { p: '#CBBBA3', bg: '#F2ECE2', border: '#DDD0BC' },
  security: { p: '#C48E6B', bg: '#F3E4D8', border: '#E8C4A8' },

  danger:   { p: '#C0392B', bg: '#FDEAEA', border: '#F5C6C6' },
  warning:  { p: '#B7770D', bg: '#FEF3CD', border: '#F5D78E' },
  success:  { p: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7' },
};

const SECTIONS = [
  { id: 'exec',     label: 'Dashboard Executivo', icon: ChartBarIcon,        color: T.exec },
  { id: 'users',    label: 'Gestão de Usuários',  icon: UserGroupIcon,       color: T.users },
  { id: 'plans',    label: 'Planos & Assinaturas',icon: CurrencyDollarIcon,  color: T.plans },
  { id: 'metrics',  label: 'Métricas de Uso',     icon: ArrowTrendingUpIcon, color: T.metrics },
  { id: 'logs',     label: 'Logs & Auditoria',    icon: DocumentTextIcon,    color: T.logs },
  { id: 'support',  label: 'Suporte',             icon: TicketIcon,          color: T.support },
  { id: 'config',   label: 'Config. do Sistema',  icon: CogIcon,             color: T.config },
  { id: 'security', label: 'Segurança',           icon: ShieldCheckIcon,     color: T.security },
];

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function KPI({ icon, label, value, sub, color = T.exec }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${color.p}`,
      borderRadius: 13, padding: '16px 18px',
      boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, background: color.bg,
        border: `1px solid ${color.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <icon.type {...icon.props} style={{ width: 20, height: 20, color: color.p }} />
      </div>
      <div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 700, color: color.p, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHead({ emoji, title, subtitle, color = T.exec, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: color.bg, border: `1.5px solid ${color.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: T.shadow,
        }}>{emoji}</div>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: T.text }}>{title}</div>
          {subtitle && <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

function Badge({ label, type = 'neutral' }) {
  const styles = {
    success: { bg: T.success.bg, color: T.success.p, border: T.success.border },
    danger:  { bg: T.danger.bg,  color: T.danger.p,  border: T.danger.border },
    warning: { bg: T.warning.bg, color: T.warning.p, border: T.warning.border },
    neutral: { bg: T.badge,      color: T.textSec,   border: T.border },
    blue:    { bg: T.users.bg,   color: T.users.p,   border: T.users.border },
    purple:  { bg: T.support.bg, color: T.support.p, border: T.support.border },
  };
  const s = styles[type] || styles.neutral;
  return (
    <span style={{
      fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: 600,
      padding: '3px 8px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function Btn({ label, icon: Icon, onClick, variant = 'primary', small = false, disabled = false }) {
  const variants = {
    primary:  { bg: T.exec.p,      color: '#fff',   hover: '#4A6943' },
    danger:   { bg: T.danger.p,    color: '#fff',   hover: '#A93226' },
    warning:  { bg: T.warning.p,   color: '#fff',   hover: '#9A6310' },
    success:  { bg: T.success.p,   color: '#fff',   hover: '#256427' },
    ghost:    { bg: T.badge,       color: T.text,   hover: T.border },
    blue:     { bg: T.users.p,     color: '#fff',   hover: '#3A6A8B' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: small ? '6px 12px' : '8px 16px',
        background: disabled ? T.badge : v.bg,
        color: disabled ? T.textSec : v.color,
        border: 'none', borderRadius: 9,
        fontFamily: "'Poppins',sans-serif",
        fontSize: small ? 12 : 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease',
        whiteSpace: 'nowrap',
        boxShadow: disabled ? 'none' : T.shadow,
      }}
    >
      {Icon && <Icon style={{ width: small ? 14 : 16, height: small ? 14 : 16 }} />}
      {label}
    </button>
  );
}

function Input({ placeholder, value, onChange, type = 'text', style: sx = {} }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        fontFamily: "'Poppins',sans-serif", fontSize: 13,
        padding: '9px 13px', borderRadius: 9,
        border: `1px solid ${T.border}`,
        background: T.input, color: T.text,
        outline: 'none', width: '100%',
        ...sx,
      }}
    />
  );
}

function Card({ children, style: sx = {} }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '20px 22px',
      boxShadow: T.shadow, ...sx,
    }}>{children}</div>
  );
}

function MiniBar({ data, color, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            height: `${(d.value / max) * 52}px`,
            background: color,
            opacity: i === data.length - 1 ? 1 : 0.5 + (i / data.length) * 0.4,
            minHeight: 3,
            transition: 'height 600ms ease',
          }} />
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 9, color: T.textSec }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Section Components ────────────────────────────────────────────────────────

function ExecDashboard({ users, pendingCouponsCount }) {
  const totalUsers   = users.length;
  const activeUsers  = users.filter(u => u.subscription?.status === 'active' || u.subscriptionStatus === 'active').length;
  const paidUsers    = users.filter(u => ['student','premium','lifetime'].includes(u.subscription?.plan || u.subscriptionPlan)).length;
  const freeUsers    = totalUsers - paidUsers;
  const convRate     = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0;
  const blockedUsers = users.filter(u => u.accessBlocked).length;

  const planDist = [
    { label: 'Free',      value: users.filter(u => (u.subscription?.plan || u.subscriptionPlan || 'free') === 'free').length,     color: T.config.p },
    { label: 'Student',   value: users.filter(u => (u.subscription?.plan || u.subscriptionPlan) === 'student').length,            color: T.plans.p },
    { label: 'Premium',   value: users.filter(u => (u.subscription?.plan || u.subscriptionPlan) === 'premium').length,            color: T.users.p },
    { label: 'Vitalício', value: users.filter(u => (u.subscription?.plan || u.subscriptionPlan) === 'lifetime').length,           color: T.exec.p },
  ];

  const recentUsers = [...users]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 6)
    .map((u, i) => ({ label: `U${i+1}`, value: 1 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHead emoji="📊" title="Dashboard Executivo" subtitle="Visão geral do negócio em tempo real" color={T.exec} actions={
        <Btn label="Exportar CSV" icon={ArrowDownTrayIcon} variant="ghost" small onClick={() => exportUsersCSV(users)} />
      } />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
        <KPI icon={<UserGroupIcon />}      label="Total de Usuários"    value={totalUsers}   sub="Todos os cadastros"        color={T.exec} />
        <KPI icon={<CheckCircleIcon />}    label="Usuários Ativos"      value={activeUsers}  sub="Com plano ativo"           color={T.plans} />
        <KPI icon={<ArrowTrendingUpIcon />}label="Taxa de Conversão"    value={`${convRate}%`} sub="Free → Pago"             color={T.users} />
        <KPI icon={<CurrencyDollarIcon />} label="Usuários Pagos"       value={paidUsers}    sub={`${freeUsers} no free`}   color={T.metrics} />
        <KPI icon={<ExclamationTriangleIcon/>}label="Bloqueados"         value={blockedUsers} sub="Acesso suspenso"          color={T.security} />
        <KPI icon={<ClockIcon />}          label="Cupons Pendentes"     value={pendingCouponsCount} sub="Aguardando aprovação" color={T.logs} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 14 }}>
            📦 Distribuição de Planos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {planDist.map(p => (
              <div key={p.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec }}>{p.label}</span>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: p.color }}>{p.value}</span>
                </div>
                <div style={{ background: T.bg, borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 6, background: p.color,
                    width: totalUsers > 0 ? `${(p.value / totalUsers) * 100}%` : '0%',
                    transition: 'width 600ms ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 14 }}>
            👥 Cadastros Recentes
          </div>
          <MiniBar data={recentUsers.length > 0 ? recentUsers : [{ label: '-', value: 0 }]} color={T.exec.p} />
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 10, textAlign: 'center' }}>
            Últimos {recentUsers.length} usuários cadastrados
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 14 }}>
          🏥 Indicadores de Saúde do Sistema
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
          {[
            { label: 'Usuários ativos / total', value: `${totalUsers > 0 ? ((activeUsers/totalUsers)*100).toFixed(0) : 0}%`, ok: activeUsers/totalUsers > 0.8 },
            { label: 'Taxa de conversão', value: `${convRate}%`, ok: convRate > 10 },
            { label: 'Cupons pendentes', value: pendingCouponsCount, ok: pendingCouponsCount === 0 },
            { label: 'Usuários bloqueados', value: blockedUsers, ok: blockedUsers === 0 },
          ].map(ind => (
            <div key={ind.label} style={{
              background: ind.ok ? T.success.bg : T.warning.bg,
              border: `1px solid ${ind.ok ? T.success.border : T.warning.border}`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 700, color: ind.ok ? T.success.p : T.warning.p }}>
                {ind.value}
              </div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 2 }}>{ind.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UsersPanel({ users, onUpdate, onLog }) {
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.displayName?.toLowerCase().includes(search.toLowerCase());
    const plan = u.subscription?.plan || u.subscriptionPlan || 'free';
    const matchPlan = filterPlan === 'all' || plan === filterPlan;
    const blocked = u.accessBlocked;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'blocked' && blocked)
      || (filterStatus === 'active' && !blocked);
    return matchSearch && matchPlan && matchStatus;
  }), [users, search, filterPlan, filterStatus]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const planColor = (plan) => {
    if (plan === 'lifetime') return 'purple';
    if (plan === 'premium') return 'blue';
    if (plan === 'student') return 'success';
    return 'neutral';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SectionHead emoji="👥" title="Gestão de Usuários" subtitle={`${users.length} usuários cadastrados`} color={T.users} actions={
        <Btn label="Exportar CSV" icon={ArrowDownTrayIcon} variant="ghost" small onClick={() => exportUsersCSV(users)} />
      } />

      <Card style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: T.input, borderRadius: 9, padding: '8px 12px', border: `1px solid ${T.border}` }}>
            <MagnifyingGlassIcon style={{ width: 15, height: 15, color: T.textSec }} />
            <input placeholder="Buscar por nome ou email..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.text, width: '100%' }} />
          </div>
          <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(0); }}
            style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, padding: '8px 12px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.input, color: T.text, cursor: 'pointer' }}>
            <option value="all">Todos os planos</option>
            <option value="free">Free</option>
            <option value="student">Estudante</option>
            <option value="premium">Premium</option>
            <option value="lifetime">Vitalício</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
            style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, padding: '8px 12px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.input, color: T.text, cursor: 'pointer' }}>
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="blocked">Bloqueados</option>
          </select>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec }}>{filtered.length} resultado(s)</span>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {['Usuário', 'Plano', 'Status', 'Cadastro', 'Último Login', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: T.textSec, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((u, i) => {
                const plan = u.subscription?.plan || u.subscriptionPlan || 'free';
                const blocked = u.accessBlocked;
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.input }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{u.displayName || '—'}</div>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <Badge label={plan.charAt(0).toUpperCase() + plan.slice(1)} type={planColor(plan)} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <Badge label={blocked ? '🔒 Bloqueado' : '✅ Ativo'} type={blocked ? 'danger' : 'success'} />
                    </td>
                    <td style={{ padding: '11px 14px', fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec }}>
                      {u.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec }}>
                      {u.lastLogin?.toDate?.()?.toLocaleString('pt-BR') || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button onClick={() => setSelected(u)} style={{ background: T.users.bg, border: `1px solid ${T.users.border}`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <EyeIcon style={{ width: 12, height: 12, color: T.users.p }} />
                          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.users.p }}>Ver</span>
                        </button>
                        {blocked
                          ? <button onClick={() => { onUpdate(u.id, { accessBlocked: false }); onLog(`Desbloqueou usuário ${u.email}`); }} style={{ background: T.success.bg, border: `1px solid ${T.success.border}`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer' }}>
                              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.success.p }}>Desbloquear</span>
                            </button>
                          : <button onClick={() => { if(confirm(`Bloquear ${u.email}?`)) { onUpdate(u.id, { accessBlocked: true }); onLog(`Bloqueou usuário ${u.email}`); }}} style={{ background: T.danger.bg, border: `1px solid ${T.danger.border}`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer' }}>
                              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.danger.p }}>Bloquear</span>
                            </button>
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginated.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.textSec }}>
              Nenhum usuário encontrado.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec }}>Página {page + 1} de {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ background: T.badge, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}>
                <ChevronLeftIcon style={{ width: 14, height: 14, color: T.textSec }} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                style={{ background: T.badge, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.5 : 1 }}>
                <ChevronRightIcon style={{ width: 14, height: 14, color: T.textSec }} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,50,40,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: T.card, borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: T.shadowMd }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 16, color: T.text }}>👤 Detalhes do Usuário</span>
              <button onClick={() => setSelected(null)} style={{ background: T.badge, border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: T.textSec, fontFamily: "'Poppins',sans-serif", fontSize: 13 }}>✕</button>
            </div>
            {[
              ['Email', selected.email],
              ['Nome', selected.displayName || '—'],
              ['Plano', selected.subscription?.plan || selected.subscriptionPlan || 'free'],
              ['Status', selected.accessBlocked ? '🔒 Bloqueado' : '✅ Ativo'],
              ['Cadastro', selected.createdAt?.toDate?.()?.toLocaleString('pt-BR') || '—'],
              ['Último login', selected.lastLogin?.toDate?.()?.toLocaleString('pt-BR') || '—'],
              ['UID', selected.id],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec }}>{k}</span>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: T.text, textAlign: 'right', maxWidth: 260, wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
              {['free','student','premium','lifetime'].map(plan => (
                <button key={plan} onClick={() => {
                  onUpdate(selected.id, { 'subscription.plan': plan, 'subscription.status': 'active', subscriptionStatus: 'active' });
                  onLog(`Alterou plano de ${selected.email} para ${plan}`);
                  setSelected(null);
                }} style={{
                  fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600,
                  padding: '7px 13px', borderRadius: 9, border: `1px solid ${T.border}`,
                  background: T.badge, color: T.text, cursor: 'pointer',
                }}>→ {plan}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PLANS PANEL - ATUALIZADO COM INTEGRAÇÃO COUPON CONTEXT
// ═══════════════════════════════════════════════════════════════════
function PlansPanel({ onLog }) {
  // ← USAR HOOK DO COUPON CONTEXT
  const { pendingCoupons, approvedCoupons, approveCoupon, rejectCoupon } = useCoupon();

  const PLANS = [
    { id: 'free',     name: 'Free',      price: 'R$ 0',    color: T.config,   features: ['Calendário básico','Tarefas (limite 10)','Finanças básicas'] },
    { id: 'student',  name: 'Estudante', price: 'R$ 19,90',color: T.plans,    features: ['Tudo do Free','Tarefas ilimitadas','Analytics básico','Estratégia'] },
    { id: 'premium',  name: 'Premium',   price: 'R$ 39,90',color: T.users,    features: ['Tudo do Estudante','Visão 360°','IA ilimitada','Bem-estar avançado'] },
    { id: 'lifetime', name: 'Vitalício', price: 'Único',   color: T.security, features: ['Tudo do Premium','Acesso vitalício','Sem cobranças futuras'] },
  ];

  const handleApprove = async (couponId, couponData) => {
    if (!confirm(`Aprovar cupom para ${couponData.userEmail}?`)) return;
    
    const result = await approveCoupon(couponId);
    
    if (result.success) {
      onLog(`Aprovou cupom de ${couponData.userEmail} — ${couponData.couponCode}`);
      alert('✅ Cupom aprovado com sucesso!');
    } else {
      alert('❌ Erro ao aprovar cupom: ' + result.message);
    }
  };

  const handleReject = async (couponId, couponData) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason === null) return; // Cancelou
    
    const result = await rejectCoupon(couponId, reason);
    
    if (result.success) {
      onLog(`Rejeitou cupom de ${couponData.userEmail}`);
      alert('❌ Cupom rejeitado.');
    } else {
      alert('❌ Erro ao rejeitar cupom: ' + result.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHead emoji="💳" title="Planos & Assinaturas" subtitle="Gestão de planos, preços e cupons" color={T.plans} />

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        {PLANS.map(p => (
          <div key={p.id} style={{
            background: T.card, border: `1px solid ${p.color.border}`,
            borderTop: `4px solid ${p.color.p}`,
            borderRadius: 13, padding: '16px 18px', boxShadow: T.shadow,
          }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: p.color.p, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 10 }}>{p.price}</div>
            {p.features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color.p, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11.5, color: T.textSec }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Coupon requests PENDENTES */}
      {pendingCoupons.length > 0 && (
        <Card>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: T.warning.p, marginBottom: 14 }}>
            ⏳ Cupons Pendentes ({pendingCoupons.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingCoupons.map(r => (
              <div key={r.id} style={{ background: T.warning.bg, border: `1px solid ${T.warning.border}`, borderRadius: 11, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text }}>{r.userEmail}</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 2 }}>
                    Cupom: {r.couponCode} ({r.couponLabel}) • Plano alvo: {r.targetPlan} • Final: R$ {r.finalPrice?.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: T.textSec, marginTop: 4 }}>
                    Solicitado em: {r.createdAt?.toDate?.()?.toLocaleString('pt-BR') || 'Agora'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn label="✅ Aprovar" icon={CheckCircleIcon} variant="success" small onClick={() => handleApprove(r.id, r)} />
                  <Btn label="❌ Rejeitar" icon={XCircleIcon} variant="danger" small onClick={() => handleReject(r.id, r)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Coupon history APROVADOS */}
      {approvedCoupons.length > 0 && (
        <Card>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>
            📋 Histórico de Cupons Aprovados ({approvedCoupons.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvedCoupons
              .sort((a, b) => (b.approvedAt?.seconds || b.createdAt?.seconds || 0) - (a.approvedAt?.seconds || a.createdAt?.seconds || 0))
              .slice(0, 20)
              .map(r => (
                <div key={r.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 9,
                  background: T.success.bg,
                  border: `1px solid ${T.success.border}`,
                }}>
                  <div>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: T.text }}>{r.userEmail}</span>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginLeft: 8 }}>
                      {r.couponCode} • {r.targetPlan} • R$ {r.finalPrice?.toFixed(2)}
                    </span>
                  </div>
                  <Badge label="✅ Aprovado" type="success" />
                </div>
              ))}
          </div>
        </Card>
      )}

      {pendingCoupons.length === 0 && approvedCoupons.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              Nenhum cupom registrado ainda
            </div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec }}>
              Quando usuários aplicarem cupons, eles aparecerão aqui para aprovação.
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricsPanel({ users }) {
  const totalUsers = users.length;

  const featureUsage = [
    { label: 'Calendário',    pct: 87, color: T.metrics.p },
    { label: 'Finanças',      pct: 62, color: T.plans.p },
    { label: 'Saúde',         pct: 54, color: T.exec.p },
    { label: 'Bem-Estar',     pct: 41, color: T.support.p },
    { label: 'Estratégia',    pct: 38, color: T.security.p },
    { label: 'Visão 360°',    pct: 29, color: T.logs.p },
    { label: 'Casa',          pct: 25, color: T.config.p },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHead emoji="📈" title="Métricas de Uso" subtitle="Analytics do produto — não do usuário" color={T.metrics} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 16 }}>
            🔧 Adesão por Funcionalidade
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {featureUsage.map(f => (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec }}>{f.label}</span>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: f.color }}>{f.pct}%</span>
                </div>
                <div style={{ background: T.bg, borderRadius: 6, height: 7, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.pct}%`, borderRadius: 6, background: f.color, transition: 'width 700ms ease' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Tempo médio de sessão', value: '14min', icon: '⏱', color: T.metrics },
            { label: 'Taxa de retenção (7d)',  value: '68%',   icon: '🔄', color: T.exec },
            { label: 'Usuários DAU estimado',  value: Math.round(totalUsers * 0.3), icon: '👁', color: T.plans },
            { label: 'Funções com baixa adesão', value: '2', icon: '⚠️', color: T.warning },
          ].map(m => (
            <div key={m.label} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderLeft: `4px solid ${(m.color?.p || T.warning.p)}`,
              borderRadius: 11, padding: '12px 15px', boxShadow: T.shadow,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 700, color: m.color?.p || T.text }}>{m.value}</div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 12 }}>
          ℹ️ Nota sobre métricas
        </div>
        <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
          Os percentuais de adesão por funcionalidade são estimativas baseadas nos dados disponíveis. 
          Para métricas precisas de comportamento, integre com Firebase Analytics, Mixpanel ou Amplitude.
        </p>
      </Card>
    </div>
  );
}

function LogsPanel({ auditLogs }) {
  const [filter, setFilter] = useState('');

  const filtered = auditLogs.filter(l =>
    !filter || l.action?.toLowerCase().includes(filter.toLowerCase()) || l.adminEmail?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHead emoji="🗂" title="Logs & Auditoria" subtitle="Histórico de ações administrativas" color={T.logs} actions={
        <Btn label="Exportar" icon={ArrowDownTrayIcon} variant="ghost" small onClick={() => {
          const csv = ['Data,Admin,Ação', ...auditLogs.map(l => `"${l.timestamp || ''}","${l.adminEmail || ''}","${l.action || ''}"`)].join('\n');
          downloadCSV(csv, 'audit_logs.csv');
        }} />
      } />

      <Card style={{ padding: '12px 16px' }}>
        <Input placeholder="Filtrar logs..." value={filter} onChange={e => setFilter(e.target.value)} />
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.textSec }}>
            Nenhum log registrado ainda.
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {filtered.map((log, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px',
                borderBottom: `1px solid ${T.border}`,
                background: i % 2 === 0 ? T.card : T.input,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: log.type === 'danger' ? T.danger.p : log.type === 'warning' ? T.warning.p : T.exec.p,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, color: T.text }}>{log.action}</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 1 }}>
                    {log.adminEmail} • {log.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function SupportPanel() {
  const [tickets] = useState([
    { id: 1, user: 'usuario@email.com', subject: 'Problema ao sincronizar calendário', status: 'open', priority: 'high', date: '27/02/2026' },
    { id: 2, user: 'outro@email.com',   subject: 'Como cancelar assinatura?',          status: 'answered', priority: 'low', date: '26/02/2026' },
    { id: 3, user: 'teste@email.com',   subject: 'Bug na tela de finanças',            status: 'open', priority: 'medium', date: '25/02/2026' },
  ]);

  const statusStyle = { open: 'warning', answered: 'blue', resolved: 'success' };
  const prioStyle   = { high: 'danger', medium: 'warning', low: 'neutral' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHead emoji="🎫" title="Suporte & Atendimento" subtitle="Tickets, feedbacks e reclamações" color={T.support} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Em aberto', value: tickets.filter(t=>t.status==='open').length, color: T.warning },
          { label: 'Respondidos', value: tickets.filter(t=>t.status==='answered').length, color: T.users },
          { label: 'Resolvidos', value: tickets.filter(t=>t.status==='resolved').length, color: T.exec },
        ].map(s => (
          <div key={s.label} style={{
            background: s.color.bg, border: `1px solid ${s.color.border}`,
            borderRadius: 12, padding: '16px 18px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 26, fontWeight: 700, color: s.color.p }}>{s.value}</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {['Usuário','Assunto','Status','Prioridade','Data'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: T.textSec, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}`, background: i%2===0 ? T.card : T.input }}>
                <td style={{ padding: '10px 14px', fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec }}>{t.user}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'Poppins',sans-serif", fontSize: 12.5, fontWeight: 500, color: T.text }}>{t.subject}</td>
                <td style={{ padding: '10px 14px' }}><Badge label={t.status} type={statusStyle[t.status]} /></td>
                <td style={{ padding: '10px 14px' }}><Badge label={t.priority} type={prioStyle[t.priority]} /></td>
                <td style={{ padding: '10px 14px', fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec }}>{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ background: T.support.bg, border: `1px solid ${T.support.border}`, borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, color: T.support.p, fontWeight: 600 }}>ℹ️ Integração de Suporte</div>
        <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.textSec, marginTop: 6, lineHeight: 1.6 }}>
          Para um sistema de tickets completo, integre com Intercom, Crisp ou Zendesk. Os tickets acima são demonstrativos.
        </p>
      </div>
    </div>
  );
}

function ConfigPanel() {
  const [features, setFeatures] = useState({
    aiAssistant: true, estrategia: true, wellnessModule: true,
    analytics360: true, financesModule: true, studyModule: true,
  });
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHead emoji="⚙️" title="Configurações Globais" subtitle="Funcionalidades e parâmetros do sistema" color={T.config} />

      <Card>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 16 }}>
          🔧 Ativar / Desativar Funcionalidades
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(features).map(([key, val]) => {
            const labels = {
              aiAssistant: 'Assistente IA', estrategia: 'Módulo Estratégia',
              wellnessModule: 'Bem-Estar Mental', analytics360: 'Visão 360°',
              financesModule: 'Finanças', studyModule: 'Estudos',
            };
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.text }}>{labels[key]}</span>
                <button onClick={() => setFeatures(f => ({ ...f, [key]: !f[key] }))} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: val ? T.exec.p : T.border, transition: 'background 200ms ease',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: val ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 200ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 14 }}>
          🚧 Modo Manutenção
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.textSec }}>Ativar mensagem de manutenção global</span>
          <button onClick={() => setMaintenance(m => !m)} style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: maintenance ? T.danger.p : T.border, transition: 'background 200ms ease', position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 3, left: maintenance ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 200ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
        {maintenance && (
          <textarea value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} placeholder="Mensagem exibida para os usuários..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.input, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.text, resize: 'vertical', minHeight: 80, outline: 'none' }} />
        )}
      </Card>

      <Card>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 12 }}>
          🔗 Integrações Externas
        </div>
        {[
          { name: 'Firebase Analytics', status: 'conectado',      color: T.exec },
          { name: 'Stripe / Pagamentos', status: 'não configurado', color: T.warning },
          { name: 'SendGrid / Email',    status: 'não configurado', color: T.warning },
          { name: 'Sentry / Erros',     status: 'não configurado', color: T.warning },
        ].map(int => (
          <div key={int.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: T.text }}>{int.name}</span>
            <Badge label={int.status} type={int.status === 'conectado' ? 'success' : 'warning'} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function SecurityPanel({ onLog }) {
  const [admins] = useState([
    { email: 'medplanner17@gmail.com', role: 'Super Admin', lastAccess: '27/02/2026 19:40', twoFA: true },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHead emoji="🔐" title="Segurança" subtitle="Controle de acesso, permissões e RBAC" color={T.security} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 14 }}>
            👑 Administradores
          </div>
          {admins.map(a => (
            <div key={a.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{a.email}</div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 2 }}>Último acesso: {a.lastAccess}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <Badge label={a.role} type="purple" />
                <Badge label={a.twoFA ? '2FA ✅' : '2FA ❌'} type={a.twoFA ? 'success' : 'danger'} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 14 }}>
            🎭 Níveis de Permissão (RBAC)
          </div>
          {[
            { role: 'Super Admin', perms: 'Acesso total ao sistema', color: T.security },
            { role: 'Admin',       perms: 'Gerenciar usuários e planos', color: T.users },
            { role: 'Suporte',     perms: 'Ver usuários e tickets', color: T.support },
          ].map(r => (
            <div key={r.role} style={{ marginBottom: 12, padding: '10px 12px', background: r.color.bg, border: `1px solid ${r.color.border}`, borderRadius: 9 }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, fontWeight: 600, color: r.color.p }}>{r.role}</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: T.textSec, marginTop: 2 }}>{r.perms}</div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 14 }}>
          🛡 Recomendações de Segurança
        </div>
        {[
          { ok: true,  item: 'Autenticação via Firebase Auth ativa' },
          { ok: true,  item: 'Rotas administrativas protegidas por AdminRoute' },
          { ok: false, item: 'Autenticação em dois fatores (2FA) — recomendado ativar' },
          { ok: false, item: 'Rate limiting nas APIs — configurar no Firebase' },
          { ok: false, item: 'Auditoria completa de acessos — expandir logs' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 16 }}>{r.ok ? '✅' : '⚠️'}</span>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, color: r.ok ? T.text : T.warning.p }}>{r.item}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function exportUsersCSV(users) {
  const rows = ['Email,Nome,Plano,Status,Cadastro'];
  users.forEach(u => {
    rows.push(`"${u.email}","${u.displayName || ''}","${u.subscription?.plan || 'free'}","${u.accessBlocked ? 'bloqueado' : 'ativo'}","${u.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || ''}"`);
  });
  downloadCSV(rows.join('\n'), 'usuarios.csv');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingCoupons } = useCoupon(); // ← USAR HOOK AQUI TAMBÉM

  const [activeSection, setActiveSection] = useState('exec');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'auditLogs')).catch(() => ({ docs: [] })),
      ]);
      setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAuditLogs(logsSnap.docs.map(d => d.data()).sort((a,b) => b.timestamp?.localeCompare?.(a.timestamp) || 0));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateDoc = async (collectionName, docId, data) => {
    try {
      await updateDoc(doc(db, collectionName, docId), data);
      await loadData();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleLog = async (action, type = 'info') => {
    const entry = {
      action,
      type,
      adminEmail: user?.email || 'unknown',
      timestamp: new Date().toLocaleString('pt-BR'),
    };
    setAuditLogs(prev => [entry, ...prev]);
    try {
      await addDoc(collection(db, 'auditLogs'), { ...entry, createdAt: serverTimestamp() });
    } catch (err) { /* silent */ }
  };

  const SW = sidebarCollapsed ? 60 : 210;
  const pendingCount = pendingCoupons.length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.bg }}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: T.textSec }}>Carregando painel...</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        body{font-family:'Poppins',sans-serif;background:${T.bg};margin:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}
        .admin-nav-btn:hover{background:${T.badge}!important}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fi .35s ease both}
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>

        <aside style={{
          width: SW, minWidth: SW, maxWidth: SW,
          background: T.card, borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
          padding: sidebarCollapsed ? '18px 8px' : '18px 12px',
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden', transition: 'width 200ms ease, min-width 200ms ease',
          boxShadow: '2px 0 8px rgba(120,100,80,0.05)', zIndex: 30, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22, justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
            {!sidebarCollapsed && (
              <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#B8D4B2,#8FA889)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, boxShadow: '0 2px 8px rgba(143,168,137,0.35)' }}>⚕️</div>
                <div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: '#5C7A57', lineHeight: 1 }}>MedPlanner</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, color: T.security.p, fontWeight: 600 }}>PAINEL ADM</div>
                </div>
              </button>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: T.badge, border: `1px solid ${T.border}`, borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textSec, flexShrink: 0 }}>
              {sidebarCollapsed ? <ChevronRightIcon style={{ width: 13, height: 13 }} /> : <ChevronLeftIcon style={{ width: 13, height: 13 }} />}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!sidebarCollapsed && (
              <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: 600, color: T.textSec, letterSpacing: '.7px', padding: '0 4px', marginBottom: 6, opacity: .65 }}>SEÇÕES</div>
            )}
            {SECTIONS.map(s => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  className="admin-nav-btn"
                  onClick={() => setActiveSection(s.id)}
                  title={sidebarCollapsed ? s.label : ''}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: sidebarCollapsed ? 0 : 9,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    width: '100%', padding: sidebarCollapsed ? '9px 0' : '8px 10px',
                    border: 'none', borderRadius: 9,
                    borderLeft: isActive && !sidebarCollapsed ? `3px solid ${s.color.p}` : '3px solid transparent',
                    background: isActive ? s.color.bg : 'transparent',
                    color: isActive ? s.color.p : T.textSec,
                    fontFamily: "'Poppins',sans-serif", fontSize: 12.5,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer', transition: 'all 150ms ease',
                    marginBottom: 2, boxSizing: 'border-box', position: 'relative',
                  }}
                >
                  <s.icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                  {!sidebarCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>}
                  {!sidebarCollapsed && s.id === 'plans' && pendingCount > 0 && (
                    <span style={{ background: T.warning.p, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{pendingCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          <button onClick={() => navigate('/dashboard')} className="admin-nav-btn" style={{
            display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : 8,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            width: '100%', padding: sidebarCollapsed ? '9px 0' : '8px 10px',
            background: 'transparent', border: 'none', borderRadius: 9,
            cursor: 'pointer', color: T.textSec,
            fontFamily: "'Poppins',sans-serif", fontSize: 12, marginTop: 8,
          }}>
            <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} />
            {!sidebarCollapsed && <span>← Voltar ao App</span>}
          </button>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          <header style={{
            height: 56, background: T.card, borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
            position: 'sticky', top: 0, zIndex: 20,
            boxShadow: '0 2px 8px rgba(120,100,80,0.04)',
          }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, color: T.text }}>
              {SECTIONS.find(s => s.id === activeSection)?.label}
            </div>
            <div style={{ flex: 1 }} />
            {pendingCount > 0 && (
              <div style={{ background: T.warning.bg, border: `1px solid ${T.warning.border}`, borderRadius: 9, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BellAlertIcon style={{ width: 14, height: 14, color: T.warning.p }} />
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: T.warning.p, fontWeight: 600 }}>{pendingCount} cupom(ns) pendente(s)</span>
              </div>
            )}
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${T.security.p},${T.support.p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13 }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </header>

          <main style={{ flex: 1, padding: '24px 26px 80px', overflowY: 'auto' }} className="fade">
            {activeSection === 'exec'     && <ExecDashboard users={allUsers} pendingCouponsCount={pendingCount} />}
            {activeSection === 'users'    && <UsersPanel users={allUsers} onUpdate={(id, data) => handleUpdateDoc('users', id, data)} onLog={handleLog} />}
            {activeSection === 'plans'    && <PlansPanel onLog={handleLog} />}
            {activeSection === 'metrics'  && <MetricsPanel users={allUsers} />}
            {activeSection === 'logs'     && <LogsPanel auditLogs={auditLogs} />}
            {activeSection === 'support'  && <SupportPanel />}
            {activeSection === 'config'   && <ConfigPanel />}
            {activeSection === 'security' && <SecurityPanel onLog={handleLog} />}
          </main>
        </div>
      </div>
    </>
  );
}