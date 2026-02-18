import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { PlusIcon, TrashIcon, XMarkIcon, CheckCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function StudyReview({ studyConfig, isPBL }) {
  const { 
    studyReviews, 
    addStudyReview, 
    updateStudyReview,
    deleteStudyReview,
    pblCases
  } = useContext(AppContext);

  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  
  const [newReview, setNewReview] = useState({
    title: '',
    date: '',
    type: 'manual', // manual ou pbl
    topics: [],
    pblModules: [],
    notes: '',
    completed: false
  });

  const [newTopic, setNewTopic] = useState('');
  const [selectedPBLModule, setSelectedPBLModule] = useState('');

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      if (selectedReview) {
        await updateStudyReview(selectedReview.id, newReview);
      } else {
        await addStudyReview({
          ...newReview,
          createdAt: new Date().toISOString()
        });
      }
      
      setNewReview({
        title: '',
        date: '',
        type: 'manual',
        topics: [],
        pblModules: [],
        notes: '',
        completed: false
      });
      setSelectedReview(null);
      setShowModal(false);
    } catch (error) {
      alert('Erro ao salvar revisão');
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setNewReview({
        ...newReview,
        topics: [...newReview.topics, { text: newTopic.trim(), checked: false }]
      });
      setNewTopic('');
    }
  };

  const handleAddPBLModule = () => {
    if (selectedPBLModule) {
      const module = pblCases.find(c => c.id === selectedPBLModule);
      if (module && !newReview.pblModules.find(m => m.id === module.id)) {
        setNewReview({
          ...newReview,
          pblModules: [...newReview.pblModules, { id: module.id, title: module.title, checked: false }]
        });
      }
      setSelectedPBLModule('');
    }
  };

  const handleRemoveTopic = (index) => {
    setNewReview({
      ...newReview,
      topics: newReview.topics.filter((_, i) => i !== index)
    });
  };

  const handleRemovePBLModule = (id) => {
    setNewReview({
      ...newReview,
      pblModules: newReview.pblModules.filter(m => m.id !== id)
    });
  };

  const handleToggleTopic = async (reviewId, topicIndex) => {
    const review = studyReviews.find(r => r.id === reviewId);
    if (review) {
      const updatedTopics = [...review.topics];
      updatedTopics[topicIndex].checked = !updatedTopics[topicIndex].checked;
      await updateStudyReview(reviewId, { ...review, topics: updatedTopics });
    }
  };

  const handleTogglePBLModule = async (reviewId, moduleId) => {
    const review = studyReviews.find(r => r.id === reviewId);
    if (review) {
      const updatedModules = review.pblModules.map(m => 
        m.id === moduleId ? { ...m, checked: !m.checked } : m
      );
      await updateStudyReview(reviewId, { ...review, pblModules: updatedModules });
    }
  };

  const handleEditReview = (review) => {
    setSelectedReview(review);
    setNewReview(review);
    setShowModal(true);
  };

  const handleToggleCompleted = async (reviewId) => {
    const review = studyReviews.find(r => r.id === reviewId);
    if (review) {
      await updateStudyReview(reviewId, { ...review, completed: !review.completed });
    }
  };

  const upcomingReviews = studyReviews
    .filter(r => !r.completed && new Date(r.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastReviews = studyReviews
    .filter(r => r.completed || new Date(r.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpenIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Revisão de Prova</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {studyReviews.length} revisões cadastradas
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setSelectedReview(null);
            setNewReview({
              title: '',
              date: '',
              type: 'manual',
              topics: [],
              pblModules: [],
              notes: '',
              completed: false
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 font-semibold shadow-lg transition-all"
        >
          <PlusIcon className="h-5 w-5" />
          Nova Revisão
        </button>
      </div>

      {/* Revisões Próximas */}
      {upcomingReviews.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📅 Próximas Revisões
          </h3>
          <div className="space-y-4">
            {upcomingReviews.map((review) => {
              const allTopicsChecked = review.topics.every(t => t.checked);
              const allModulesChecked = review.pblModules?.every(m => m.checked) ?? true;
              const totalProgress = [...review.topics, ...(review.pblModules || [])].length;
              const checkedProgress = [...review.topics.filter(t => t.checked), ...(review.pblModules || []).filter(m => m.checked)].length;
              const progressPercent = totalProgress > 0 ? Math.round((checkedProgress / totalProgress) * 100) : 0;

              return (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                          {review.title}
                        </h4>
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-semibold">
                          {new Date(review.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Progresso
                          </span>
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full transition-all"
                            style={{ width: progressPercent + '%' }}
                          />
                        </div>
                      </div>

                      {/* Tópicos Manuais */}
                      {review.topics.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            📝 Tópicos para Revisar:
                          </p>
                          <div className="space-y-2">
                            {review.topics.map((topic, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              >
                                <button
                                  onClick={() => handleToggleTopic(review.id, index)}
                                  className="flex-shrink-0"
                                >
                                  <CheckCircleIcon 
                                    className={'h-6 w-6 ' + 
                                      (topic.checked 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-gray-400 dark:text-gray-600')
                                    } 
                                  />
                                </button>
                                <span className={'text-sm flex-1 ' +
                                  (topic.checked 
                                    ? 'line-through text-gray-500 dark:text-gray-500' 
                                    : 'text-gray-900 dark:text-white')
                                }>
                                  {topic.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Módulos PBL */}
                      {review.pblModules && review.pblModules.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            🧪 Módulos PBL:
                          </p>
                          <div className="space-y-2">
                            {review.pblModules.map((module) => (
                              <div
                                key={module.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              >
                                <button
                                  onClick={() => handleTogglePBLModule(review.id, module.id)}
                                  className="flex-shrink-0"
                                >
                                  <CheckCircleIcon 
                                    className={'h-6 w-6 ' + 
                                      (module.checked 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-gray-400 dark:text-gray-600')
                                    } 
                                  />
                                </button>
                                <span className={'text-sm flex-1 ' +
                                  (module.checked 
                                    ? 'line-through text-gray-500 dark:text-gray-500' 
                                    : 'text-gray-900 dark:text-white')
                                }>
                                  {module.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {review.notes && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <p className="text-sm text-blue-900 dark:text-blue-300">
                            💡 {review.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleCompleted(review.id)}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-all"
                        title="Marcar como concluída"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => deleteStudyReview(review.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revisões Passadas/Concluídas */}
      {pastReviews.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            ✅ Revisões Concluídas
          </h3>
          <div className="space-y-3">
            {pastReviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {review.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(review.date).toLocaleDateString('pt-BR')} • {review.topics.length + (review.pblModules?.length || 0)} itens
                    </p>
                  </div>
                  <button
                    onClick={() => deleteStudyReview(review.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem se não houver revisões */}
      {studyReviews.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg">
          <BookOpenIcon className="h-16 w-16 mx-auto text-orange-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Nenhuma Revisão Cadastrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Organize seus estudos para as próximas provas!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold shadow-lg"
          >
            Criar Primeira Revisão
          </button>
        </div>
      )}

      {/* Modal Nova/Editar Revisão */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedReview ? '✏️ Editar Revisão' : '📖 Nova Revisão'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título da Prova
                </label>
                <input
                  type="text"
                  required
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: P1 - Anatomia"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Data da Prova
                </label>
                <input
                  type="date"
                  required
                  value={newReview.date}
                  onChange={(e) => setNewReview({ ...newReview, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Tópicos Manuais */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📝 Tópicos para Revisar
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Digite um tópico"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
                
                {newReview.topics.length > 0 && (
                  <div className="space-y-2">
                    {newReview.topics.map((topic, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                      >
                        <span className="text-sm text-gray-900 dark:text-white">{topic.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(index)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Módulos PBL */}
              {isPBL && pblCases.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    🧪 Módulos PBL
                  </label>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={selectedPBLModule}
                      onChange={(e) => setSelectedPBLModule(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Selecione um módulo</option>
                      {pblCases.map(module => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddPBLModule}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                    >
                      Adicionar
                    </button>
                  </div>
                  
                  {newReview.pblModules && newReview.pblModules.length > 0 && (
                    <div className="space-y-2">
                      {newReview.pblModules.map((module) => (
                        <div
                          key={module.id}
                          className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                        >
                          <span className="text-sm text-gray-900 dark:text-white">{module.title}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePBLModule(module.id)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  rows="3"
                  value={newReview.notes}
                  onChange={(e) => setNewReview({ ...newReview, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Anotações sobre a prova..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 font-semibold shadow-lg"
                >
                  {selectedReview ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}