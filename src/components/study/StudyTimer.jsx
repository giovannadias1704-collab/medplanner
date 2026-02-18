import { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { PlayIcon, PauseIcon, ArrowPathIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function StudyTimer({ studyConfig }) {
  const { addStudyRecord } = useContext(AppContext);
  
  const [timeLeft, setTimeLeft] = useState(studyConfig.sessionDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showComfortCheck, setShowComfortCheck] = useState(false);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Tocar som de notificação
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUQ0NTKXh8bllHAU2jdXzwoAxBx1xxvDgklENDFGq5O+zYhsGPJPY88p2KwUme8rx3I4+CRZiuuzooVQODUyn4/K9aB8FM4vU88SDMwYebMPv45ZQDAZMp+PyvmshBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUQ0NTKXh8bllHAU2jdXzwoAxBx1xxvDgklENDFGq5O+zYhsGPJPY88p2KwUme8rx3I4+CRZiuuzooVQODUyn4/K9aB8FM4vU88SDMwYebMPv45ZQDAZMp+PyvmshBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUQ0NTKXh8bllHAU2jdXzwoAxBx1xxvDgklENDFGq5O+zYhsGPJPY88p2KwUme8rx3I4+CRZiuuzooVQODUyn4/K9aB8FM4vU88SDMwYebMPv45ZQDAZMp+PyvmshBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUQ0NTKXh8bllHAU2jdXzwoAxBx1xxvDgklENDFGq5O+zYhsGPJPY88p2KwUme8rx3I4+CRZiuuzooVQODUyn4/K9aB8FM4vU88SDMwYebMPv45ZQDAZMp+PyvmshBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUQ0NTKXh8bllHAU2jdXzwoAxBx1xxvDgklENDFGq5O+zYhsGPJPY88p2KwUme8rx3I4+CRZiuuzooVQODUyn4/K9aB8FM4vU88SDMwYebMPv45ZQDAZMp+PyvmshBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUQ0NTKXh8bllHAU2jdXzwoAxBx1xxvDgklENDFGq5O+zYhsGPJPY88p2KwUme8rx3I4+CRZiuuzooVQODUyn4/K9aB8FM4vU88SDMwYebMPv45ZQDAZMp+Pyvmsh');
    audio.play().catch(() => {});

    if (!isBreak) {
      // Sessão de estudo completa
      const studyMinutes = studyConfig.sessionDuration;
      setTotalStudyTime(prev => prev + studyMinutes);
      
      if (currentSubject) {
        addStudyRecord({
          subject: currentSubject,
          duration: studyMinutes,
          date: new Date().toISOString(),
          technique: 'Timer'
        });
      }

      setSessionsCompleted(prev => prev + 1);
      setIsBreak(true);
      setTimeLeft(studyConfig.breakDuration * 60);
      
      // Mostrar verificação de conforto a cada 2 sessões
      if ((sessionsCompleted + 1) % 2 === 0) {
        setShowComfortCheck(true);
      }
    } else {
      // Pausa completa
      setIsBreak(false);
      setTimeLeft(studyConfig.sessionDuration * 60);
    }
  };

  const handleStart = () => {
    if (!currentSubject && !isBreak) {
      setShowSubjectModal(true);
      return;
    }
    
    if (!isRunning && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(studyConfig.sessionDuration * 60);
    startTimeRef.current = null;
  };

  const handleSubjectSelect = (subject) => {
    setCurrentSubject(subject);
    setShowSubjectModal(false);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  };

  const progress = isBreak 
    ? ((studyConfig.breakDuration * 60 - timeLeft) / (studyConfig.breakDuration * 60)) * 100
    : ((studyConfig.sessionDuration * 60 - timeLeft) / (studyConfig.sessionDuration * 60)) * 100;

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <ClockIcon className="h-8 w-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Tempo Total Hoje</p>
          <p className="text-3xl font-bold">{totalStudyTime} min</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
          <CheckIcon className="h-8 w-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Sessões Completas</p>
          <p className="text-3xl font-bold">{sessionsCompleted}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-sm opacity-90">Matéria Atual</p>
          <p className="text-lg font-bold truncate">{currentSubject || 'Nenhuma'}</p>
        </div>
      </div>

      {/* Timer Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl border-4 border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isBreak ? '☕ Pausa para Descanso' : '📚 Sessão de Estudo'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isBreak 
              ? 'Descanse e se hidrate!' 
              : 'Foque no seu objetivo de aprendizado'}
          </p>
        </div>

        {/* Círculo do Timer */}
        <div className="relative w-80 h-80 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            {/* Círculo de fundo */}
            <circle
              cx="160"
              cy="160"
              r="150"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Círculo de progresso */}
            <circle
              cx="160"
              cy="160"
              r="150"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={2 * Math.PI * 150}
              strokeDashoffset={2 * Math.PI * 150 * (1 - progress / 100)}
              className={isBreak 
                ? 'text-blue-500 transition-all duration-1000' 
                : 'text-purple-600 transition-all duration-1000'
              }
              strokeLinecap="round"
            />
          </svg>
          
          {/* Tempo no centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-7xl font-bold text-gray-900 dark:text-white mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {isBreak 
                  ? studyConfig.breakDuration + ' min de pausa' 
                  : studyConfig.sessionDuration + ' min de estudo'}
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            >
              <PlayIcon className="h-10 w-10 ml-1" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            >
              <PauseIcon className="h-10 w-10" />
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          >
            <ArrowPathIcon className="h-8 w-8" />
          </button>
        </div>
      </div>

      {/* Dicas */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">💡 Dicas para Melhor Aproveitamento</h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>• Silencie notificações durante a sessão de estudo</li>
          <li>• Mantenha água por perto para se hidratar</li>
          <li>• Use a pausa para alongar e descansar a vista</li>
          <li>• Evite redes sociais durante o estudo</li>
          <li>• Faça anotações dos pontos principais</li>
        </ul>
      </div>

      {/* Modal Selecionar Matéria */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              📚 Qual matéria você vai estudar?
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {studyConfig.subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-gray-900 dark:text-white rounded-xl hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 font-semibold transition-all border-2 border-purple-200 dark:border-purple-800 text-left"
                >
                  {subject}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSubjectModal(false)}
              className="w-full mt-4 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Verificação de Conforto */}
      {showComfortCheck && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Como você está se sentindo?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Você está confortável com a quantidade de estudo?
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowComfortCheck(false)}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg"
              >
                ✅ Sim, está ótimo!
              </button>
              
              <button
                onClick={() => {
                  setShowComfortCheck(false);
                  alert('Considere fazer uma pausa mais longa ou reduzir o tempo das próximas sessões. Lembre-se: qualidade > quantidade!');
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 font-semibold shadow-lg"
              >
                😓 Estou cansado(a)
              </button>
              
              <button
                onClick={() => setShowComfortCheck(false)}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
              >
                Pular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}