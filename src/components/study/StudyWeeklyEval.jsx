import { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { SparklesIcon, ClipboardDocumentCheckIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { generateText } from '../../services/gemini';

export default function StudyWeeklyEval({ studyConfig }) {
  const { 
    weeklyEvaluations = [], 
    addWeeklyEvaluation,
    updateStudyConfig
  } = useContext(AppContext);

  const [showEvalForm, setShowEvalForm] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  
  const [evaluation, setEvaluation] = useState({
    weekStart: '',
    weekEnd: '',
    disruptions: '',
    whatWorked: '',
    masteredTopics: '',
    needsReinforcement: '',
    preparedForExam: 'sim',
    adjustmentsNeeded: '',
    createdAt: new Date().toISOString()
  });

  const sortedEvaluations = useMemo(() => {
    try {
      if (!Array.isArray(weeklyEvaluations)) return [];
      return [...weeklyEvaluations].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.weekEnd || 0);
        const dateB = new Date(b.createdAt || b.weekEnd || 0);
        return dateB - dateA;
      });
    } catch {
      return [];
    }
  }, [weeklyEvaluations]);

  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if ((dayOfWeek === 0 || dayOfWeek === 1) && sortedEvaluations.length === 0) {
      const thisWeekEval = sortedEvaluations.find(e => {
        const evalDate = new Date(e.createdAt);
        const weekDiff = Math.floor((today - evalDate) / (7 * 24 * 60 * 60 * 1000));
        return weekDiff === 0;
      });
      
      if (!thisWeekEval) {
        setShowEvalForm(true);
      }
    }
  }, [sortedEvaluations]);

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    
    try {
      await addWeeklyEvaluation(evaluation);
      await generateSuggestions(evaluation);
      
      setEvaluation({
        weekStart: '',
        weekEnd: '',
        disruptions: '',
        whatWorked: '',
        masteredTopics: '',
        needsReinforcement: '',
        preparedForExam: 'sim',
        adjustmentsNeeded: '',
        createdAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar avaliação. Tente novamente.');
    }
  };

  const generateSuggestions = async (evalData) => {
    setLoadingSuggestions(true);
    
    try {
      const prompt = 'Você é um especialista em planejamento de estudos para medicina. Retorne APENAS um JSON válido com: {"summary":"texto","strengths":["ponto1"],"weaknesses":["ponto1"],"recommendations":[{"type":"schedule","action":"texto"}],"scheduleAdjustments":{"increaseTime":[],"decreaseTime":[],"addBreaks":false,"adjustSessionDuration":null}}';

      const result = await generateText(prompt);
      let cleanResult = result.trim();
      
      const startMarker = cleanResult.indexOf('{');
      const endMarker = cleanResult.lastIndexOf('}');
      if (startMarker !== -1 && endMarker !== -1) {
        cleanResult = cleanResult.substring(startMarker, endMarker + 1);
      }
      
      const data = JSON.parse(cleanResult);
      setSuggestions(data);
      
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      setSuggestions(null);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleApplySuggestions = async () => {
    if (!suggestions?.scheduleAdjustments) {
      alert('Nenhuma sugestão de ajuste disponível.');
      return;
    }

    try {
      const adjustments = suggestions.scheduleAdjustments;
      const newPriorities = { ...studyConfig.priorities };

      adjustments.increaseTime?.forEach(subject => {
        if (newPriorities[subject]) {
          newPriorities[subject].priority = 'alta';
        }
      });

      adjustments.decreaseTime?.forEach(subject => {
        if (newPriorities[subject]) {
          newPriorities[subject].priority = 'baixa';
        }
      });

      const newSessionDuration = adjustments.adjustSessionDuration || studyConfig.sessionDuration;

      await updateStudyConfig({
        ...studyConfig,
        priorities: newPriorities,
        sessionDuration: newSessionDuration
      });

      alert('✅ Ajustes aplicados com sucesso!');
      setShowEvalForm(false);
      setSuggestions(null);
      
    } catch (error) {
      console.error('Erro ao aplicar sugestões:', error);
      alert('Erro ao aplicar ajustes. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Avaliação Semanal</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Acompanhe sua evolução e ajuste seu plano</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowEvalForm(!showEvalForm)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all"
        >
          <ClipboardDocumentCheckIcon className="h-5 w-5" />
          Nova Avaliação
        </button>
      </div>

      {showEvalForm && sortedEvaluations.length === 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-300 dark:border-yellow-700">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⏰</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-2">Hora da Avaliação Semanal!</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-400">Reserve alguns minutos para refletir sobre sua semana de estudos.</p>
            </div>
          </div>
        </div>
      )}

      {showEvalForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📝 Responda as Perguntas Abaixo</h3>
          
          <form onSubmit={handleSubmitEvaluation} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Início da Semana</label>
                <input type="date" required value={evaluation.weekStart} onChange={(e) => setEvaluation({ ...evaluation, weekStart: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fim da Semana</label>
                <input type="date" required value={evaluation.weekEnd} onChange={(e) => setEvaluation({ ...evaluation, weekEnd: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🚧 Quais imprevistos afetaram seu plano?</label>
              <textarea required rows="3" value={evaluation.disruptions} onChange={(e) => setEvaluation({ ...evaluation, disruptions: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Compromissos inesperados..." />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">✅ O que funcionou bem na sua rotina?</label>
              <textarea required rows="3" value={evaluation.whatWorked} onChange={(e) => setEvaluation({ ...evaluation, whatWorked: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Sessões de manhã..." />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🎯 Quais assuntos você já está dominando?</label>
              <textarea required rows="2" value={evaluation.masteredTopics} onChange={(e) => setEvaluation({ ...evaluation, masteredTopics: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Sistema cardiovascular..." />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📚 Quais você ainda precisa reforçar?</label>
              <textarea required rows="2" value={evaluation.needsReinforcement} onChange={(e) => setEvaluation({ ...evaluation, needsReinforcement: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Fisiologia renal..." />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🎓 Seu plano está te preparando para a prova?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="preparedForExam" value="sim" checked={evaluation.preparedForExam === 'sim'} onChange={(e) => setEvaluation({ ...evaluation, preparedForExam: e.target.value })} className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">✅ Sim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="preparedForExam" value="parcialmente" checked={evaluation.preparedForExam === 'parcialmente'} onChange={(e) => setEvaluation({ ...evaluation, preparedForExam: e.target.value })} className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">⚠️ Parcialmente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="preparedForExam" value="nao" checked={evaluation.preparedForExam === 'nao'} onChange={(e) => setEvaluation({ ...evaluation, preparedForExam: e.target.value })} className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">❌ Não</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🔧 O que pode ou precisa ser ajustado?</label>
              <textarea required rows="3" value={evaluation.adjustmentsNeeded} onChange={(e) => setEvaluation({ ...evaluation, adjustmentsNeeded: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Ex: Aumentar tempo de fisiologia..." />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowEvalForm(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">Cancelar</button>
              <button type="submit" disabled={loadingSuggestions} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loadingSuggestions ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Analisando...</> : <><SparklesIcon className="h-5 w-5" />Enviar e Analisar</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {suggestions && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border-2 border-purple-300 dark:border-purple-700 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <LightBulbIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-300">✨ Análise e Sugestões</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">Baseado na sua avaliação semanal</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">📊 Resumo da Situação</h4>
            <p className="text-gray-700 dark:text-gray-300">{suggestions.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="font-bold text-green-900 dark:text-green-300 mb-3">💪 Pontos Fortes</h4>
              <ul className="space-y-2">
                {suggestions.strengths?.map((s, i) => <li key={i} className="text-sm text-green-800 dark:text-green-400 flex items-start gap-2"><span>✓</span><span>{s}</span></li>)}
              </ul>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 mb-3">📈 Pontos a Melhorar</h4>
              <ul className="space-y-2">
                {suggestions.weaknesses?.map((w, i) => <li key={i} className="text-sm text-orange-800 dark:text-orange-400 flex items-start gap-2"><span>→</span><span>{w}</span></li>)}
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-4">💡 Recomendações</h4>
            <div className="space-y-3">
              {suggestions.recommendations?.map((rec, i) => {
                const icon = rec.type === 'schedule' ? '📅' : rec.type === 'study' ? '📚' : '🎯';
                return <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl flex items-start gap-3"><span className="text-2xl">{icon}</span><p className="flex-1 text-gray-900 dark:text-white">{rec.action}</p></div>;
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setSuggestions(null)} className="flex-1 px-6 py-3 border-2 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 font-semibold">Fechar</button>
            <button onClick={handleApplySuggestions} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg">✓ Aceitar Sugestões</button>
          </div>
        </div>
      )}

      {!showEvalForm && !suggestions && sortedEvaluations.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📚 Histórico de Avaliações</h3>
          <div className="space-y-3">
            {sortedEvaluations.map((item, i) => item && (
              <div key={item.id || i} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Semana de {item.weekStart ? new Date(item.weekStart).toLocaleDateString('pt-BR') : 'N/A'} a {item.weekEnd ? new Date(item.weekEnd).toLocaleDateString('pt-BR') : 'N/A'}
                  </h4>
                  <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + (item.preparedForExam === 'sim' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : item.preparedForExam === 'parcialmente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')}>
                    {item.preparedForExam === 'sim' ? '✅ Preparado' : item.preparedForExam === 'parcialmente' ? '⚠️ Parcial' : '❌ Não Preparado'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">💪 Domina:</p>
                    <p className="text-gray-600 dark:text-gray-400">{item.masteredTopics || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">📚 Reforçar:</p>
                    <p className="text-gray-600 dark:text-gray-400">{item.needsReinforcement || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showEvalForm && !suggestions && sortedEvaluations.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg">
          <ClipboardDocumentCheckIcon className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma Avaliação Registrada</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Responda sua primeira avaliação semanal!</p>
          <button onClick={() => setShowEvalForm(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg">Começar Avaliação</button>
        </div>
      )}
    </div>
  );
}