import { useState, useMemo, useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import {
  PlusIcon, XMarkIcon, TrashIcon, CheckCircleIcon, ClockIcon,
  ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  BanknotesIcon, FireIcon, ShieldCheckIcon, FlagIcon,
  ExclamationTriangleIcon, SparklesIcon, CreditCardIcon,
  ArrowPathIcon, FunnelIcon, CalendarDaysIcon
} from '@heroicons/react/24/outline';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const today = () => new Date().toISOString().split('T')[0];

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date(today());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'moradia',     label: 'Moradia',       emoji: '🏠', type: 'fixed',    color: '#6366f1' },
  { id: 'alimentacao', label: 'Alimentação',   emoji: '🍽️', type: 'variable', color: '#f59e0b' },
  { id: 'transporte',  label: 'Transporte',    emoji: '🚗', type: 'variable', color: '#3b82f6' },
  { id: 'saude',       label: 'Saúde',         emoji: '💊', type: 'fixed',    color: '#10b981' },
  { id: 'educacao',    label: 'Educação',      emoji: '📚', type: 'fixed',    color: '#8b5cf6' },
  { id: 'lazer',       label: 'Lazer',         emoji: '🎮', type: 'variable', color: '#ec4899' },
  { id: 'vestuario',   label: 'Vestuário',     emoji: '👕', type: 'variable', color: '#f97316' },
  { id: 'assinaturas', label: 'Assinaturas',   emoji: '📱', type: 'fixed',    color: '#14b8a6' },
  { id: 'delivery',    label: 'Delivery',      emoji: '🛵', type: 'variable', color: '#ef4444' },
  { id: 'outros',      label: 'Outros',        emoji: '📦', type: 'variable', color: '#6b7280' },
];

const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência'];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function MiniProgressBar({ value, max, color = '#10b981', alert80 = false }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : color;
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-1">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

function StatCard({ icon, title, value, sub, color = 'emerald', trend }) {
  const colors = {
    emerald: 'from-emerald-500 to-teal-600',
    red: 'from-red-500 to-rose-600',
    amber: 'from-amber-500 to-orange-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-violet-600',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <span className="text-white text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{title}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.up ? '↑' : '↓'} {trend.label}
        </div>
      )}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="text-center text-gray-400 py-8">Sem dados</div>;

  let cumulative = 0;
  const r = 70, cx = 90, cy = 90, strokeW = 28;
  const circ = 2 * Math.PI * r;

  const segments = data.map(d => {
    const pct = d.value / total;
    const offset = circ * (1 - cumulative - pct);
    const dasharray = `${circ * pct} ${circ * (1 - pct)}`;
    cumulative += pct;
    return { ...d, dasharray, offset, pct };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="180" height="180" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeW} />
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'all 0.5s' }}
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-gray-900 dark:fill-white" fontSize="13" fontWeight="700">Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-gray-500" fontSize="11">{formatCurrency(total)}</text>
      </svg>
      <div className="flex-1 space-y-2">
        {segments.slice(0, 6).map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{s.label}</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white ml-2">{(s.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineSparkline({ data, color = '#10b981' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.v));
  const min = Math.min(...data.map(d => d.v));
  const range = max - min || 1;
  const W = 280, H = 60, pad = 8;
  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((d.v - min) / range) * (H - pad * 2)
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width={W} height={H} className="w-full">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

// ─── Modal de Transação ───────────────────────────────────────────────────────
function TransactionModal({ onClose, onSave, editData = null }) {
  const [form, setForm] = useState(editData || {
    type: 'expense',
    title: '',
    amount: '',
    date: today(),
    category: 'alimentacao',
    paymentMethod: 'Pix',
    notes: '',
    installments: 1,
    totalInstallments: 1,
    recurring: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    const base = { ...form, amount: parseFloat(form.amount), createdAt: new Date().toISOString() };

    if (form.totalInstallments > 1) {
      const items = [];
      for (let i = 0; i < form.totalInstallments; i++) {
        const d = new Date(form.date);
        d.setMonth(d.getMonth() + i);
        items.push({
          ...base,
          date: d.toISOString().split('T')[0],
          installments: i + 1,
          amount: base.amount / form.totalInstallments,
          title: `${base.title} (${i + 1}/${form.totalInstallments})`,
        });
      }
      items.forEach(item => onSave(item));
    } else {
      onSave(base);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {editData ? 'Editar' : 'Nova'} Transação
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tipo */}
        <div className="flex gap-2 mb-5">
          {[['expense', '💸 Despesa'], ['income', '💰 Receita']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => set('type', val)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                form.type === val
                  ? val === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Descrição</label>
            <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Ex: Almoço, Aluguel, Salário..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Valor (R$)</label>
              <input type="number" step="0.01" required value={form.amount} onChange={e => set('amount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Data</label>
              <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm" />
            </div>
          </div>

          {form.type === 'expense' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => set('category', cat.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all border-2 ${
                        form.category === cat.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Forma de Pagamento</label>
                <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm">
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Parcelas</label>
                  <select value={form.totalInstallments} onChange={e => set('totalInstallments', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x`}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl mt-5">
                  <input type="checkbox" id="recurring-t" checked={form.recurring} onChange={e => set('recurring', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500" />
                  <label htmlFor="recurring-t" className="text-xs text-gray-600 dark:text-gray-400 font-medium">🔄 Recorrente</label>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
              placeholder="Opcional..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all text-sm">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Meta Financeira ─────────────────────────────────────────────────
function GoalModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', targetAmount: '', savedAmount: '', deadline: '', category: 'Compra', monthlyContribution: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, targetAmount: parseFloat(form.targetAmount), savedAmount: parseFloat(form.savedAmount || 0), monthlyContribution: parseFloat(form.monthlyContribution || 0), createdAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">🎯 Nova Meta</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome da Meta</label>
            <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Ex: Notebook novo, Viagem..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor Total (R$)</label>
              <input type="number" step="0.01" required value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Já guardou (R$)</label>
              <input type="number" step="0.01" value={form.savedAmount} onChange={e => set('savedAmount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="0,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prazo</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Aporte/mês (R$)</label>
              <input type="number" step="0.01" value={form.monthlyContribution} onChange={e => set('monthlyContribution', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="0,00" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg text-sm">Criar Meta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Orçamento por Categoria ────────────────────────────────────────
function BudgetModal({ onClose, budgets, onSave }) {
  const [vals, setVals] = useState({ ...budgets });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">📊 Orçamento Mensal</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-xl w-8">{cat.emoji}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{cat.label}</span>
              <input type="number" step="10" value={vals[cat.id] || ''} onChange={e => setVals(v => ({ ...v, [cat.id]: parseFloat(e.target.value) || 0 }))}
                className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm text-right"
                placeholder="R$ 0" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm">Cancelar</button>
          <button onClick={() => { onSave(vals); onClose(); }} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg text-sm">Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Conta (bills) ───────────────────────────────────────────────────
function BillModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', amount: '', dueDate: today(), paid: false, recurring: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: parseFloat(form.amount), createdAt: new Date().toISOString() });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">💳 Nova Conta</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
            <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="Ex: Aluguel, Energia..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor (R$)</label>
              <input type="number" step="0.01" required value={form.amount} onChange={e => set('amount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vencimento</label>
              <input type="date" required value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <input type="checkbox" id="rec-bill" checked={form.recurring} onChange={e => set('recurring', e.target.checked)} className="w-4 h-4 accent-emerald-500" />
            <label htmlFor="rec-bill" className="text-sm text-gray-600 dark:text-gray-400 font-medium">🔄 Conta recorrente (mensal)</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg text-sm">Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function Finances() {
  const { bills, addBill, toggleBillPaid, deleteBill } = useContext(AppContext);

  // Estado local de transações (salvo no localStorage — pode migrar pro Firebase depois)
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fin_transactions') || '[]'); } catch { return []; }
  });
  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fin_goals') || '[]'); } catch { return []; }
  });
  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fin_budgets') || '{}'); } catch { return {}; }
  });
  const [monthlyIncome, setMonthlyIncome] = useState(() => parseFloat(localStorage.getItem('fin_income') || '0'));

  const saveTransactions = (t) => { setTransactions(t); localStorage.setItem('fin_transactions', JSON.stringify(t)); };
  const saveGoals = (g) => { setGoals(g); localStorage.setItem('fin_goals', JSON.stringify(g)); };
  const saveBudgets = (b) => { setBudgets(b); localStorage.setItem('fin_budgets', JSON.stringify(b)); };
  const saveIncome = (v) => { setMonthlyIncome(v); localStorage.setItem('fin_income', String(v)); };

  const [tab, setTab] = useState('dashboard');
  const [showTransModal, setShowTransModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(currentMonth());
  const [filterCat, setFilterCat] = useState('all');

  // ─── Dados derivados ──────────────────────────────────────────────
  const monthTx = useMemo(() =>
    transactions.filter(t => t.date?.startsWith(filterMonth)),
    [transactions, filterMonth]
  );

  const expenses = useMemo(() => monthTx.filter(t => t.type === 'expense'), [monthTx]);
  const incomes  = useMemo(() => monthTx.filter(t => t.type === 'income'),  [monthTx]);

  const totalExpenses = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome   = useMemo(() => incomes.reduce((s, t) => s + t.amount, 0) + (monthlyIncome || 0), [incomes, monthlyIncome]);
  const balance       = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

  const byCategory = useMemo(() => {
    const acc = {};
    expenses.forEach(t => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
    });
    return acc;
  }, [expenses]);

  const donutData = useMemo(() =>
    CATEGORIES.filter(c => byCategory[c.id]).map(c => ({ label: c.label, value: byCategory[c.id], color: c.color })),
    [byCategory]
  );

  // Evolução mensal (últimos 6 meses)
  const monthlyEvolution = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const txs = transactions.filter(t => t.date?.startsWith(key));
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      months.push({ label: d.toLocaleString('pt-BR', { month: 'short' }), v: exp, key });
    }
    return months;
  }, [transactions]);

  // Análise comportamental
  const behaviorInsights = useMemo(() => {
    const insights = [];
    // Compara categoria delivery com meses anteriores
    const lastMonths = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const txs = transactions.filter(t => t.date?.startsWith(key) && t.type === 'expense');
      lastMonths.push(txs);
    }
    CATEGORIES.forEach(cat => {
      if (!byCategory[cat.id]) return;
      const prev = lastMonths.map(m => m.filter(t => t.category === cat.id).reduce((s, t) => s + t.amount, 0));
      const avgPrev = prev.reduce((s, v) => s + v, 0) / (prev.filter(v => v > 0).length || 1);
      if (avgPrev > 0 && byCategory[cat.id] > avgPrev * 1.2) {
        const pct = (((byCategory[cat.id] / avgPrev) - 1) * 100).toFixed(0);
        insights.push({ type: 'warning', msg: `${cat.emoji} Seu gasto com ${cat.label} aumentou ${pct}% em relação à média recente.` });
      }
    });
    if (parseFloat(savingsRate) < 10 && totalIncome > 0) insights.push({ type: 'danger', msg: '⚠️ Taxa de poupança abaixo de 10%. Considere revisar seus gastos variáveis.' });
    if (parseFloat(savingsRate) >= 20) insights.push({ type: 'success', msg: '🏆 Excelente! Você está poupando mais de 20% da sua renda.' });
    const fixedTotal = CATEGORIES.filter(c => c.type === 'fixed').reduce((s, c) => s + (byCategory[c.id] || 0), 0);
    if (totalIncome > 0 && fixedTotal / totalIncome > 0.5) insights.push({ type: 'warning', msg: `🏠 ${((fixedTotal / totalIncome) * 100).toFixed(0)}% da sua renda está comprometida com gastos fixos.` });
    return insights;
  }, [byCategory, savingsRate, totalIncome, transactions]);

  // Bills stats
  const unpaidBills = useMemo(() => bills.filter(b => !b.paid), [bills]);
  const totalDue = useMemo(() => unpaidBills.reduce((s, b) => s + b.amount, 0), [unpaidBills]);
  const overdueBills = useMemo(() => unpaidBills.filter(b => daysUntil(b.dueDate) < 0), [unpaidBills]);

  // Filtered transactions
  const filteredTx = useMemo(() => {
    let list = monthTx;
    if (filterCat !== 'all') list = list.filter(t => t.category === filterCat);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [monthTx, filterCat]);

  const addTransaction = useCallback((tx) => {
    const newList = [...transactions, { ...tx, id: Date.now().toString() }];
    saveTransactions(newList);
  }, [transactions]);

  const deleteTransaction = useCallback((id) => {
    saveTransactions(transactions.filter(t => t.id !== id));
  }, [transactions]);

  const addGoal = useCallback((g) => {
    saveGoals([...goals, { ...g, id: Date.now().toString() }]);
  }, [goals]);

  const updateGoalSaved = useCallback((id, amount) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) } : g));
  }, [goals]);

  const deleteGoal = useCallback((id) => {
    saveGoals(goals.filter(g => g.id !== id));
  }, [goals]);

  const handleAddBill = async (data) => {
    try { await addBill(data); } catch { alert('Erro ao adicionar conta'); }
  };

  // ─── Renderização ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader
        title="Finanças"
        subtitle="Controle financeiro completo"
        emoji="💰"
        imageQuery="money,finance,budget"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-2">
          {[
            ['dashboard', '📊 Dashboard'],
            ['transactions', '💸 Transações'],
            ['budget', '📋 Orçamento'],
            ['bills', '🧾 Contas'],
            ['goals', '🎯 Metas'],
          ].map(([id, label]) => (
            <TabButton key={id} active={tab === id} onClick={() => setTab(id)}>{label}</TabButton>
          ))}
        </div>

        {/* ══════════════ TAB: DASHBOARD ══════════════ */}
        {tab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">

            {/* Renda mensal */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Renda Mensal Base</p>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="number"
                      value={monthlyIncome || ''}
                      onChange={e => saveIncome(parseFloat(e.target.value) || 0)}
                      className="bg-white/20 text-white text-2xl font-bold rounded-xl px-3 py-1 w-44 placeholder-white/60 focus:outline-none focus:bg-white/30"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <p className="text-emerald-100 text-xs mt-1">Clique para editar sua renda</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm">Saldo do Mês</p>
                  <p className={`text-3xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-200'}`}>{formatCurrency(balance)}</p>
                  <p className="text-emerald-100 text-xs mt-1">Taxa de poupança: {savingsRate}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-emerald-100 text-xs">Receitas</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-100 text-xs">Despesas</p>
                  <p className="text-red-200 font-bold text-lg">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-100 text-xs">Contas Pendentes</p>
                  <p className="text-amber-200 font-bold text-lg">{formatCurrency(totalDue)}</p>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="💸" title="Gastos este mês" value={formatCurrency(totalExpenses)} sub={`${expenses.length} transações`} color="red" />
              <StatCard icon="💰" title="Receitas" value={formatCurrency(totalIncome)} sub="incluindo renda base" color="emerald" />
              <StatCard icon="🚨" title="Contas atrasadas" value={overdueBills.length} sub={overdueBills.length > 0 ? 'Atenção!' : 'Em dia!'} color={overdueBills.length > 0 ? 'red' : 'emerald'} />
              <StatCard icon="📈" title="% Poupança" value={`${savingsRate}%`} sub={savingsRate >= 20 ? 'Ótimo!' : savingsRate >= 10 ? 'Razoável' : 'Atenção'} color={savingsRate >= 20 ? 'emerald' : savingsRate >= 10 ? 'amber' : 'red'} />
            </div>

            {/* Gráfico pizza + evolução */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">🍩 Gastos por Categoria</h3>
                {donutData.length > 0 ? <DonutChart data={donutData} /> : (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="text-sm">Adicione transações para ver o gráfico</p>
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">📈 Evolução de Gastos (6 meses)</h3>
                <LineSparkline data={monthlyEvolution} color="#10b981" />
                <div className="flex justify-between mt-2">
                  {monthlyEvolution.map(m => (
                    <div key={m.key} className="text-center flex-1">
                      <p className="text-xs text-gray-500">{m.label}</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(m.v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights comportamentais */}
            {behaviorInsights.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-amber-500" />
                  Análise Comportamental
                </h3>
                <div className="space-y-3">
                  {behaviorInsights.map((ins, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                      ins.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' :
                      ins.type === 'danger'  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                    }`}>
                      <span>{ins.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indicadores pessoais */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-500" />
                Indicadores Financeiros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Taxa de Poupança', value: `${savingsRate}%`,
                    desc: 'do que entra, fica',
                    color: savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#ef4444',
                    pct: Math.min(parseFloat(savingsRate), 100)
                  },
                  {
                    label: '% Comprometido com Fixos',
                    value: totalIncome > 0 ? `${((CATEGORIES.filter(c => c.type === 'fixed').reduce((s, c) => s + (byCategory[c.id] || 0), 0) / totalIncome) * 100).toFixed(0)}%` : '—',
                    desc: 'gastos fixos sobre renda',
                    color: '#6366f1',
                    pct: totalIncome > 0 ? Math.min((CATEGORIES.filter(c => c.type === 'fixed').reduce((s, c) => s + (byCategory[c.id] || 0), 0) / totalIncome) * 100, 100) : 0
                  },
                  {
                    label: 'Nível de Risco',
                    value: totalIncome > 0 && totalExpenses / totalIncome > 0.9 ? 'Alto' : totalExpenses / totalIncome > 0.7 ? 'Médio' : 'Baixo',
                    desc: 'de endividamento',
                    color: totalIncome > 0 && totalExpenses / totalIncome > 0.9 ? '#ef4444' : totalExpenses / totalIncome > 0.7 ? '#f59e0b' : '#10b981',
                    pct: totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0
                  },
                ].map((ind, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{ind.label}</span>
                      <span className="text-sm font-bold" style={{ color: ind.color }}>{ind.value}</span>
                    </div>
                    <MiniProgressBar value={ind.pct} max={100} color={ind.color} />
                    <p className="text-xs text-gray-400 mt-1">{ind.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: TRANSAÇÕES ══════════════ */}
        {tab === 'transactions' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setShowTransModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all text-sm">
                <PlusIcon className="h-4 w-4" /> Nova Transação
              </button>
              <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm" />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm">
                <option value="all">Todas as categorias</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Receitas</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Despesas</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className={`${balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} rounded-2xl p-4 border`}>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Saldo</p>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(balance)}</p>
              </div>
            </div>

            {/* Lista de transações */}
            {filteredTx.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-6xl mb-4">💸</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Nenhuma transação</h3>
                <p className="text-gray-500 text-sm">Clique em "Nova Transação" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTx.map((tx) => {
                  const cat = CAT_MAP[tx.category] || CAT_MAP['outros'];
                  return (
                    <div key={tx.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: (cat.color || '#6b7280') + '20' }}>
                        {tx.type === 'income' ? '💰' : (cat.emoji || '📦')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{tx.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                          {tx.type === 'expense' && cat && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                              {cat.label}
                            </span>
                          )}
                          {tx.paymentMethod && <span className="text-xs text-gray-400">{tx.paymentMethod}</span>}
                          {tx.totalInstallments > 1 && <span className="text-xs text-gray-400">{tx.installments}/{tx.totalInstallments}x</span>}
                          {tx.recurring && <span className="text-xs text-purple-600 dark:text-purple-400">🔄</span>}
                        </div>
                        {tx.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{tx.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-base font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button onClick={() => deleteTransaction(tx.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: ORÇAMENTO ══════════════ */}
        {tab === 'budget' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orçamento por Categoria</h2>
                <p className="text-sm text-gray-500">Defina limites e acompanhe o consumo</p>
              </div>
              <button onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg text-sm">
                <FunnelIcon className="h-4 w-4" /> Definir Limites
              </button>
            </div>

            {/* Fluxo de caixa projetado */}
            {totalIncome > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                  Fluxo de Caixa Projetado
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Renda Mensal</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Comprometido</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(totalExpenses + totalDue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Disponível</p>
                    <p className={`text-lg font-bold ${totalIncome - totalExpenses - totalDue >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(totalIncome - totalExpenses - totalDue)}
                    </p>
                  </div>
                </div>
                <MiniProgressBar value={totalExpenses + totalDue} max={totalIncome} color="#6366f1" />
                <p className="text-xs text-gray-500 mt-1">
                  {totalIncome > 0 ? `${(((totalExpenses + totalDue) / totalIncome) * 100).toFixed(0)}% da renda comprometida` : ''}
                </p>
              </div>
            )}

            {/* Categorias com orçamento */}
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const spent = byCategory[cat.id] || 0;
                const limit = budgets[cat.id] || 0;
                const pct = limit > 0 ? (spent / limit) * 100 : 0;
                const alert80 = pct >= 80 && pct < 100;
                const over = pct >= 100;

                return (
                  <div key={cat.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-2 transition-all ${
                    over ? 'border-red-300 dark:border-red-700' : alert80 ? 'border-amber-300 dark:border-amber-700' : 'border-gray-100 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{cat.label}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${cat.type === 'fixed' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {cat.type === 'fixed' ? 'Fixo' : 'Variável'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(spent)}</span>
                        {limit > 0 && <span className="text-xs text-gray-400"> / {formatCurrency(limit)}</span>}
                      </div>
                    </div>
                    {limit > 0 ? (
                      <>
                        <MiniProgressBar value={spent} max={limit} color={cat.color} />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">{pct.toFixed(0)}% do limite</span>
                          {over && <span className="text-xs text-red-600 font-semibold">⚠️ Limite ultrapassado!</span>}
                          {alert80 && !over && <span className="text-xs text-amber-600 font-semibold">⚡ Próximo do limite</span>}
                          {!over && !alert80 && limit > 0 && <span className="text-xs text-emerald-600">{formatCurrency(limit - spent)} restante</span>}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Sem limite definido — clique em "Definir Limites"</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: CONTAS ══════════════ */}
        {tab === 'bills' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contas a Pagar</h2>
                <p className="text-sm text-gray-500">Gerencie seus boletos e compromissos</p>
              </div>
              <button onClick={() => setShowBillModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg text-sm">
                <PlusIcon className="h-4 w-4" /> Nova Conta
              </button>
            </div>

            {/* Stats bills */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon="⏳" title="Total pendente" value={formatCurrency(totalDue)} sub={`${unpaidBills.length} contas`} color="amber" />
              <StatCard icon="🚨" title="Atrasadas" value={overdueBills.length} sub={overdueBills.length > 0 ? 'Urgente!' : 'Nenhuma'} color={overdueBills.length > 0 ? 'red' : 'emerald'} />
              <StatCard icon="✅" title="Pagas" value={bills.filter(b => b.paid).length} sub="este ciclo" color="emerald" />
            </div>

            {/* Lista */}
            {unpaidBills.length === 0 ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-12 text-center border-2 border-green-200 dark:border-green-800">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Tudo em Dia!</h3>
                <p className="text-gray-500 text-sm mt-1">Nenhuma conta pendente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...unpaidBills].sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)).map((bill) => {
                  const days = daysUntil(bill.dueDate);
                  const isLate = days < 0;
                  const isUrgent = days >= 0 && days <= 3;
                  return (
                    <div key={bill.id} className={`rounded-2xl p-5 shadow-sm border-2 ${isLate ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : isUrgent ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{isLate ? '🚨' : isUrgent ? '⚠️' : '💳'}</span>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{bill.title}</h3>
                            <p className="text-sm text-gray-500">Vence: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                              {isLate && <span className="ml-2 text-red-600 font-semibold">(Atrasada {Math.abs(days)}d)</span>}
                              {isUrgent && !isLate && <span className="ml-2 text-amber-600 font-semibold">(em {days}d)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(bill.amount)}</span>
                          <button onClick={() => deleteBill(bill.id)} className="p-1.5 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => toggleBillPaid(bill.id, bill.paid)}
                        className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-teal-700 transition-all">
                        <CheckCircleIcon className="h-4 w-4" /> Marcar como Paga
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagas */}
            {bills.filter(b => b.paid).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> Contas Pagas
                </h3>
                <div className="space-y-3">
                  {bills.filter(b => b.paid).map(bill => (
                    <div key={bill.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white line-through text-sm">{bill.title}</p>
                          <p className="text-xs text-gray-400">Pago em {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '--'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(bill.amount)}</span>
                        <button onClick={() => toggleBillPaid(bill.id, bill.paid)} className="text-xs text-blue-500 hover:underline">Desfazer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: METAS ══════════════ */}
        {tab === 'goals' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h2>
                <p className="text-sm text-gray-500">Planeje e acompanhe seus objetivos</p>
              </div>
              <button onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg text-sm">
                <FlagIcon className="h-4 w-4" /> Nova Meta
              </button>
            </div>

            {/* Reserva de emergência */}
            {totalIncome > 0 && (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-5 border border-teal-200 dark:border-teal-800">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheckIcon className="w-6 h-6 text-teal-600" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Reserva de Emergência Ideal</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Com base nos seus gastos fixos mensais, sua reserva ideal é de:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 6, 12].map(months => (
                    <div key={months} className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-500">{months} meses</p>
                      <p className="font-bold text-teal-700 dark:text-teal-300 text-sm">{formatCurrency(totalExpenses * months)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de metas */}
            {goals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Nenhuma meta criada</h3>
                <p className="text-gray-500 text-sm mt-1">Defina um objetivo e comece a economizar!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => {
                  const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
                  const remaining = goal.targetAmount - goal.savedAmount;
                  const monthsNeeded = goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : null;
                  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
                  const daysLeft = deadlineDate ? Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{goal.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {formatCurrency(goal.savedAmount)} de {formatCurrency(goal.targetAmount)}
                            {goal.deadline && <span className="ml-2">• Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${pct >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                            {pct.toFixed(0)}%
                          </span>
                          <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <MiniProgressBar value={goal.savedAmount} max={goal.targetAmount} color="#8b5cf6" />

                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {remaining > 0 && <span>Faltam {formatCurrency(remaining)}</span>}
                        {monthsNeeded && <span>• ~{monthsNeeded} meses para atingir</span>}
                        {daysLeft !== null && daysLeft > 0 && <span>• {daysLeft} dias restantes</span>}
                        {goal.monthlyContribution > 0 && <span>• Aporte: {formatCurrency(goal.monthlyContribution)}/mês</span>}
                      </div>

                      {pct < 100 && (
                        <div className="flex gap-2 mt-4">
                          {[50, 100, 200].map(amount => (
                            <button key={amount} onClick={() => updateGoalSaved(goal.id, amount)}
                              className="flex-1 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all">
                              +{formatCurrency(amount)}
                            </button>
                          ))}
                        </div>
                      )}

                      {pct >= 100 && (
                        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                          <p className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">🎉 Meta atingida! Parabéns!</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modais ── */}
      {showTransModal && <TransactionModal onClose={() => setShowTransModal(false)} onSave={addTransaction} />}
      {showGoalModal  && <GoalModal        onClose={() => setShowGoalModal(false)}  onSave={addGoal} />}
      {showBudgetModal && <BudgetModal     onClose={() => setShowBudgetModal(false)} budgets={budgets} onSave={saveBudgets} />}
      {showBillModal   && <BillModal       onClose={() => setShowBillModal(false)}   onSave={handleAddBill} />}
    </div>
  );
}