import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    timezone: 'America/Sao_Paulo',
    sleepTime: '23:00',
    wakeTime: '07:00',
    tutorialDays: [],
    studyHoursPerDay: 2,
    subjects: [],
    workoutsPerWeek: 3,
    workoutDays: [],
    waterGoal: 2,
    trackWeight: false,
    weightFrequency: 'weekly',
    recurringBills: [],
    aiMode: 'confirm'
  });

  const { completeOnboarding } = useOnboarding();
  const { addEvent } = useContext(AppContext);
  const navigate = useNavigate();

  const totalSteps = 7;

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
    // Criar eventos recorrentes baseados no onboarding
    // (simplificado - em produção, criar com recorrência real)
    
    completeOnboarding(data);
    navigate('/dashboard');
  };

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Passo {step} de {totalSteps}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ~{totalSteps - step + 1} min restante{totalSteps - step + 1 !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Bem-vinda ao MedPlanner! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Vamos configurar seu planner em 2 minutos. Isso vai ajudar a organizar sua rotina automaticamente.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Que horas você costuma dormir?
                  </label>
                  <input
                    type="time"
                    value={data.sleepTime}
                    onChange={(e) => updateData('sleepTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Que horas você costuma acordar?
                  </label>
                  <input
                    type="time"
                    value={data.wakeTime}
                    onChange={(e) => updateData('wakeTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Faculdade (PBL) 📚
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Vamos organizar seus estudos.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantas horas por dia você quer estudar fora da tutoria?
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={data.studyHoursPerDay}
                    onChange={(e) => updateData('studyHoursPerDay', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Academia 💪
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Configure seus treinos.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantos treinos por semana?
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={data.workoutsPerWeek}
                    onChange={(e) => updateData('workoutsPerWeek', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta de água por dia (litros)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={data.waterGoal}
                    onChange={(e) => updateData('waterGoal', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Peso ⚖️
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Deseja acompanhar seu peso? (opcional)
              </p>

              <div className="space-y-4">
                <label className="flex items-center">
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

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Contas Recorrentes 💰
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Quais contas você paga todo mês?
              </p>

              <div className="space-y-3">
                {['Aluguel', 'Luz', 'Água', 'Internet', 'Telefone'].map(bill => (
                  <label key={bill} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-primary-600 rounded"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{bill}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Modo da IA 🤖
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Quando você digitar uma frase, como prefere que funcione?
              </p>

              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
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
                      Sempre confirmar antes de salvar
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Mais seguro - você revisa antes de salvar
                    </p>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
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
                      Salvar direto quando a confiança for alta
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Mais rápido - só pergunta quando tiver dúvida
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Tudo Pronto!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Seu planner está configurado e pronto para usar. Criamos automaticamente sua agenda inicial com base nas suas preferências.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
            >
              {step === totalSteps ? 'Começar a usar!' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}