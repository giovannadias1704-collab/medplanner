import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import AIChat from './AIChat';

export default function GlobalAIButton() {
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <>
      {/* Botão Flutuante de IA */}
      <button
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-50 animate-bounce-slow"
        title="Assistente IA"
        aria-label="Abrir Assistente IA"
      >
        <SparklesIcon className="h-8 w-8" />
      </button>

      {/* Modal do Chat IA */}
      <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
    </>
  );
}