import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    // Informações Básicas
    name: '',
    semester: '',
    university: '',
    
    // Rotina
    timezone: 'America/Sao_Paulo',
    sleepTime: '23:00',
    wakeTime: '07:00',
    
    // Estilo de Estudo
    studyTime: '', // manhã, tarde, noite, flexível
    studyHoursPerDay: 2,
    studyTechniques: [], // pomodoro, flashcards, mapas, etc
    tutorialDays: [],
    subjects: [],
    
    // Objetivos
    focusResidency: '', // sim, não, ainda_nao_sei
    residencyArea: '',
    importantExam: '', // enem, revalida, residencia, etc
    shortTermGoals: '',
    
    // Saúde e Bem-Estar
    workoutsPerWeek: 3,
    exerciseFrequency: '', // 0x, 1-2x, 3-4x, etc
    workoutDays: [],
    waterGoal: 2,
    idealSleepHours: '', // 6-7h, 8h, etc
    selfCareRoutine: '', // sim, às_vezes, não, quero_começar
    psychologicalSupport: '', // sim, não, já_fiz, pretendo
    trackWeight: false,
    weightFrequency: 'weekly',
    
    // Organização Financeira
    monthlyBudget: '', // sim, não, quero_definir
    budgetAmount: '',
    expenseCategories: [], // alimentacao, transporte, etc
    recurringBills: [],
    
    // Preferências do App
    wantsNotifications: '', // sim, não
    notificationTime: '', // manha, tarde, noite, sempre
    theme: 'auto', // claro, escuro, auto
    language: 'pt-BR',
    aiMode: 'confirm' // confirm, auto
  });

  const { completeOnboarding } = useOnboarding();
  const { addEvent } = useContext(AppContext);
  const navigate = useNavigate();

  const totalSteps = 13; // Expandido de 7 para 13 steps

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
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
      case 1: return true; // Boas-vindas
      case 2: return data.name.trim() && data.semester && data.university.trim();
      case 3: return data.sleepTime && data.wakeTime;
      case 4: return data.studyTime && data.studyHoursPerDay;
      case 5: return data.focusResidency;
      case 6: return data.exerciseFrequency && data.idealSleepHours;
      case 7: return data.selfCareRoutine && data.psychologicalSupport;
      case 8: return data.waterGoal;
      case 9: return true; // Peso opcional
      case 10: return data.monthlyBudget;
      case 11: return true; // Contas recorrentes opcional
      case 12: return data.wantsNotifications && data.theme;
      case 13: return data.aiMode;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white/90">
              Passo {step} de {totalSteps}
            </span>
            <span className="text-sm text-white/70">
              ~{totalSteps - step + 1} min restante{totalSteps - step + 1 !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300 shadow-lg"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-h-[600px] overflow-y-auto">
          
          {/* STEP 1: Boas-vindas */}
          {step === 1 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">👋</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Bem-vindo(a) ao MedPlanner!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Vamos configurar seu planner personalizado em poucos minutos. Isso vai nos ajudar a organizar sua rotina de estudos, saúde e finanças automaticamente.
                </p>
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-left">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>📋 O que vamos configurar:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    <li>• Suas informações básicas</li>
                    <li>• Rotina de sono e estudos</li>
                    <li>• Objetivos acadêmicos</li>
                    <li>• Saúde e bem-estar</li>
                    <li>• Organização financeira</li>
                    <li>• Preferências do app</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Informações Básicas */}
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Como prefere ser chamado(a)? *
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => updateData('name', e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        onClick={() => updateData('semester', sem)}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          data.semester === sem
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {sem}º
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Qual sua faculdade? *
                  </label>
                  <input
                    type="text"
                    value={data.university}
                    onChange={(e) => updateData('university', e.target.value)}
                    placeholder="Ex: UFMG, USP, UNICAMP..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Rotina de Sono */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">🌙</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Rotina de Sono
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ajude-nos a entender sua rotina de descanso
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Que horas você costuma dormir? *
                  </label>
                  <input
                    type="time"
                    value={data.sleepTime}
                    onChange={(e) => updateData('sleepTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Que horas você costuma acordar? *
                  </label>
                  <input
                    type="time"
                    value={data.wakeTime}
                    onChange={(e) => updateData('wakeTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Estilo de Estudo */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">📚</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Estilo de Estudo
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Como você prefere estudar?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Prefere estudar pela manhã, tarde ou noite? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'manhã', emoji: '🌅', label: 'Manhã' },
                      { value: 'tarde', emoji: '☀️', label: 'Tarde' },
                      { value: 'noite', emoji: '🌙', label: 'Noite' },
                      { value: 'flexível', emoji: '🔄', label: 'Flexível' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData('studyTime', option.value)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          data.studyTime === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantas horas por dia quer dedicar aos estudos fora da tutoria? *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={data.studyHoursPerDay}
                    onChange={(e) => updateData('studyHoursPerDay', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Usa técnicas específicas? (Pode selecionar várias)
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'pomodoro', label: '🍅 Pomodoro' },
                      { value: 'flashcards', label: '🗂️ Flashcards' },
                      { value: 'mapas', label: '🗺️ Mapas Mentais' },
                      { value: 'resumos', label: '📝 Resumos' },
                      { value: 'questoes', label: '❓ Questões' },
                      { value: 'nenhuma', label: '❌ Nenhuma específica' },
                    ].map((tech) => (
                      <button
                        key={tech.value}
                        onClick={() => toggleArrayItem('studyTechniques', tech.value)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          data.studyTechniques.includes(tech.value)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tech.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Objetivos */}
          {step === 5 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">🎯</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Objetivos
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Quais são suas metas?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Foco em residência médica? *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'sim', label: 'Sim', emoji: '🏥', desc: 'Já estou focando' },
                      { value: 'não', label: 'Não', emoji: '❌', desc: 'Sem planos de residência' },
                      { value: 'ainda_nao_sei', label: 'Ainda não sei', emoji: '🤔', desc: 'Vou decidir mais tarde' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData('focusResidency', option.value)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          data.focusResidency === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {data.focusResidency === 'sim' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Qual área de residência?
                    </label>
                    <input
                      type="text"
                      value={data.residencyArea}
                      onChange={(e) => updateData('residencyArea', e.target.value)}
                      placeholder="Ex: Cardiologia, Pediatria, Cirurgia..."
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tem alguma prova importante?
                  </label>
                  <select
                    value={data.importantExam}
                    onChange={(e) => updateData('importantExam', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="enem">ENEM</option>
                    <option value="revalida">Revalida</option>
                    <option value="residencia">Prova de Residência</option>
                    <option value="concurso">Concurso Público</option>
                    <option value="outra">Outra</option>
                    <option value="nenhuma">Nenhuma no momento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Metas de curto prazo? (opcional)
                  </label>
                  <textarea
                    value={data.shortTermGoals}
                    onChange={(e) => updateData('shortTermGoals', e.target.value)}
                    placeholder="Ex: Passar em todas as matérias, melhorar nota em anatomia..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Exercícios e Sono */}
          {step === 6 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">💪</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Saúde Física
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Exercícios e sono
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pratica exercícios? Quantas vezes por semana? *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['0x', '1-2x', '3-4x', '5-6x', 'Diariamente', 'Eventualmente'].map((freq) => (
                      <button
                        key={freq}
                        onClick={() => updateData('exerciseFrequency', freq)}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          data.exerciseFrequency === freq
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Horas de sono ideais? *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['4-5h', '6-7h', '8h', '9h+', 'Varia', 'Preciso melhorar'].map((sleep) => (
                      <button
                        key={sleep}
                        onClick={() => updateData('idealSleepHours', sleep)}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          data.idealSleepHours === sleep
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {sleep}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Bem-Estar Mental */}
          {step === 7 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">❤️</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Bem-Estar Mental
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Cuidados com a saúde mental
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tem rotina de autocuidado? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'sim', label: 'Sim', emoji: '✅' },
                      { value: 'às_vezes', label: 'Às vezes', emoji: '🔄' },
                      { value: 'não', label: 'Não', emoji: '❌' },
                      { value: 'quero_começar', label: 'Quero começar', emoji: '🌱' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData('selfCareRoutine', option.value)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          data.selfCareRoutine === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Faz acompanhamento psicológico? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'sim', label: 'Sim', emoji: '✅' },
                      { value: 'não', label: 'Não', emoji: '❌' },
                      { value: 'já_fiz', label: 'Já fiz', emoji: '🕐' },
                      { value: 'pretendo', label: 'Pretendo iniciar', emoji: '💭' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData('psychologicalSupport', option.value)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          data.psychologicalSupport === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Hidratação */}
          {step === 8 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">💧</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Hidratação
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Meta diária de água
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta de água por dia (litros) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={data.waterGoal}
                    onChange={(e) => updateData('waterGoal', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    💡 Recomendação: 2-3 litros por dia
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Peso */}
          {step === 9 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">⚖️</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Acompanhamento de Peso
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Deseja acompanhar seu peso? (opcional)
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={data.trackWeight}
                    onChange={(e) => updateData('trackWeight', e.target.checked)}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">
                    Sim, quero acompanhar meu peso
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 10: Orçamento */}
          {step === 10 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">💰</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Organização Financeira
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Orçamento mensal
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tem orçamento mensal definido? *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'sim', label: 'Sim', emoji: '✅', desc: 'Já tenho definido' },
                      { value: 'não', label: 'Não', emoji: '❌', desc: 'Não controlo' },
                      { value: 'quero_definir', label: 'Quero definir', emoji: '📊', desc: 'Vou começar agora' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData('monthlyBudget', option.value)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          data.monthlyBudget === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {(data.monthlyBudget === 'sim' || data.monthlyBudget === 'quero_definir') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Qual o valor aproximado? (opcional)
                    </label>
                    <input
                      type="text"
                      value={data.budgetAmount}
                      onChange={(e) => updateData('budgetAmount', e.target.value)}
                      placeholder="Ex: R$ 1.500,00"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Principais categorias de gastos? (Pode selecionar várias)
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'alimentacao', label: '🍔 Alimentação' },
                      { value: 'transporte', label: '🚗 Transporte' },
                      { value: 'material', label: '📚 Material de Estudo' },
                      { value: 'moradia', label: '🏠 Moradia' },
                      { value: 'lazer', label: '🎉 Lazer' },
                      { value: 'saude', label: '💊 Saúde' },
                    ].map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => toggleArrayItem('expenseCategories', cat.value)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          data.expenseCategories.includes(cat.value)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 11: Contas Recorrentes */}
          {step === 11 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">💳</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Contas Recorrentes
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Quais contas você paga todo mês? (opcional)
                </p>
              </div>

              <div className="space-y-3">
                {['Aluguel', 'Luz', 'Água', 'Internet', 'Telefone', 'Academia', 'Streaming'].map(bill => (
                  <label key={bill} className="flex items-center p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-primary-600 rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateData('recurringBills', [...data.recurringBills, bill]);
                        } else {
                          updateData('recurringBills', data.recurringBills.filter(b => b !== bill));
                        }
                      }}
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{bill}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 12: Preferências do App */}
          {step === 12 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">⚙️</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Preferências do App
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Personalize sua experiência
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quer receber notificações? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'sim', label: 'Sim', emoji: '🔔' },
                      { value: 'não', label: 'Não', emoji: '🔕' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData('wantsNotifications', option.value)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          data.wantsNotifications === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {data.wantsNotifications === 'sim' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Quando prefere receber notificações?
                    </label>
                    <select
                      value={data.notificationTime}
                      onChange={(e) => updateData('notificationTime', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="manha">Pela manhã (7h-12h)</option>
                      <option value="tarde">À tarde (12h-18h)</option>
                      <option value="noite">À noite (18h-22h)</option>
                      <option value="sempre">A qualquer momento</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tema preferido? *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'claro', label: 'Claro', emoji: '☀️' },
                      { value: 'escuro', label: 'Escuro', emoji: '🌙' },
                      { value: 'auto', label: 'Automático', emoji: '🔄' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateData('theme', option.value)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                          data.theme === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Idioma de preferência
                  </label>
                  <select
                    value={data.language}
                    onChange={(e) => updateData('language', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                    <option value="en-US">🇺🇸 English (US)</option>
                    <option value="es-ES">🇪🇸 Español</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 13: Modo da IA */}
          {step === 13 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">🤖</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Modo da IA
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Como você quer que a IA funcione?
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  <input
                    type="radio"
                    name="aiMode"
                    value="confirm"
                    checked={data.aiMode === 'confirm'}
                    onChange={(e) => updateData('aiMode', e.target.value)}
                    className="h-5 w-5 text-primary-600 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      ✅ Sempre confirmar antes de salvar
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Mais seguro - você revisa antes de salvar
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
                    className="h-5 w-5 text-primary-600 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      ⚡ Salvar direto quando a confiança for alta
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Mais rápido - só pergunta quando tiver dúvida
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mt-6">
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                  🎉 Tudo pronto! Clique em "Começar a usar" para finalizar.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                canProceed()
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {step === totalSteps ? '🎉 Começar a usar!' : 'Próximo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}