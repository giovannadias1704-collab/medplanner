import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState({
    plan: 'free',
    status: 'active',
    features: {
      maxEvents: 10,
      aiEnabled: false,
      aiLimit: 0,
      pdfUpload: false,
      advancedAnalytics: false,
      exportPdf: false,
      prioritySupport: false,
      autoAdjustments: false,
      questionsGeneration: false,
      unlimitedAI: false
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription({
        plan: 'free',
        status: 'inactive',
        features: {
          maxEvents: 10,
          aiEnabled: false,
          aiLimit: 0,
          pdfUpload: false,
          advancedAnalytics: false,
          exportPdf: false,
          prioritySupport: false,
          autoAdjustments: false,
          questionsGeneration: false,
          unlimitedAI: false
        }
      });
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userPlan = userData.subscription?.plan || 'free';
          
          // Configurar recursos baseados no plano
          let features = {};
          
          switch (userPlan) {
            case 'free':
              features = {
                maxEvents: 10,
                aiEnabled: false,
                aiLimit: 0,
                pdfUpload: false,
                advancedAnalytics: false,
                exportPdf: false,
                prioritySupport: false,
                autoAdjustments: false,
                questionsGeneration: false,
                unlimitedAI: false
              };
              break;
            
            case 'student':
              features = {
                maxEvents: -1, // ilimitado
                aiEnabled: true,
                aiLimit: 100, // 100 consultas/mês
                pdfUpload: true,
                advancedAnalytics: true,
                exportPdf: false,
                prioritySupport: false,
                autoAdjustments: false,
                questionsGeneration: true,
                questionsLimit: 50, // 50 questões/mês
                unlimitedAI: false
              };
              break;
            
            case 'premium':
            case 'lifetime':
              features = {
                maxEvents: -1, // ilimitado
                aiEnabled: true,
                aiLimit: -1, // ilimitado
                pdfUpload: true,
                advancedAnalytics: true,
                exportPdf: true,
                prioritySupport: true,
                autoAdjustments: true,
                questionsGeneration: true,
                questionsLimit: -1, // ilimitado
                unlimitedAI: true
              };
              break;
            
            default:
              features = {
                maxEvents: 10,
                aiEnabled: false,
                aiLimit: 0,
                pdfUpload: false,
                advancedAnalytics: false,
                exportPdf: false,
                prioritySupport: false,
                autoAdjustments: false,
                questionsGeneration: false,
                unlimitedAI: false
              };
          }
          
          setSubscription({
            plan: userPlan,
            status: userData.subscription?.status || 'active',
            features,
            aiUsage: userData.aiUsage || 0,
            questionsUsage: userData.questionsUsage || 0,
            eventsCount: userData.eventsCount || 0
          });
        }
      } catch (error) {
        console.error('Erro ao buscar assinatura:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const hasFeature = (feature) => {
    return subscription.features[feature] === true || subscription.features[feature] === -1;
  };

  const canUseAI = () => {
    if (!subscription.features.aiEnabled) return false;
    if (subscription.features.aiLimit === -1) return true;
    return (subscription.aiUsage || 0) < subscription.features.aiLimit;
  };

  const canCreateEvent = () => {
    if (subscription.features.maxEvents === -1) return true;
    return (subscription.eventsCount || 0) < subscription.features.maxEvents;
  };

  const canGenerateQuestions = () => {
    if (!subscription.features.questionsGeneration) return false;
    if (subscription.features.questionsLimit === -1) return true;
    return (subscription.questionsUsage || 0) < subscription.features.questionsLimit;
  };

  const isPremium = () => {
    return subscription.plan === 'premium' || subscription.plan === 'lifetime';
  };

  const isStudent = () => {
    return subscription.plan === 'student';
  };

  const isFree = () => {
    return subscription.plan === 'free';
  };

  return {
    subscription,
    loading,
    hasFeature,
    canUseAI,
    canCreateEvent,
    canGenerateQuestions,
    isPremium,
    isStudent,
    isFree
  };
}