import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

export const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState({
    plan: 'free', // 'free', 'student', 'premium', 'lifetime'
    status: 'active', // 'active', 'pending_payment', 'expired', 'cancelled'
    paymentMethod: null, // 'pix', 'card', null
    proofSubmitted: false,
    proofUrl: null,
    lastPaymentDate: null,
    nextPaymentDate: null,
    expiresAt: null,
    isLifetime: false,
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Carregar do localStorage
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`medplanner_subscription_${user.uid}`);
    if (saved) {
      setSubscription(JSON.parse(saved));
    }
  }, [user]);

  // Salvar no localStorage
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`medplanner_subscription_${user.uid}`, JSON.stringify(subscription));
  }, [subscription, user]);

  // Verificar status do pagamento
  useEffect(() => {
    if (!user || subscription.isLifetime) return;

    const checkPaymentStatus = () => {
      const now = new Date();
      
      // Se tem data de vencimento e já passou
      if (subscription.nextPaymentDate) {
        const nextPayment = new Date(subscription.nextPaymentDate);
        
        // Venceu há mais de 3 dias = bloquear
        const threeDaysAfter = new Date(nextPayment);
        threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
        
        if (now > threeDaysAfter && subscription.status === 'active') {
          setSubscription(prev => ({
            ...prev,
            status: 'expired'
          }));
        }
      }
    };

    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 1000 * 60 * 60); // Verificar a cada hora

    return () => clearInterval(interval);
  }, [user, subscription]);

  const upgradePlan = (planId, paymentMethod = 'pix') => {
    const now = new Date();
    let nextPayment = new Date(now);
    nextPayment.setDate(nextPayment.getDate() + 30); // 30 dias

    const isLifetime = planId === 'lifetime';

    setSubscription(prev => ({
      ...prev,
      plan: planId,
      status: 'pending_payment',
      paymentMethod,
      proofSubmitted: false,
      lastPaymentDate: now.toISOString(),
      nextPaymentDate: isLifetime ? null : nextPayment.toISOString(),
      expiresAt: isLifetime ? null : nextPayment.toISOString(),
      isLifetime,
    }));

    setShowPaymentModal(true);
  };

  const submitPaymentProof = (proofData) => {
    setSubscription(prev => ({
      ...prev,
      proofSubmitted: true,
      proofUrl: proofData,
      status: 'pending_approval', // Aguardando você aprovar
    }));
    setShowPaymentModal(false);
    alert('✅ Comprovante enviado! Aguarde aprovação (até 24h).');
  };

  const approvePayment = () => {
    setSubscription(prev => ({
      ...prev,
      status: 'active',
      proofSubmitted: false,
      proofUrl: null,
    }));
  };

  const isAccessBlocked = () => {
    if (subscription.isLifetime && subscription.status === 'active') return false;
    if (subscription.plan === 'free') return false;
    return subscription.status === 'expired' || subscription.status === 'cancelled';
  };

  const isPendingPayment = () => {
    return subscription.status === 'pending_payment' || subscription.status === 'pending_approval';
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        upgradePlan,
        submitPaymentProof,
        approvePayment,
        isAccessBlocked,
        isPendingPayment,
        showPaymentModal,
        setShowPaymentModal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);