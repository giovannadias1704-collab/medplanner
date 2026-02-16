import { useState, useContext } from 'react';
import { parseUserInput } from '../services/aiParser';
import { AppContext } from '../context/AppContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function QuickCaptureBar() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const { addEvent, addTask, addBill } = useContext(AppContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    
    try {
      const result = await parseUserInput(input);
      
      if (result.success) {
        const { data } = result;
        
        // Se confiança baixa ou requer confirmação, mostra preview
        if (data.requireUserConfirmation || data.confidence < 0.75) {
          setPreview(data);
        } else {
          // Salva automaticamente
          await saveItem(data.payload);
          setInput('');
          setPreview(null);
        }
      }
    } catch (error) {
      console.error('Erro ao processar:', error);
      alert('Erro ao processar sua mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (payload) => {
    switch (payload.type) {
      case 'event':
      case 'exam':
        await addEvent(payload);
        break;
      case 'task':
        await addTask(payload);
        break;
      case 'bill':
        await addBill(payload);
        break;
      default:
        await addEvent(payload);
    }
  };

  const handleConfirm = async () => {
    if (preview) {
      await saveItem(preview.payload);
      setInput('');
      setPreview(null);
    }
  };

  const handleCancel = () => {
    setPreview(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite como você fala... ex: tenho prova dia 20"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Preview de Confirmação */}
      {preview && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Entendi assim:
          </p>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200 mb-3">
            <p><strong>Tipo:</strong> {preview.payload.type}</p>
            <p><strong>Título:</strong> {preview.payload.title}</p>
            {preview.payload.date && <p><strong>Data:</strong> {preview.payload.date}</p>}
            {preview.payload.startTime && <p><strong>Horário:</strong> {preview.payload.startTime}</p>}
            {preview.payload.amount && <p><strong>Valor:</strong> R$ {preview.payload.amount}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              ✓ Salvar
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
            >
              ✗ Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}