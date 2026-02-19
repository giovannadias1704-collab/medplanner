import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../config/firebase';

/* ======================================================
   👑 EMAIL ADMIN PRINCIPAL
====================================================== */
const ADMIN_EMAIL = 'medplanner@gmail.com';

/* ======================================================
   📦 ESTRUTURA PADRÃO DE USUÁRIO
====================================================== */
const getDefaultUserData = (user) => {
  const isAdmin = user.email === ADMIN_EMAIL;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',

    role: isAdmin ? 'admin' : 'user',

    subscription: {
      plan: isAdmin ? 'admin' : 'free',
      status: 'active',
      startDate: serverTimestamp(),
      endDate: null,
      lifetime: isAdmin ? true : false
    },

    aiUsage: 0,
    questionsUsage: 0,
    eventsCount: 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    lastResetDate: new Date().toISOString().slice(0, 7)
  };
};

/* ======================================================
   🆕 CRIAR OU ATUALIZAR PERFIL
====================================================== */
export const createOrUpdateUserProfile = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    const shouldBeAdmin = user.email === ADMIN_EMAIL;

    if (!userSnap.exists()) {
      await setDoc(userRef, getDefaultUserData(user));
      console.log('✅ Novo usuário criado:', user.uid);
      return;
    }

    const existingData = userSnap.data();

    const updates = {
      displayName: user.displayName || existingData.displayName,
      photoURL: user.photoURL || existingData.photoURL,
      updatedAt: serverTimestamp()
    };

    /* 🔐 GARANTE ADMIN CORRETO */
    if (shouldBeAdmin && existingData.role !== 'admin') {
      updates.role = 'admin';
      updates.subscription = {
        plan: 'admin',
        status: 'active',
        startDate: serverTimestamp(),
        endDate: null,
        lifetime: true
      };
    }

    /* Se role não existir (usuários antigos) */
    if (!existingData.role) {
      updates.role = shouldBeAdmin ? 'admin' : 'user';
    }

    await updateDoc(userRef, updates);

    await checkAndResetMonthlyCounters(user.uid);

    console.log('✅ Perfil sincronizado:', user.uid);

  } catch (error) {
    console.error('❌ Erro ao criar/atualizar perfil:', error);
    throw error;
  }
};

/* ======================================================
   🔄 RESET MENSAL
====================================================== */
export const checkAndResetMonthlyCounters = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const currentMonth = new Date().toISOString().slice(0, 7);

    if (userData.lastResetDate !== currentMonth) {
      await updateDoc(userRef, {
        aiUsage: 0,
        questionsUsage: 0,
        eventsCount: 0,
        lastResetDate: currentMonth,
        updatedAt: serverTimestamp()
      });

      console.log('🔄 Reset mensal executado:', userId);
    }
  } catch (error) {
    console.error('❌ Erro no reset mensal:', error);
  }
};

/* ======================================================
   👑 ADMIN — ALTERAR ASSINATURA
====================================================== */
export const updateUserSubscription = async (userId, subscriptionData) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      subscription: {
        plan: subscriptionData.plan,
        status: subscriptionData.status || 'active',
        startDate: subscriptionData.startDate || serverTimestamp(),
        endDate: subscriptionData.endDate || null,
        lifetime: subscriptionData.lifetime || false
      },
      updatedAt: serverTimestamp()
    });

    console.log('✅ Plano atualizado para:', userId);

  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error);
    throw error;
  }
};

/* ======================================================
   💎 ADMIN — DAR PLANO VITALÍCIO
====================================================== */
export const grantLifetimeAccess = async (userId, plan = 'premium') => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      subscription: {
        plan,
        status: 'active',
        startDate: serverTimestamp(),
        endDate: null,
        lifetime: true
      },
      updatedAt: serverTimestamp()
    });

    console.log('💎 Acesso vitalício concedido:', userId);

  } catch (error) {
    console.error('❌ Erro ao conceder vitalício:', error);
    throw error;
  }
};

/* ======================================================
   👑 ADMIN — ALTERAR ROLE
====================================================== */
export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    console.log('👑 Role atualizada:', userId, newRole);

  } catch (error) {
    console.error('❌ Erro ao atualizar role:', error);
    throw error;
  }
};

/* ======================================================
   📋 ADMIN — LISTAR USUÁRIOS
====================================================== */
export const getAllUsers = async () => {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    return [];
  }
};

/* ======================================================
   📥 OBTER DADOS
====================================================== */
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    return userSnap.exists() ? userSnap.data() : null;

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
};

/* ======================================================
   📈 CONTADORES
====================================================== */
export const incrementAIUsage = async (userId) => {
  await incrementField(userId, 'aiUsage');
};

export const incrementQuestionsUsage = async (userId) => {
  await incrementField(userId, 'questionsUsage');
};

export const incrementEventsCount = async (userId) => {
  await incrementField(userId, 'eventsCount');
};

export const decrementEventsCount = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const current = userSnap.data().eventsCount || 0;

    if (current > 0) {
      await updateDoc(userRef, {
        eventsCount: current - 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('❌ Erro ao decrementar eventos:', error);
  }
};

const incrementField = async (userId, field) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const current = userSnap.data()[field] || 0;

    await updateDoc(userRef, {
      [field]: current + 1,
      updatedAt: serverTimestamp()
    });

  } catch (error) {
    console.error(`❌ Erro ao incrementar ${field}:`, error);
  }
};
