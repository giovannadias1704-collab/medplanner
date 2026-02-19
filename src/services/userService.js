import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// 🔐 DEFINA SEU EMAIL ADMIN AQUI
const ADMIN_EMAIL = "medplanner@gmail.com";

// Estrutura padrão de um novo usuário
const getDefaultUserData = (user) => {
  const isAdmin = user.email === ADMIN_EMAIL;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',

    // 🔑 NOVO CAMPO DE CONTROLE
    role: isAdmin ? 'admin' : 'user',

    subscription: {
      plan: isAdmin ? 'admin' : 'free',
      status: 'active',
      startDate: serverTimestamp(),
      endDate: null
    },

    aiUsage: 0,
    questionsUsage: 0,
    eventsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastResetDate: new Date().toISOString().slice(0, 7)
  };
};

// Criar ou atualizar perfil de usuário no Firestore
export const createOrUpdateUserProfile = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // 🆕 Usuário novo
      await setDoc(userRef, getDefaultUserData(user));
      console.log('✅ Perfil de usuário criado:', user.uid);
    } else {
      // 🔄 Usuário existente
      const existingData = userDoc.data();

      const updates = {
        displayName: user.displayName || existingData.displayName,
        photoURL: user.photoURL || existingData.photoURL,
        updatedAt: serverTimestamp()
      };

      // Se ainda não existir role, adiciona automaticamente
      if (!existingData.role) {
        updates.role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
      }

      await updateDoc(userRef, updates);
      console.log('✅ Perfil de usuário atualizado:', user.uid);

      await checkAndResetMonthlyCounters(user.uid);
    }
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar perfil:', error);
    throw error;
  }
};

// Verificar e resetar contadores mensais
export const checkAndResetMonthlyCounters = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastResetMonth = userData.lastResetDate;

    if (lastResetMonth !== currentMonth) {
      await updateDoc(userRef, {
        aiUsage: 0,
        questionsUsage: 0,
        eventsCount: 0,
        lastResetDate: currentMonth,
        updatedAt: serverTimestamp()
      });

      console.log('🔄 Contadores mensais resetados para:', userId);
    }
  } catch (error) {
    console.error('❌ Erro ao resetar contadores:', error);
  }
};

// 👑 FUNÇÃO ADMIN PARA ALTERAR PLANO MANUALMENTE
export const updateUserSubscription = async (userId, subscriptionData) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      subscription: {
        plan: subscriptionData.plan,
        status: subscriptionData.status || 'active',
        startDate: subscriptionData.startDate || serverTimestamp(),
        endDate: subscriptionData.endDate || null
      },
      updatedAt: serverTimestamp()
    });

    console.log('✅ Assinatura atualizada:', userId, subscriptionData.plan);
  } catch (error) {
    console.error('❌ Erro ao atualizar assinatura:', error);
    throw error;
  }
};

// Obter dados do usuário
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao obter dados do usuário:', error);
    return null;
  }
};

// Incrementar contador de uso de IA
export const incrementAIUsage = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const currentUsage = userDoc.data().aiUsage || 0;

    await updateDoc(userRef, {
      aiUsage: currentUsage + 1,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ Erro ao incrementar uso de IA:', error);
  }
};

// Incrementar contador de questões
export const incrementQuestionsUsage = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const currentUsage = userDoc.data().questionsUsage || 0;

    await updateDoc(userRef, {
      questionsUsage: currentUsage + 1,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ Erro ao incrementar uso de questões:', error);
  }
};

// Incrementar contador de eventos
export const incrementEventsCount = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const currentCount = userDoc.data().eventsCount || 0;

    await updateDoc(userRef, {
      eventsCount: currentCount + 1,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ Erro ao incrementar contador de eventos:', error);
  }
};

// Decrementar contador de eventos
export const decrementEventsCount = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const currentCount = userDoc.data().eventsCount || 0;

    if (currentCount > 0) {
      await updateDoc(userRef, {
        eventsCount: currentCount - 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('❌ Erro ao decrementar contador de eventos:', error);
  }
};