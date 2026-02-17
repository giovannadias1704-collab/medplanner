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
        className="fixed bottom-24 right-6 md:bottom-6 md:right-6 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center z-40"
        title="Assistente IA"
        aria-label="Abrir Assistente IA"
        style={{ 
          animation: 'bounce-slow 3s ease-in-out infinite',
          marginBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <SparklesIcon className="h-7 w-7 md:h-8 md:w-8" />
      </button>

      {/* Modal do Chat IA */}
      {showAIChat && (
        <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
      )}
    </>
  );
}