import { useState, useEffect, useMemo, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { AppContext } from '../context/AppContext';
import PageLayout from '../components/PageLayout';
import { generateText } from '../services/gemini';
import {
  PlusIcon, XMarkIcon, ClockIcon, MapPinIcon, DocumentTextIcon,
  ChevronLeftIcon, ChevronRightIcon, FunnelIcon, FlagIcon,
  CheckCircleIcon, BellIcon, ArrowPathIcon, TagIcon,
  CalendarDaysIcon, ListBulletIcon, ViewColumnsIcon,
  ChartBarIcon, SparklesIcon, StarIcon, FireIcon,
  TrashIcon, PencilIcon, ChevronDownIcon, ArrowUpTrayIcon,
  PhotoIcon, DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// ─── Constantes ───────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { id: 'event',    label: 'Evento',    emoji: '📅', color: '#6366f1' },
  { id: 'task',     label: 'Tarefa',    emoji: '✅', color: '#10b981' },
  { id: 'routine',  label: 'Rotina',    emoji: '🔄', color: '#f59e0b' },
  { id: 'reminder', label: 'Lembrete',  emoji: '🔔', color: '#ef4444' },
  { id: 'exam',     label: 'Prova',     emoji: '📝', color: '#8b5cf6' },
  { id: 'health',   label: 'Saúde',     emoji: '💊', color: '#ec4899' },
  { id: 'study',    label: 'Estudo',    emoji: '📚', color: '#3b82f6' },
  { id: 'finance',  label: 'Financeiro',emoji: '💰', color: '#f97316' },
];

const PRIORITIES = [
  { id: 'urgent', label: 'Urgente', color: '#ef4444', icon: '🔴' },
  { id: 'high',   label: 'Alta',    color: '#f97316', icon: '🟠' },
  { id: 'medium', label: 'Média',   color: '#f59e0b', icon: '🟡' },
  { id: 'low',    label: 'Baixa',   color: '#10b981', icon: '🟢' },
];

const RECURRENCE = [
  { id: 'none',    label: 'Não repetir' },
  { id: 'daily',   label: 'Diariamente' },
  { id: 'weekly',  label: 'Semanalmente' },
  { id: 'monthly', label: 'Mensalmente' },
];

const ALERT_OPTIONS = [
  { value: 0,    label: 'No momento' },
  { value: 15,   label: '15 min antes' },
  { value: 30,   label: '30 min antes' },
  { value: 60,   label: '1 hora antes' },
  { value: 1440, label: '1 dia antes' },
];

const VIEWS = ['mês', 'semana', 'dia', 'lista'];
const TYPE_MAP = Object.fromEntries(EVENT_TYPES.map(t => [t.id, t]));
const PRIO_MAP = Object.fromEntries(PRIORITIES.map(p => [p.id, p]));

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const dayNamesFull = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

const todayStr = () => new Date().toISOString().split('T')[0];
const toDateStr = (d) => d.toISOString().split('T')[0];
function pad(n) { return String(n).padStart(2, '0'); }

function getWeekDays(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

function getMonthMatrix(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return { first, days };
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date(todayStr());
  return Math.ceil(diff / 86400000);
}

function eisenhower(events) {
  return {
    urgentImportant:       events.filter(e => daysUntil(e.date) <= 3 && ['urgent','high'].includes(e.priority)),
    notUrgentImportant:    events.filter(e => daysUntil(e.date) >  3 && ['urgent','high'].includes(e.priority)),
    urgentNotImportant:    events.filter(e => daysUntil(e.date) <= 3 && ['medium','low',''].includes(e.priority || 'medium')),
    notUrgentNotImportant: events.filter(e => daysUntil(e.date) >  3 && ['low',''].includes(e.priority || '')),
  };
}

// ─── PDF text extractor ───────────────────────────────────────────────────────
async function extractPDFText(file) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(it => it.str).join(' ') + '\n';
  }
  return text;
}

// ─── Image to base64 ─────────────────────────────────────────────────────────
async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ═══════════════════════════════════════════════════════════════════
// ABA IMPORTAR
// ═══════════════════════════════════════════════════════════════════
function ImportTab({ onSaveEvents }) {
  const [gcalStatus, setGcalStatus] = useState('idle'); // idle | loading | success | error
  const [gcalEvents, setGcalEvents] = useState([]);
  const [gcalSelected, setGcalSelected] = useState([]);
  const [gcalError, setGcalError] = useState('');

  const [fileStatus, setFileStatus] = useState('idle'); // idle | loading | preview | saving | success | error
  const [fileEvents, setFileEvents] = useState([]);
  const [fileSelected, setFileSelected] = useState([]);
  const [fileError, setFileError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  // ── Google Calendar ──────────────────────────────────────────────
  const syncGoogleCalendar = async () => {
    setGcalStatus('loading');
    setGcalError('');
    setGcalEvents([]);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Liste os eventos do Google Calendar dos próximos 30 dias. 
Retorne APENAS um array JSON válido, sem markdown, com este formato exato:
[{"title":"Nome do evento","date":"2026-03-20","time":"14:00","description":"descrição","location":"local"}]
Se não houver eventos, retorne [].`
          }],
          mcp_servers: [{
            type: 'url',
            url: 'https://gcal.mcp.claude.com/mcp',
            name: 'google-calendar'
          }]
        })
      });

      const data = await response.json();
      const textBlock = data.content?.find(b => b.type === 'text');
      const raw = textBlock?.text || '[]';

      const s = raw.indexOf('['), e = raw.lastIndexOf(']');
      const parsed = s !== -1 ? JSON.parse(raw.substring(s, e + 1)) : [];

      setGcalEvents(parsed);
      setGcalSelected(parsed.map((_, i) => i));
      setGcalStatus('success');
    } catch (err) {
      console.error(err);
      setGcalError('Não foi possível conectar ao Google Calendar. Verifique se está conectado nas configurações.');
      setGcalStatus('error');
    }
  };

  const importGcalEvents = async () => {
    const toImport = gcalSelected.map(i => gcalEvents[i]).filter(Boolean);
    const events = toImport.map(ev => ({
      title: ev.title || ev.summary || 'Evento',
      date: ev.date?.split('T')[0] || todayStr(),
      time: ev.time || ev.start?.dateTime?.split('T')[1]?.substring(0, 5) || '',
      description: ev.description || '',
      location: ev.location || '',
      type: 'event',
      priority: 'medium',
      color: '#4285f4',
      recurrence: 'none',
      alertMinutes: 30,
      completed: false,
      tags: ['google-calendar'],
    }));
    await onSaveEvents(events);
    setGcalStatus('idle');
    setGcalEvents([]);
    setGcalSelected([]);
  };

  // ── PDF / Imagem ─────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileStatus('loading');
    setFileError('');
    setFileEvents([]);

    try {
      const currentYear = new Date().getFullYear();
      let prompt = '';

      if (file.type === 'application/pdf') {
        const text = await extractPDFText(file);
        prompt = `Analise este texto de um documento acadêmico/universitário e extraia TODOS os eventos, provas, aulas, prazos e compromissos.

TEXTO:
"${text.substring(0, 8000)}"

Retorne APENAS um array JSON válido, sem markdown:
[{"title":"Prova de Anatomia","date":"${currentYear}-06-15","time":"08:00","type":"exam","description":"descrição","location":"sala"}]

Tipos válidos: exam, task, event, study, health, reminder
Se não encontrar eventos, retorne [].`;
      } else {
        const b64 = await imageToBase64(file);
        prompt = `Analise esta imagem (pode ser um cronograma, horário, calendário, lista de provas ou qualquer documento com datas) e extraia TODOS os eventos, provas, aulas e compromissos visíveis.

Retorne APENAS um array JSON válido, sem markdown:
[{"title":"Nome do evento","date":"${currentYear}-06-15","time":"08:00","type":"exam","description":"descrição"}]

Tipos: exam, task, event, study, health, reminder
Ano base: ${currentYear}
Se não encontrar nada, retorne [].`;

        // Para imagem, usa a API com vision
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: file.type, data: b64 } },
                { type: 'text', text: prompt }
              ]
            }]
          })
        });
        const data = await response.json();
        const raw = data.content?.find(b => b.type === 'text')?.text || '[]';
        const s = raw.indexOf('['), en = raw.lastIndexOf(']');
        const parsed = s !== -1 ? JSON.parse(raw.substring(s, en + 1)) : [];
        setFileEvents(parsed);
        setFileSelected(parsed.map((_, i) => i));
        setFileStatus(parsed.length > 0 ? 'preview' : 'error');
        if (parsed.length === 0) setFileError('Nenhum evento encontrado na imagem. Tente uma imagem mais clara.');
        e.target.value = '';
        return;
      }

      // PDF usa generateText
      const raw = await generateText(prompt);
      const s = raw.indexOf('['), en = raw.lastIndexOf(']');
      const parsed = s !== -1 ? JSON.parse(raw.substring(s, en + 1)) : [];
      setFileEvents(parsed);
      setFileSelected(parsed.map((_, i) => i));
      setFileStatus(parsed.length > 0 ? 'preview' : 'error');
      if (parsed.length === 0) setFileError('Nenhum evento identificado no arquivo. Verifique se o PDF contém datas e eventos.');
    } catch (err) {
      console.error(err);
      setFileError('Erro ao processar o arquivo. Tente novamente.');
      setFileStatus('error');
    }
    e.target.value = '';
  };

  const importFileEvents = async () => {
    setFileStatus('saving');
    const toImport = fileSelected.map(i => fileEvents[i]).filter(Boolean);
    const events = toImport.map(ev => ({
      title: ev.title || 'Evento',
      date: ev.date?.split('T')[0] || todayStr(),
      time: ev.time || '',
      description: ev.description || `Importado de: ${fileName}`,
      location: ev.location || '',
      type: ev.type || 'event',
      priority: 'medium',
      color: TYPE_MAP[ev.type]?.color || '#6366f1',
      recurrence: 'none',
      alertMinutes: 30,
      completed: false,
      tags: ['importado'],
    }));
    await onSaveEvents(events);
    setFileStatus('success');
    setFileEvents([]);
    setFileSelected([]);
    setFileName('');
  };

  const toggleGcal = (i) => setGcalSelected(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  );
  const toggleFile = (i) => setFileSelected(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  );

  return (
    <div className="space-y-6">

      {/* ── Google Calendar ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#4285f420', border: '2px solid #4285f440' }}>
            📆
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Google Calendar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sincronize eventos dos próximos 30 dias</p>
          </div>
          <button
            onClick={syncGoogleCalendar}
            disabled={gcalStatus === 'loading'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
            style={{ background: gcalStatus === 'loading' ? '#9ca3af' : '#4285f4' }}
          >
            {gcalStatus === 'loading'
              ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Buscando...</>
              : <><ArrowPathIcon className="h-4 w-4" /> Sincronizar</>}
          </button>
        </div>

        {gcalStatus === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">❌ {gcalError}</p>
            <p className="text-xs text-red-500 mt-1">
              Para conectar, acesse <strong>Configurações → Integrações</strong> e conecte sua conta Google.
            </p>
          </div>
        )}

        {gcalStatus === 'success' && gcalEvents.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">Nenhum evento encontrado nos próximos 30 dias</p>
          </div>
        )}

        {gcalStatus === 'success' && gcalEvents.length > 0 && (
          <div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                ✅ {gcalEvents.length} evento(s) encontrado(s) — {gcalSelected.length} selecionado(s)
              </p>
              <button
                onClick={() => setGcalSelected(gcalSelected.length === gcalEvents.length ? [] : gcalEvents.map((_, i) => i))}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold underline"
              >
                {gcalSelected.length === gcalEvents.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
              {gcalEvents.map((ev, i) => (
                <button key={i} onClick={() => toggleGcal(i)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-all">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${gcalSelected.includes(i) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {gcalSelected.includes(i) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ev.title || ev.summary}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ev.date?.split('T')[0]} {ev.time && `às ${ev.time}`}
                      {ev.location && ` · 📍 ${ev.location}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={importGcalEvents}
                disabled={gcalSelected.length === 0}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                style={{ background: '#4285f4' }}
              >
                Importar {gcalSelected.length} evento(s) para o MedPlanner
              </button>
            </div>
          </div>
        )}

        {gcalStatus === 'idle' && (
          <div className="p-6 text-center text-gray-400">
            <p className="text-sm">Clique em <strong>Sincronizar</strong> para buscar seus eventos do Google Calendar</p>
          </div>
        )}
      </div>

      {/* ── PDF / Imagem ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#8b5cf620', border: '2px solid #8b5cf640' }}>
            🤖
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Importar PDF ou Foto</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">A IA extrai eventos automaticamente de cronogramas, horários e listas de provas</p>
          </div>
        </div>

        {fileStatus === 'idle' || fileStatus === 'error' ? (
          <div className="p-6">
            <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
            >
              <div className="flex gap-4">
                <DocumentArrowUpIcon className="h-10 w-10 text-gray-300 group-hover:text-indigo-400 transition-all" />
                <PhotoIcon className="h-10 w-10 text-gray-300 group-hover:text-indigo-400 transition-all" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Clique para selecionar arquivo
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, HEIC — Cronogramas, horários, listas de provas</p>
              </div>
            </button>
            {fileStatus === 'error' && (
              <p className="text-sm text-red-500 mt-3 text-center">❌ {fileError}</p>
            )}
          </div>
        ) : null}

        {fileStatus === 'loading' && (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Analisando com IA...</p>
              <p className="text-xs text-gray-400 mt-1">{fileName}</p>
            </div>
          </div>
        )}

        {fileStatus === 'preview' && fileEvents.length > 0 && (
          <div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between">
              <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold">
                🎉 {fileEvents.length} evento(s) encontrado(s) em <span className="italic">{fileName}</span>
              </p>
              <button
                onClick={() => setFileSelected(fileSelected.length === fileEvents.length ? [] : fileEvents.map((_, i) => i))}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold underline"
              >
                {fileSelected.length === fileEvents.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
              {fileEvents.map((ev, i) => {
                const type = TYPE_MAP[ev.type] || TYPE_MAP.event;
                return (
                  <button key={i} onClick={() => toggleFile(i)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-all">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${fileSelected.includes(i) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {fileSelected.includes(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-base flex-shrink-0">{type.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ev.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ev.date} {ev.time && `às ${ev.time}`}
                        {ev.description && ` · ${ev.description.substring(0, 50)}`}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full flex-shrink-0 font-semibold"
                      style={{ background: type.color + '20', color: type.color }}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => { setFileStatus('idle'); setFileEvents([]); setFileSelected([]); setFileName(''); }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={importFileEvents}
                disabled={fileSelected.length === 0 || fileStatus === 'saving'}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {fileStatus === 'saving' ? 'Salvando...' : `Importar ${fileSelected.length} evento(s)`}
              </button>
            </div>
          </div>
        )}

        {fileStatus === 'success' && (
          <div className="p-8 text-center">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-bold text-gray-900 dark:text-white">Eventos importados com sucesso!</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Já aparecem no seu calendário</p>
            <button
              onClick={() => { setFileStatus('idle'); setFileEvents([]); setFileSelected([]); setFileName(''); }}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700"
            >
              Importar outro arquivo
            </button>
          </div>
        )}
      </div>

      {/* Dicas */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800">
        <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-indigo-500" /> Dicas de importação
        </h4>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>📋 <strong>PDF funciona melhor</strong> com documentos de texto (não PDFs escaneados)</p>
          <p>📸 <strong>Fotos</strong> de horários, quadros brancos ou listas escritas à mão funcionam bem</p>
          <p>📆 <strong>Google Calendar</strong> sincroniza automaticamente os próximos 30 dias</p>
          <p>✅ Você pode <strong>selecionar quais eventos importar</strong> antes de salvar</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL DE EVENTO
// ═══════════════════════════════════════════════════════════════════
function EventModal({ onClose, onSave, initial = null, defaultDate = '' }) {
  const [form, setForm] = useState(initial || {
    title: '', date: defaultDate || todayStr(), time: '', endTime: '',
    type: 'event', priority: 'medium', description: '', location: '',
    tags: '', participants: '', recurrence: 'none', alertMinutes: 30,
    completed: false, color: '#6366f1',
  });
  const [tab, setTab] = useState('basic');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTypeChange = (typeId) => {
    const t = TYPE_MAP[typeId];
    set('type', typeId);
    set('color', t.color);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col border border-gray-100 dark:border-gray-700">
        <div className="rounded-t-2xl p-5 flex items-center justify-between" style={{ backgroundColor: form.color + '18', borderBottom: `3px solid ${form.color}` }}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{initial ? '✏️ Editar' : '➕ Novo'} Registro</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-xl transition-all">
            <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-700 px-5 pt-2">
          {[['basic','Básico'],['details','Detalhes'],['settings','Config']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${tab === id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'basic' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</label>
                <div className="grid grid-cols-4 gap-2">
                  {EVENT_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => handleTypeChange(t.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all border-2 text-center ${form.type === t.id ? 'border-2' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}
                      style={form.type === t.id ? { borderColor: t.color, backgroundColor: t.color + '15', color: t.color } : {}}>
                      {t.emoji}<br />{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título *</label>
                <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="O que você precisa fazer?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Horário</label>
                  <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prioridade</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p.id} type="button" onClick={() => set('priority', p.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${form.priority === p.id ? 'border-2' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                      style={form.priority === p.id ? { borderColor: p.color, backgroundColor: p.color + '15', color: p.color } : {}}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm resize-none"
                  placeholder="Detalhes, links, anotações..." />
              </div>
            </>
          )}
          {tab === 'details' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">📍 Local / Link</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="Endereço ou URL" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">👥 Participantes</label>
                <input type="text" value={form.participants} onChange={e => set('participants', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="Ex: Prof. Silva, Colega João" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">🏷️ Tags (separadas por vírgula)</label>
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" placeholder="Ex: medicina, anatomia" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">🎨 Cor personalizada</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Escolha uma cor para este evento</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">⏰ Início</label>
                  <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">⏰ Fim</label>
                  <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm" />
                </div>
              </div>
            </>
          )}
          {tab === 'settings' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🔔 Alerta</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_OPTIONS.map(a => (
                    <button key={a.value} type="button" onClick={() => set('alertMinutes', a.value)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border-2 ${form.alertMinutes === a.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🔁 Repetição</label>
                <div className="space-y-2">
                  {RECURRENCE.map(r => (
                    <button key={r.id} type="button" onClick={() => set('recurrence', r.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-all border-2 ${form.recurrence === r.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                      {r.id === 'none' ? '—' : r.id === 'daily' ? '📆' : r.id === 'weekly' ? '📅' : '🗓'} {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </form>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm">
            Cancelar
          </button>
          <button onClick={handleSubmit}
            className="flex-1 py-3 text-white rounded-xl font-semibold shadow-lg text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: form.color }}>
            {initial ? 'Salvar Alterações' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventChip({ event, onClick, compact = false }) {
  const type = TYPE_MAP[event.type] || TYPE_MAP.event;
  return (
    <button onClick={() => onClick(event)}
      className={`w-full text-left rounded-lg px-2 ${compact ? 'py-0.5' : 'py-1'} text-xs font-medium truncate transition-all hover:opacity-80`}
      style={{ backgroundColor: (event.color || type.color) + '25', color: event.color || type.color, borderLeft: `3px solid ${event.color || type.color}` }}>
      {event.completed && '✓ '}
      {!compact && <span className="mr-1">{type.emoji}</span>}
      {event.time && <span className="mr-1 opacity-70">{event.time}</span>}
      {event.title}
    </button>
  );
}

function EventDetail({ event, onClose, onEdit, onDelete, onToggleComplete }) {
  const type = TYPE_MAP[event.type] || TYPE_MAP.event;
  const prio = PRIO_MAP[event.priority] || PRIO_MAP.medium;
  const days = daysUntil(event.date);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 pb-4" style={{ backgroundColor: (event.color || type.color) + '18', borderBottom: `3px solid ${event.color || type.color}` }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: (event.color || type.color) + '25', color: event.color || type.color }}>
                  {type.emoji} {type.label}
                </span>
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: prio.color + '20', color: prio.color }}>
                  {prio.icon} {prio.label}
                </span>
              </div>
              <h3 className={`text-xl font-bold text-gray-900 dark:text-white ${event.completed ? 'line-through opacity-60' : ''}`}>{event.title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-xl ml-2">
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <CalendarDaysIcon className="h-5 w-5 flex-shrink-0" style={{ color: event.color || type.color }} />
            <div>
              <span className="font-medium">{new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              {event.time && <span className="text-gray-400 ml-2">às {event.time}{event.endTime && ` — ${event.endTime}`}</span>}
              <span className={`ml-2 text-xs font-semibold ${days < 0 ? 'text-red-500' : days === 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                {days < 0 ? `${Math.abs(days)}d atrás` : days === 0 ? 'Hoje!' : `em ${days}d`}
              </span>
            </div>
          </div>
          {event.location && <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"><MapPinIcon className="h-5 w-5 flex-shrink-0 text-pink-500" /><span>{event.location}</span></div>}
          {event.description && <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300"><DocumentTextIcon className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" /><p className="whitespace-pre-wrap">{event.description}</p></div>}
          {event.tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="h-4 w-4 text-gray-400" />
              {event.tags.map((tag, i) => <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">{tag}</span>)}
            </div>
          )}
        </div>
        <div className="p-5 pt-0 grid grid-cols-3 gap-2">
          <button onClick={() => onToggleComplete(event)}
            className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${event.completed ? 'bg-gray-100 dark:bg-gray-700 text-gray-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700'}`}>
            {event.completed ? '↩ Reabrir' : '✓ Concluir'}
          </button>
          <button onClick={() => { onEdit(event); onClose(); }}
            className="py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 transition-all">
            ✏️ Editar
          </button>
          <button onClick={() => { onDelete(event.id); onClose(); }}
            className="py-2.5 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 transition-all">
            🗑 Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function Calendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, canCreateEvent, isFree } = useSubscription();
  const { events: ctxEvents, addEvent, updateEvent, deleteEvent, bills } = useContext(AppContext);

  const [view, setView]               = useState('mês');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab]     = useState('calendar');
  const [showModal, setShowModal]     = useState(false);
  const [editEvent, setEditEvent]     = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [filterType, setFilterType]   = useState('all');
  const [filterPrio, setFilterPrio]   = useState('all');
  const [searchQ, setSearchQ]         = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [importSuccess, setImportSuccess] = useState(0);

  const selectedDateStr = toDateStr(selectedDate);

  const billEvents = useMemo(() =>
    (bills || []).filter(b => !b.paid && b.dueDate).map(b => ({
      id: 'bill_' + b.id,
      title: `💰 Pagar: ${b.title}`,
      date: b.dueDate,
      type: 'finance',
      priority: daysUntil(b.dueDate) <= 2 ? 'urgent' : 'medium',
      color: '#f97316',
      _isBill: true,
    })),
    [bills]
  );

  const allEvents = useMemo(() => {
    const combined = [...(ctxEvents || []), ...billEvents];
    return combined.filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterPrio !== 'all' && e.priority !== filterPrio) return false;
      if (searchQ && !e.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [ctxEvents, billEvents, filterType, filterPrio, searchQ]);

  const getEventsForDate = useCallback((dateStr) =>
    allEvents.filter(e => e.date === dateStr), [allEvents]
  );

  const { first, days: daysInMonth } = useMemo(() => getMonthMatrix(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const dayEvents = useMemo(() =>
    getEventsForDate(selectedDateStr).sort((a, b) => (a.time || '') < (b.time || '') ? -1 : 1),
    [getEventsForDate, selectedDateStr]
  );

  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const weekEvents = allEvents.filter(e => { const d = new Date(e.date); return d >= weekStart && d <= weekEnd; });
    const overdue = allEvents.filter(e => !e.completed && daysUntil(e.date) < 0);
    const completedThisWeek = weekEvents.filter(e => e.completed).length;
    const completionRate = weekEvents.length > 0 ? ((completedThisWeek / weekEvents.length) * 100).toFixed(0) : 0;
    return { weekEvents: weekEvents.length, overdue: overdue.length, completionRate };
  }, [allEvents]);

  const eisMatrix = useMemo(() => {
    const upcoming = allEvents.filter(e => !e.completed && !e._isBill && daysUntil(e.date) >= 0);
    return eisenhower(upcoming);
  }, [allEvents]);

  const handleSaveEvent = async (data) => {
    try {
      if (editEvent && editEvent.id) {
        await updateEvent(editEvent.id, data);
      } else {
        await addEvent(data);
      }
      setEditEvent(null);
    } catch (err) { console.error(err); }
  };

  // Salva múltiplos eventos (para importação)
  const handleSaveMultipleEvents = async (events) => {
    let count = 0;
    for (const ev of events) {
      try { await addEvent(ev); count++; } catch (err) { console.error(err); }
    }
    setImportSuccess(count);
    setTimeout(() => setImportSuccess(0), 4000);
  };

  const handleDeleteEvent = async (id) => {
    if (id.startsWith('bill_')) return;
    if (!confirm('Excluir este evento?')) return;
    try { await deleteEvent(id); } catch (err) { console.error(err); }
  };

  const handleToggleComplete = async (event) => {
    if (event._isBill) return;
    try { await updateEvent(event.id, { completed: !event.completed, completedAt: !event.completed ? new Date().toISOString() : null }); }
    catch (err) { console.error(err); }
  };

  const handleDayClick = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const nav = (dir) => {
    const d = new Date(currentDate);
    if (view === 'mês') d.setMonth(d.getMonth() + dir);
    else if (view === 'semana') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
    setSelectedDate(d);
  };

  const navLabel = () => {
    if (view === 'mês') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'semana') {
      const days = getWeekDays(currentDate);
      return `${days[0].getDate()} – ${days[6].getDate()} ${monthNames[days[6].getMonth()]}`;
    }
    return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); };

  // ─── Month View ───────────────────────────────────────────────────
  const MonthView = () => (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {Array.from({ length: first }).map((_, i) => (
          <div key={`e-${i}`} className="bg-gray-50 dark:bg-gray-800/50 aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(day)}`;
          const dayEvts = getEventsForDate(dateStr);
          const isT = dateStr === todayStr();
          const isSel = dateStr === selectedDateStr;
          return (
            <button key={day} onClick={() => handleDayClick(day)}
              className={`bg-white dark:bg-gray-800 min-h-[80px] p-1.5 text-left transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/10 ${isSel ? 'ring-2 ring-inset ring-indigo-500' : ''}`}>
              <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-bold mb-1 ${isT ? 'bg-indigo-600 text-white' : isSel ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
              <div className="space-y-0.5">
                {dayEvts.slice(0, 3).map(ev => <EventChip key={ev.id} event={ev} onClick={setDetailEvent} compact />)}
                {dayEvts.length > 3 && <div className="text-xs text-gray-400 pl-1">+{dayEvts.length - 3} mais</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const WeekView = () => {
    const days = getWeekDays(currentDate);
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-8 mb-2">
            <div />
            {days.map((d, i) => {
              const ds = toDateStr(d);
              const isT = ds === todayStr();
              const isSel = ds === selectedDateStr;
              const cnt = getEventsForDate(ds).length;
              return (
                <button key={i} onClick={() => setSelectedDate(d)}
                  className={`text-center py-3 rounded-xl transition-all ${isSel ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{dayNames[d.getDay()]}</div>
                  <div className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold mt-1 ${isT ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>{d.getDate()}</div>
                  {cnt > 0 && <div className="text-xs text-indigo-500 mt-0.5">{cnt}</div>}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-8 border-t border-gray-100 dark:border-gray-700">
            {hours.map(h => (
              <>
                <div key={`h-${h}`} className="text-xs text-gray-400 text-right pr-3 py-3 border-b border-gray-100 dark:border-gray-700">{pad(h)}:00</div>
                {days.map((d, di) => {
                  const ds = toDateStr(d);
                  const evs = getEventsForDate(ds).filter(e => e.time && parseInt(e.time) === h);
                  return (
                    <div key={`${h}-${di}`} className="border-b border-l border-gray-100 dark:border-gray-700 p-1 min-h-[44px]">
                      {evs.map(ev => <EventChip key={ev.id} event={ev} onClick={setDetailEvent} />)}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DayView = () => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    const timedEvs = dayEvents.filter(e => e.time);
    const untimedEvs = dayEvents.filter(e => !e.time);
    return (
      <div>
        {untimedEvs.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 mb-2 font-semibold">SEM HORÁRIO</p>
            <div className="space-y-1">{untimedEvs.map(ev => <EventChip key={ev.id} event={ev} onClick={setDetailEvent} />)}</div>
          </div>
        )}
        <div className="space-y-px border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
          {hours.map(h => {
            const evs = timedEvs.filter(e => parseInt(e.time) === h);
            return (
              <div key={h} className={`flex gap-2 p-2 border-b border-gray-100 dark:border-gray-700 ${evs.length ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'bg-white dark:bg-gray-800'}`}>
                <span className="text-xs text-gray-400 w-12 flex-shrink-0 pt-1">{pad(h)}:00</span>
                <div className="flex-1 space-y-1">{evs.map(ev => <EventChip key={ev.id} event={ev} onClick={setDetailEvent} />)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ListView = () => {
    const grouped = {};
    allEvents.filter(e => !e.completed || daysUntil(e.date) >= -7)
      .sort((a, b) => a.date < b.date ? -1 : 1)
      .forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });

    return (
      <div className="space-y-4">
        {Object.keys(grouped).sort().slice(0, 30).map(date => {
          const d = daysUntil(date);
          const label = d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : d === -1 ? 'Ontem' : new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
          return (
            <div key={date}>
              <div className={`flex items-center gap-2 mb-2 ${d === 0 ? 'text-indigo-600' : d < 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${d === 0 ? 'bg-indigo-600' : d < 0 ? 'bg-red-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-bold uppercase tracking-wide">{label}</span>
              </div>
              <div className="space-y-2 pl-4">
                {grouped[date].map(ev => (
                  <button key={ev.id} onClick={() => setDetailEvent(ev)}
                    className="w-full text-left flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-300 transition-all">
                    <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color || TYPE_MAP[ev.type]?.color || '#6366f1' }} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm text-gray-900 dark:text-white ${ev.completed ? 'line-through opacity-50' : ''}`}>{ev.title}</p>
                      {ev.time && <p className="text-xs text-gray-400 mt-0.5">{ev.time}</p>}
                    </div>
                    <span className="text-lg flex-shrink-0">{TYPE_MAP[ev.type]?.emoji || '📅'}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-3">🗓</p>
            <p>Nenhum evento encontrado</p>
          </div>
        )}
      </div>
    );
  };

  const PrioritiesTab = () => {
    const matrix = [
      { key: 'urgentImportant',       title: '🔥 Urgente + Importante',         sub: 'Faça agora',  color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/10',     border: 'border-red-300 dark:border-red-700' },
      { key: 'notUrgentImportant',    title: '📋 Não urgente + Importante',     sub: 'Planeje',     color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-300 dark:border-indigo-700' },
      { key: 'urgentNotImportant',    title: '⚡ Urgente + Não importante',     sub: 'Delegue',     color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10',   border: 'border-amber-300 dark:border-amber-700' },
      { key: 'notUrgentNotImportant', title: '💤 Não urgente + Não importante', sub: 'Elimine',     color: '#6b7280', bg: 'bg-gray-50 dark:bg-gray-700/30',    border: 'border-gray-300 dark:border-gray-600' },
    ];
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1"><SparklesIcon className="w-5 h-5 text-indigo-500" />Matriz de Eisenhower</h3>
          <p className="text-sm text-gray-500">Organize suas atividades por urgência e importância</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matrix.map(q => (
            <div key={q.key} className={`rounded-2xl p-4 border-2 ${q.bg} ${q.border}`}>
              <div className="mb-3">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{q.title}</h4>
                <p className="text-xs text-gray-500">{q.sub}</p>
              </div>
              {eisMatrix[q.key].length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhum item</p>
              ) : (
                <div className="space-y-2">
                  {eisMatrix[q.key].slice(0, 5).map(ev => (
                    <button key={ev.id} onClick={() => setDetailEvent(ev)}
                      className="w-full text-left flex items-center gap-2 p-2 bg-white/70 dark:bg-gray-800/70 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all">
                      <span className="text-sm">{TYPE_MAP[ev.type]?.emoji || '📅'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PlanningTab = () => {
    const nextWeekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
    const freeSlotsToday = (() => {
      const busyHours = new Set(getEventsForDate(todayStr()).filter(e => e.time).map(e => parseInt(e.time)));
      const slots = [];
      for (let h = 8; h <= 20; h++) if (!busyHours.has(h)) slots.push(`${pad(h)}:00`);
      return slots.slice(0, 5);
    })();
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><SparklesIcon className="w-5 h-5 text-emerald-500" />Janelas Livres Hoje</h3>
          {freeSlotsToday.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {freeSlotsToday.map(slot => <span key={slot} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-semibold shadow-sm">🕐 {slot}</span>)}
            </div>
          ) : <p className="text-sm text-gray-500">Dia bastante ocupado!</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">📆 Próximos 7 Dias</h3>
          <div className="space-y-3">
            {nextWeekDays.map((d, i) => {
              const ds = toDateStr(d);
              const evs = getEventsForDate(ds);
              return (
                <button key={i} onClick={() => { setSelectedDate(d); setCurrentDate(d); setActiveTab('calendar'); }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all text-left">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <span className={`text-xs font-medium ${i === 0 ? 'text-indigo-100' : 'text-gray-500'}`}>{dayNames[d.getDay()]}</span>
                    <span className={`text-lg font-bold ${i === 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{d.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNamesFull[d.getDay()]}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{evs.length === 0 ? 'Dia livre' : `${evs.length} compromisso(s)`}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const InsightsTab = () => {
    const byType = useMemo(() => { const acc = {}; allEvents.forEach(e => { acc[e.type] = (acc[e.type] || 0) + 1; }); return acc; }, []);
    const completionRate = allEvents.length > 0 ? ((allEvents.filter(e => e.completed).length / allEvents.length) * 100).toFixed(0) : 0;
    const busiestDay = useMemo(() => {
      const acc = {};
      allEvents.forEach(e => { const d = new Date(e.date).getDay(); acc[d] = (acc[d] || 0) + 1; });
      const max = Object.entries(acc).sort((a, b) => b[1] - a[1])[0];
      return max ? dayNamesFull[parseInt(max[0])] : '—';
    }, []);
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total de eventos', value: allEvents.length, icon: '📅' },
            { label: 'Taxa de conclusão', value: `${completionRate}%`, icon: '✅' },
            { label: 'Dia mais ocupado', value: busiestDay, icon: '📆' },
            { label: 'Em atraso', value: stats.overdue, icon: '⚠️' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">📊 Distribuição por Tipo</h3>
          <div className="space-y-3">
            {EVENT_TYPES.filter(t => byType[t.id]).map(t => {
              const count = byType[t.id] || 0;
              const pct = allEvents.length > 0 ? (count / allEvents.length) * 100 : 0;
              return (
                <div key={t.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{t.emoji} {t.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: t.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout title="Agenda" subtitle="Organize sua vida com inteligência" emoji="📅" urgentCount={stats.overdue}>
      <div className="space-y-5">

        {/* Toast de sucesso da importação */}
        {importSuccess > 0 && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2">
            ✅ {importSuccess} evento(s) importado(s) com sucesso!
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            ['calendar',   '🗓 Calendário'],
            ['priorities', '⚡ Prioridades'],
            ['planning',   '📆 Planejamento'],
            ['insights',   '📊 Insights'],
            ['import',     '📥 Importar'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === id
                ? id === 'import'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── CALENDÁRIO ── */}
        {activeTab === 'calendar' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                <button onClick={() => nav(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"><ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
                <span className="text-sm font-bold text-gray-900 dark:text-white px-2 min-w-[160px] text-center">{navLabel()}</span>
                <button onClick={() => nav(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"><ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
              </div>
              <button onClick={goToday} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-all">Hoje</button>
              <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                {VIEWS.map(v => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-xs font-semibold capitalize transition-all ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{v}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar..." className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white text-sm w-36" />
                <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600'}`}><FunnelIcon className="h-5 w-5" /></button>
                <button onClick={() => { setEditEvent(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all text-sm">
                  <PlusIcon className="h-4 w-4" /> Novo
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Tipo</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>Todos</button>
                    {EVENT_TYPES.map(t => (
                      <button key={t.id} onClick={() => setFilterType(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === t.id ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`} style={filterType === t.id ? { backgroundColor: t.color } : {}}>{t.emoji} {t.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              {view === 'mês'    && <MonthView />}
              {view === 'semana' && <WeekView />}
              {view === 'dia'    && <DayView />}
              {view === 'lista'  && <ListView />}
            </div>

            {(view === 'mês' || view === 'semana') && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {selectedDateStr === todayStr() && <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded-full">Hoje</span>}
                  </h3>
                  <button onClick={() => { setEditEvent(null); setShowModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-all">
                    <PlusIcon className="h-4 w-4" /> Adicionar
                  </button>
                </div>
                {dayEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400"><p className="text-4xl mb-2">📭</p><p className="text-sm">Dia livre!</p></div>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map(ev => (
                      <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer" onClick={() => setDetailEvent(ev)}>
                        <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color || TYPE_MAP[ev.type]?.color || '#6366f1' }} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm text-gray-900 dark:text-white ${ev.completed ? 'line-through opacity-50' : ''}`}>{ev.title}</p>
                          {ev.time && <p className="text-xs text-gray-400 mt-0.5">{ev.time}</p>}
                        </div>
                        <span className="text-base flex-shrink-0">{TYPE_MAP[ev.type]?.emoji || '📅'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'priorities' && <PrioritiesTab />}
        {activeTab === 'planning'   && <PlanningTab />}
        {activeTab === 'insights'   && <InsightsTab />}
        {activeTab === 'import'     && <ImportTab onSaveEvents={handleSaveMultipleEvents} />}
      </div>

      {showModal && (
        <EventModal onClose={() => { setShowModal(false); setEditEvent(null); }} onSave={handleSaveEvent} initial={editEvent} defaultDate={selectedDateStr} />
      )}
      {detailEvent && (
        <EventDetail event={detailEvent} onClose={() => setDetailEvent(null)} onEdit={(ev) => { setEditEvent(ev); setShowModal(true); }} onDelete={handleDeleteEvent} onToggleComplete={handleToggleComplete} />
      )}
    </PageLayout>
  );
}