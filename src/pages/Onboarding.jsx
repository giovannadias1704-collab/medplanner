import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    semester: '',
    university: '',
    timezone: 'America/Sao_Paulo',
    sleepTime: '23:00',
    wakeTime: '07:00',
    studyTime: '',
    studyHoursPerDay: 2,
    studyTechniques: [],
    tutorialDays: [],
    subjects: [],
    focusResidency: '',
    residencyArea: '',
    importantExam: '',
    shortTermGoals: '',
    workoutsPerWeek: 3,
    exerciseFrequency: '',
    workoutDays: [],
    waterGoal: 2,
    idealSleepHours: '',
    selfCareRoutine: '',
    psychologicalSupport: '',
    trackWeight: false,
    weightFrequency: 'weekly',
    monthlyBudget: '',
    budgetAmount: '',
    expenseCategories: [],
    recurringBills: [],
    wantsNotifications: '',
    notificationTime: '',
    theme: 'auto',
    language: 'pt-BR',
    aiMode: 'confirm'
  });

  const { completeOnboarding } = useOnboarding();
  const { addEvent } = useContext(AppContext);
  const navigate = useNavigate();

  const totalSteps = 13;

  const handleNext = () => {
    console.log('🔵 Botão Próximo clicado! Step atual:', step);
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    console.log('🔵 Botão Voltar clicado! Step atual:', step);
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = async () => {
    console.log('🎉 Finalizando onboarding com dados:', data);
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
      case 2: return data.name.trim() && data.semester && data.university.trim();
      case 3: return data.sleepTime && data.wakeTime;
      case 4: return data.studyTime && data.studyHoursPerDay;
      case 5: return data.focusResidency;
      case 6: return data.exerciseFrequency && data.idealSleepHours;
      case 7: return data.selfCareRoutine && data.psychologicalSupport;
      case 8: return data.waterGoal;
      case 9: return true;
      case 10: return data.monthlyBudget;
      case 11: return true;
      case 12: return data.wantsNotifications && data.theme;
      case 13: return data.aiMode;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full pb-24">
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 max-h-[500px] overflow-y-auto">
            
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
                          type="button"
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

            {/* ... (resto dos steps permanecem iguais, são muitos para incluir aqui mas não precisam de mudanças) ... */}

          </div>

          {/* FOOTER COM BOTÕES - CORRIGIDO COM Z-INDEX */}
          <div className="sticky bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 p-6">
            <div className="flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="relative z-50 flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  ← Voltar
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className={`relative z-50 flex-1 px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl cursor-pointer ${
                  canProceed()
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-400 dark:bg-gray-600 text-white opacity-50'
                }`}
                style={{ pointerEvents: 'auto' }}
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