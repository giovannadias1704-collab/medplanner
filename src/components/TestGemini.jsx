import { useState } from 'react';

export default function TestGemini() {
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);

  const testar = async () => {
    setLoading(true);
    setResultado('⏳ Testando...');
    
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!API_KEY) {
      setResultado('❌ API Key não encontrada no .env');
      setLoading(false);
      return;
    }

    try {
      // Listar modelos disponíveis
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData, null, 2));
      }

      const data = await response.json();
      
      // Filtrar modelos que suportam generateContent
      const modelosGerar = data.models.filter(m => 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent')
      );

      if (modelosGerar.length === 0) {
        setResultado('⚠️ API Key válida, mas sem acesso a modelos de geração!');
        setLoading(false);
        return;
      }

      let resultado = '✅ API KEY FUNCIONA!\n\n';
      resultado += '📋 MODELOS DISPONÍVEIS:\n\n';
      
      modelosGerar.forEach(m => {
        const nomeModelo = m.name.split('/')[1];
        resultado += `🎯 ${nomeModelo}\n`;
      });
      
      resultado += `\n👉 USE ESTE MODELO: ${modelosGerar[0].name.split('/')[1]}`;
      
      setResultado(resultado);
      console.log('Modelos completos:', modelosGerar);
      
    } catch (error) {
      setResultado(`❌ ERRO:\n${error.message}`);
      console.error('Erro completo:', error);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🧪 Teste Gemini API
        </h2>
        
        <button
          onClick={testar}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Testando...' : '🚀 Testar API'}
        </button>

        {resultado && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
              {resultado}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}