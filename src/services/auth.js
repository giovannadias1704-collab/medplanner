import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';

import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

import { auth, googleProvider, db } from '../config/firebase';
import { createOrUpdateUserProfile } from './userService';

/* ======================================================
   👑 EMAIL ADMIN PRINCIPAL
====================================================== */
const ADMIN_EMAIL = 'medplanner@gmail.com';

/* ======================================================
   📋 AUDITORIA DE ACESSOS
====================================================== */
async function logAudit(action, details = {}) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'audit_logs'), {
      uid: user?.uid || 'anonymous',
      email: user?.email || details.email || 'anonymous',
      action,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (err) {
    console.error('Erro ao salvar log de auditoria:', err);
  }
}

/* ======================================================
   🔒 GARANTE ROLE ADMIN CORRETO
====================================================== */
async function ensureAdminRole(user) {
  if (!user?.uid || !user?.email) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const currentRole = userSnap.data()?.role;
  const shouldBeAdmin = user.email === ADMIN_EMAIL;

  if (shouldBeAdmin && currentRole !== 'admin') {
    await updateDoc(userRef, { role: 'admin' });
    console.log('👑 Role ADMIN aplicada automaticamente.');
  }
}

/* ======================================================
   📌 VERIFICAR SE USUÁRIO É ADMIN
====================================================== */
export async function isAdmin(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return false;

  return userSnap.data()?.role === 'admin';
}

/* ======================================================
   ========== REGISTRO ==========
====================================================== */
export async function registerWithEmail(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });
    await sendEmailVerification(user);
    await createOrUpdateUserProfile({ ...user, displayName });
    await ensureAdminRole(user);
    await logAudit('register', { email: user.email, displayName });

    return {
      success: true,
      user: user,
      message: 'Conta criada! Verifique seu email para ativar sua conta.'
    };

  } catch (error) {
    await logAudit('register_failed', { email, error: error.code });
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   ========== LOGIN COM EMAIL ==========
====================================================== */
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await createOrUpdateUserProfile(user);
    await ensureAdminRole(user);
    await logAudit('login_email', { email: user.email });

    return {
      success: true,
      user: user,
      emailVerified: user.emailVerified
    };

  } catch (error) {
    await logAudit('login_email_failed', { email, error: error.code });
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   ========== LOGIN COM GOOGLE ==========
====================================================== */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    await createOrUpdateUserProfile(user);
    await ensureAdminRole(user);
    await logAudit('login_google', { email: user.email });

    return {
      success: true,
      user: user,
      isNewUser: result._tokenResponse?.isNewUser || false
    };

  } catch (error) {

    if (error.code === 'auth/popup-blocked') {
      try {
        sessionStorage.setItem('googleLoginInProgress', 'true');
        sessionStorage.setItem('googleLoginTimestamp', Date.now().toString());
        await signInWithRedirect(auth, googleProvider);
        return { success: true, redirecting: true };
      } catch (redirectError) {
        sessionStorage.removeItem('googleLoginInProgress');
        sessionStorage.removeItem('googleLoginTimestamp');
        return {
          success: false,
          error: redirectError.code,
          message: getErrorMessage(redirectError.code)
        };
      }
    }

    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: error.code,
        message: 'Login cancelado. Tente novamente.'
      };
    }

    await logAudit('login_google_failed', { error: error.code });
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   ========== REDIRECT RESULT ==========
====================================================== */
export async function handleRedirectResult() {
  try {
    const wasRedirecting = sessionStorage.getItem('googleLoginInProgress') === 'true';

    if (!wasRedirecting) {
      return { success: false, noRedirect: true };
    }

    const result = await getRedirectResult(auth);

    sessionStorage.removeItem('googleLoginInProgress');
    sessionStorage.removeItem('googleLoginTimestamp');

    if (result?.user) {
      await createOrUpdateUserProfile(result.user);
      await ensureAdminRole(result.user);
      await logAudit('login_google_redirect', { email: result.user.email });

      return {
        success: true,
        user: result.user,
        isNewUser: result._tokenResponse?.isNewUser || false
      };
    }

    return { success: false, noRedirect: true };

  } catch (error) {
    sessionStorage.removeItem('googleLoginInProgress');
    sessionStorage.removeItem('googleLoginTimestamp');
    await logAudit('login_google_redirect_failed', { error: error.code });
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   ========== LOGOUT ==========
====================================================== */
export async function logout() {
  try {
    await logAudit('logout', {});
    await signOut(auth);
    sessionStorage.clear();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: 'Erro ao fazer logout.'
    };
  }
}

/* ======================================================
   ========== RESET PASSWORD ==========
====================================================== */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + '/auth',
      handleCodeInApp: false
    });

    await logAudit('password_reset_requested', { email });

    return {
      success: true,
      message: 'Email de recuperação enviado!'
    };

  } catch (error) {
    await logAudit('password_reset_failed', { email, error: error.code });
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   ========== REENVIAR VERIFICAÇÃO ==========
====================================================== */
export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;

    if (!user) return { success: false, message: 'Usuário não autenticado.' };
    if (user.emailVerified) return { success: false, message: 'Email já verificado!' };

    await sendEmailVerification(user);
    await logAudit('verification_email_resent', { email: user.email });

    return {
      success: true,
      message: 'Email reenviado!'
    };

  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   ========== ALTERAR SENHA ==========
====================================================== */
export async function changePassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;

    if (!user?.email) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    await logAudit('password_changed', { email: user.email });

    return { success: true, message: 'Senha alterada com sucesso!' };

  } catch (error) {
    await logAudit('password_change_failed', { error: error.code });
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

/* ======================================================
   ========== ERROS ==========
====================================================== */
function getErrorMessage(errorCode) {
  const errors = {
    'auth/email-already-in-use': 'Este email já está cadastrado.',
    'auth/invalid-email': 'Email inválido.',
    'auth/weak-password': 'Senha muito fraca.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Credenciais inválidas.',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
    'auth/network-request-failed': 'Erro de conexão.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/requires-recent-login': 'Faça login novamente por segurança.'
  };

  return errors[errorCode] || 'Erro desconhecido.';
}

export default {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  handleRedirectResult,
  logout,
  resetPassword,
  resendVerificationEmail,
  changePassword,
  isAdmin
};