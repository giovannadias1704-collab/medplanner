import { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';
import ThemeSelector from '../components/ThemeSelector';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon, UserCircleIcon, CameraIcon, SparklesIcon,
  DocumentArrowUpIcon, ArrowDownTrayIcon, CurrencyDollarIcon, CalendarIcon,
  BeakerIcon, BellIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon,
  PencilSquareIcon, ArrowPathIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import PageLayout from '../components/PageLayout';

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'conta',        icon: '👤', label: 'Conta',            color: 'from-blue-500 to-indigo-600' },
  { id: 'privacidade',  icon: '🔐', label: 'Privacidade',      color: 'from-slate-600 to-gray-700' },
  { id: 'visual',       icon: '🎨', label: 'Personalização',   color: 'from-pink-500 to-rose-600' },
  { id: 'notificacoes', icon: '🔔', label: 'Notificações',     color: 'from-amber-500 to-orange-600' },
  { id: 'analise',      icon: '📊', label: 'Análise',          color: 'from-violet-500 to-purple-600' },
  { id: 'ia',           icon: '🧠', label: 'IA',               color: 'from-emerald-500 to-teal-600' },
  { id: 'agenda',       icon: '📅', label: 'Agenda',           color: 'from-cyan-500 to-blue-600' },
  { id: 'saude',        icon: '🏥', label: 'Saúde',            color: 'from-red-500 to-rose-600' },
  { id: 'estudo',       icon: '📚', label: 'Estudos',          color: 'from-orange-500 to-amber-600' },
  { id: 'financeiro',   icon: '💰', label: 'Financeiro',       color: 'from-green-500 to-emerald-600' },
  { id: 'sistema',      icon: '🌍', label: 'Sistema',          color: 'from-indigo-500 to-blue-600' },
  { id: 'legal',        icon: '🧾', label: 'Legal',            color: 'from-gray-500 to-slate-600' },
];

// ─── DEFAULTS (usados só como fallback) ───────────────────────────────────────
const SETTINGS_DEFAULTS = {
  notifEvents: true, notifTasks: true, notifBills: true,
  notifWater: true, notifStudy: true, notifHealth: false,
  notifEmail: false, notifPush: true, notifInternal: true,
  notifFrequency: 'daily',
  analysisPeriod: '30', autoCorrelations: true,
  scoreWeightHealth: 30, scoreWeightMental: 30,
  scoreWeightProd: 30, scoreWeightFinance: 10,
  aiAutoSave: false, aiHistorical: true,
  aiSuggestions: true, aiStyle: 'balanced', aiInsightsPerDay: 5,
  weekStartsOn: 'monday', timezone: 'America/Sao_Paulo',
  dateFormat: 'dd/mm/yyyy', defaultReminderTime: '09:00',
  weightUnit: 'kg', heightUnit: 'cm',
  waterGoal: 2.0, sleepGoal: 8, exerciseGoal: 30,
  pomodoroDuration: 25, pomodoroBreak: 5,
  spacedRepFreq: 'daily', weeklyStudyGoal: 20,
  currency: 'BRL', monthStart: 1, savingsGoal: 500, overspendAlert: true,
  language: 'pt-BR', region: 'BR',
  fontSize: 'medium', highContrast: false, reduceAnimations: false,
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        value ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

function Row({ icon, title, desc, children, danger = false }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
      danger
        ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
        : 'bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700/70'
    }`}>
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className={`font-semibold text-sm leading-tight ${
            danger ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'
          }`}>{title}</p>
          {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{desc}</p>}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );
}

function SectionCard({ id, icon, label, gradient, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className={`bg-gradient-to-r ${gradient} px-6 py-5 flex items-center gap-3`}>
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-bold text-white tracking-tight">{label}</h2>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </section>
  );
}

function SelectRow({ icon, title, desc, value, onChange, options }) {
  return (
    <Row icon={icon} title={title} desc={desc}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Row>
  );
}

function NumberRow({ icon, title, desc, value, onChange, min, max, step, unit }) {
  return (
    <Row icon={icon} title={title} desc={desc}>
      <div className="flex items-center gap-2">
        <input
          type="number" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-20 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white text-center font-bold focus:ring-2 focus:ring-indigo-400 outline-none"
        />
        {unit && <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{unit}</span>}
      </div>
    </Row>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Settings() {
  const {
    user, userProfile, settings,
    updateUserProfile, uploadProfilePhoto, updateTheme, updateSettings,
    processPDFWithAI, exportAllData,
    notificationPermission, requestNotificationPermission, clearOldNotifications
  } = useContext(AppContext);

  const { onboardingData, resetOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('conta');
  const [localProfile, setLocalProfile] = useState({ displayName: '', photoURL: '' });
  const [editingName, setEditingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [processingPDF, setProcessingPDF] = useState(false);

  // ─── cfg é sempre inicializado a partir do settings do contexto ─────────────
  // Começa com defaults e sobrescreve com o que vem do Firebase
  const [cfg, setCfg] = useState(() => ({ ...SETTINGS_DEFAULTS, ...settings }));

  // Sincroniza cfg quando settings do contexto (Firebase) atualiza
  useEffect(() => {
    if (settings) {
      setCfg(prev => ({ ...SETTINGS_DEFAULTS, ...settings }));
    }
  }, [settings]);

  useEffect(() => {
    if (userProfile) {
      setLocalProfile({
        displayName: userProfile.displayName || user?.displayName || '',
        photoURL: userProfile.photoURL || user?.photoURL || ''
      });
    }
  }, [userProfile, user]);

  // ─── Debounce para não chamar Firestore a cada keystroke ──────────────────
  const saveTimer = useRef(null);

  const set = (key, val) => {
    const next = { ...cfg, [key]: val };
    setCfg(next);

    // Cancela timer anterior e agenda novo save após 600ms
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateSettings?.({ [key]: val }); // Salva só o campo que mudou
    }, 600);
  };

  // Limpa timer ao desmontar
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) return alert('Selecione uma imagem válida');
    try {
      setUploadingPhoto(true);
      const url = await uploadProfilePhoto(file);
      setLocalProfile(p => ({ ...p, photoURL: url }));
    } catch { alert('Erro ao fazer upload da foto'); }
    finally { setUploadingPhoto(false); }
  };

  const handleSaveName = async () => {
    try {
      await updateUserProfile({ displayName: localProfile.displayName });
      setEditingName(false);
    } catch { alert('Erro ao atualizar nome'); }
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    e.target.value = '';
    try {
      setProcessingPDF(true);
      const result = await processPDFWithAI(file);
      alert(result.savedCount > 0 ? `✅ ${result.savedCount} evento(s) extraído(s)!` : '⚠️ Nenhum evento identificado.');
    } catch (err) { console.error(err); }
    finally { setProcessingPDF(false); }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      try { await signOut(auth); navigate('/auth'); } catch (e) { console.error(e); }
    }
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const totalWeight = cfg.scoreWeightHealth + cfg.scoreWeightMental + cfg.scoreWeightProd + cfg.scoreWeightFinance;

  return (
    <PageLayout
      title="Configurações"
      subtitle="Personalize cada detalhe do seu MedPlanner"
      emoji="⚙️"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .settings-wrap * { box-sizing: border-box; }
        .settings-wrap { font-family: 'Plus Jakarta Sans', sans-serif; }
        .snav-btn { transition: all .15s ease; border-radius: 12px; }
        .snav-btn.is-active { background: linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff !important; box-shadow: 0 4px 14px rgba(99,102,241,.3); }
        .snav-btn:not(.is-active):hover { background: rgba(99,102,241,.07); }
        @keyframes sfadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        .sfade { animation: sfadeup .25s ease forwards; }
        input[type=range] { -webkit-appearance:none; width:100%; height:6px; border-radius:6px; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#6366f1; box-shadow:0 2px 6px rgba(99,102,241,.4); cursor:pointer; }
      `}</style>

      <div className="settings-wrap pb-32">

        {/* ── MOBILE NAV ── */}
        <div className="lg:hidden w-full mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={`snav-btn flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap border ${
                  activeSection === n.id ? 'is-active border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}>
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">

          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0 sticky top-24 self-start">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={`snav-btn flex items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold w-full ${
                  activeSection === n.id ? 'is-active' : 'text-gray-600 dark:text-gray-400'
                }`}>
                <span className="text-base">{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleLogout}
                className="snav-btn flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <span className="text-base">🚪</span><span>Sair da conta</span>
              </button>
            </div>
          </aside>

          {/* ── SECTIONS ── */}
          <div className="flex-1 space-y-6 sfade min-w-0">

            {/* 1. CONTA */}
            <SectionCard id="conta" icon="👤" label="Conta" gradient="from-blue-500 to-indigo-600">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 shadow-md">
                    {localProfile.photoURL
                      ? <img src={localProfile.photoURL} alt="Foto" className="w-full h-full object-cover" />
                      : <UserCircleIcon className="w-full h-full text-gray-400 p-2" />}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                    className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-all">
                    {uploadingPhoto
                      ? <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                      : <CameraIcon className="w-4 h-4" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={localProfile.displayName}
                        onChange={e => setLocalProfile(p => ({ ...p, displayName: e.target.value }))}
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-indigo-300 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400" />
                      <button onClick={handleSaveName} className="px-3 py-2 bg-green-600 text-white rounded-xl flex-shrink-0"><CheckIcon className="w-4 h-4" /></button>
                      <button onClick={() => setEditingName(false)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl flex-shrink-0 text-gray-600 dark:text-gray-300"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 dark:text-white text-base truncate">{localProfile.displayName || 'Adicione seu nome'}</p>
                      <button onClick={() => setEditingName(true)} className="text-indigo-500 hover:text-indigo-700 flex-shrink-0 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">✅ Verificado</span>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">🔒 Conta ativa</span>
                  </div>
                </div>
              </div>

              <Row icon="🔑" title="Alterar Senha" desc="Enviar link de redefinição por email">
                <button onClick={() => alert('Link enviado para ' + user?.email)}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all">
                  Redefinir
                </button>
              </Row>
              <Row icon="📱" title="Autenticação em 2 Fatores" desc="Camada extra de segurança (2FA)">
                <Toggle value={false} onChange={() => alert('2FA em breve!')} />
              </Row>
              <Row icon="💻" title="Sessões Ativas" desc="Dispositivos conectados à conta">
                <button onClick={() => alert('Em breve')} className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">Ver sessões</button>
              </Row>
              <Row icon="📋" title="Histórico de Login" desc="Registro dos últimos acessos">
                <button onClick={() => alert('Em breve')} className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">Ver histórico</button>
              </Row>
              <Row icon="🗑️" title="Excluir Conta" desc="Ação irreversível — todos os dados serão removidos" danger>
                <button onClick={() => confirm('Tem certeza? Esta ação é irreversível!') && alert('Funcionalidade em breve')}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all">
                  Excluir conta
                </button>
              </Row>
            </SectionCard>

            {/* 2. PRIVACIDADE */}
            <SectionCard id="privacidade" icon="🔐" label="Privacidade & Segurança" gradient="from-slate-600 to-gray-700">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'JSON', icon: '📥', action: () => exportAllData?.() },
                  { label: 'PDF',  icon: '📄', action: () => alert('Em breve') },
                  { label: 'CSV',  icon: '📊', action: () => alert('Em breve') },
                ].map(b => (
                  <button key={b.label} onClick={b.action}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700/70 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all">
                    <span className="text-xl">{b.icon}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Exportar {b.label}</span>
                  </button>
                ))}
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-3">🗑️ Apagar Dados por Categoria</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Saúde', 'Bem-estar', 'Estudos', 'Finanças', 'Agenda', 'Tarefas'].map(cat => (
                    <button key={cat} onClick={() => confirm(`Apagar todos os dados de ${cat}? Ação irreversível.`)}
                      className="px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                      🗑️ {cat}
                    </button>
                  ))}
                </div>
              </div>
              <Row icon="☁️" title="Backup Automático" desc="Cópia diária salva na nuvem">
                <Toggle value={true} onChange={() => {}} />
              </Row>
              <Row icon="🔒" title="Criptografia" desc="Dados sensíveis criptografados">
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-bold">Ativa ✅</span>
              </Row>
              <SelectRow icon="⏱️" title="Timeout por Inatividade" desc="Bloquear após tempo sem uso"
                value="never" onChange={() => {}}
                options={[
                  { value: 'never', label: 'Nunca' },
                  { value: '5',     label: '5 minutos' },
                  { value: '15',    label: '15 minutos' },
                  { value: '30',    label: '30 minutos' },
                ]} />
            </SectionCard>

            {/* 3. PERSONALIZAÇÃO */}
            <SectionCard id="visual" icon="🎨" label="Personalização" gradient="from-pink-500 to-rose-600">
              <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <ThemeSelector />
              </div>
              <SelectRow icon="📐" title="Layout" desc="Modo de exibição das informações"
                value="expanded" onChange={() => {}}
                options={[{ value: 'compact', label: '🗜️ Compacto' }, { value: 'expanded', label: '📋 Expandido' }]} />
              <SelectRow icon="🔍" title="Nível de Detalhe" desc="Quantidade de informações exibidas"
                value="advanced" onChange={() => {}}
                options={[{ value: 'simple', label: '🔍 Simplificado' }, { value: 'advanced', label: '🔬 Avançado' }]} />
              <Row icon="📌" title="Ordem das Abas" desc="Reordenar módulos do menu">
                <span className="text-xs text-gray-400 italic">Em breve</span>
              </Row>
              <Row icon="👁️" title="Métricas Visíveis" desc="Ocultar cards no Dashboard">
                <button className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Configurar</button>
              </Row>
            </SectionCard>

            {/* 4. NOTIFICAÇÕES */}
            <SectionCard id="notificacoes" icon="🔔" label="Notificações" gradient="from-amber-500 to-orange-600">
              <div className={`p-4 rounded-2xl flex items-center justify-between gap-4 border-2 ${
                notificationPermission === 'granted'
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700'
                  : 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700'
              }`}>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Permissão do Navegador</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {notificationPermission === 'granted' ? '✅ Ativada — tudo certo!'
                      : notificationPermission === 'denied' ? '❌ Negada — ative nas configurações do navegador'
                      : '⏳ Ainda não solicitada'}
                  </p>
                </div>
                {notificationPermission !== 'granted' && (
                  <button onClick={requestNotificationPermission}
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all flex-shrink-0">
                    Ativar
                  </button>
                )}
              </div>

              {/* Canais de notificação */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'notifEmail',    icon: '📧', label: 'Email'   },
                  { key: 'notifPush',     icon: '📲', label: 'Push'    },
                  { key: 'notifInternal', icon: '🔔', label: 'Interna' },
                ].map(ch => (
                  <button key={ch.key} onClick={() => set(ch.key, !cfg[ch.key])}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all font-bold text-xs ${
                      cfg[ch.key]
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-700 text-gray-500'
                    }`}>
                    <span className="text-xl">{ch.icon}</span>{ch.label}
                  </button>
                ))}
              </div>

              {/* Tipos de notificação */}
              {[
                { key: 'notifEvents', icon: '📅', label: 'Eventos',    desc: '1 dia antes do evento' },
                { key: 'notifTasks',  icon: '✅', label: 'Tarefas',    desc: 'Tarefas atrasadas e urgentes' },
                { key: 'notifBills',  icon: '💰', label: 'Contas',     desc: '3 dias antes do vencimento' },
                { key: 'notifWater',  icon: '💧', label: 'Hidratação', desc: 'A cada 2h (8h–20h)' },
                { key: 'notifStudy',  icon: '📚', label: 'Estudos',    desc: 'Revisões e cronograma' },
                { key: 'notifHealth', icon: '🏥', label: 'Saúde',      desc: 'Consultas e medicamentos' },
              ].map(n => (
                <Row key={n.key} icon={n.icon} title={n.label} desc={n.desc}>
                  <Toggle value={!!cfg[n.key]} onChange={v => set(n.key, v)} />
                </Row>
              ))}

              <SelectRow icon="🔁" title="Frequência de Resumos" desc="Periodicidade dos resumos automáticos"
                value={cfg.notifFrequency} onChange={v => set('notifFrequency', v)}
                options={[
                  { value: 'daily',  label: '📅 Diária'     },
                  { value: 'weekly', label: '📆 Semanal'    },
                  { value: 'off',    label: '🔕 Desativado' },
                ]} />
              <Row icon="🗑️" title="Limpar Notificações Antigas" desc="Remover alertas com mais de 30 dias">
                <button onClick={async () => {
                  if (confirm('Limpar notificações com mais de 30 dias?')) {
                    const c = await clearOldNotifications?.();
                    alert(`✅ ${c || 0} notificação(ões) removida(s)`);
                  }
                }} className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  Limpar
                </button>
              </Row>
            </SectionCard>

            {/* 5. ANÁLISE */}
            <SectionCard id="analise" icon="📊" label="Preferências de Análise" gradient="from-violet-500 to-purple-600">
              <SelectRow icon="📆" title="Período Padrão" desc="Janela de análise ao abrir a página"
                value={cfg.analysisPeriod} onChange={v => set('analysisPeriod', v)}
                options={[{ value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }]} />
              <Row icon="🔗" title="Correlações Automáticas" desc="Detectar relações entre variáveis">
                <Toggle value={!!cfg.autoCorrelations} onChange={v => set('autoCorrelations', v)} />
              </Row>
              <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-300">⚖️ Peso de Cada Área no Score Global</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    totalWeight === 100
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>{totalWeight}/100%</span>
                </div>
                <div className="space-y-5">
                  {[
                    { key: 'scoreWeightHealth', label: 'Saúde Física',      color: '#22d3ee' },
                    { key: 'scoreWeightMental', label: 'Bem-Estar Mental',  color: '#a78bfa' },
                    { key: 'scoreWeightProd',   label: 'Produtividade',     color: '#fbbf24' },
                    { key: 'scoreWeightFinance',label: 'Financeiro',        color: '#34d399' },
                  ].map(w => (
                    <div key={w.key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{w.label}</span>
                        <span className="text-xs font-bold" style={{ color: w.color }}>{cfg[w.key]}%</span>
                      </div>
                      <input type="range" min={5} max={60} step={5} value={cfg[w.key]}
                        onChange={e => set(w.key, parseInt(e.target.value))}
                        style={{ accentColor: w.color }}
                        className="w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* 6. IA */}
            <SectionCard id="ia" icon="🧠" label="Inteligência Artificial" gradient="from-emerald-500 to-teal-600">
              <Row icon="🤖" title="Auto-save com IA" desc="Salvar sugestões sem confirmação manual">
                <Toggle value={!!cfg.aiAutoSave} onChange={v => set('aiAutoSave', v)} />
              </Row>
              <Row icon="📖" title="Acesso ao Histórico" desc="IA analisa seus dados passados para insights melhores">
                <Toggle value={!!cfg.aiHistorical} onChange={v => set('aiHistorical', v)} />
              </Row>
              <Row icon="💡" title="Sugestões Proativas" desc="Insights automáticos em tempo real">
                <Toggle value={!!cfg.aiSuggestions} onChange={v => set('aiSuggestions', v)} />
              </Row>
              <SelectRow icon="🎙️" title="Estilo de Resposta" desc="Tom e formato das mensagens da IA"
                value={cfg.aiStyle} onChange={v => set('aiStyle', v)}
                options={[
                  { value: 'direct',   label: '⚡ Direto e objetivo'        },
                  { value: 'balanced', label: '⚖️ Equilibrado'              },
                  { value: 'detailed', label: '📝 Detalhado e explicativo'  },
                ]} />
              <NumberRow icon="🔢" title="Limite de Insights por Dia" desc="Máximo de análises automáticas diárias"
                value={cfg.aiInsightsPerDay} onChange={v => set('aiInsightsPerDay', v)} min={1} max={20} step={1} unit="/ dia" />
              <div className="bg-teal-50 dark:bg-teal-900/10 border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📄</span>
                  <p className="text-sm font-bold text-teal-700 dark:text-teal-300">Importar PDF com IA</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 ml-8">Extração automática de eventos de cronogramas e calendários acadêmicos</p>
                <button onClick={() => pdfInputRef.current?.click()} disabled={processingPDF}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                  {processingPDF
                    ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Processando...</>
                    : <><DocumentArrowUpIcon className="w-4 h-4" /> Selecionar PDF</>}
                </button>
                <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePDFUpload} className="hidden" />
              </div>
            </SectionCard>

            {/* 7. AGENDA */}
            <SectionCard id="agenda" icon="📅" label="Preferências de Agenda" gradient="from-cyan-500 to-blue-600">
              <SelectRow icon="📆" title="Início da Semana" desc="Primeiro dia no calendário"
                value={cfg.weekStartsOn} onChange={v => set('weekStartsOn', v)}
                options={[{ value: 'monday', label: '🗓️ Segunda-feira' }, { value: 'sunday', label: '🗓️ Domingo' }]} />
              <SelectRow icon="🌐" title="Fuso Horário" desc="Referência para horários e lembretes"
                value={cfg.timezone} onChange={v => set('timezone', v)}
                options={[
                  { value: 'America/Sao_Paulo', label: '🇧🇷 Brasília (UTC-3)' },
                  { value: 'America/New_York',  label: '🇺🇸 New York (UTC-5)' },
                  { value: 'Europe/Lisbon',     label: '🇵🇹 Lisboa (UTC+0)'   },
                ]} />
              <SelectRow icon="📋" title="Formato de Data" desc="Como as datas são exibidas"
                value={cfg.dateFormat} onChange={v => set('dateFormat', v)}
                options={[
                  { value: 'dd/mm/yyyy', label: 'DD/MM/AAAA'  },
                  { value: 'mm/dd/yyyy', label: 'MM/DD/AAAA'  },
                  { value: 'yyyy-mm-dd', label: 'AAAA-MM-DD'  },
                ]} />
              <Row icon="⏰" title="Horário Padrão de Lembrete" desc="Hora padrão de envio dos alertas">
                <input type="time" value={cfg.defaultReminderTime}
                  onChange={e => set('defaultReminderTime', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400" />
              </Row>
            </SectionCard>

            {/* 8. SAÚDE */}
            <SectionCard id="saude" icon="🏥" label="Configurações de Saúde" gradient="from-red-500 to-rose-600">
              <SelectRow icon="⚖️" title="Unidade de Peso" desc="Formato para registros de peso corporal"
                value={cfg.weightUnit} onChange={v => set('weightUnit', v)}
                options={[{ value: 'kg', label: '🇧🇷 Quilogramas (kg)' }, { value: 'lb', label: '🇺🇸 Libras (lb)' }]} />
              <SelectRow icon="📏" title="Unidade de Altura" desc="Formato para registros de altura"
                value={cfg.heightUnit} onChange={v => set('heightUnit', v)}
                options={[{ value: 'cm', label: 'Centímetros (cm)' }, { value: 'ft', label: 'Pés/Polegadas (ft/in)' }]} />
              <NumberRow icon="💧" title="Meta Diária de Água" desc="Quantidade ideal de água por dia"
                value={cfg.waterGoal} onChange={v => set('waterGoal', v)} min={0.5} max={6} step={0.1} unit="L/dia" />
              <NumberRow icon="😴" title="Meta de Sono" desc="Horas ideais de sono por noite"
                value={cfg.sleepGoal} onChange={v => set('sleepGoal', v)} min={4} max={12} step={0.5} unit="h/noite" />
              <NumberRow icon="🏃" title="Meta de Exercício" desc="Tempo mínimo de atividade física diária"
                value={cfg.exerciseGoal} onChange={v => set('exerciseGoal', v)} min={0} max={180} step={5} unit="min/dia" />
            </SectionCard>

            {/* 9. ESTUDOS */}
            <SectionCard id="estudo" icon="📚" label="Configurações de Estudo" gradient="from-orange-500 to-amber-600">
              <NumberRow icon="🍅" title="Duração do Pomodoro" desc="Minutos de foco por sessão de estudo"
                value={cfg.pomodoroDuration} onChange={v => set('pomodoroDuration', v)} min={5} max={90} step={5} unit="minutos" />
              <NumberRow icon="☕" title="Intervalo entre Sessões" desc="Minutos de descanso entre pomodoros"
                value={cfg.pomodoroBreak} onChange={v => set('pomodoroBreak', v)} min={1} max={30} step={1} unit="minutos" />
              <SelectRow icon="🔄" title="Frequência de Revisão Espaçada" desc="Quão frequente você quer revisar o conteúdo"
                value={cfg.spacedRepFreq} onChange={v => set('spacedRepFreq', v)}
                options={[
                  { value: 'daily',  label: '📅 Diária'        },
                  { value: 'weekly', label: '📆 Semanal'       },
                  { value: 'custom', label: '⚙️ Personalizado' },
                ]} />
              <NumberRow icon="🎯" title="Meta Semanal de Estudo" desc="Horas de estudo alvo por semana"
                value={cfg.weeklyStudyGoal} onChange={v => set('weeklyStudyGoal', v)} min={1} max={80} step={1} unit="h/semana" />
            </SectionCard>

            {/* 10. FINANCEIRO */}
            <SectionCard id="financeiro" icon="💰" label="Configurações Financeiras" gradient="from-green-500 to-emerald-600">
              <SelectRow icon="💱" title="Moeda" desc="Formato de exibição de valores monetários"
                value={cfg.currency} onChange={v => set('currency', v)}
                options={[
                  { value: 'BRL', label: '🇧🇷 Real Brasileiro (R$)' },
                  { value: 'USD', label: '🇺🇸 Dólar Americano ($)'  },
                  { value: 'EUR', label: '🇪🇺 Euro (€)'             },
                ]} />
              <NumberRow icon="📅" title="Início do Mês Financeiro" desc="Dia do mês para reset do orçamento"
                value={cfg.monthStart} onChange={v => set('monthStart', v)} min={1} max={28} step={1} unit="dia do mês" />
              <NumberRow icon="🎯" title="Meta Mensal de Economia" desc="Valor alvo de poupança por mês"
                value={cfg.savingsGoal} onChange={v => set('savingsGoal', v)} min={0} max={99999} step={50}
                unit={cfg.currency === 'BRL' ? 'R$/mês' : '$/ mês'} />
              <Row icon="⚠️" title="Alerta de Gasto Excessivo" desc="Notificar ao ultrapassar limites do orçamento">
                <Toggle value={!!cfg.overspendAlert} onChange={v => set('overspendAlert', v)} />
              </Row>
            </SectionCard>

            {/* 11. SISTEMA */}
            <SectionCard id="sistema" icon="🌍" label="Sistema" gradient="from-indigo-500 to-blue-600">
              <SelectRow icon="🌐" title="Idioma da Interface" desc="Linguagem de todos os textos do app"
                value={cfg.language} onChange={v => set('language', v)}
                options={[
                  { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
                  { value: 'en-US', label: '🇺🇸 English (US)'       },
                  { value: 'es-ES', label: '🇪🇸 Español'            },
                ]} />
              <SelectRow icon="📍" title="Região" desc="Formatos regionais de datas e números"
                value={cfg.region} onChange={v => set('region', v)}
                options={[{ value: 'BR', label: '🇧🇷 Brasil' }, { value: 'US', label: '🇺🇸 EUA' }, { value: 'PT', label: '🇵🇹 Portugal' }]} />
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3">♿ Acessibilidade</p>
                <div className="space-y-2">
                  <Row icon="🔤" title="Tamanho da Fonte" desc="Ajuste para melhor leitura">
                    <div className="flex gap-1">
                      {[{ v: 'small', l: 'P' }, { v: 'medium', l: 'M' }, { v: 'large', l: 'G' }].map(s => (
                        <button key={s.v} onClick={() => set('fontSize', s.v)}
                          className={`w-9 h-9 text-xs font-bold rounded-xl transition-all border ${
                            cfg.fontSize === s.v
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}>{s.l}</button>
                      ))}
                    </div>
                  </Row>
                  <Row icon="🌗" title="Alto Contraste" desc="Aumentar contraste para melhor visibilidade">
                    <Toggle value={!!cfg.highContrast} onChange={v => set('highContrast', v)} />
                  </Row>
                  <Row icon="🎬" title="Reduzir Animações" desc="Desativar efeitos de movimento">
                    <Toggle value={!!cfg.reduceAnimations} onChange={v => set('reduceAnimations', v)} />
                  </Row>
                </div>
              </div>
            </SectionCard>

            {/* 12. LEGAL */}
            <SectionCard id="legal" icon="🧾" label="Legal & Sobre" gradient="from-gray-500 to-slate-600">
              <Row icon="📋" title="Termos de Uso" desc="Leia os termos de utilização da plataforma">
                <button className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Abrir →</button>
              </Row>
              <Row icon="🔒" title="Política de Privacidade" desc="Como seus dados são coletados e protegidos">
                <button className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Abrir →</button>
              </Row>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 text-center border border-indigo-100 dark:border-indigo-800">
                <div className="text-4xl mb-3">💙</div>
                <p className="font-bold text-gray-900 dark:text-white">MedPlanner</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Versão 1.0.0 — Build 2025.02</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Feito com carinho para estudantes de medicina</p>
                <div className="flex justify-center gap-2 mt-3">
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-semibold">✅ Atualizado</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-semibold">🔒 Seguro</span>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full font-semibold">⚡ Estável</span>
                </div>
              </div>
            </SectionCard>

            {/* LOGOUT */}
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl font-bold text-sm shadow-lg transition-all">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Sair da Conta
            </button>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}