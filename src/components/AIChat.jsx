import { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { chatWithAI, generateFlashcards, createSchedule, analyzePBL } from '../services/gemini';
import { useChatHistory } from '../hooks/useChatHistory';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import PremiumBlock from './PremiumBlock';
import LimitReached from './LimitReached';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  XMarkIcon, PaperAirplaneIcon, SparklesIcon,
  MicrophoneIcon, SpeakerWaveIcon, StopIcon,
  PaperClipIcon, DocumentTextIcon, PhotoIcon, TrashIcon
} from '@heroicons/react/24/outline';

// ─── Resolve datas relativas em português ─────────────────────────────────────
function resolveDate(dateStr) {
  const now = new Date();
  if (!dateStr || dateStr === 'hoje') return now.toISOString().split('T')[0];
  if (dateStr === 'amanhã') {
    now.setDate(now.getDate() + 1);
    return now.toISOString().split('T')[0];
  }
  const weekdays = { 'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6, 'domingo': 0 };
  for (const [name, day] of Object.entries(weekdays)) {
    if (dateStr.toLowerCase().includes(name)) {
      const diff = (day - now.getDay() + 7) % 7 || 7;
      now.setDate(now.getDate() + diff);
      return now.toISOString().split('T')[0];
    }
  }
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  return now.toISOString().split('T')[0];
}

const ACTION_LABELS = {
  ADD_BILL:      { icon: '💰', text: 'Conta adicionada em Finanças' },
  ADD_EVENT:     { icon: '📅', text: 'Evento adicionado na Agenda' },
  ADD_TASK:      { icon: '✅', text: 'Tarefa criada' },
  ADD_HOME_TASK: { icon: '🏠', text: 'Tarefa doméstica criada' },
  LOG_WATER:     { icon: '💧', text: 'Hidratação registrada' },
};

const QUICK_ACTIONS = [
  { label: '📚 Ajuda com PBL',     type: 'pbl',        hint: 'Cole o caso clínico aqui...' },
  { label: '🧠 Criar Flashcards',  type: 'flashcards',  hint: 'Digite o tema ou anexe um PDF...' },
  { label: '📅 Montar Cronograma', type: 'schedule',    hint: 'Descreva suas matérias e horários disponíveis...' },
  { label: '💡 Dica de Estudo',    type: 'tip',         hint: 'Digite sua mensagem...' },
];

export default function AIChat({ isOpen, onClose }) {
  const { user } = useAuth();
  const { subscription, canUseAI, isPremium, loading: subLoading } = useSubscription();

  // Usa as funções do AppContext — atualização instantânea na UI
  const { addBill, addEvent, addTask, addHomeTask, logWater, events, bills, tasks } = useContext(AppContext);

  const { conversations, currentConversationId, createNewConversation,
    updateCurrentConversation, loadConversation, deleteConversation,
    clearAllHistory, getCurrentConversation } = useChatHistory();

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '👋 Olá! Sou seu assistente do MedPlanner.\n\nPosso responder dúvidas médicas, criar flashcards, montar cronogramas e também **executar ações diretamente no app**!\n\nExemplos do que posso fazer:\n• "gastei 45 reais no RU" → adiciona em Finanças\n• "tenho prova de fisiologia na quinta às 9h" → cria evento na Agenda\n• "adicionar tarefa: revisar anatomia" → cria tarefa\n• "bebi 500ml de água" → registra hidratação'
  }]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentConversationId) {
      const conv = getCurrentConversation();
      if (conv) setMessages(conv.messages);
    }
  }, [isOpen, currentConversationId]);

  useEffect(() => {
    if (messages.length > 1) updateCurrentConversation(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.onresult = (e) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
    synthRef.current = window.speechSynthesis;
    return () => { recognitionRef.current?.stop(); synthRef.current?.cancel(); };
  }, []);

  // Executa ação via AppContext (mesmo fluxo que o resto do app)
  const executeAction = async (action, actionData) => {
    try {
      switch (action) {
        case 'ADD_BILL':
          await addBill({
            title: actionData.description || actionData.title || 'Conta',
            amount: Number(actionData.amount) || 0,
            dueDate: resolveDate(actionData.date),
            paid: false,
            recurring: false,
          });
          return 'ADD_BILL';

        case 'ADD_EVENT':
          await addEvent({
            title: actionData.title || 'Evento',
            date: resolveDate(actionData.date),
            time: actionData.time || '00:00',
            type: actionData.eventType || 'event',
            description: actionData.description || '',
            color: actionData.color || '#8B5CF6',
          });
          return 'ADD_EVENT';

        case 'ADD_TASK':
          await addTask({
            title: actionData.title || 'Tarefa',
            date: resolveDate(actionData.date),
            priority: actionData.priority || 'média',
            completed: false,
            description: actionData.description || '',
          });
          return 'ADD_TASK';

        case 'ADD_HOME_TASK':
          await addHomeTask({
            title: actionData.title || 'Tarefa doméstica',
            category: actionData.category || 'Outros',
            priority: actionData.priority || 'média',
          });
          return 'ADD_HOME_TASK';

        case 'LOG_WATER':
          await logWater(Number(actionData.amount) || 0.25);
          return 'LOG_WATER';

        default:
          return null;
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      return 'error';
    }
  };

  // Injeta dados reais do usuário no prompt
  const buildUserContext = () => {
    const ctx = {};
    if (events?.length) {
      ctx.events = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5)
        .map(e => ({ title: e.title, date: e.date }));
    }
    if (bills?.length) {
      const unpaid = bills.filter(b => !b.paid);
      ctx.finances = {
        totalPending: unpaid.reduce((s, b) => s + (b.amount || 0), 0),
        pendingCount: unpaid.length,
      };
    }
    if (tasks?.length) {
      ctx.tasks = { pending: tasks.filter(t => !t.completed).length };
    }
    return ctx;
  };

  const incrementAIUsage = async () => {
    if (!user || isPremium()) return;
    try { await updateDoc(doc(db, 'users', user.uid), { aiUsage: increment(1) }); } catch {}
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || loading) return;
    if (!canUseAI()) { alert('⚠️ Limite atingido. Faça upgrade para continuar!'); return; }

    const userMsg = {
      role: 'user',
      content: input || '📎 Arquivo(s) anexado(s)',
      files: attachedFiles.map(f => ({ name: f.name, type: f.type }))
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const filesToSend = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);
    setLoading(true);

    try {
      let response;

      if (activeMode === 'flashcards') {
        response = await generateFlashcards(currentInput || 'medicina geral', 15);
        setActiveMode(null);
      } else if (activeMode === 'schedule') {
        response = await createSchedule(currentInput);
        setActiveMode(null);
      } else if (activeMode === 'pbl') {
        response = await analyzePBL(currentInput);
        setActiveMode(null);
      } else {
        const userContext = buildUserContext();
        if (user?.displayName) userContext.name = user.displayName;
        response = await chatWithAI(currentInput, userContext, filesToSend);
      }

      let executedAction = null;
      if (response.action && response.action !== 'NONE' && response.actionData) {
        executedAction = await executeAction(response.action, response.actionData);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response || 'Erro ao processar.',
        executedAction: executedAction && executedAction !== 'error' ? executedAction : null,
      }]);

      await incrementAIUsage();
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleNewConversation = () => {
    const newConv = createNewConversation();
    setMessages(newConv.messages);
    setShowHistory(false);
    setActiveMode(null);
  };

  const handleLoadConversation = (id) => {
    const msgs = loadConversation(id);
    if (msgs) { setMessages(msgs); setShowHistory(false); }
  };

  const handleDeleteConversation = (id, e) => {
    e.stopPropagation();
    if (confirm('Deseja deletar esta conversa?')) {
      deleteConversation(id);
      if (id === currentConversationId) handleNewConversation();
    }
  };

  const handleQuickAction = (action) => {
    if (action.type === 'tip') {
      setInput('Me dê 5 dicas práticas e específicas para estudar melhor medicina, baseadas em ciência do aprendizado.');
      setActiveMode(null);
    } else {
      setActiveMode(action.type);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Modo **${action.label}** ativado!\n${action.hint}`,
        isInstruction: true,
      }]);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) { alert('Seu navegador não suporta reconhecimento de voz.'); return; }
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else { recognitionRef.current.start(); setIsRecording(true); }
  };

  const speakMessage = (text) => {
    if (!synthRef.current) return;
    if (isSpeaking) { synthRef.current.cancel(); setIsSpeaking(false); return; }
    const clean = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'pt-BR';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => {
      if (!f.type.startsWith('image/') && f.type !== 'application/pdf') { alert(`${f.name}: Apenas imagens e PDFs.`); return false; }
      if (f.size > 10 * 1024 * 1024) { alert(`${f.name}: Máximo 10MB.`); return false; }
      return true;
    });
    setAttachedFiles(prev => [...prev, ...valid]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = Math.floor((Date.now() - date) / 86400000);
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  if (subLoading) return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    </div>
  );

  if (!subscription.features.aiEnabled) return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl p-8">
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <PremiumBlock feature="ai" requiredPlan="student" message="A IA integrada está disponível nos planos Estudante, Premium e Vitalício." />
      </div>
    </div>
  );

  if (!canUseAI()) return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl p-8">
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <LimitReached title="Limite de IA Atingido" message="Faça upgrade para ter acesso ilimitado!" currentUsage={subscription.aiUsage || 0} limit={subscription.features.aiLimit} feature="ai" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex overflow-hidden animate-scale-in">

        {/* Sidebar histórico */}
        <div className={`${showHistory ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">💬 Histórico</h3>
            <button onClick={handleNewConversation} className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all">
              + Nova Conversa
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center p-4">Nenhuma conversa salva</p>
            ) : conversations.map(conv => (
              <button key={conv.id} onClick={() => handleLoadConversation(conv.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${conv.id === currentConversationId ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(conv.updatedAt)}</p>
                  </div>
                  <button onClick={(e) => handleDeleteConversation(conv.id, e)} className="flex-shrink-0 w-6 h-6 text-red-500 hover:text-red-700 rounded-lg flex items-center justify-center">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </button>
            ))}
          </div>
          {conversations.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={clearAllHistory} className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                🗑️ Limpar Histórico
              </button>
            </div>
          )}
        </div>

        {/* Chat principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between flex-shrink-0">
            <button onClick={() => setShowHistory(!showHistory)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all mr-3">
              <span className="text-xl">{showHistory ? '✖️' : '💬'}</span>
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                <SparklesIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Assistente IA</h2>
                <p className="text-sm text-white/80">
                  {isPremium() ? '✨ Uso Ilimitado' : `${subscription.aiUsage || 0}/${subscription.features.aiLimit} consultas`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all">
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Aviso limite */}
          {!isPremium() && subscription.features.aiLimit > 0 && (subscription.aiUsage / subscription.features.aiLimit) >= 0.8 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b-2 border-yellow-300 dark:border-yellow-700 flex-shrink-0">
              <p className="text-sm text-center text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Atenção:</strong> Próximo do limite mensal. Faça upgrade!
              </p>
            </div>
          )}

          {/* Ações rápidas */}
          {messages.length <= 1 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">🚀 Ações Rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <button key={i} onClick={() => handleQuickAction(action)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all text-left">
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : message.isInstruction
                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {message.executedAction && ACTION_LABELS[message.executedAction] && (
                        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-xs font-semibold">
                          {ACTION_LABELS[message.executedAction].icon} {ACTION_LABELS[message.executedAction].text}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.files?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                              {file.type?.startsWith('image/') ? <PhotoIcon className="w-4 h-4" /> : <DocumentTextIcon className="w-4 h-4" />}
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === 'assistant' && !message.isInstruction && (
                      <button onClick={() => speakMessage(message.content)}
                        className="flex-shrink-0 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all">
                        {isSpeaking ? <StopIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="flex gap-2">
                    {[0, 0.1, 0.2].map((delay, i) => (
                      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Arquivos anexados */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
                    {file.type.startsWith('image/') ? <PhotoIcon className="w-4 h-4 text-purple-600" /> : <DocumentTextIcon className="w-4 h-4 text-red-600" />}
                    <span className="text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{file.name}</span>
                    <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {activeMode && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium">
                  {activeMode === 'flashcards' ? '🧠 Modo Flashcards' : activeMode === 'schedule' ? '📅 Modo Cronograma' : '📚 Modo PBL'}
                </span>
                <button onClick={() => setActiveMode(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">cancelar</button>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex-shrink-0">
                <PaperClipIcon className="w-5 h-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileSelect} className="hidden" />

              <div className="flex-1 relative">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
                  placeholder={
                    activeMode === 'flashcards' ? 'Digite o tema ou anexe um PDF...' :
                    activeMode === 'schedule'   ? 'Descreva suas matérias e horários...' :
                    activeMode === 'pbl'        ? 'Cole o caso clínico aqui...' :
                    'Ex: gastei 45 reais no RU | tenho prova de fisio na quinta às 9h'
                  }
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white text-sm"
                  rows={1} disabled={loading} />
                <button onClick={toggleRecording}
                  className={`absolute right-2 top-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              </div>

              <button onClick={handleSend} disabled={(!input.trim() && attachedFiles.length === 0) || loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg flex-shrink-0">
                <PaperAirplaneIcon className="w-5 h-5" />
                Enviar
              </button>
            </div>

            {isRecording && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 bg-red-600 rounded-full inline-block" />
                Gravando... Fale agora!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}