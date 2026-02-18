import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import PremiumBlock from '../components/PremiumBlock';
import LimitReached from '../components/LimitReached';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userProfile } = useContext(AppContext);
  const { subscription, canGenerateQuestions, hasFeature, isFree, isStudent, isPremium } = useSubscription();
  
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

  // Handler para trocar de tab com verificação de acesso
  const handleTabChange = (tabId) => {
    if (tabId === 'questoes' && !hasFeature('questionsGeneration')) {
      alert('⚠️ Geração de questões inteligentes está disponível apenas nos planos Estudante e superiores.\n\nFaça upgrade para acessar!');
      navigate('/pricing');
      return;
    }
    setActiveTab(tabId);
  };

  // Definir abas baseado no perfil
  const tabs = [
    { id: 'planejamento', label: 'Planejamento', icon: AcademicCapIcon, emoji: '📅' },
    ...(studyConfig?.isPBL ? [{ id: 'pbl', label: 'PBL', icon: BeakerIcon, emoji: '🧪' }] : []),
    { id: 'timer', label: 'Timer', icon: ClockIcon, emoji: '⏱️' },
    { id: 'progresso', label: 'Progresso', icon: ChartBarIcon, emoji: '📊' },
    { id: 'questoes', label: 'Questões', icon: QuestionMarkCircleIcon, emoji: '❓', premium: !hasFeature('questionsGeneration') },
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

      {/* Aviso de plano gratuito */}
      {isFree() && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📚 <strong>Plano Gratuito:</strong> Você tem acesso ao planejamento básico. Faça upgrade para desbloquear <strong>geração de questões inteligentes</strong>, <strong>upload de PDF automático</strong> e <strong>revisão inteligente de provas</strong>!
                </p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-sm whitespace-nowrap"
              >
                ⭐ Ver Planos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso sobre upload de PDF - Plano Gratuito */}
      {!hasFeature('pdfUpload') && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4">
            <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
              📄 <strong>Upload de PDF para automatizar planos de estudo</strong> disponível nos planos Estudante e superiores
            </p>
          </div>
        </div>
      )}

      {/* Aviso de limite de questões - Plano Estudante */}
      {isStudent() && hasFeature('questionsGeneration') && subscription.features.questionsLimit > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className={`rounded-xl p-4 border-2 ${
            (subscription.questionsUsage || 0) / subscription.features.questionsLimit >= 0.8
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
              : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          }`}>
            <p className={`text-sm text-center ${
              (subscription.questionsUsage || 0) / subscription.features.questionsLimit >= 0.8
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-green-800 dark:text-green-200'
            }`}>
              ❓ <strong>Geração de Questões:</strong> {subscription.questionsUsage || 0}/{subscription.features.questionsLimit} questões usadas este mês
              {(subscription.questionsUsage || 0) / subscription.features.questionsLimit >= 0.8 && (
                <span> - Você está próximo do limite! Faça upgrade para questões ilimitadas.</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 py-4 px-4 font-semibold text-sm border-b-2 transition-all whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  {tab.label}
                  {tab.premium && (
                    <span className="ml-1 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
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
        
        {/* Tab Questões com Controle de Acesso */}
        {activeTab === 'questoes' && (
          <>
            {!hasFeature('questionsGeneration') ? (
              <PremiumBlock 
                feature="questionsGeneration"
                requiredPlan="student"
                message="Geração de questões inteligentes está disponível nos planos Estudante, Premium e Vitalício. Faça upgrade para criar questões automaticamente baseadas no seu conteúdo!"
              />
            ) : !canGenerateQuestions() ? (
              <LimitReached 
                title="Limite de Questões Atingido"
                message="Você atingiu o limite mensal de geração de questões do seu plano. Faça upgrade para ter geração ilimitada!"
                currentUsage={subscription.questionsUsage || 0}
                limit={subscription.features.questionsLimit}
                feature="questionsGeneration"
              />
            ) : (
              <StudyQuestions />
            )}
          </>
        )}
        
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