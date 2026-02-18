import { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function StudyQuestionnaire({ onComplete }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    subjects: [],
    priorities: {},
    availableDays: [],
    studyHours: {},
    sessionDuration: 50,
    breakDuration: 10,
    tasks: [],
    reviewTopics: [],
    changePreference: 'suggest', // 'suggest' ou 'auto'
    isPBL: false,
    pblTutorials: [],
    pblActivities: []
  });

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(config);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const totalSteps = config.isPBL ? 9 : 7;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Pergunta {step} de {totalSteps}
          </span>
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Perguntas */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        
        {/* Pergunta 1: Matérias */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📚 Quais matérias você está estudando?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Liste todas as disciplinas ou áreas que você precisa estudar
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Digite uma matéria e pressione Enter"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setConfig({
                      ...config,
                      subjects: [...config.subjects, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              
              {config.subjects.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {config.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-xl font-semibold flex items-center gap-2"
                    >
                      {subject}
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            subjects: config.subjects.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pergunta 2: Prioridades */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎯 Quais são suas prioridades?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Defina a prioridade e dificuldade de cada matéria
              </p>
            </div>

            <div className="space-y-4">
              {config.subjects.map((subject, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                    {subject}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Prioridade
                      </label>
                      <select
                        value={config.priorities[subject]?.priority || 'media'}
                        onChange={(e) => setConfig({
                          ...config,
                          priorities: {
                            ...config.priorities,
                            [subject]: {
                              ...config.priorities[subject],
                              priority: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="alta">🔴 Alta</option>
                        <option value="media">🟡 Média</option>
                        <option value="baixa">🟢 Baixa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Dificuldade
                      </label>
                      <select
                        value={config.priorities[subject]?.difficulty || 'media'}
                        onChange={(e) => setConfig({
                          ...config,
                          priorities: {
                            ...config.priorities,
                            [subject]: {
                              ...config.priorities[subject],
                              difficulty: e.target.value
                            }
                          }
                        })}
                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="dificil">🔴 Difícil</option>
                        <option value="media">🟡 Média</option>
                        <option value="facil">🟢 Fácil</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pergunta 3: Dias e Horários Disponíveis */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📅 Quando você pode estudar?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Selecione os dias e defina os horários disponíveis
              </p>
            </div>

            <div className="space-y-4">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => (
                <div key={day} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <label className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={config.availableDays.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({
                            ...config,
                            availableDays: [...config.availableDays, day]
                          });
                        } else {
                          setConfig({
                            ...config,
                            availableDays: config.availableDays.filter(d => d !== day),
                            studyHours: {
                              ...config.studyHours,
                              [day]: undefined
                            }
                          });
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="font-bold text-gray-900 dark:text-white">{day}</span>
                  </label>

                  {config.availableDays.includes(day) && (
                    <div className="grid grid-cols-2 gap-3 ml-8">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Início
                        </label>
                        <input
                          type="time"
                          value={config.studyHours[day]?.start || '08:00'}
                          onChange={(e) => setConfig({
                            ...config,
                            studyHours: {
                              ...config.studyHours,
                              [day]: {
                                ...config.studyHours[day],
                                start: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Fim
                        </label>
                        <input
                          type="time"
                          value={config.studyHours[day]?.end || '18:00'}
                          onChange={(e) => setConfig({
                            ...config,
                            studyHours: {
                              ...config.studyHours,
                              [day]: {
                                ...config.studyHours[day],
                                end: e.target.value
                              }
                            }
                          })}
                          className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pergunta 4: Duração das Sessões */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ⏱️ Duração ideal das sessões
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Por quanto tempo você consegue manter o foco estudando?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Duração do estudo: <span className="text-purple-600">{config.sessionDuration} minutos</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={config.sessionDuration}
                  onChange={(e) => setConfig({ ...config, sessionDuration: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15 min</span>
                  <span>120 min</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Duração da pausa: <span className="text-purple-600">{config.breakDuration} minutos</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={config.breakDuration}
                  onChange={(e) => setConfig({ ...config, breakDuration: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 min</span>
                  <span>30 min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pergunta 5: Preferência de Mudanças */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🔄 Como você prefere ajustes?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Quando precisarmos fazer ajustes no seu cronograma
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setConfig({ ...config, changePreference: 'suggest' })}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  config.changePreference === 'suggest'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    config.changePreference === 'suggest' 
                      ? 'border-purple-600 bg-purple-600' 
                      : 'border-gray-400'
                  }`}>
                    {config.changePreference === 'suggest' && (
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    💡 Sugerir mudanças
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 ml-9">
                  Vou apresentar sugestões e você decide se aplica ou não
                </p>
              </button>

              <button
                onClick={() => setConfig({ ...config, changePreference: 'auto' })}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  config.changePreference === 'auto'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    config.changePreference === 'auto' 
                      ? 'border-purple-600 bg-purple-600' 
                      : 'border-gray-400'
                  }`}>
                    {config.changePreference === 'auto' && (
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    ⚡ Ajustar automaticamente
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 ml-9">
                  Faça os ajustes automaticamente e me notifique sobre as mudanças
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Pergunta 6: Faz PBL? */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🧪 Você faz PBL (Problem-Based Learning)?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Isso nos ajudará a personalizar ainda mais sua experiência
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setConfig({ ...config, isPBL: true })}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  config.isPBL === true
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    config.isPBL === true 
                      ? 'border-purple-600 bg-purple-600' 
                      : 'border-gray-400'
                  }`}>
                    {config.isPBL === true && (
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    ✅ Sim, faço PBL
                  </h3>
                </div>
              </button>

              <button
                onClick={() => setConfig({ ...config, isPBL: false })}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  config.isPBL === false
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    config.isPBL === false 
                      ? 'border-purple-600 bg-purple-600' 
                      : 'border-gray-400'
                  }`}>
                    {config.isPBL === false && (
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    ❌ Não faço PBL
                  </h3>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Pergunta 7: Tarefas/Assuntos (só se não for PBL) */}
        {step === 7 && !config.isPBL && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📝 Tarefas ou assuntos específicos
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Existem tarefas ou tópicos específicos que você precisa incluir no cronograma?
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Digite uma tarefa e pressione Enter"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setConfig({
                      ...config,
                      tasks: [...config.tasks, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              
              {config.tasks.length > 0 && (
                <div className="mt-4 space-y-2">
                  {config.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between"
                    >
                      <span className="text-gray-900 dark:text-white">{task}</span>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            tasks: config.tasks.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pergunta 7 (PBL): Tutoriais por semana */}
        {step === 7 && config.isPBL && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🧪 Tutoriais PBL
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Quantos tutoriais você tem por semana? Em quais dias e horários?
              </p>
            </div>

            <div>
              <button
                onClick={() => {
                  setConfig({
                    ...config,
                    pblTutorials: [
                      ...config.pblTutorials,
                      { day: 'Segunda', startTime: '08:00', endTime: '10:00' }
                    ]
                  });
                }}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 transition-all"
              >
                + Adicionar Tutorial
              </button>

              {config.pblTutorials.length > 0 && (
                <div className="mt-4 space-y-3">
                  {config.pblTutorials.map((tutorial, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Dia
                          </label>
                          <select
                            value={tutorial.day}
                            onChange={(e) => {
                              const newTutorials = [...config.pblTutorials];
                              newTutorials[index].day = e.target.value;
                              setConfig({ ...config, pblTutorials: newTutorials });
                            }}
                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Início
                          </label>
                          <input
                            type="time"
                            value={tutorial.startTime}
                            onChange={(e) => {
                              const newTutorials = [...config.pblTutorials];
                              newTutorials[index].startTime = e.target.value;
                              setConfig({ ...config, pblTutorials: newTutorials });
                            }}
                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Fim
                          </label>
                          <input
                            type="time"
                            value={tutorial.endTime}
                            onChange={(e) => {
                              const newTutorials = [...config.pblTutorials];
                              newTutorials[index].endTime = e.target.value;
                              setConfig({ ...config, pblTutorials: newTutorials });
                            }}
                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            pblTutorials: config.pblTutorials.filter((_, i) => i !== index)
                          });
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pergunta 8 (PBL): Outras Atividades */}
        {step === 8 && config.isPBL && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📚 Outras atividades PBL
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Você tem outras atividades relacionadas ao PBL? (sessões de feedback, apresentações, etc.)
              </p>
            </div>

            <div>
              <button
                onClick={() => {
                  setConfig({
                    ...config,
                    pblActivities: [
                      ...config.pblActivities,
                      { name: '', day: 'Segunda', startTime: '08:00', endTime: '10:00' }
                    ]
                  });
                }}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 transition-all"
              >
                + Adicionar Atividade
              </button>

              {config.pblActivities.length > 0 && (
                <div className="mt-4 space-y-3">
                  {config.pblActivities.map((activity, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Nome da atividade (ex: Feedback, Apresentação)"
                        value={activity.name}
                        onChange={(e) => {
                          const newActivities = [...config.pblActivities];
                          newActivities[index].name = e.target.value;
                          setConfig({ ...config, pblActivities: newActivities });
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Dia
                          </label>
                          <select
                            value={activity.day}
                            onChange={(e) => {
                              const newActivities = [...config.pblActivities];
                              newActivities[index].day = e.target.value;
                              setConfig({ ...config, pblActivities: newActivities });
                            }}
                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Início
                          </label>
                          <input
                            type="time"
                            value={activity.startTime}
                            onChange={(e) => {
                              const newActivities = [...config.pblActivities];
                              newActivities[index].startTime = e.target.value;
                              setConfig({ ...config, pblActivities: newActivities });
                            }}
                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Fim
                          </label>
                          <input
                            type="time"
                            value={activity.endTime}
                            onChange={(e) => {
                              const newActivities = [...config.pblActivities];
                              newActivities[index].endTime = e.target.value;
                              setConfig({ ...config, pblActivities: newActivities });
                            }}
                            className="w-full px-3 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            pblActivities: config.pblActivities.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pergunta Final: Tópicos para Revisar */}
        {step === (config.isPBL ? 9 : 7) && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🔍 Tópicos para revisar
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Existem tópicos específicos que você precisa revisar nas suas matérias?
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Digite um tópico e pressione Enter"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setConfig({
                      ...config,
                      reviewTopics: [...config.reviewTopics, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              
              {config.reviewTopics.length > 0 && (
                <div className="mt-4 space-y-2">
                  {config.reviewTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between"
                    >
                      <span className="text-gray-900 dark:text-white">{topic}</span>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            reviewTopics: config.reviewTopics.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                💡 Você pode pular esta etapa se não tiver tópicos específicos agora
              </p>
            </div>
          </div>
        )}

        {/* Botões de Navegação */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
            >
              ← Voltar
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && config.subjects.length === 0) ||
              (step === 3 && config.availableDays.length === 0) ||
              (step === 7 && config.isPBL && config.pblTutorials.length === 0)
            }
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {step === totalSteps ? (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Finalizar
              </>
            ) : (
              <>
                Próximo
                <ChevronRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}