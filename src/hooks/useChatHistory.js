import { useState, useEffect } from 'react';

const STORAGE_KEY = 'medplanner_chat_history';
const MAX_CONVERSATIONS = 50; // Máximo de conversas salvas

export function useChatHistory() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Carregar conversas do localStorage ao iniciar
  useEffect(() => {
    loadConversations();
  }, []);

  // Carregar conversas do localStorage
  const loadConversations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  // Salvar conversas no localStorage
  const saveConversations = (convs) => {
    try {
      // Limitar número de conversas
      const limited = convs.slice(0, MAX_CONVERSATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      setConversations(limited);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  // Criar nova conversa
  const createNewConversation = () => {
    const newConv = {
      id: Date.now().toString(),
      title: 'Nova conversa',
      messages: [
        {
          role: 'assistant',
          content: '👋 Olá! Sou seu assistente de IA para medicina. Como posso ajudar você hoje?\n\n💡 Você pode enviar imagens e PDFs para análise!'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setCurrentConversationId(newConv.id);
    return newConv;
  };

  // Atualizar conversa atual
  const updateCurrentConversation = (messages) => {
    if (!currentConversationId) {
      // Se não há conversa atual, criar nova
      const newConv = createNewConversation();
      updateConversation(newConv.id, messages);
      return;
    }

    updateConversation(currentConversationId, messages);
  };

  // Atualizar conversa específica
  const updateConversation = (id, messages) => {
    const updated = conversations.map(conv => {
      if (conv.id === id) {
        // Gerar título automático baseado na primeira mensagem do usuário
        let title = conv.title;
        if (title === 'Nova conversa') {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
          }
        }

        return {
          ...conv,
          messages,
          title,
          updatedAt: new Date().toISOString()
        };
      }
      return conv;
    });

    saveConversations(updated);
  };

  // Carregar conversa específica
  const loadConversation = (id) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      return conv.messages;
    }
    return null;
  };

  // Deletar conversa
  const deleteConversation = (id) => {
    const updated = conversations.filter(c => c.id !== id);
    saveConversations(updated);
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  // Limpar todo o histórico
  const clearAllHistory = () => {
    if (confirm('Tem certeza que deseja apagar todo o histórico de conversas?')) {
      localStorage.removeItem(STORAGE_KEY);
      setConversations([]);
      setCurrentConversationId(null);
    }
  };

  // Obter conversa atual
  const getCurrentConversation = () => {
    if (!currentConversationId) return null;
    return conversations.find(c => c.id === currentConversationId);
  };

  return {
    conversations,
    currentConversationId,
    createNewConversation,
    updateCurrentConversation,
    loadConversation,
    deleteConversation,
    clearAllHistory,
    getCurrentConversation
  };
}