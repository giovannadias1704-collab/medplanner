import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/gemini';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  StopIcon,
  PaperClipIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function AIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Olá! Sou seu assistente de IA para medicina. Como posso ajudar você hoje?\n\n💡 Você pode enviar imagens e PDFs para análise!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll automático para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar Web Speech API
  useEffect(() => {
    // Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Speech Synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || loading) return;

    const userMessage = { 
      role: 'user', 
      content: input || '📎 Arquivo(s) anexado(s)',
      files: attachedFiles.map(f => ({ name: f.name, type: f.type }))
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setLoading(true);

    try {
      const response = await chatWithAI(input || 'Analise o(s) arquivo(s) anexado(s)', '', filesToSend);
      
      const aiMessage = {
        role: 'assistant',
        content: response.success ? response.response : response.response || 'Erro ao processar mensagem.'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erro no chat:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar os arquivos. Tente novamente.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Iniciar/Parar gravação de voz
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Ler mensagem em voz alta
  const speakMessage = (text) => {
    if (!synthRef.current) {
      alert('Seu navegador não suporta síntese de voz.');
      return;
    }

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text
      .replace(/[📚📅💡🎯✨🔥💪👋🤖📎🖼️📄💊🩺]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Anexar arquivos
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage && !isPDF) {
        alert(`${file.name}: Apenas imagens e PDFs são permitidos.`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name}: Arquivo muito grande. Máximo 10MB.`);
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
  };

  // Remover arquivo anexado
  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Atalhos rápidos
  const quickActions = [
    { label: '📚 Ajuda com PBL', prompt: 'Me ajude a analisar um caso de PBL' },
    { label: '🧠 Criar Flashcards', prompt: 'Crie flashcards para meu estudo' },
    { label: '📅 Montar Cronograma', prompt: 'Me ajude a criar um cronograma de estudos' },
    { label: '💡 Dica de Estudo', prompt: 'Me dê dicas para estudar melhor' }
  ];

  const handleQuickAction = (prompt) => {
    setInput(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Assistente IA</h2>
              <p className="text-sm text-white/80">Powered by Google Gemini 2.5-flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Atalhos rápidos */}
        {messages.length <= 1 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
              🚀 Ações Rápidas:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all text-left"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Mostrar arquivos anexados */}
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.files.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                            {file.type.startsWith('image/') ? (
                              <PhotoIcon className="w-4 h-4" />
                            ) : (
                              <DocumentTextIcon className="w-4 h-4" />
                            )}
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => speakMessage(message.content)}
                      className="flex-shrink-0 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                      title={isSpeaking ? 'Parar' : 'Ouvir'}
                    >
                      {isSpeaking ? (
                        <StopIcon className="w-4 h-4" />
                      ) : (
                        <SpeakerWaveIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Arquivos anexados */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                >
                  {file.type.startsWith('image/') ? (
                    <PhotoIcon className="w-4 h-4 text-purple-600" />
                  ) : (
                    <DocumentTextIcon className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {/* Botão de anexar */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              title="Anexar arquivo (imagem ou PDF)"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem ou anexe um arquivo..."
                className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                rows={1}
                disabled={loading}
              />
              
              {/* Botão de microfone */}
              <button
                onClick={toggleRecording}
                className={`absolute right-2 top-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={isRecording ? 'Parar gravação' : 'Gravar voz'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Enviar
            </button>
          </div>

          {isRecording && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              Gravando... Fale agora!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}