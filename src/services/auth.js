/**
 * Serviço de autenticação refatorado para MedPlanner.
 * Integra validações, rate limiting, erros customizados, cache, timeout e refresh automático.
 * Compatível com Firebase Auth v9+.
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken
} from 'firebase/auth';

import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  sanitizeInput,
  validatePasswordStrength
} from '../utils/authValidation';

import { getErrorMessage, logAuthError } from '../utils/authErrors';
import RateLimiter from '../utils/rateLimiter';

const auth = getAuth();
const rateLimiter = new RateLimiter(5, 10 * 60 * 1000); // 5 tentativas, 10 min
let currentUser = null;
let refreshInterval = null;

/* ======================================================
   🔒 INICIALIZAÇÃO E CACHE
====================================================== */

/**
 * Listener de estado de auth com cache localStorage e refresh automático.
 */
function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      localStorage.setItem('medplanner_user_uid', user.uid);
      startAutoRefresh();
      console.info(`[MedPlanner Auth] Usuário logado: ${user.uid}`);
    } else {
      localStorage.removeItem('medplanner_user_uid');
      stopAutoRefresh();
      console.info('[MedPlanner Auth] Usuário deslogado');
    }
  });
}

/**
 * Inicia refresh automático a cada 55 minutos.
 */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshInterval = setInterval(async () => {
    if (currentUser) {
      try {
        await getIdToken(currentUser, true);
        console.info('[MedPlanner Auth] Token atualizado automaticamente');
      } catch (error) {
        logAuthError('autoRefresh', error);
      }
    }
  }, 55 * 60 * 1000);
}

/**
 * Para refresh automático.
 */
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Promise de timeout para 1 minuto.
 */
function timeout(ms = 60000) {
  return new Promise((_, reject) =>
    setTimeout(() => reject({ code: 'request-timeout', message: 'Timeout' }), ms)
  );
}

initAuthListener();

/* ======================================================
   📋 REGISTRO
====================================================== */

/**
 * Registra novo usuário com validações.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<{success: boolean, user?: Object, message: string}>}
 */
export async function registerWithEmail(email, password, displayName) {
  try {
    const cleanEmail = sanitizeInput(email);
    const cleanDisplayName = sanitizeInput(displayName);

    if (!validateEmail(cleanEmail)) {
      throw { code: 'auth/invalid-email' };
    }
    if (!validatePassword(password)) {
      throw { code: 'auth/weak-password' };
    }
    if (!validateDisplayName(cleanDisplayName)) {
      throw { code: 'auth/invalid-display-name' };
    }

    const strength = validatePasswordStrength(password);
    console.info(`[MedPlanner Auth] Força da senha: ${strength}`);

    const userCredential = await Promise.race([
      createUserWithEmailAndPassword(auth, cleanEmail, password),
      timeout()
    ]);

    await updateProfile(userCredential.user, { displayName: cleanDisplayName });

    console.info(`[MedPlanner Auth] Registro bem-sucedido: ${userCredential.user.uid}`);

    return {
      success: true,
      user: userCredential.user,
      message: 'Conta criada com sucesso!'
    };
  } catch (error) {
    logAuthError('register', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   🔐 LOGIN COM EMAIL
====================================================== */

/**
 * Login com email/senha + rate limiting.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: Object, message?: string}>}
 */
export async function loginWithEmail(email, password) {
  try {
    const cleanEmail = sanitizeInput(email);

    if (!validateEmail(cleanEmail)) {
      throw { code: 'auth/invalid-email' };
    }
    if (!validatePassword(password)) {
      throw { code: 'auth/weak-password' };
    }

    // Rate limiting
    if (rateLimiter.isBlocked(cleanEmail)) {
      const until = rateLimiter.getBlockedUntil(cleanEmail);
      throw {
        code: 'auth/too-many-requests',
        message: `Bloqueado até ${new Date(until).toLocaleString('pt-BR')}`
      };
    }

    if (!rateLimiter.recordAttempt(cleanEmail)) {
      throw { code: 'auth/too-many-requests' };
    }

    const userCredential = await Promise.race([
      signInWithEmailAndPassword(auth, cleanEmail, password),
      timeout()
    ]);

    rateLimiter.reset(cleanEmail);

    console.info(`[MedPlanner Auth] Login bem-sucedido: ${userCredential.user.uid}`);

    return {
      success: true,
      user: userCredential.user,
      emailVerified: userCredential.user.emailVerified
    };
  } catch (error) {
    logAuthError('loginWithEmail', error);
    return {
      success: false,
      error: error.code,
      message: error.message || getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   🌐 LOGIN COM GOOGLE
====================================================== */

/**
 * Login com Google.
 * @returns {Promise<{success: boolean, user?: Object, message?: string}>}
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();

    const result = await Promise.race([
      signInWithPopup(auth, provider),
      timeout()
    ]);

    console.info(`[MedPlanner Auth] Google login: ${result.user.uid}`);

    return {
      success: true,
      user: result.user,
      isNewUser: result._tokenResponse?.isNewUser || false
    };
  } catch (error) {
    logAuthError('loginWithGoogle', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   🚪 LOGOUT
====================================================== */

/**
 * Logout.
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function logout() {
  try {
    await signOut(auth);
    console.info('[MedPlanner Auth] Logout executado');
    return { success: true };
  } catch (error) {
    logAuthError('logout', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   👤 USUÁRIO ATUAL
====================================================== */

/**
 * Retorna usuário atual do cache.
 * @returns {Object|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/* ======================================================
   🔑 RECUPERAÇÃO DE SENHA
====================================================== */

/**
 * Envia email de reset de senha.
 * @param {string} email
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function resetPassword(email) {
  try {
    const cleanEmail = sanitizeInput(email);

    if (!validateEmail(cleanEmail)) {
      throw { code: 'auth/invalid-email' };
    }

    await Promise.race([
      sendPasswordResetEmail(auth, cleanEmail, {
        url: window.location.origin + '/auth',
        handleCodeInApp: false
      }),
      timeout()
    ]);

    console.info(`[MedPlanner Auth] Reset de senha enviado para ${cleanEmail}`);

    return {
      success: true,
      message: 'Email de recuperação enviado!'
    };
  } catch (error) {
    logAuthError('resetPassword', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   📤 EXPORTAÇÃO
====================================================== */

export default {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  getCurrentUser,
  resetPassword
};