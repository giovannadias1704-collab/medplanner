import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { PlusIcon, CheckCircleIcon, TrashIcon, XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function PBL() {
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

  const [activeTab, setActiveTab] = useState('casos');
  
  // Modals state
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);
  
  // Form states
  const [newCase, setNewCase] = useState({ title: '', sessao: 1, status: 'em-andamento' });
  const [newObjective, setNewObjective] = useState({ text: '', casoId: '' });
  const [newReading, setNewReading] = useState({ title: '', author: '', type: 'artigo', casoId: '' });

  // Handlers
  const handleAddCase = async (e) => {
    e.preventDefault();
    try {
      await addPBLCase(newCase);
      setNewCase({ title: '', sessao: 1, status: 'em-andamento' });
      setShowCaseModal(false);
    } catch (error) {
      alert('Erro ao adicionar caso');
    }
  };

  const handleAddObjective = async (e) => {
    e.preventDefault();
    try {
      await addPBLObjective(newObjective);
      setNewObjective({ text: '', casoId: '' });
      setShowObjectiveModal(false);
    } catch (error) {
      alert('Erro ao adicionar objetivo');
    }
  };

  const handleAddReading = async (e) => {
    e.preventDefault();
    try {
      await addPBLReading(newReading);
      setNewReading({ title: '', author: '', type: 'artigo', casoId: '' });
      setShowReadingModal(false);
    } catch (error) {
      alert('Erro ao adicionar leitura');
    }
  };

  const readingEmojis = {
    'artigo': '📄',
    'livro': '📚',
    'video': '🎥',
    'outro': '📎'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="PBL"
        subtitle="Problem-Based Learning"
        emoji="📚"
        imageQuery="medicine,medical,study,hospital"
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'casos', label: 'Casos', emoji: '🩺' },
              { id: 'objetivos', label: 'Objetivos', emoji: '🎯' },
              { id: 'leituras', label: 'Leituras', emoji: '📖' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 scale-105'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="text-lg">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Casos */}
        {activeTab === 'casos' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🩺</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Casos Ativos
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tutoria PBL
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCaseModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Novo Caso
              </button>
            </div>

            {pblCases.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">🩺</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum Caso Cadastrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Adicione seu primeiro caso PBL!
                </p>
                <button
                  onClick={() => setShowCaseModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Adicionar Primeiro Caso
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pblCases.map((caso, index) => (
                  <div
                    key={caso.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover-lift animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl">
                          🩺
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                            {caso.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            📅 Sessão {caso.sessao} • Tutoria PBL
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${
                            caso.status === 'concluido'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300'
                              : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300'
                          }`}
                        >
                          {caso.status === 'concluido' ? '✓ Concluído' : '⏳ Em andamento'}
                        </span>
                        <button
                          onClick={() => deletePBLCase(caso.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => updatePBLCase(caso.id, { 
                        status: caso.status === 'concluido' ? 'em-andamento' : 'concluido' 
                      })}
                      className="w-full px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 text-sm font-bold shadow-lg transition-all hover-lift"
                    >
                      {caso.status === 'concluido' ? '🔄 Reabrir Caso' : '✅ Marcar Concluído'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Objetivos */}
        {activeTab === 'objetivos' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Objetivos de Aprendizagem
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    O que você precisa estudar
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowObjectiveModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Novo Objetivo
              </button>
            </div>

            {pblObjectives.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum Objetivo Cadastrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Adicione seus objetivos de aprendizagem!
                </p>
                <button
                  onClick={() => setShowObjectiveModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Adicionar Primeiro Objetivo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {pblObjectives.map((objetivo, index) => (
                  <div
                    key={objetivo.id}
                    className={`rounded-2xl p-5 shadow-lg border-2 flex items-start gap-4 hover-lift animate-slide-in ${
                      objetivo.completed
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <button
                      onClick={() => togglePBLObjective(objetivo.id, objetivo.completed)}
                      className={`flex-shrink-0 mt-0.5 transition-all hover-scale ${
                        objetivo.completed 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      <CheckCircleIcon className="h-8 w-8" />
                    </button>
                    <div className="flex-1">
                      <p
                        className={`text-lg font-medium ${
                          objetivo.completed 
                            ? 'line-through text-gray-500 dark:text-gray-500' 
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {objetivo.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leituras */}
        {activeTab === 'leituras' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📖</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Material de Estudo
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Referências bibliográficas
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowReadingModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Adicionar Material
              </button>
            </div>

            {pblReadings.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum Material Cadastrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Adicione suas referências bibliográficas!
                </p>
                <button
                  onClick={() => setShowReadingModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Adicionar Primeiro Material
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pblReadings.map((reading, index) => (
                  <div
                    key={reading.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 hover-lift animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-2xl">
                          {readingEmojis[reading.type] || '📎'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                            {reading.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            ✍️ {reading.author}
                          </p>
                          <span className="inline-block mt-2 text-xs px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full font-semibold">
                            {reading.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePBLReading(reading.id)}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Novo Caso */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🩺</span>
                </div>
                Novo Caso PBL
              </h3>
              <button 
                onClick={() => setShowCaseModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddCase} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título do Caso
                </label>
                <input
                  type="text"
                  required
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Caso 1: Dor Torácica"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Sessão
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newCase.sessao}
                  onChange={(e) => setNewCase({ ...newCase, sessao: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Objetivo */}
      {showObjectiveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                Novo Objetivo
              </h3>
              <button 
                onClick={() => setShowObjectiveModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
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
                  onChange={(e) => setNewObjective({ ...newObjective, text: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Entender a fisiopatologia do IAM"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowObjectiveModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Leitura */}
      {showReadingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <BookOpenIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Novo Material de Estudo
              </h3>
              <button 
                onClick={() => setShowReadingModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddReading} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={newReading.title}
                  onChange={(e) => setNewReading({ ...newReading, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Anatomia do Coração"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  required
                  value={newReading.author}
                  onChange={(e) => setNewReading({ ...newReading, author: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Silva, J. et al."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={newReading.type}
                  onChange={(e) => setNewReading({ ...newReading, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="artigo">📄 Artigo</option>
                  <option value="livro">📚 Livro</option>
                  <option value="video">🎥 Vídeo</option>
                  <option value="outro">📎 Outro</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReadingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
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