import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { PlusIcon, TrashIcon, XMarkIcon, SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { generateText } from '../../services/gemini';

export default function StudyQuestions() {
  const { 
    studyQuestions, 
    addStudyQuestion, 
    deleteStudyQuestion 
  } = useContext(AppContext);

  const [showManualModal, setShowManualModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const [manualQuestion, setManualQuestion] = useState({
    subject: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  const [aiConfig, setAiConfig] = useState({
    subject: '',
    topic: '',
    quantity: 5,
    difficulty: 'media'
  });

  const [selectedSubject, setSelectedSubject] = useState('all');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizResults, setQuizResults] = useState([]);

  const handleAddManualQuestion = async (e) => {
    e.preventDefault();
    try {
      await addStudyQuestion({
        ...manualQuestion,
        type: 'manual',
        createdAt: new Date().toISOString()
      });
      setManualQuestion({
        subject: '',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      });
      setShowManualModal(false);
    } catch (error) {
      alert('Erro ao adicionar questão');
    }
  };

  const handleGenerateAIQuestions = async (e) => {
    e.preventDefault();
    setLoadingAI(true);
    
    try {
      const prompt = 'Você é um professor de medicina especializado em criar questões de múltipla escolha.\n\n' +
        'Crie ' + aiConfig.quantity + ' questões de múltipla escolha sobre:\n' +
        'Matéria: ' + aiConfig.subject + '\n' +
        'Tópico: ' + aiConfig.topic + '\n' +
        'Dificuldade: ' + aiConfig.difficulty + '\n\n' +
        'Retorne um JSON no formato:\n' +
        '{"questions": [{\n' +
        '  "question": "Texto da pergunta",\n' +
        '  "options": ["A) opção 1", "B) opção 2", "C) opção 3", "D) opção 4"],\n' +
        '  "correctAnswer": 0,\n' +
        '  "explanation": "Explicação detalhada da resposta correta"\n' +
        '}]}\n\n' +
        'Regras:\n' +
        '- Questões relevantes e educativas\n' +
        '- 4 alternativas por questão\n' +
        '- correctAnswer é o índice (0-3) da resposta correta\n' +
        '- Explicação clara e didática\n' +
        '- Dificuldade ' + aiConfig.difficulty + ': ' + 
        (aiConfig.difficulty === 'facil' ? 'conceitos básicos' : 
         aiConfig.difficulty === 'media' ? 'aplicação de conhecimento' : 
         'raciocínio clínico avançado') + '\n\n' +
        'Retorne APENAS o JSON.';

      const result = await generateText(prompt);
      let cleanResult = result.trim();
      
      const startMarker = cleanResult.indexOf('{');
      const endMarker = cleanResult.lastIndexOf('}');
      if (startMarker !== -1 && endMarker !== -1) {
        cleanResult = cleanResult.substring(startMarker, endMarker + 1);
      }
      
      const data = JSON.parse(cleanResult);
      
      // Adicionar questões ao banco
      for (const q of data.questions) {
        await addStudyQuestion({
          subject: aiConfig.subject,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          type: 'ai',
          difficulty: aiConfig.difficulty,
          createdAt: new Date().toISOString()
        });
      }
      
      setAiConfig({ subject: '', topic: '', quantity: 5, difficulty: 'media' });
      setShowAIModal(false);
      alert('✅ Questões geradas com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar questões:', error);
      alert('Erro ao gerar questões. Tente novamente.');
    } finally {
      setLoadingAI(false);
    }
  };

  const startQuiz = () => {
    const filtered = selectedSubject === 'all' 
      ? studyQuestions 
      : studyQuestions.filter(q => q.subject === selectedSubject);
    
    if (filtered.length === 0) {
      alert('Nenhuma questão disponível para este filtro.');
      return;
    }
    
    // Embaralhar questões
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizResults([]);
    setShowQuizModal(true);
  };

  const handleAnswerSelect = (index) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) {
      alert('Selecione uma alternativa!');
      return;
    }
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    setQuizResults([...quizResults, {
      question: currentQuestion.question,
      selected: selectedAnswer,
      correct: currentQuestion.correctAnswer,
      isCorrect
    }]);
    
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz finalizado
      const correctCount = quizResults.filter(r => r.isCorrect).length + (showResult && selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer ? 1 : 0);
      const total = quizQuestions.length;
      const percentage = Math.round((correctCount / total) * 100);
      
      alert('Quiz Finalizado!\n\n' +
        'Acertos: ' + correctCount + '/' + total + '\n' +
        'Desempenho: ' + percentage + '%\n\n' +
        (percentage >= 70 ? '🎉 Parabéns!' : '📚 Continue estudando!'));
      
      setShowQuizModal(false);
    }
  };

  const subjects = [...new Set(studyQuestions.map(q => q.subject))];

  const filteredQuestions = selectedSubject === 'all' 
    ? studyQuestions 
    : studyQuestions.filter(q => q.subject === selectedSubject);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">❓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banco de Questões</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {studyQuestions.length} questões cadastradas
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Manual
          </button>
          
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all"
          >
            <SparklesIcon className="h-5 w-5" />
            Gerar com IA
          </button>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📚 Filtrar por Matéria
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
            >
              <option value="all">Todas as matérias</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={startQuiz}
              disabled={filteredQuestions.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎯 Iniciar Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Questões */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg">
          <span className="text-6xl mb-4 block">❓</span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Nenhuma Questão Cadastrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Adicione questões manualmente ou gere com IA!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
                        {question.subject}
                      </span>
                      {question.difficulty && (
                        <span className={'px-3 py-1 rounded-full text-xs font-semibold ' +
                          (question.difficulty === 'facil' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : question.difficulty === 'media'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')
                        }>
                          {question.difficulty}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-semibold">
                        {question.type === 'manual' ? '✍️ Manual' : '✨ IA'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-3">
                      {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={'px-4 py-2 rounded-xl text-sm ' +
                            (optIndex === question.correctAnswer
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-semibold'
                              : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300')
                          }
                        >
                          {option}
                          {optIndex === question.correctAnswer && ' ✓'}
                        </div>
                      ))}
                    </div>
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-300">
                          <strong>💡 Explicação:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteStudyQuestion(question.id)}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Questão Manual */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">✍️ Nova Questão Manual</h3>
              <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddManualQuestion} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Matéria
                </label>
                <input
                  type="text"
                  required
                  value={manualQuestion.subject}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Anatomia"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Pergunta
                </label>
                <textarea
                  required
                  rows="3"
                  value={manualQuestion.question}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, question: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Digite a pergunta..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Alternativas
                </label>
                <div className="space-y-3">
                  {manualQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={manualQuestion.correctAnswer === index}
                        onChange={() => setManualQuestion({ ...manualQuestion, correctAnswer: index })}
                        className="w-5 h-5 text-green-600"
                      />
                      <input
                        type="text"
                        required
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...manualQuestion.options];
                          newOptions[index] = e.target.value;
                          setManualQuestion({ ...manualQuestion, options: newOptions });
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder={'Alternativa ' + String.fromCharCode(65 + index)}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ✓ Marque a alternativa correta
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Explicação (opcional)
                </label>
                <textarea
                  rows="3"
                  value={manualQuestion.explanation}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, explanation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Explique por que esta é a resposta correta..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowManualModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">
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

      {/* Modal Gerar com IA */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">✨ Gerar Questões com IA</h3>
              <button onClick={() => setShowAIModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleGenerateAIQuestions} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Matéria
                </label>
                <input
                  type="text"
                  required
                  value={aiConfig.subject}
                  onChange={(e) => setAiConfig({ ...aiConfig, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Fisiologia"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tópico
                </label>
                <input
                  type="text"
                  required
                  value={aiConfig.topic}
                  onChange={(e) => setAiConfig({ ...aiConfig, topic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Sistema Cardiovascular"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={aiConfig.quantity}
                    onChange={(e) => setAiConfig({ ...aiConfig, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Dificuldade
                  </label>
                  <select
                    value={aiConfig.difficulty}
                    onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="facil">Fácil</option>
                    <option value="media">Média</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAIModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">
                  Cancelar
                </button>
                <button type="submit" disabled={loadingAI} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {loadingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Gerando...
                    </>
                  ) : (
                    'Gerar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quiz */}
      {showQuizModal && quizQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Quiz Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Questão {currentQuestionIndex + 1} de {quizQuestions.length}
                </p>
              </div>
              <button onClick={() => setShowQuizModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: ((currentQuestionIndex + 1) / quizQuestions.length * 100) + '%' }}
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {quizQuestions[currentQuestionIndex].question}
              </p>
              
              <div className="space-y-3">
                {quizQuestions[currentQuestionIndex].options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === quizQuestions[currentQuestionIndex].correctAnswer;
                  
                  let bgClass = 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600';
                  
                  if (showResult) {
                    if (isCorrect) {
                      bgClass = 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600';
                    } else if (isSelected && !isCorrect) {
                      bgClass = 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600';
                    }
                  } else if (isSelected) {
                    bgClass = 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600';
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={'w-full px-5 py-4 rounded-xl border-2 text-left font-semibold transition-all ' + bgClass}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white">{option}</span>
                        {showResult && isCorrect && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
                        {showResult && isSelected && !isCorrect && <XCircleIcon className="h-6 w-6 text-red-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {showResult && quizQuestions[currentQuestionIndex].explanation && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>💡 Explicação:</strong> {quizQuestions[currentQuestionIndex].explanation}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {!showResult ? (
                <button
                  onClick={handleConfirmAnswer}
                  disabled={selectedAnswer === null}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Resposta
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg"
                >
                  {currentQuestionIndex < quizQuestions.length - 1 ? 'Próxima Questão →' : 'Finalizar Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}