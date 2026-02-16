import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    // Informações básicas
    name: '',
    age: '',
    semester: '',
    university: '',
    teachingModel: '', // PBL, tradicional, híbrido
    city: '',
    livesAlone: '',
    
    // Rotina e estudos
    sleepTime: '23:00',
    wakeTime: '07:00',
    idealSleepHours: '',
    studyTime: '', // manhã, tarde, noite, flexível
    studyHoursPerDay: 4,
    studyTechniques: [],
    difficultySubjects: [],
    hasPartTimeJob: '',
    
    // Objetivos
    mainGoal: '', // passar no semestre, residência, concurso
    focusResidency: '',
    residencyArea: '',
    dreamSpecialty: '',
    examDate: '',
    
    // Saúde física
    exerciseFrequency: '',
    isAthlete: '',
    athleticName: '',
    workoutDays: [],
    workoutsPerWeek: 0,
    
    // Saúde mental e bem-estar
    stressLevel: '',
    hasAnxiety: '',
    selfCareRoutine: '',
    psychologicalSupport: '',
    hobbies: [],
    
    // Finanças
    monthlyBudget: '',
    budgetAmount: '',
    mainExpenses: [],
    hasScholarship: '',
    needsBudgetHelp: '',
    
    // Hidratação e nutrição
    waterGoal: 2,
    mealsPerDay: 3,
    cookOwnMeals: '',
    
    // Peso (opcional)
    trackWeight: false,
    currentWeight: '',
    weightGoal: '',
    
    // Preferências do app
    wantsNotifications: '',
    notificationTime: '',
    priorityFeature: '', // estudos, finanças, saúde, tudo
    theme: 'auto',
    aiMode: 'confirm'
  });

  const { completeOnboarding } = useOnboarding();
  const { addEvent } = useContext(AppContext);
  const navigate = useNavigate();

  const totalSteps = 15;

  const handleNext = () => {
    console.log('🔵 Próximo clicado! Step:', step, 'Dados:', data);
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    console.log('🔵 Voltar clicado! Step:', step);
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = async () => {
    console.log('🎉 Finalizando onboarding! Dados completos:', data);
    completeOnboarding(data);
    navigate('/dashboard');
  };

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, value) => {
    setData(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const canProceed = () => {
    switch(step) {
      case 1: return true;
      case 2: return data.name.trim() && data.age && data.semester;
      case 3: return data.teachingModel && data.city.trim() && data.livesAlone;
      case 4: return data.sleepTime && data.wakeTime && data.idealSleepHours;
      case 5: return data.studyTime && data.studyHoursPerDay;
      case 6: return data.mainGoal;
      case 7: return data.focusResidency;
      case 8: return data.exerciseFrequency;
      case 9: return data.stressLevel && data.hasAnxiety;
      case 10: return data.waterGoal && data.mealsPerDay;
      case 11: return true; // peso é opcional
      case 12: return data.monthlyBudget;
      case 13: return data.needsBudgetHelp;
      case 14: return data.wantsNotifications && data.priorityFeature;
      case 15: return data.theme && data.aiMode;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full pb-28">
        {/* Barra de progresso */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white/90">
              Etapa {step} de {totalSteps}
            </span>
            <span className="text-sm text-white/70">
              ~{Math.ceil((totalSteps - step + 1) * 0.8)} min restante{Math.ceil((totalSteps - step + 1) * 0.8) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 max-h-[500px] overflow-y-auto">
            
            {/* STEP 1: Boas-vindas */}
            {step === 1 && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                    <span className="text-5xl">⚕️</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Bem-vindo(a) ao MedPlanner!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                    Seu organizador pessoal para a vida de estudante de medicina
                  </p>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 text-left">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      📋 Vamos configurar:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Seu perfil e rotina acadêmica
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Objetivos de residência e especialização
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Saúde física e mental
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Gestão financeira inteligente
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Preferências personalizadas
                      </li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    ⏱️ Tempo estimado: ~12 minutos
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Informações básicas */}
            {step === 2 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">👤</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Informações Básicas
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Vamos começar te conhecendo melhor
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Como prefere ser chamado(a)? *
                    </label>
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => updateData('name', e.target.value)}
                      placeholder="Digite seu nome ou apelido"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Qual sua idade? *
                    </label>
                    <input
                      type="number"
                      min="16"
                      max="60"
                      value={data.age}
                      onChange={(e) => updateData('age', e.target.value)}
                      placeholder="Ex: 22"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Qual semestre/período está cursando? *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sem) => (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => updateData('semester', sem)}
                          className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                            data.semester === sem
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 scale-105'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {sem}º
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Qual sua faculdade/universidade? *
                    </label>
                    <input
                      type="text"
                      value={data.university}
                      onChange={(e) => updateData('university', e.target.value)}
                      placeholder="Ex: UFBA, USP, UESC..."
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Modelo de ensino e localização */}
            {step === 3 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🏫</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Sobre seu Curso
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Modelo de ensino e localização
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Qual o modelo de ensino da sua faculdade? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'pbl', label: 'PBL (Problem-Based Learning)', emoji: '🔍', desc: 'Aprendizagem baseada em problemas' },
                        { value: 'tradicional', label: 'Tradicional', emoji: '📚', desc: 'Aulas expositivas e práticas' },
                        { value: 'hibrido', label: 'Híbrido', emoji: '🔄', desc: 'Mistura de PBL e tradicional' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('teachingModel', option.value)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                            data.teachingModel === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-[1.02]'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{option.emoji}</span>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Em qual cidade você estuda? *
                    </label>
                    <input
                      type="text"
                      value={data.city}
                      onChange={(e) => updateData('city', e.target.value)}
                      placeholder="Ex: Salvador, São Paulo..."
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Você mora sozinho(a) ou com a família? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'sozinho', label: 'Sozinho(a)', emoji: '🏠' },
                        { value: 'familia', label: 'Com família', emoji: '👨‍👩‍👧‍👦' },
                        { value: 'republica', label: 'República/Colegas', emoji: '🏘️' },
                        { value: 'outro', label: 'Outro', emoji: '🏡' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('livesAlone', option.value)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            data.livesAlone === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{option.emoji}</span>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white text-center">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Rotina de sono */}
            {step === 4 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">😴</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Rotina de Sono
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sono de qualidade é essencial para estudantes de medicina
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Que horas você costuma dormir? *
                    </label>
                    <input
                      type="time"
                      value={data.sleepTime}
                      onChange={(e) => updateData('sleepTime', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Que horas você costuma acordar? *
                    </label>
                    <input
                      type="time"
                      value={data.wakeTime}
                      onChange={(e) => updateData('wakeTime', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Quantas horas de sono você considera ideal? *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['4-5h', '6h', '7h', '8h', '9h+', 'Varia muito'].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => updateData('idealSleepHours', hours)}
                          className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                            data.idealSleepHours === hours
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {hours}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 <strong>Dica:</strong> Estudantes de medicina precisam de 7-8h de sono para boa performance cognitiva e memória!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Rotina de estudos */}
            {step === 5 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">📚</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Rotina de Estudos
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Como você organiza seus estudos?
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Qual período você prefere estudar? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'manha', emoji: '🌅', label: 'Manhã', time: '6h-12h' },
                        { value: 'tarde', emoji: '☀️', label: 'Tarde', time: '12h-18h' },
                        { value: 'noite', emoji: '🌙', label: 'Noite', time: '18h-24h' },
                        { value: 'madrugada', emoji: '🌃', label: 'Madrugada', time: '0h-6h' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('studyTime', option.value)}
                          className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                            data.studyTime === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{option.time}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Quantas horas por dia você dedica aos estudos (fora das aulas)? *
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        value={data.studyHoursPerDay}
                        onChange={(e) => updateData('studyHoursPerDay', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 min-w-[60px]">
                        {data.studyHoursPerDay}h
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>0h</span>
                      <span>6h</span>
                      <span>12h</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Quais técnicas de estudo você usa? (pode marcar várias)
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'pomodoro', label: '🍅 Técnica Pomodoro' },
                        { value: 'flashcards', label: '🗂️ Flashcards/Anki' },
                        { value: 'mapas', label: '🗺️ Mapas Mentais' },
                        { value: 'resumos', label: '📝 Resumos escritos' },
                        { value: 'questoes', label: '❓ Bancos de questões' },
                        { value: 'grupos', label: '👥 Grupos de estudo' },
                        { value: 'videos', label: '🎥 Videoaulas' },
                        { value: 'nenhuma', label: '❌ Nenhuma específica' },
                      ].map((tech) => (
                        <button
                          key={tech.value}
                          type="button"
                          onClick={() => toggleArrayItem('studyTechniques', tech.value)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                            data.studyTechniques.includes(tech.value)
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {tech.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Quais matérias você tem mais dificuldade? (opcional)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Anatomia',
                        'Fisiologia',
                        'Bioquímica',
                        'Patologia',
                        'Farmacologia',
                        'Clínica Médica',
                        'Cirurgia',
                        'Outras',
                      ].map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => toggleArrayItem('difficultySubjects', subject)}
                          className={`p-2 text-sm rounded-lg border-2 transition-all ${
                            data.difficultySubjects.includes(subject)
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Objetivo principal */}
            {step === 6 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🎯</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Seu Objetivo Principal
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    O que você mais quer alcançar agora?
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { value: 'passar_semestre', label: 'Passar no semestre', emoji: '✅', desc: 'Foco em aprovação nas matérias' },
                    { value: 'melhorar_notas', label: 'Melhorar as notas', emoji: '📈', desc: 'Aumentar o desempenho acadêmico' },
                    { value: 'residencia', label: 'Preparar para residência', emoji: '🏥', desc: 'Foco em prova de residência médica' },
                    { value: 'revalida', label: 'Passar no Revalida', emoji: '🌎', desc: 'Validação de diploma estrangeiro' },
                    { value: 'concurso', label: 'Concurso público', emoji: '📋', desc: 'Preparação para concursos' },
                    { value: 'equilibrio', label: 'Equilibrar vida e estudos', emoji: '⚖️', desc: 'Organização e qualidade de vida' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateData('mainGoal', option.value)}
                      className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                        data.mainGoal === option.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-[1.02]'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Residência médica */}
            {step === 7 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🏥</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Residência Médica
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Seus planos de especialização
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Já está pensando em residência? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'sim_decidido', label: 'Sim, já decidi', emoji: '✅', desc: 'Sei qual área quero' },
                        { value: 'sim_duvida', label: 'Sim, mas ainda tenho dúvidas', emoji: '🤔', desc: 'Estou decidindo' },
                        { value: 'nao_ainda', label: 'Ainda não pensei nisso', emoji: '⏳', desc: 'É cedo demais' },
                        { value: 'nao_pretendo', label: 'Não pretendo fazer', emoji: '❌', desc: 'Outros planos' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('focusResidency', option.value)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                            data.focusResidency === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{option.emoji}</span>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {(data.focusResidency === 'sim_decidido' || data.focusResidency === 'sim_duvida') && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Qual área/especialidade? (opcional)
                        </label>
                        <input
                          type="text"
                          value={data.residencyArea}
                          onChange={(e) => updateData('residencyArea', e.target.value)}
                          placeholder="Ex: Cardiologia, Pediatria, Cirurgia Geral..."
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Qual sua especialidade dos sonhos? (opcional)
                        </label>
                        <input
                          type="text"
                          value={data.dreamSpecialty}
                          onChange={(e) => updateData('dreamSpecialty', e.target.value)}
                          placeholder="Ex: Neurocirurgia, Oncologia..."
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Tem data prevista para a prova? (opcional)
                        </label>
                        <input
                          type="date"
                          value={data.examDate}
                          onChange={(e) => updateData('examDate', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 8: Atividade física */}
            {step === 8 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">💪</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Atividade Física
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Exercícios e bem-estar físico
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Com que frequência você pratica exercícios? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'nao_pratico', label: 'Não pratico', emoji: '❌' },
                        { value: '1-2x', label: '1-2x por semana', emoji: '🏃' },
                        { value: '3-4x', label: '3-4x por semana', emoji: '🏋️' },
                        { value: '5-6x', label: '5-6x por semana', emoji: '💪' },
                        { value: 'diario', label: 'Diariamente', emoji: '🔥' },
                        { value: 'eventual', label: 'Eventualmente', emoji: '🔄' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            updateData('exerciseFrequency', option.value);
                            if (option.value === 'nao_pratico') {
                              updateData('workoutsPerWeek', 0);
                            } else if (option.value === '1-2x') {
                              updateData('workoutsPerWeek', 2);
                            } else if (option.value === '3-4x') {
                              updateData('workoutsPerWeek', 3);
                            } else if (option.value === '5-6x') {
                              updateData('workoutsPerWeek', 5);
                            } else if (option.value === 'diario') {
                              updateData('workoutsPerWeek', 7);
                            }
                          }}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            data.exerciseFrequency === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white text-center">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {data.exerciseFrequency && data.exerciseFrequency !== 'nao_pratico' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Você faz parte de alguma atlética? *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'sim', label: 'Sim', emoji: '⚽' },
                            { value: 'nao', label: 'Não', emoji: '❌' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateData('isAthlete', option.value)}
                              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                                data.isAthlete === option.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                              }`}
                            >
                              <span className="text-2xl">{option.emoji}</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {data.isAthlete === 'sim' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Qual o nome da atlética? (opcional)
                          </label>
                          <input
                            type="text"
                            value={data.athleticName}
                            onChange={(e) => updateData('athleticName', e.target.value)}
                            placeholder="Ex: Majestade, AAACF..."
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 9: Saúde mental */}
            {step === 9 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🧠</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Saúde Mental
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Cuidar da mente é tão importante quanto do corpo
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Como você avalia seu nível de estresse atualmente? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'baixo', label: 'Baixo', emoji: '😌', color: 'green' },
                        { value: 'moderado', label: 'Moderado', emoji: '😐', color: 'yellow' },
                        { value: 'alto', label: 'Alto', emoji: '😰', color: 'orange' },
                        { value: 'muito_alto', label: 'Muito alto', emoji: '😫', color: 'red' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('stressLevel', option.value)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                            data.stressLevel === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{option.emoji}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Você sente ansiedade com frequência? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'nao', label: 'Não', emoji: '✅' },
                        { value: 'as_vezes', label: 'Às vezes', emoji: '🔄' },
                        { value: 'sim_frequentemente', label: 'Sim, frequentemente', emoji: '😰' },
                        { value: 'sim_sempre', label: 'Sim, quase sempre', emoji: '😖' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('hasAnxiety', option.value)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                            data.hasAnxiety === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Você tem rotina de autocuidado?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'sim', label: 'Sim, tenho', emoji: '✅' },
                        { value: 'as_vezes', label: 'Às vezes', emoji: '🔄' },
                        { value: 'nao', label: 'Não', emoji: '❌' },
                        { value: 'quero_criar', label: 'Quero criar', emoji: '🌱' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('selfCareRoutine', option.value)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            data.selfCareRoutine === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white text-center">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Faz acompanhamento psicológico?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'sim', label: 'Sim, faço', emoji: '✅' },
                        { value: 'nao', label: 'Não faço', emoji: '❌' },
                        { value: 'ja_fiz', label: 'Já fiz', emoji: '🕐' },
                        { value: 'pretendo', label: 'Pretendo iniciar', emoji: '💭' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('psychologicalSupport', option.value)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            data.psychologicalSupport === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white text-center">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {(data.stressLevel === 'alto' || data.stressLevel === 'muito_alto' || data.hasAnxiety === 'sim_frequentemente' || data.hasAnxiety === 'sim_sempre') && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        💛 <strong>Cuidado:</strong> É importante buscar apoio profissional. Sua universidade provavelmente oferece serviço de apoio psicológico gratuito!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 10: Hidratação e nutrição */}
            {step === 10 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🥗</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Hidratação e Nutrição
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Alimentação e hábitos saudáveis
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Meta de água por dia (litros) *
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={data.waterGoal}
                        onChange={(e) => updateData('waterGoal', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 min-w-[60px]">
                        {data.waterGoal}L
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      💡 Recomendação: 2-3 litros por dia
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Quantas refeições você faz por dia? *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, '6+'].map((meals) => (
                        <button
                          key={meals}
                          type="button"
                          onClick={() => updateData('mealsPerDay', typeof meals === 'number' ? meals : 6)}
                          className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                            data.mealsPerDay === (typeof meals === 'number' ? meals : 6)
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {meals}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Você costuma cozinhar suas próprias refeições? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'sim_sempre', label: 'Sim, sempre', emoji: '👨‍🍳' },
                        { value: 'as_vezes', label: 'Às vezes', emoji: '🔄' },
                        { value: 'raramente', label: 'Raramente', emoji: '🍕' },
                        { value: 'nunca', label: 'Nunca', emoji: '🍔' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('cookOwnMeals', option.value)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            data.cookOwnMeals === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white text-center">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 11: Controle de peso (opcional) */}
            {step === 11 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">⚖️</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Controle de Peso
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Esta seção é totalmente opcional
                  </p>
                </div>
                <div className="space-y-5">
                  <label className="flex items-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <input
                      type="checkbox"
                      checked={data.trackWeight}
                      onChange={(e) => updateData('trackWeight', e.target.checked)}
                      className="h-5 w-5 text-indigo-600 rounded"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                      Quero acompanhar meu peso
                    </span>
                  </label>
                  {data.trackWeight && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Peso atual (kg) - opcional
                        </label>
                        <input
                          type="number"
                          min="30"
                          max="200"
                          step="0.1"
                          value={data.currentWeight}
                          onChange={(e) => updateData('currentWeight', e.target.value)}
                          placeholder="Ex: 70.5"
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Qual seu objetivo? - opcional
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'perder', label: 'Perder peso', emoji: '📉' },
                            { value: 'manter', label: 'Manter peso', emoji: '➡️' },
                            { value: 'ganhar', label: 'Ganhar peso', emoji: '📈' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateData('weightGoal', option.value)}
                              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                data.weightGoal === option.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                              }`}
                            >
                              <span className="text-2xl">{option.emoji}</span>
                              <span className="font-semibold text-xs text-gray-900 dark:text-white text-center">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 12: Finanças - Orçamento */}
            {step === 12 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">💰</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Gestão Financeira
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Vamos organizar suas finanças
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Você tem orçamento mensal definido? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'sim', label: 'Sim, já tenho definido', emoji: '✅', desc: 'Sei quanto posso gastar' },
                        { value: 'mais_ou_menos', label: 'Mais ou menos', emoji: '🤔', desc: 'Tenho noção mas não é exato' },
                        { value: 'nao', label: 'Não tenho', emoji: '❌', desc: 'Não controlo meus gastos' },
                        { value: 'quero_definir', label: 'Quero definir agora', emoji: '📊', desc: 'Vou começar a controlar' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('monthlyBudget', option.value)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                            data.monthlyBudget === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{option.emoji}</span>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {(data.monthlyBudget === 'sim' || data.monthlyBudget === 'mais_ou_menos' || data.monthlyBudget === 'quero_definir') && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Qual o valor aproximado? (opcional)
                        </label>
                        <input
                          type="text"
                          value={data.budgetAmount}
                          onChange={(e) => updateData('budgetAmount', e.target.value)}
                          placeholder="Ex: R$ 1.500,00"
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Você tem bolsa de estudos ou ajuda financeira?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'sim', label: 'Sim', emoji: '✅' },
                            { value: 'nao', label: 'Não', emoji: '❌' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateData('hasScholarship', option.value)}
                              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                                data.hasScholarship === option.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                              }`}
                            >
                              <span className="text-2xl">{option.emoji}</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 13: Principais gastos */}
            {step === 13 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">💳</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Principais Gastos
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Com o que você mais gasta?
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Selecione suas principais categorias de gastos: *
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'alimentacao', label: '🍔 Alimentação/Comida' },
                        { value: 'transporte', label: '🚗 Transporte/Uber' },
                        { value: 'moradia', label: '🏠 Aluguel/Moradia' },
                        { value: 'material', label: '📚 Material de Estudo/Livros' },
                        { value: 'academia', label: '💪 Academia/Esportes' },
                        { value: 'atletica', label: '⚽ Atlética/Eventos' },
                        { value: 'lazer', label: '🎉 Lazer/Festas' },
                        { value: 'streaming', label: '📺 Streaming/Assinaturas' },
                        { value: 'saude', label: '💊 Saúde/Medicamentos' },
                        { value: 'vestuario', label: '👕 Roupas/Vestuário' },
                      ].map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => toggleArrayItem('mainExpenses', cat.value)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                            data.mainExpenses.includes(cat.value)
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Precisa de ajuda para organizar seu orçamento? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'sim_muito', label: 'Sim, preciso muito', emoji: '🆘', desc: 'Tenho dificuldade em controlar' },
                        { value: 'sim_um_pouco', label: 'Sim, um pouco', emoji: '✅', desc: 'Algumas dicas seriam úteis' },
                        { value: 'nao', label: 'Não, já controlo bem', emoji: '💪', desc: 'Já tenho tudo organizado' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('needsBudgetHelp', option.value)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                            data.needsBudgetHelp === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{option.emoji}</span>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 14: Notificações e prioridade */}
            {step === 14 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">🔔</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Notificações
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Configure lembretes importantes
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Quer receber notificações de lembretes? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'sim', label: 'Sim, quero', emoji: '🔔', desc: 'Para estudos, treinos, etc' },
                        { value: 'so_importantes', label: 'Só as importantes', emoji: '⚠️', desc: 'Apenas prioridades' },
                        { value: 'nao', label: 'Não, prefiro sem', emoji: '🔕', desc: 'Vou gerenciar manualmente' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('wantsNotifications', option.value)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-start gap-2 transition-all ${
                            data.wantsNotifications === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {(data.wantsNotifications === 'sim' || data.wantsNotifications === 'so_importantes') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Quando prefere receber notificações?
                        </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'manha', label: 'Pela manhã', emoji: '🌅', time: '7h-12h' },
                          { value: 'tarde', label: 'À tarde', emoji: '☀️', time: '12h-18h' },
                          { value: 'noite', label: 'À noite', emoji: '🌙', time: '18h-22h' },
                          { value: 'sempre', label: 'Qualquer horário', emoji: '🔄', time: 'Flexível' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateData('notificationTime', option.value)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                              data.notificationTime === option.value
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                            }`}
                          >
                            <span className="text-2xl">{option.emoji}</span>
                            <div className="text-center">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{option.label}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{option.time}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Qual funcionalidade é mais importante para você? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'estudos', label: 'Organização de estudos', emoji: '📚', desc: 'Cronogramas, lembretes de provas' },
                        { value: 'financas', label: 'Gestão financeira', emoji: '💰', desc: 'Controle de gastos e orçamento' },
                        { value: 'saude', label: 'Saúde e bem-estar', emoji: '❤️', desc: 'Exercícios, sono, hidratação' },
                        { value: 'tudo', label: 'Tudo é importante', emoji: '🎯', desc: 'Equilibrar todas as áreas' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('priorityFeature', option.value)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                            data.priorityFeature === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{option.emoji}</span>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 15: Preferências finais */}
            {step === 15 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-3 block">⚙️</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Preferências do App
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Últimos ajustes para personalizar sua experiência
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Tema visual preferido: *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'claro', label: 'Claro', emoji: '☀️', desc: 'Sempre claro' },
                        { value: 'escuro', label: 'Escuro', emoji: '🌙', desc: 'Sempre escuro' },
                        { value: 'auto', label: 'Automático', emoji: '🔄', desc: 'Seguir sistema' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateData('theme', option.value)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            data.theme === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <div className="text-center">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Modo de interação com IA: *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        <input
                          type="radio"
                          name="aiMode"
                          value="confirm"
                          checked={data.aiMode === 'confirm'}
                          onChange={(e) => updateData('aiMode', e.target.value)}
                          className="h-5 w-5 text-indigo-600 mt-0.5"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">✅</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              Sempre confirmar antes de salvar
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Mais seguro - você revisa todas as informações antes de salvar
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        <input
                          type="radio"
                          name="aiMode"
                          value="auto"
                          checked={data.aiMode === 'auto'}
                          onChange={(e) => updateData('aiMode', e.target.value)}
                          className="h-5 w-5 text-indigo-600 mt-0.5"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⚡</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              Salvar direto quando a confiança for alta
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Mais rápido - só pergunta quando tiver dúvida
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-5 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🎉</span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        Tudo pronto!
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Seu MedPlanner está configurado e personalizado especialmente para você. Clique em <strong>"Começar a usar"</strong> para iniciar sua jornada organizada!
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* FOOTER COM BOTÕES - Z-INDEX CORRIGIDO */}
          <div className="sticky bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg">
            <div className="flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="relative z-50 flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  ← Voltar
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`relative z-50 flex-1 px-6 py-4 rounded-xl font-semibold transition-all shadow-md hover:shadow-xl cursor-pointer ${
                  canProceed()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
                style={{ pointerEvents: canProceed() ? 'auto' : 'none' }}
              >
                {step === totalSteps ? '🎉 Começar a usar!' : 'Próximo →'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}