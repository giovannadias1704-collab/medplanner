import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { PlusIcon, TrashIcon, XMarkIcon, BookOpenIcon, BeakerIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { generateText } from '../../services/gemini';

export default function StudyPBL({ studyConfig }) {
  const { 
    pblCases, 
    pblObjectives, 
    pblReadings,
    addPBLCase,
    updatePBLCase,
    deletePBLCase,
    addPBLObjective,
    togglePBLObjective,
    addPBLReading,
    deletePBLReading
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('modulos');
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  const [newTutorial, setNewTutorial] = useState({ 
    title: '', 
    number: 1, 
    module: '', 
    objectives: [] 
  });
  
  const [newObjective, setNewObjective] = useState({ 
    text: '', 
    tutorialId: '' 
  });
  const [newReference, setNewReference] = useState({ 
  title: '', 
  author: '', 
  type: 'artigo', 
  tutorialId: '',
  year: new Date().getFullYear()
});

const [recommendedReferences, setRecommendedReferences] = useState({});
  const handleAddTutorial = async (e) => {
    e.preventDefault();
    try {
      await addPBLCase(newTutorial);
      setNewTutorial({ title: '', number: 1, module: '', objectives: [] });
      setShowTutorialModal(false);
    } catch (error) {
      alert('Erro ao adicionar tutorial');
    }
  };

  const handleAddObjective = async (e) => {
    e.preventDefault();
    try {
      await addPBLObjective(newObjective);
      setNewObjective({ text: '', tutorialId: '' });
      setShowObjectiveModal(false);
    } catch (error) {
      alert('Erro ao adicionar objetivo');
    }
  };

  const handleAddReference = async (e) => {
    e.preventDefault();
    try {
      await addPBLReading(newReference);
      setNewReference({ title: '', author: '', type: 'artigo', tutorialId: '', year: new Date().getFullYear() });
      setShowReferenceModal(false);
    } catch (error) {
      alert('Erro ao adicionar referência');
    }
  };

  const getRecommendedReferences = async (tutorialId) => {
    setLoadingRecommendations(true);
    try {
      const tutorial = pblCases.find(c => c.id === tutorialId);
      const objectives = pblObjectives.filter(o => o.casoId === tutorialId);
      
      const prompt = 'Você é um especialista em medicina. Recomende 5 referências bibliográficas (artigos, livros, guidelines) para o seguinte tutorial PBL:\n\n' +
        'Título: ' + tutorial.title + '\n' +
        'Objetivos:\n' + objectives.map(o => '- ' + o.text).join('\n') + '\n\n' +
        'Retorne um JSON com: {"references": [{"title": "...", "author": "...", "year": 2024, "type": "artigo/livro/guideline", "reason": "Por que é relevante"}]}\n\n' +
        'Seja específico e use referências reais e atualizadas.';
      
      const result = await generateText(prompt);
      let cleanResult = result.trim();
      
      const startMarker = cleanResult.indexOf('{');
      const endMarker = cleanResult.lastIndexOf('}');
      if (startMarker !== -1 && endMarker !== -1) {
        cleanResult = cleanResult.substring(startMarker, endMarker + 1);
      }
      
      const data = JSON.parse(cleanResult);
      setRecommendedReferences({ ...recommendedReferences, [tutorialId]: data.references });
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      alert('Erro ao gerar recomendações. Tente novamente.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const readingEmojis = {
    'artigo': '📄',
    'livro': '📚',
    'guideline': '📋',
    'video': '🎥',
    'outro': '📎'
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg flex gap-2">
        <button
          onClick={() => setActiveTab('modulos')}
          className={'flex-1 px-4 py-3 rounded-xl font-semibold transition-all ' + 
            (activeTab === 'modulos' 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')
          }
        >
          🧪 Módulos e Tutoriais
        </button>
        <button
          onClick={() => setActiveTab('referencias')}
          className={'flex-1 px-4 py-3 rounded-xl font-semibold transition-all ' + 
            (activeTab === 'referencias' 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')
          }
        >
          📚 Referências
        </button>
      </div>

      {/* Módulos e Tutoriais */}
      {activeTab === 'modulos' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BeakerIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Módulos PBL</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organize seus tutoriais</p>
              </div>
            </div>
            <button 
              onClick={() => setShowTutorialModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              Novo Tutorial
            </button>
          </div>

          {pblCases.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg">
              <BeakerIcon className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhum Tutorial Cadastrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Adicione seu primeiro tutorial PBL!
              </p>
              <button
                onClick={() => setShowTutorialModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg"
              >
                Adicionar Primeiro Tutorial
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pblCases.map((tutorial) => {
                const tutorialObjectives = pblObjectives.filter(o => o.casoId === tutorial.id);
                return (
                  <div
                    key={tutorial.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
                          T{tutorial.sessao || tutorial.number}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                            {tutorial.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {tutorial.module && '📦 Módulo: ' + tutorial.module + ' • '}
                            Tutorial {tutorial.sessao || tutorial.number}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePBLCase(tutorial.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Objetivos do Tutorial */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          🎯 Objetivos de Aprendizagem ({tutorialObjectives.length})
                        </h4>
                        <button
                          onClick={() => {
                            setNewObjective({ ...newObjective, tutorialId: tutorial.id });
                            setShowObjectiveModal(true);
                          }}
                          className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 font-semibold"
                        >
                          + Adicionar Objetivo
                        </button>
                      </div>
                      
                      {tutorialObjectives.length > 0 ? (
                        <div className="space-y-2">
                          {tutorialObjectives.map((obj) => (
                            <div
                              key={obj.id}
                              className={'rounded-xl p-3 flex items-start gap-3 border-2 ' +
                                (obj.completed 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700')
                              }
                            >
                              <button
                                onClick={() => togglePBLObjective(obj.id, obj.completed)}
                                className="flex-shrink-0 mt-0.5"
                              >
                                <CheckCircleIcon 
                                  className={'h-6 w-6 ' + 
                                    (obj.completed 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-gray-400 dark:text-gray-600')
                                  } 
                                />
                              </button>
                              <p className={'flex-1 text-sm ' +
                                (obj.completed 
                                  ? 'line-through text-gray-500 dark:text-gray-500' 
                                  : 'text-gray-900 dark:text-white')
                              }>
                                {obj.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Nenhum objetivo cadastrado
                        </p>
                      )}
                    </div>

                    {/* Botão Recomendar Referências */}
                    <button
                      onClick={() => getRecommendedReferences(tutorial.id)}
                      disabled={loadingRecommendations || tutorialObjectives.length === 0}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingRecommendations ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Gerando recomendações...
                        </>
                      ) : (
                        <>
                          ✨ Recomendar Referências com IA
                        </>
                      )}
                    </button>

                    {/* Referências Recomendadas */}
                    {recommendedReferences[tutorial.id] && (
                      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                        <h5 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">
                          ✨ Referências Recomendadas:
                        </h5>
                        <div className="space-y-2">
                          {recommendedReferences[tutorial.id].map((ref, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {readingEmojis[ref.type] || '📄'} {ref.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {ref.author} ({ref.year})
                              </p>
                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">
                                💡 {ref.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Referências */}
      {activeTab === 'referencias' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Referências Bibliográficas</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organize suas fontes de estudo</p>
              </div>
            </div>
            <button 
              onClick={() => setShowReferenceModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              Nova Referência
            </button>
          </div>

          {pblReadings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg">
              <BookOpenIcon className="h-16 w-16 mx-auto text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhuma Referência Cadastrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Adicione suas referências bibliográficas!
              </p>
              <button
                onClick={() => setShowReferenceModal(true)}
                className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold shadow-lg"
              >
                Adicionar Primeira Referência
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pblReadings.map((ref) => {
                const tutorial = pblCases.find(c => c.id === ref.casoId);
                return (
                  <div
                    key={ref.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-2xl">
                          {readingEmojis[ref.type] || '📎'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                            {ref.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            ✍️ {ref.author} {ref.year && '• ' + ref.year}
                          </p>
                          {tutorial && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              📌 {tutorial.title}
                            </p>
                          )}
                          <span className="inline-block mt-2 text-xs px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full font-semibold">
                            {ref.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePBLReading(ref.id)}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Tutorial */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">🧪 Novo Tutorial</h3>
              <button onClick={() => setShowTutorialModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddTutorial} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título do Tutorial
                </label>
                <input
                  type="text"
                  required
                  value={newTutorial.title}
                  onChange={(e) => setNewTutorial({ ...newTutorial, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Dor Torácica Aguda"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Módulo
                </label>
                <input
                  type="text"
                  value={newTutorial.module}
                  onChange={(e) => setNewTutorial({ ...newTutorial, module: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Módulo 3 - Cardiologia"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Número do Tutorial
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTutorial.number}
                  onChange={(e) => setNewTutorial({ ...newTutorial, number: parseInt(e.target.value), sessao: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowTutorialModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Objetivo */}
      {showObjectiveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">🎯 Novo Objetivo</h3>
              <button onClick={() => setShowObjectiveModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddObjective} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Objetivo de Aprendizagem
                </label>
                <textarea
                  required
                  rows="4"
                  value={newObjective.text}
                  onChange={(e) => setNewObjective({ ...newObjective, text: e.target.value, casoId: newObjective.tutorialId })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Compreender a fisiopatologia do IAM"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowObjectiveModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Referência */}
      {showReferenceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">📚 Nova Referência</h3>
              <button onClick={() => setShowReferenceModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddReference} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tutorial
                </label>
                <select
                  required
                  value={newReference.tutorialId}
                  onChange={(e) => setNewReference({ ...newReference, tutorialId: e.target.value, casoId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione um tutorial</option>
                  {pblCases.map(tutorial => (
                    <option key={tutorial.id} value={tutorial.id}>
                      T{tutorial.sessao || tutorial.number} - {tutorial.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={newReference.title}
                  onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Harrison's Principles of Internal Medicine"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  required
                  value={newReference.author}
                  onChange={(e) => setNewReference({ ...newReference, author: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Kasper, D. L. et al."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={newReference.type}
                    onChange={(e) => setNewReference({ ...newReference, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="artigo">📄 Artigo</option>
                    <option value="livro">📚 Livro</option>
                    <option value="guideline">📋 Guideline</option>
                    <option value="video">🎥 Vídeo</option>
                    <option value="outro">📎 Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ano
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={newReference.year}
                    onChange={(e) => setNewReference({ ...newReference, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowReferenceModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 font-semibold shadow-lg">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}