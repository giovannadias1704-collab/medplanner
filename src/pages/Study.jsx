import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';  // ⬅️ ADICIONE ESTA LINHA
import PageHeader from '../components/PageHeader';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  ChartBarIcon,
  BeakerIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

 // Importar componentes (CORRETO: todos em ../components/study/)
import StudyQuestionnaire from '../components/study/StudyQuestionnaire';
import StudyPlanning from '../components/study/StudyPlanning';
import StudyPBL from '../components/study/StudyPBL';
import StudyTimer from '../components/study/StudyTimer';
import StudyProgress from '../components/study/StudyProgress';
import StudyQuestions from '../components/study/StudyQuestions';
import StudyReview from '../components/study/StudyReview';
import StudyWeeklyEval from '../components/study/StudyWeeklyEval';
export default function Study() {
  const { user } = useAuth();  // ⬅️ ESTA LINHA JÁ ESTÁ, MAS PRECISA DO IMPORT ACIMA
  const { userProfile } = useContext(AppContext);
  
  // ... resto do código
  const [activeTab, setActiveTab] = useState('planejamento');
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);
  const [studyConfig, setStudyConfig] = useState(null);

  // Verificar se usuário completou questionário
  useEffect(() => {
    const config = localStorage.getItem(`studyConfig_${user?.uid}`);
    if (config) {
      setStudyConfig(JSON.parse(config));
      setHasCompletedQuestionnaire(true);
    }
  }, [user]);

  // Definir abas baseado no perfil
  const tabs = [
    { id: 'planejamento', label: 'Planejamento', icon: AcademicCapIcon, emoji: '📅' },
    ...(studyConfig?.isPBL ? [{ id: 'pbl', label: 'PBL', icon: BeakerIcon, emoji: '🧪' }] : []),
    { id: 'timer', label: 'Timer', icon: ClockIcon, emoji: '⏱️' },
    { id: 'progresso', label: 'Progresso', icon: ChartBarIcon, emoji: '📊' },
    { id: 'questoes', label: 'Questões', icon: QuestionMarkCircleIcon, emoji: '❓' },
    { id: 'revisao', label: 'Revisão', icon: BookOpenIcon, emoji: '📖' },
    { id: 'avaliacao', label: 'Avaliação', icon: ClipboardDocumentCheckIcon, emoji: '📈' }
  ];

  // Se não completou questionário, mostrar isso primeiro
  if (!hasCompletedQuestionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
        <PageHeader 
          title="Configurar Estudos"
          subtitle="Vamos personalizar sua experiência de estudo"
          emoji="📚"
        />
        
        <StudyQuestionnaire 
          onComplete={(config) => {
            localStorage.setItem(`studyConfig_${user.uid}`, JSON.stringify(config));
            setStudyConfig(config);
            setHasCompletedQuestionnaire(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Estudos"
        subtitle="Organize e acompanhe seus estudos"
        emoji="📚"
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-4 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'planejamento' && <StudyPlanning studyConfig={studyConfig} />}
        {activeTab === 'pbl' && studyConfig?.isPBL && <StudyPBL studyConfig={studyConfig} />}
        {activeTab === 'timer' && <StudyTimer studyConfig={studyConfig} />}
        {activeTab === 'progresso' && <StudyProgress />}
        {activeTab === 'questoes' && <StudyQuestions />}
        {activeTab === 'revisao' && <StudyReview studyConfig={studyConfig} isPBL={studyConfig?.isPBL} />}
        {activeTab === 'avaliacao' && <StudyWeeklyEval studyConfig={studyConfig} />}
      </div>

      {/* Botão para refazer questionário */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => {
            if (confirm('Deseja refazer o questionário? Isso resetará suas configurações.')) {
              localStorage.removeItem(`studyConfig_${user.uid}`);
              setHasCompletedQuestionnaire(false);
              setStudyConfig(null);
            }
          }}
          className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl shadow-lg font-semibold transition-all text-sm"
        >
          🔄 Refazer Questionário
        </button>
      </div>
    </div>
  );
}