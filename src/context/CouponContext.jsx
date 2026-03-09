import { createContext, useState, useContext, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

export const CouponContext = createContext();

export function CouponProvider({ children }) {
  const { user } = useAuth();
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [pendingCoupons, setPendingCoupons] = useState([]);
  const [approvedCoupons, setApprovedCoupons] = useState([]);

  // SEU NÚMERO DE WHATSAPP
  const ADMIN_WHATSAPP = '5571992883976';

  const validCoupons = {
    'VITALICIO': {
      code: 'VITALICIO',
      discount: 1.0,
      label: '100% OFF - VITALÍCIO',
      plan: 'lifetime'
    },
    'MEDPLANNER30': {
      code: 'MEDPLANNER30',
      discount: 0.30,
      label: '30% OFF',
      plan: 'pro'
    },
    'MEDPLANNER50': {
      code: 'MEDPLANNER50',
      discount: 0.50,
      label: '50% OFF',
      plan: 'pro'
    },
    'MEDPLANNER100': {
      code: 'MEDPLANNER100',
      discount: 1.0,
      label: '100% OFF - GRÁTIS',
      plan: 'pro'
    }
  };

  // LISTENER DE CUPONS PENDENTES (para admin)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'couponRequests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingCoupons(coupons);
    });

    return () => unsubscribe();
  }, [user]);

  // LISTENER DE CUPONS APROVADOS (histórico)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'couponRequests'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApprovedCoupons(coupons);
    });

    return () => unsubscribe();
  }, [user]);

  // APLICAR CUPOM
  const applyCoupon = async (code, planName, planPrice, userEmail) => {
    const coupon = validCoupons[code];

    if (!coupon) {
      return {
        success: false,
        message: '❌ Cupom inválido!'
      };
    }

    // Verificar se já existe cupom pendente ou aprovado para este email
    const existingQ = query(
      collection(db, 'couponRequests'),
      where('userEmail', '==', userEmail),
      where('couponCode', '==', code)
    );
    
    const existingDocs = await getDocs(existingQ);
    const hasPending = existingDocs.docs.some(doc => doc.data().status === 'pending');
    const hasApproved = existingDocs.docs.some(doc => doc.data().status === 'approved');

    if (hasPending) {
      return {
        success: false,
        message: '⏳ Você já tem uma solicitação pendente para este cupom!'
      };
    }

    if (hasApproved) {
      return {
        success: false,
        message: '✅ Este cupom já foi aprovado para você!'
      };
    }

    setAppliedCoupon(coupon);

    // CALCULAR VALORES
    const discountAmount = (planPrice * coupon.discount).toFixed(2);
    const finalPrice = (planPrice * (1 - coupon.discount)).toFixed(2);

    // SALVAR NO FIREBASE
    try {
      const couponRequest = {
        userEmail,
        userId: user?.uid || null,
        couponCode: code,
        couponLabel: coupon.label,
        planName,
        planPrice,
        discountAmount: parseFloat(discountAmount),
        finalPrice: parseFloat(finalPrice),
        targetPlan: coupon.plan,
        status: 'pending',
        createdAt: serverTimestamp(),
        approvedAt: null,
        approvedBy: null
      };

      await addDoc(collection(db, 'couponRequests'), couponRequest);

      // MENSAGEM PARA WHATSAPP
      const message = `🎟️ *NOVO CUPOM APLICADO - MEDPLANNER*

👤 *Usuário:* ${userEmail}
📦 *Plano:* ${planName}
🎫 *Cupom:* ${code} (${coupon.label})

💰 *Valores:*
• Preço original: R$ ${planPrice.toFixed(2).replace('.', ',')}
• Desconto: -R$ ${discountAmount.replace('.', ',')}
• Preço final: R$ ${finalPrice.replace('.', ',')}

⏰ *Data/Hora:* ${new Date().toLocaleString('pt-BR')}

---
📌 Solicitação salva no sistema. Aprovar no painel admin.`;

      // ABRIR WHATSAPP
      const whatsappURL = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, '_blank');

      return {
        success: true,
        message: `✅ Cupom ${coupon.label} aplicado! Aguardando aprovação.`
      };
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      return {
        success: false,
        message: '❌ Erro ao processar cupom. Tente novamente.'
      };
    }
  };

  // APROVAR CUPOM (apenas admin)
  const approveCoupon = async (couponRequestId) => {
    try {
      const couponRef = doc(db, 'couponRequests', couponRequestId);
      
      // Buscar dados do cupom
      const couponDoc = await getDocs(query(collection(db, 'couponRequests'), where('__name__', '==', couponRequestId)));
      const couponData = couponDoc.docs[0]?.data();

      if (!couponData) {
        throw new Error('Cupom não encontrado');
      }

      // Atualizar status do cupom
      await updateDoc(couponRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: user?.uid || 'admin'
      });

      // ATUALIZAR PLANO DO USUÁRIO
      if (couponData.userId) {
        // Se tem userId, atualizar usuário existente
        const userRef = doc(db, 'users', couponData.userId);
        await updateDoc(userRef, {
          plan: couponData.targetPlan,
          subscription: {
            plan: couponData.targetPlan,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: couponData.targetPlan === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            paymentMethod: 'coupon',
            couponCode: couponData.couponCode
          }
        });
      } else {
        // Se não tem userId, buscar por email ou criar
        const userQ = query(collection(db, 'users'), where('email', '==', couponData.userEmail));
        const userDocs = await getDocs(userQ);

        if (userDocs.empty) {
          // Criar novo usuário
          await addDoc(collection(db, 'users'), {
            email: couponData.userEmail,
            plan: couponData.targetPlan,
            role: 'user',
            createdAt: serverTimestamp(),
            subscription: {
              plan: couponData.targetPlan,
              status: 'active',
              startDate: new Date().toISOString(),
              endDate: couponData.targetPlan === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              paymentMethod: 'coupon',
              couponCode: couponData.couponCode
            }
          });
        } else {
          // Atualizar usuário existente
          const userDocRef = userDocs.docs[0].ref;
          await updateDoc(userDocRef, {
            plan: couponData.targetPlan,
            subscription: {
              plan: couponData.targetPlan,
              status: 'active',
              startDate: new Date().toISOString(),
              endDate: couponData.targetPlan === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              paymentMethod: 'coupon',
              couponCode: couponData.couponCode
            }
          });
        }
      }

      return {
        success: true,
        message: '✅ Cupom aprovado e usuário atualizado!'
      };
    } catch (error) {
      console.error('Erro ao aprovar cupom:', error);
      return {
        success: false,
        message: '❌ Erro ao aprovar cupom.'
      };
    }
  };

  // REJEITAR CUPOM
  const rejectCoupon = async (couponRequestId, reason = '') => {
    try {
      const couponRef = doc(db, 'couponRequests', couponRequestId);
      await updateDoc(couponRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user?.uid || 'admin',
        rejectionReason: reason
      });

      return {
        success: true,
        message: '❌ Cupom rejeitado.'
      };
    } catch (error) {
      console.error('Erro ao rejeitar cupom:', error);
      return {
        success: false,
        message: '❌ Erro ao rejeitar cupom.'
      };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const calculateDiscount = (price) => {
    if (!appliedCoupon) return 0;
    return price * appliedCoupon.discount;
  };

  const calculateFinalPrice = (price) => {
    if (!appliedCoupon) return price;
    return price * (1 - appliedCoupon.discount);
  };

  return (
    <CouponContext.Provider
      value={{
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        calculateDiscount,
        calculateFinalPrice,
        approveCoupon,
        rejectCoupon,
        pendingCoupons,
        approvedCoupons,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
}

export const useCoupon = () => useContext(CouponContext);