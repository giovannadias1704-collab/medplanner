import { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ProgressChart from '../components/ProgressChart';
import InsightCard from '../components/InsightCard';
import { calculateStudyStats } from '../utils/statsCalculator';
import { 
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  SparklesIcon,
  PlusIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function Study() {
  const {
    studyConfig,
    studySchedule,
    studyReviews,
    studyQuestions,
    events,
    pblObjectives,
    pblCases,
    updateStudyConfig,
    generateStudySchedule,
    toggleStudyScheduleItem,
    toggleReviewComplete,
    addStudyQuestion,
    answerStudyQuestion,
    getTodayReviews,
    getUpcomingExams,
    addEvent
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('cronograma');
  const [showOnboarding, setShowOnboarding] = useState(!studyConfig.configured);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  // ========== NOVO: CALCULAR ESTATÍSTICAS ==========
  const studyStats = useMemo(() => 
    calculateStudyStats(studySchedule, studyReviews, events),
    [studySchedule, studyReviews, events]
  );

  // Onboarding form
  const [onboardingData, setOnboardingData] = useState({
    hoursPerDay: 4,
    subjectsPerDay: 3,
    preferredTime: 'morning',
    sessionType: 'pomodoro'
  });

  // Exam form
  const [newExam, setNewExam] = useState({
    title: '',
    date: '',
    topics: []
  });

  // Topics management
  const [manualTopic, setManualTopic] = useState('');
  const [selectedPBLCase, setSelectedPBLCase] = useState('');

  // New question form
  const [newQuestion, setNewQuestion] = useState({
    topic: '',
    question: '',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: ''
  });

  const todayReviews = getTodayReviews();
  const upcomingExams = getUpcomingExams();

  const todaySchedule = studySchedule.filter(item => 
    item.date === new Date().toISOString().split('T')[0]
  );

  const handleOnboardingComplete = async () => {
    try {
      await updateStudyConfig(onboardingData);
      setShowOnboarding(false);
      alert('Configuração salva! Agora você pode cadastrar provas e gerar cronogramas. ✅');
    } catch (error) {
      alert('Erro ao salvar configuração');
    }
  };

  const handleAddManualTopic = () => {
    if (manualTopic.trim()) {
      setNewExam(prev => ({
        ...prev,
        topics: [...prev.topics, manualTopic.trim()]
      }));
      setManualTopic('');
    }
  };

  const handleImportFromPBL = () => {
    if (!selectedPBLCase) {
      alert('Selecione um caso PBL primeiro!');
      return;
    }

    const caseObjectives = pblObjectives.filter(obj => obj.casoId === selectedPBLCase);
    const topicsFromPBL = caseObjectives.map(obj => obj.text);

    setNewExam(prev => ({
      ...prev,
      topics: [...new Set([...prev.topics, ...topicsFromPBL])]
    }));

    alert(`${topicsFromPBL.length} objetivos importados do PBL! ✅`);
  };

  const handleRemoveTopic = (index) => {
    setNewExam(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    
    if (newExam.topics.length === 0) {
      alert('Adicione pelo menos um tópico para a prova!');
      return;
    }

    try {
      await addEvent({
        title: newExam.title,
        date: newExam.date,
        type: 'exam',
        topics: newExam.topics,
        completed: false
      });

      setNewExam({ title: '', date: '', topics: [] });
      setShowExamModal(false);
      alert('Prova cadastrada com sucesso! 🎉 Agora gere o cronograma!');
    } catch (error) {
      alert('Erro ao cadastrar prova');
    }
  };

  const handleGenerateSchedule = async () => {
    if (upcomingExams.length === 0) {
      alert('Você precisa cadastrar pelo menos uma prova primeiro!');
      setShowExamModal(true);
      return;
    }

    try {
      setGeneratingSchedule(true);
      await generateStudySchedule();
      alert('Cronograma gerado com sucesso! 🎉');
    } catch (error) {
      alert('Erro ao gerar cronograma: ' + error.message);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await addStudyQuestion({
        ...newQuestion,
        attempts: 0,
        correct: 0
      });
      setNewQuestion({
        topic: '',
        question: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: ''
      });
      setShowQuestionModal(false);
      alert('Questão adicionada com sucesso! ✅');
    } catch (error) {
      alert('Erro ao adicionar questão');
    }
  };

  // Onboarding Modal
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AcademicCapIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Bem-vindo aos Estudos! 📚
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Vamos configurar seu perfil de estudos para criar cronogramas personalizados
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-primary-600" />
                Quantas horas você pode estudar por dia?
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={onboardingData.hoursPerDay}
                onChange={(e) => setOnboardingData({ ...onboardingData, hoursPerDay: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all text-center text-2xl font-bold"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                💡 Recomendado: 3-6 horas
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-primary-600" />
                Quantos assuntos diferentes por dia?
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={onboardingData.subjectsPerDay}
                onChange={(e) => setOnboardingData({ ...onboardingData, subjectsPerDay: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all text-center text-2xl font-bold"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                💡 Recomendado: 2-4 assuntos
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary-600" />
                Melhor horário para estudar
              </label>
              <select
                value={onboardingData.preferredTime}
                onChange={(e) => setOnboardingData({ ...onboardingData, preferredTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
              >
                <option value="morning">🌅 Manhã (6h - 12h)</option>
                <option value="afternoon">☀️ Tarde (12h - 18h)</option>
                <option value="evening">🌙 Noite (18h - 23h)</option>
                <option value="flexible">🔄 Flexível</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-primary-600" />
                Método de estudo
              </label>
              <select
                value={onboardingData.sessionType}
                onChange={(e) => setOnboardingData({ ...onboardingData, sessionType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
              >
                <option value="pomodoro">🍅 Pomodoro (25min + 5min pausa)</option>
                <option value="standard">⏱️ Sessões de 1 hora</option>
                <option value="flexible">🎯 Livre</option>
              </select>
            </div>

            <button
              onClick={handleOnboardingComplete}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold text-lg shadow-xl hover-lift"
            >
              Começar a Estudar! 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Estudos"
        subtitle="Organize suas matérias e revisões"
        emoji="📚"
        imageQuery="study,library,books,education"
      />

      {/* ========== NOVO: ESTATÍSTICAS DE ESTUDOS ========== */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in">
          <StatsCard
            title="Horas (7 dias)"
            value={studyStats.totalHours}
            subtitle="Horas estudadas"
            icon="⏱️"
            color="blue"
          />
          
          <StatsCard
            title="Conclusão"
            value={`${studyStats.completionRate}%`}
            subtitle={`${studyStats.completedStudies}/${studyStats.totalScheduled} itens`}
            icon="✅"
            color="green"
            trend={
              studyStats.completionRate >= 80 
                ? { direction: 'up', value: 'Ótimo!' }
                : { direction: 'down', value: 'Melhorar' }
            }
          />
          
          <StatsCard
            title="Próxima Prova"
            value={studyStats.daysUntilExam ? `${studyStats.daysUntilExam}d` : '-'}
            subtitle={studyStats.nextExam}
            icon="🎯"
            color={studyStats.daysUntilExam && studyStats.daysUntilExam <= 7 ? 'red' : 'orange'}
          />
          
          <StatsCard
            title="Revisões"
            value={studyStats.pendingReviews}
            subtitle="Pendentes"
            icon="🔄"
            color="purple"
          />
        </section>

        {/* ========== NOVO: GRÁFICO DE PROGRESSO ========== */}
        {studyStats.totalScheduled > 0 && (
          <section className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <ProgressChart
              title="📊 Progresso Semanal de Estudos"
              color="blue"
              data={[
                { 
                  label: 'Itens Concluídos', 
                  value: studyStats.completedStudies, 
                  unit: `de ${studyStats.totalScheduled}` 
                },
                { 
                  label: 'Taxa de Conclusão', 
                  value: parseInt(studyStats.completionRate), 
                  unit: '%' 
                },
                { 
                  label: 'Horas Estudadas', 
                  value: studyStats.totalHours, 
                  unit: 'horas' 
                }
              ]}
            />
          </section>
        )}

        {/* ========== NOVO: INSIGHTS AUTOMÁTICOS ========== */}
        {studyStats.insights && studyStats.insights.length > 0 && (
          <section className="mb-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <InsightCard 
              title="💡 Insights de Estudos"
              insights={studyStats.insights}
            />
          </section>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {[
              { id: 'cronograma', label: 'Cronograma', icon: CalendarIcon, emoji: '📅' },
              { id: 'revisao', label: 'Revisão', icon: BookOpenIcon, emoji: '🔄' },
              { id: 'questoes', label: 'Questões', icon: QuestionMarkCircleIcon, emoji: '❓' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
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
        {/* Tab: Cronograma */}
        {activeTab === 'cronograma' && (
          <div className="space-y-6">
            {/* Ações */}
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <button
                onClick={() => setShowExamModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg hover-lift"
              >
                <PlusIcon className="h-5 w-5" />
                Cadastrar Prova
              </button>
              <button
                onClick={handleGenerateSchedule}
                disabled={generatingSchedule || upcomingExams.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold shadow-lg hover-lift disabled:opacity-50"
              >
                <SparklesIcon className="h-5 w-5" />
                {generatingSchedule ? 'Gerando...' : 'Gerar Cronograma'}
              </button>
            </div>

            {/* Próximas Provas */}
            {upcomingExams.length > 0 && (
              <section className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Próximas Provas
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fique atento aos prazos
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {upcomingExams.map((exam, index) => {
                    const daysUntil = Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div
                        key={exam.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover-lift animate-slide-in"
                        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {exam.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              📅 {new Date(exam.date).toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                          </div>
                          <div className={`text-right ${daysUntil <= 3 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            <span className="text-3xl font-bold">{daysUntil}</span>
                            <p className="text-xs font-semibold">dias</p>
                          </div>
                        </div>
                        {exam.topics && exam.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {exam.topics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-medium"
                              >
                                📚 {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Cronograma de Hoje */}
            {todaySchedule.length > 0 && (
              <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Estudos de Hoje
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {todaySchedule.length} tópico(s) para estudar
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {todaySchedule.map((item, index) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-5 shadow-lg border-2 hover-lift animate-slide-in ${
                        item.completed
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                          : item.isReview
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.isReview && (
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full font-bold shadow-sm">
                                🔥 REVISÃO FINAL
                              </span>
                            )}
                          </div>
                          <h3 className={`font-bold text-xl ${item.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {item.topic}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            📖 {item.examTitle} • {new Date(item.examDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 font-medium">
                            ⏱️ {item.hours}h de estudo
                          </p>
                        </div>
                        <button
                          onClick={() => toggleStudyScheduleItem(item.id, item.completed)}
                          className={`flex-shrink-0 transition-all hover-scale ${
                            item.completed
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-600 hover:text-primary-600'
                          }`}
                        >
                          <CheckCircleIcon className="h-10 w-10" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Próximas Semanas */}
            {studySchedule.length > 0 && (
              <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Próximas Semanas
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Planejamento futuro
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {studySchedule
                    .filter(item => new Date(item.date) > new Date())
                    .slice(0, 10)
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-between hover-lift animate-slide-in"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-xl">📖</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {item.topic}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-500 font-bold">
                          {item.hours}h
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {studySchedule.length === 0 && upcomingExams.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Nenhuma Prova Cadastrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Cadastre suas provas para gerar um cronograma de estudos personalizado!
                </p>
                <button
                  onClick={() => setShowExamModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-bold shadow-xl hover-lift"
                >
                  Cadastrar Primeira Prova
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Revisão */}
        {activeTab === 'revisao' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sistema de Revisão Espaçada
                </h2>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                📊 Baseado na <strong>Curva de Esquecimento de Ebbinghaus</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revisões automáticas: <strong>1 dia</strong>, <strong>3 dias</strong>, <strong>7 dias</strong>, <strong>15 dias</strong> e <strong>30 dias</strong> após estudar
              </p>
            </div>

            <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Revisões de Hoje
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {todayReviews.length} revisão(ões) pendente(s)
                  </p>
                </div>
              </div>

              {todayReviews.length === 0 ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-10 text-center border-2 border-green-200 dark:border-green-800 shadow-lg">
                  <div className="text-7xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Tudo em Dia!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sem revisões pendentes para hoje!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayReviews.map((review, index) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border-2 border-purple-200 dark:border-purple-800 hover-lift animate-slide-in"
                      style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🔄</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {review.topic}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              📖 {review.examTitle}
                            </p>
                            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 font-medium">
                              ⏱️ Estudado há {review.interval} dias
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleReviewComplete(review.id, review.completed)}
                          className="text-purple-600 dark:text-purple-400 hover-scale"
                        >
                          <CheckCircleIcon className="h-10 w-10" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {studyReviews.length > 0 && (
              <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Próximas Revisões
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Planejamento futuro
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {studyReviews
                    .filter(review => !review.completed && new Date(review.reviewDate) > new Date())
                    .sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate))
                    .slice(0, 10)
                    .map((review, index) => (
                      <div
                        key={review.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-between hover-lift animate-slide-in"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-xl">📖</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {review.topic}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(review.reviewDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1.5 rounded-full font-bold">
                          {review.interval}d
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tab: Questões */}
        {activeTab === 'questoes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Banco de Questões
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pratique seus conhecimentos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuestionModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover-lift font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Nova Questão
              </button>
            </div>

            {studyQuestions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-7xl mb-4">❓</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhuma Questão Cadastrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Crie questões para testar seus conhecimentos!
                </p>
                <button
                  onClick={() => setShowQuestionModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg"
                >
                  Adicionar Primeira Questão
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {studyQuestions.map((question, index) => {
                  const successRate = question.attempts > 0 
                    ? ((question.correct / question.attempts) * 100).toFixed(0)
                    : 0;
                  
                  return (
                    <div
                      key={question.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover-lift animate-slide-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-bold">
                            📚 {question.topic}
                          </span>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-3">
                            {question.question}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              idx === question.correctOption
                                ? 'border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {idx === question.correctOption && (
                                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                              )}
                              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                <strong>{String.fromCharCode(65 + idx)})</strong> {option}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {question.attempts > 0 && (
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <ChartBarIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {question.attempts} tentativa(s)
                            </span>
                          </div>
                          <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                            successRate >= 70 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            ✓ {successRate}% de acerto
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
      </div>

      {/* Modal Cadastrar Prova */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-2xl w-full my-8 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <PlusIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Cadastrar Nova Prova
              </h3>
              <button 
                onClick={() => setShowExamModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Prova
                </label>
                <input
                  type="text"
                  required
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Prova de Anatomia"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Data da Prova
                </label>
                <input
                  type="date"
                  required
                  value={newExam.date}
                  onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              {/* Tópicos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Tópicos da Prova
                </label>

                {/* Opção 1: Importar do PBL */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-3 border-2 border-purple-200 dark:border-purple-800">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ArrowDownTrayIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Importar do PBL
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedPBLCase}
                      onChange={(e) => setSelectedPBLCase(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white font-medium"
                    >
                      <option value="">Selecione um caso PBL</option>
                      {pblCases.map(caso => (
                        <option key={caso.id} value={caso.id}>
                          🩺 {caso.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleImportFromPBL}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 whitespace-nowrap font-bold shadow-lg"
                    >
                      Importar
                    </button>
                  </div>
                </div>

                {/* Opção 2: Adicionar Manualmente */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4 mb-3 border-2 border-green-200 dark:border-green-800">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <PencilIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Adicionar Manualmente
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualTopic}
                      onChange={(e) => setManualTopic(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualTopic())}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Anatomia Cardíaca"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualTopic}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 whitespace-nowrap font-bold shadow-lg flex items-center gap-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Lista de Tópicos Adicionados */}
                {newExam.topics.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      📚 Tópicos Adicionados ({newExam.topics.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {newExam.topics.map((topic, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {topic}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTopic(index)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
                  Cadastrar Prova
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Questão */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-2xl w-full my-8 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <QuestionMarkCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Nova Questão
              </h3>
              <button 
                onClick={() => setShowQuestionModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tópico/Matéria
                </label>
                <input
                  type="text"
                  required
                  value={newQuestion.topic}
                  onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Ex: Anatomia Cardíaca"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Pergunta
                </label>
                <textarea
                  required
                  rows="3"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Digite a pergunta..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Alternativas
                </label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 mb-3">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={newQuestion.correctOption === index}
                      onChange={() => setNewQuestion({ ...newQuestion, correctOption: index })}
                      className="h-5 w-5 text-primary-600"
                    />
                    <input
                      type="text"
                      required
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  Marque a alternativa correta
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Explicação (Opcional)
                </label>
                <textarea
                  rows="2"
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Explique por que essa é a resposta correta..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
                  Adicionar Questão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}